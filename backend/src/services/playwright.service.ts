import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../config/logger';
import pool from '../config/database';

const execAsync = promisify(exec);

interface PlaywrightConfig {
  projectId: string;
  suiteId?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headed?: boolean;
  workers?: number;
}

interface TestResult {
  projectId: string;
  suiteId?: string;
  runName: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  reportPath?: string;
}

class PlaywrightService {
  private readonly projectsDir = path.join(__dirname, '../../test-projects');
  private readonly reportsDir = path.join(__dirname, '../../public/reports');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      await fs.mkdir(this.reportsDir, { recursive: true });
      logger.info('Playwright directories initialized');
    } catch (error) {
      logger.error('Error creating directories:', error);
    }
  }

  /**
   * Clone repository from URL (supports GitHub, GitLab, Azure DevOps)
   */
  async cloneRepository(
    repoUrl: string,
    projectName: string,
    branch: string = 'main'
  ): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectName);

    try {
      // Validate repo URL
      if (!repoUrl || !repoUrl.trim()) {
        throw new Error('Repository URL is required');
      }

      // Check if project already exists
      try {
        await fs.access(projectPath);
        logger.info(`Project ${projectName} already exists, pulling latest changes...`);

        try {
          // Pull latest changes
          const { stdout, stderr } = await execAsync(
            `cd "${projectPath}" && git pull origin ${branch}`,
            { timeout: 60000 }
          );

          logger.info(`Git pull output: ${stdout}`);
          if (stderr && !stderr.includes('Already up to date')) {
            logger.warn(`Git pull stderr: ${stderr}`);
          }
        } catch (pullError: any) {
          logger.error(`Git pull failed: ${pullError.message}`);
          // If pull fails, try to use existing repo without updating
          logger.warn('Using existing repository without updating');
        }
      } catch {
        // Directory doesn't exist, clone the repo
        logger.info(`Cloning repository: ${repoUrl} (branch: ${branch})`);

        try {
          const { stdout, stderr } = await execAsync(
            `git clone "${repoUrl}" "${projectPath}" --branch ${branch} --single-branch`,
            { timeout: 120000 }
          );

          logger.info(`Git clone output: ${stdout}`);
          if (stderr) {
            logger.info(`Git clone stderr: ${stderr}`);
          }
        } catch (cloneError: any) {
          const errorMsg = cloneError.message || cloneError.stderr || cloneError.toString();
          logger.error(`Git clone failed: ${errorMsg}`);

          // Provide more specific error messages
          if (errorMsg.includes('Authentication failed') || errorMsg.includes('authentication')) {
            throw new Error('Authentication failed. Please ensure your Personal Access Token (PAT) is included in the repository URL or check your credentials.');
          } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
            throw new Error(`Branch '${branch}' not found. Please verify the branch name exists in the repository.`);
          } else if (errorMsg.includes('Repository not found') || errorMsg.includes('could not read')) {
            throw new Error('Repository not found. Please check the repository URL and ensure you have access permissions.');
          } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            throw new Error('Repository cloning timed out. The repository might be too large or network connection is slow.');
          } else {
            throw new Error(`Failed to clone repository: ${errorMsg}`);
          }
        }
      }

      // Install dependencies if package.json exists
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        await fs.access(packageJsonPath);
        logger.info('Installing dependencies...');

        const { stdout, stderr } = await execAsync(
          `cd "${projectPath}" && npm install`,
          { timeout: 300000 }
        );

        logger.info('Dependencies installed successfully');
        if (stderr) {
          logger.debug(`npm install stderr: ${stderr}`);
        }
      } catch (error) {
        logger.warn('No package.json found or error installing dependencies');
      }

      return projectPath;
    } catch (error: any) {
      logger.error('Error in cloneRepository:', error);
      // Re-throw the error with the specific message
      throw error;
    }
  }

  /**
   * Run Playwright tests for a project
   */
  async runTests(config: PlaywrightConfig): Promise<TestResult> {
    const { projectId, suiteId, browser = 'chromium', headed = false, workers = 1 } = config;

    try {
      // Get project details from database
      const projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];
      const projectPath = path.join(this.projectsDir, project.name);

      // Verify project directory exists
      try {
        await fs.access(projectPath);
      } catch {
        throw new Error(`Project directory not found. Please clone the repository first using the clone endpoint.`);
      }

      // Create test run record
      const runResult = await pool.query(
        `INSERT INTO test_runs (project_id, suite_id, run_name, status, start_time, browser, environment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          projectId,
          suiteId || null,
          `Run ${new Date().toISOString()}`,
          'in_progress',
          new Date(),
          browser,
          'test'
        ]
      );

      const testRunId = runResult.rows[0].id;
      const reportName = `report-${testRunId}`;
      const reportPath = path.join(this.reportsDir, reportName);

      // Ensure report directory exists
      await fs.mkdir(reportPath, { recursive: true });

      // Build Playwright command using best practices
      // Use environment variables for configuration
      const envVars = [
        `PLAYWRIGHT_HTML_REPORT="${reportPath}"`,
        `PLAYWRIGHT_BROWSERS_PATH=0` // Use system browsers
      ];

      let playwrightCmd = `npx playwright test`;

      // Browser selection - check if playwright.config exists, otherwise use --project
      try {
        await fs.access(path.join(projectPath, 'playwright.config.ts'));
        // Config exists, use --project flag
        playwrightCmd += ` --project=${browser}`;
      } catch {
        try {
          await fs.access(path.join(projectPath, 'playwright.config.js'));
          // Config exists, use --project flag
          playwrightCmd += ` --project=${browser}`;
        } catch {
          // No config found, use environment variable for browser
          envVars.push(`BROWSER=${browser}`);
          logger.info('No playwright.config found, using default configuration');
        }
      }

      // Add other flags
      playwrightCmd += ` --workers=${workers}`;
      playwrightCmd += headed ? ` --headed` : '';
      playwrightCmd += ` --reporter=html,list`;

      // Complete command with environment variables
      const fullCommand = `${envVars.join(' ')} ${playwrightCmd}`;

      const startTime = Date.now();
      let testResult: TestResult;

      try {
        logger.info(`Running Playwright tests for project ${project.name}...`);
        logger.info(`Project path: ${projectPath}`);
        logger.info(`Command: ${fullCommand}`);

        const { stdout, stderr } = await execAsync(
          `cd "${projectPath}" && ${fullCommand}`,
          {
            timeout: 600000, // 10 minute timeout
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
          }
        );

        const duration = Date.now() - startTime;

        logger.info(`Test execution completed`);
        logger.info(`stdout: ${stdout}`);
        if (stderr) {
          logger.warn(`stderr: ${stderr}`);
        }

        // Parse test results from output
        const results = this.parsePlaywrightOutput(stdout);

        testResult = {
          projectId,
          suiteId,
          runName: runResult.rows[0].run_name,
          status: results.failed > 0 ? 'failed' : 'completed',
          totalTests: results.total,
          passedTests: results.passed,
          failedTests: results.failed,
          skippedTests: results.skipped,
          duration,
          reportPath: `/reports/${reportName}/index.html`
        };

        // Update test run in database
        await pool.query(
          `UPDATE test_runs
           SET status = $1,
               total_tests = $2,
               passed_tests = $3,
               failed_tests = $4,
               skipped_tests = $5,
               end_time = $6,
               duration_ms = $7
           WHERE id = $8`,
          [
            testResult.status,
            testResult.totalTests,
            testResult.passedTests,
            testResult.failedTests,
            testResult.skippedTests,
            new Date(),
            testResult.duration,
            testRunId
          ]
        );

        return testResult;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Error running Playwright tests:', error);
        logger.error('Error stdout:', error.stdout);
        logger.error('Error stderr:', error.stderr);

        // Parse results even from failed execution to capture partial results
        const results = this.parsePlaywrightOutput(error.stdout || error.stderr || '');

        // Update test run as failed
        await pool.query(
          `UPDATE test_runs
           SET status = $1,
               total_tests = $2,
               passed_tests = $3,
               failed_tests = $4,
               skipped_tests = $5,
               end_time = $6,
               duration_ms = $7
           WHERE id = $8`,
          ['failed', results.total, results.passed, results.failed, results.skipped, new Date(), duration, testRunId]
        );

        throw new Error(`Test execution failed: ${error.message}. ${error.stderr || ''}`);
      }
    } catch (error: any) {
      logger.error('Error in runTests:', error);
      throw error;
    }
  }

  /**
   * Parse Playwright test output to extract results
   */
  private parsePlaywrightOutput(output: string): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  } {
    const results = { total: 0, passed: 0, failed: 0, skipped: 0 };

    try {
      // Look for summary line like: "3 passed (5s)"
      const passedMatch = output.match(/(\d+)\s+passed/i);
      if (passedMatch) {
        results.passed = parseInt(passedMatch[1]);
      }

      // Look for failed tests: "2 failed"
      const failedMatch = output.match(/(\d+)\s+failed/i);
      if (failedMatch) {
        results.failed = parseInt(failedMatch[1]);
      }

      // Look for skipped tests: "1 skipped"
      const skippedMatch = output.match(/(\d+)\s+skipped/i);
      if (skippedMatch) {
        results.skipped = parseInt(skippedMatch[1]);
      }

      results.total = results.passed + results.failed + results.skipped;

    } catch (error) {
      logger.error('Error parsing Playwright output:', error);
    }

    return results;
  }

  /**
   * Get HTML report path for a test run
   */
  async getReportPath(testRunId: string): Promise<string | null> {
    const reportPath = path.join(this.reportsDir, `report-${testRunId}`, 'index.html');

    try {
      await fs.access(reportPath);
      return `/reports/report-${testRunId}/index.html`;
    } catch {
      return null;
    }
  }

  /**
   * List all cloned projects
   */
  async listProjects(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.projectsDir);
      const projects: string[] = [];

      for (const file of files) {
        const projectPath = path.join(this.projectsDir, file);
        const stats = await fs.stat(projectPath);

        if (stats.isDirectory()) {
          projects.push(file);
        }
      }

      return projects;
    } catch (error) {
      logger.error('Error listing projects:', error);
      return [];
    }
  }

  /**
   * Delete a cloned project
   */
  async deleteProject(projectName: string): Promise<void> {
    const projectPath = path.join(this.projectsDir, projectName);

    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      logger.info(`Project ${projectName} deleted`);
    } catch (error) {
      logger.error(`Error deleting project ${projectName}:`, error);
      throw new Error('Failed to delete project');
    }
  }
}

export default new PlaywrightService();
