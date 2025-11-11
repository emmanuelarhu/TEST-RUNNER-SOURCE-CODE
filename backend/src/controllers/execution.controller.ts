import { Request, Response } from 'express';
import playwrightService from '../services/playwright.service';
import pool from '../config/database';
import logger from '../config/logger';
import { ExecuteTestDTO } from '../models/types';

export class TestExecutionController {
  /**
   * Execute tests using Playwright
   */
  async executeTestSuite(req: Request, res: Response): Promise<void> {
    try {
      const { suiteId } = req.params;
      const executeOptions: ExecuteTestDTO = {
        suite_id: suiteId,
        browser: req.body.browser || 'chromium',
        environment: req.body.environment || 'test',
        headless: req.body.headless ?? true
      };

      logger.info(`Executing test suite: ${suiteId}`);

      // Get suite details to find project
      const suiteResult = await pool.query(
        'SELECT project_id FROM test_suites WHERE id = $1',
        [suiteId]
      );

      if (suiteResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test suite not found'
        });
        return;
      }

      const projectId = suiteResult.rows[0].project_id;

      // Execute tests using Playwright service
      const result = await playwrightService.runTests({
        projectId,
        suiteId,
        browser: executeOptions.browser,
        headed: !executeOptions.headless,
        workers: 1
      });

      res.json({
        success: true,
        message: 'Test suite execution completed',
        data: result
      });
    } catch (error: any) {
      logger.error('Error executing test suite:', error);
      res.status(500).json({
        success: false,
        message: 'Test suite execution failed',
        error: error.message
      });
    }
  }

  /**
   * Execute tests for a project
   */
  async executeProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { browser = 'chromium', headless = true, workers = 1 } = req.body;

      logger.info(`Executing tests for project: ${projectId}`);

      // Execute tests using Playwright service
      const result = await playwrightService.runTests({
        projectId,
        browser,
        headed: !headless,
        workers
      });

      res.json({
        success: true,
        message: 'Project tests execution completed',
        data: result
      });
    } catch (error: any) {
      logger.error('Error executing project tests:', error);
      res.status(500).json({
        success: false,
        message: 'Project execution failed',
        error: error.message
      });
    }
  }

  /**
   * Get test execution history
   */
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { testCaseId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await pool.query(
        `SELECT te.*, tc.name as test_case_name, u.username as executed_by_username
         FROM test_executions te
         JOIN test_cases tc ON te.test_case_id = tc.id
         LEFT JOIN users u ON te.executed_by = u.id
         WHERE te.test_case_id = $1
         ORDER BY te.created_at DESC
         LIMIT $2`,
        [testCaseId, limit]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching execution history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch execution history',
        error: error.message
      });
    }
  }

  /**
   * Get test run details
   */
  async getTestRun(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;

      const runResult = await pool.query(
        `SELECT tr.*, u.username as triggered_by_username, ts.name as suite_name, p.name as project_name
         FROM test_runs tr
         LEFT JOIN users u ON tr.triggered_by = u.id
         LEFT JOIN test_suites ts ON tr.suite_id = ts.id
         LEFT JOIN projects p ON tr.project_id = p.id
         WHERE tr.id = $1`,
        [runId]
      );

      if (runResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test run not found'
        });
        return;
      }

      // Get report path if available
      const reportPath = await playwrightService.getReportPath(runId);

      res.json({
        success: true,
        data: {
          ...runResult.rows[0],
          reportPath
        }
      });
    } catch (error: any) {
      logger.error('Error fetching test run:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test run',
        error: error.message
      });
    }
  }

  /**
   * Get all test runs for a project
   */
  async getProjectTestRuns(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await pool.query(
        `SELECT tr.*, u.username as triggered_by_username, ts.name as suite_name
         FROM test_runs tr
         LEFT JOIN users u ON tr.triggered_by = u.id
         LEFT JOIN test_suites ts ON tr.suite_id = ts.id
         WHERE tr.project_id = $1
         ORDER BY tr.created_at DESC
         LIMIT $2`,
        [projectId, limit]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching test runs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test runs',
        error: error.message
      });
    }
  }

  /**
   * Clone repository for a project
   */
  async cloneRepository(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { repoUrl, branch = 'main' } = req.body;

      // Validate request body
      if (!repoUrl || !repoUrl.trim()) {
        res.status(400).json({
          success: false,
          message: 'Repository URL is required'
        });
        return;
      }

      // Validate repoUrl format
      try {
        const url = new URL(repoUrl.replace(/^https:\/\/[^@]+@/, 'https://'));
        const validHosts = ['github.com', 'gitlab.com', 'dev.azure.com', 'bitbucket.org'];
        if (!validHosts.some(host => url.hostname.includes(host))) {
          logger.warn(`Repository URL uses non-standard host: ${url.hostname}`);
        }
      } catch (urlError) {
        res.status(400).json({
          success: false,
          message: 'Invalid repository URL format. Expected a valid Git repository URL (GitHub, GitLab, Azure DevOps, or Bitbucket)'
        });
        return;
      }

      // Validate branch name
      if (branch && !/^[a-zA-Z0-9._\/-]+$/.test(branch)) {
        res.status(400).json({
          success: false,
          message: 'Invalid branch name. Branch names can only contain letters, numbers, dots, hyphens, underscores, and forward slashes'
        });
        return;
      }

      // Get project details
      const projectResult = await pool.query(
        'SELECT name FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      const projectName = projectResult.rows[0].name;

      logger.info(`Cloning repository for project: ${projectName}, branch: ${branch}`);

      // Clone repository
      const projectPath = await playwrightService.cloneRepository(
        repoUrl,
        projectName,
        branch
      );

      // Update project with repo URL
      await pool.query(
        'UPDATE projects SET base_url = $1 WHERE id = $2',
        [repoUrl, projectId]
      );

      logger.info(`Repository cloned successfully to: ${projectPath}`);

      res.json({
        success: true,
        message: 'Repository cloned successfully',
        data: {
          projectPath,
          projectName,
          branch
        }
      });
    } catch (error: any) {
      logger.error('Error cloning repository:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to clone repository';
      let statusCode = 500;

      if (error.message.includes('Authentication failed') || error.message.includes('authentication')) {
        errorMessage = error.message;
        statusCode = 401;
      } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
        errorMessage = error.message;
        statusCode = 404;
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = error.message;
        statusCode = 408;
      } else {
        errorMessage = error.message || 'An unexpected error occurred while cloning the repository';
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: error.message
      });
    }
  }

  /**
   * Get HTML report for a test run
   */
  async getTestReport(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;

      const reportPath = await playwrightService.getReportPath(runId);

      if (!reportPath) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { reportPath, reportUrl: `http://localhost:${process.env.PORT || 5000}${reportPath}` }
      });
    } catch (error: any) {
      logger.error('Error getting test report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test report',
        error: error.message
      });
    }
  }
}

export default new TestExecutionController();