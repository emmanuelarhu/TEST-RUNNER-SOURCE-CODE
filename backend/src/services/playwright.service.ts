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
   * Sanitize project name for use as directory name
   * Replaces spaces and special characters with hyphens
   */
  private sanitizeProjectName(projectName: string): string {
    return projectName
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9-_]/g, '') // Remove special characters
      .replace(/-+/g, '-')            // Replace multiple hyphens with single
      .toLowerCase();
  }

  /**
   * Clone repository from URL (supports GitHub, GitLab, Azure DevOps)
   */
  async cloneRepository(
    repoUrl: string,
    projectName: string,
    branch: string = 'main'
  ): Promise<string> {
    // Sanitize project name for directory
    const dirName = this.sanitizeProjectName(projectName);
    const projectPath = path.join(this.projectsDir, dirName);

    try {
      // Validate repo URL
      if (!repoUrl || !repoUrl.trim()) {
        throw new Error('Repository URL is required');
      }

      logger.info(`Cloning repository for project: ${projectName} (directory: ${dirName})`);

      // Check if project already exists
      try {
        await fs.access(projectPath);
        logger.info(`Project directory ${dirName} already exists, pulling latest changes...`);

        try {
          // Pull latest changes
          const { stdout, stderr } = await execAsync(`git pull origin ${branch}`, {
            cwd: projectPath,
            timeout: 60000
          });

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

        const { stdout, stderr } = await execAsync('npm install', {
          cwd: projectPath,
          timeout: 300000
        });

        logger.info('Dependencies installed successfully');
        if (stderr) {
          logger.debug(`npm install stderr: ${stderr}`);
        }

        // Install Playwright browsers if playwright is in dependencies
        logger.info('Installing Playwright browsers...');
        try {
          // Install browsers with dependencies - chromium, firefox, webkit
          const installBrowsersResult = await execAsync('npx playwright install chromium --with-deps', {
            cwd: projectPath,
            timeout: 600000, // 10 minutes for browser download
            env: {
              ...process.env,
              PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined // Ensure browsers are downloaded
            }
          });

          logger.info('Playwright browsers installed successfully');
          if (installBrowsersResult.stderr) {
            logger.debug(`Playwright install stderr: ${installBrowsersResult.stderr}`);
          }

          // Also install firefox and webkit if needed
          try {
            await execAsync('npx playwright install firefox webkit', {
              cwd: projectPath,
              timeout: 600000
            });
            logger.info('Additional browsers (firefox, webkit) installed');
          } catch (additionalBrowserError) {
            logger.debug('Additional browser installation skipped or failed (non-critical)');
          }
        } catch (browserInstallError: any) {
          // If playwright install fails, it might not be a playwright project
          // Log warning but don't fail the entire clone operation
          logger.warn(`Playwright browser installation failed or not needed: ${browserInstallError.message}`);
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

      // Ensure Playwright browsers are installed before running tests
      logger.info('Checking Playwright browser installation...');
      try {
        // Run playwright install as a safety check - it's fast if browsers are already installed
        await execAsync(`npx playwright install ${browser} --with-deps`, {
          cwd: projectPath,
          timeout: 300000,
          env: {
            ...process.env,
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined
          }
        });
        logger.info(`Playwright browser (${browser}) verified/installed`);
      } catch (browserError: any) {
        logger.warn(`Browser installation check failed: ${browserError.message}`);
        // Continue anyway - the test command will fail with a clear message if browsers are missing
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
        `PLAYWRIGHT_HTML_REPORT="${reportPath}"`
        // Don't set PLAYWRIGHT_BROWSERS_PATH - let it use the installed browsers location
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

      // Complete command with environment variables (using cross-env for Windows compatibility)
      const fullCommand = `npx cross-env ${envVars.join(' ')} ${playwrightCmd}`;

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
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large outputs
            // Don't fail on non-zero exit code - we'll check results ourselves
            encoding: 'utf8'
          }
        );

        const duration = Date.now() - startTime;

        // Parse test results from output
        const combinedOutput = stdout + '\n' + stderr;
        const results = this.parsePlaywrightOutput(combinedOutput);

        logger.info(`Test execution completed (${results.failed > 0 ? 'with failures' : 'successfully'})`);
        logger.info(`Parsed results: ${results.total} total, ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);

        // Log more output for debugging if no results found
        if (results.total === 0) {
          logger.warn(`Full output length: stdout=${stdout.length}, stderr=${stderr.length}`);
          logger.warn(`Last 1000 chars of stdout: ${stdout.substring(Math.max(0, stdout.length - 1000))}`);
          logger.warn(`Last 1000 chars of stderr: ${stderr.substring(Math.max(0, stderr.length - 1000))}`);
        }

        // Check if HTML report was generated
        const reportIndexPath = path.join(reportPath, 'index.html');
        let reportGenerated = false;
        try {
          await fs.access(reportIndexPath);
          reportGenerated = true;
          logger.info(`HTML report generated successfully at: ${reportIndexPath}`);
        } catch {
          logger.warn(`HTML report not found at: ${reportIndexPath}`);
        }

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
          reportPath: reportGenerated ? `/reports/${reportName}/index.html` : undefined
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

        logger.info(`✅ Test run ${testRunId} saved to database with results: ${testResult.totalTests} total, ${testResult.passedTests} passed, ${testResult.failedTests} failed, ${testResult.skippedTests} skipped`);

        return testResult;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Error running Playwright tests:', error.message);

        // Even if there's an error, try to parse the output
        // Tests might have run but Playwright exited with error
        const combinedOutput = (error.stdout || '') + '\n' + (error.stderr || '');
        const results = this.parsePlaywrightOutput(combinedOutput);

        // Log output for debugging
        if (error.stdout) {
          logger.info(`Test output captured (${error.stdout.length} chars)`);
          // Log last part of output which usually has the summary
          const lastPart = error.stdout.substring(Math.max(0, error.stdout.length - 2000));
          logger.info(`Last 2000 chars of output:\n${lastPart}`);
        }

        // Check if HTML report was generated despite the error
        const reportIndexPath = path.join(reportPath, 'index.html');
        let reportGenerated = false;
        try {
          await fs.access(reportIndexPath);
          reportGenerated = true;
          logger.info(`HTML report generated at: ${reportIndexPath}`);
        } catch {
          logger.warn(`HTML report not found at: ${reportIndexPath}`);
        }

        // If we got test results, it's not a complete failure
        const status = results.total > 0 ? (results.failed > 0 ? 'failed' : 'completed') : 'failed';

        testResult = {
          projectId,
          suiteId,
          runName: runResult.rows[0].run_name,
          status,
          totalTests: results.total,
          passedTests: results.passed,
          failedTests: results.failed,
          skippedTests: results.skipped,
          duration,
          reportPath: reportGenerated ? `/reports/${reportName}/index.html` : undefined
        };

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
          [status, results.total, results.passed, results.failed, results.skipped, new Date(), duration, testRunId]
        );

        logger.info(`Test run ${testRunId} saved: ${results.total} total, ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped (status: ${status})`);

        // If we captured test results, return them instead of throwing
        if (results.total > 0) {
          logger.info(`Tests completed but Playwright exited with error. Returning captured results.`);
          return testResult;
        }

        // Only throw if we truly have no results
        throw new Error(`Test execution failed: ${error.message}`);
      }
    } catch (error: any) {
      logger.error('Error in runTests:', error);
      throw error;
    }
  }

  /**
   * Parse Playwright test output to extract results
   * Supports multiple output formats from Playwright test runner
   */
  private parsePlaywrightOutput(output: string): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  } {
    const results = { total: 0, passed: 0, failed: 0, skipped: 0 };

    try {
      logger.debug('Parsing Playwright output for test results...');

      // Method 1: Count individual test results from list reporter
      // Look for "✓" (passed), "✘" (failed), "⊘" (skipped) markers
      const passedTests = (output.match(/✓/g) || []).length;
      const failedTests = (output.match(/✘/g) || []).length;
      const skippedTests = (output.match(/⊘/g) || []).length;

      if (passedTests > 0 || failedTests > 0 || skippedTests > 0) {
        results.passed = passedTests;
        results.failed = failedTests;
        results.skipped = skippedTests;
        logger.debug(`Found from markers: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`);
      }

      // Method 2: Look for summary line like: "3 passed (5s)"
      const passedMatch = output.match(/(\d+)\s+passed/i);
      if (passedMatch && results.passed === 0) {
        results.passed = parseInt(passedMatch[1]);
        logger.debug(`Found passed tests from summary: ${results.passed}`);
      }

      // Method 3: Look for failed tests: "2 failed"
      const failedMatch = output.match(/(\d+)\s+failed/i);
      if (failedMatch && results.failed === 0) {
        results.failed = parseInt(failedMatch[1]);
        logger.debug(`Found failed tests from summary: ${results.failed}`);
      }

      // Method 4: Look for skipped tests: "1 skipped"
      const skippedMatch = output.match(/(\d+)\s+skipped/i);
      if (skippedMatch && results.skipped === 0) {
        results.skipped = parseInt(skippedMatch[1]);
        logger.debug(`Found skipped tests from summary: ${results.skipped}`);
      }

      // Method 5: Look for flaky tests: "1 flaky"
      const flakyMatch = output.match(/(\d+)\s+flaky/i);
      if (flakyMatch) {
        const flaky = parseInt(flakyMatch[1]);
        // Count flaky tests as passed (they eventually passed)
        results.passed += flaky;
        logger.debug(`Found flaky tests (counted as passed): ${flaky}`);
      }

      // Method 6: Alternative format - "Running X tests using Y workers"
      const runningMatch = output.match(/Running\s+(\d+)\s+tests?\s+using/i);
      if (runningMatch) {
        const totalFromRunning = parseInt(runningMatch[1]);
        logger.debug(`Found total tests from 'Running' line: ${totalFromRunning}`);
        // Use this as a sanity check
        const calculatedTotal = results.passed + results.failed + results.skipped;
        if (calculatedTotal === 0) {
          // If we haven't found individual results, at least we know the total
          logger.debug(`Using total from 'Running' line as reference`);
        }
      }

      // Method 7: Look for "X of Y tests passed"
      const ofTotalMatch = output.match(/(\d+)\s+of\s+(\d+)\s+tests?\s+passed/i);
      if (ofTotalMatch && results.total === 0) {
        results.passed = parseInt(ofTotalMatch[1]);
        const totalTests = parseInt(ofTotalMatch[2]);
        results.failed = totalTests - results.passed;
        logger.debug(`Found "X of Y" format: ${results.passed} of ${totalTests} passed`);
      }

      // Calculate total
      results.total = results.passed + results.failed + results.skipped;

      logger.info(`Parsed test results: ${results.total} total (${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped)`);

      // If no results were parsed, try to extract from the running line
      if (results.total === 0) {
        const runningMatch2 = output.match(/Running\s+(\d+)\s+tests?\s+using/i);
        if (runningMatch2) {
          const total = parseInt(runningMatch2[1]);
          logger.warn(`No detailed results found, but detected ${total} tests were scheduled to run`);
          logger.warn('Sample output (first 500 chars):');
          logger.warn(output.substring(0, 500));
          logger.warn('Sample output (last 500 chars):');
          logger.warn(output.substring(Math.max(0, output.length - 500)));
        } else {
          logger.warn('No test results found in output at all.');
          logger.warn('Sample output (first 500 chars):');
          logger.warn(output.substring(0, 500));
        }
      }

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
   * Get the latest test run for a project
   */
  async getLatestTestRun(projectId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT tr.*, u.username as triggered_by_username, ts.name as suite_name
         FROM test_runs tr
         LEFT JOIN users u ON tr.triggered_by = u.id
         LEFT JOIN test_suites ts ON tr.suite_id = ts.id
         WHERE tr.project_id = $1
         ORDER BY tr.created_at DESC
         LIMIT 1`,
        [projectId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const testRun = result.rows[0];

      // Get report path if available
      const reportPath = await this.getReportPath(testRun.id);

      return {
        ...testRun,
        reportPath,
        reportUrl: reportPath ? `http://localhost:${process.env.PORT || 5000}${reportPath}` : null
      };
    } catch (error) {
      logger.error('Error getting latest test run:', error);
      throw error;
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
