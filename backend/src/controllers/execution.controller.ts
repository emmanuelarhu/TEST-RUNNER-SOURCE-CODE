import { Request, Response } from 'express';
import { PlaywrightExecutor } from '../services/playwright.service';
import pool from '../config/database';
import logger from '../config/logger';
import { ExecuteTestDTO } from '../models/types';

export class TestExecutionController {
  private executor: PlaywrightExecutor;

  constructor() {
    this.executor = new PlaywrightExecutor();
  }

  /**
   * Execute a single test case
   */
  async executeTestCase(req: Request, res: Response): Promise<void> {
    try {
      const { testCaseId } = req.params;
      const { browser, environment, headless } = req.body;

      logger.info(`Executing test case: ${testCaseId}`);

      // Initialize browser
      await this.executor.initBrowser(browser || 'chromium', headless ?? true);

      // Create execution record
      const executionResult = await pool.query(
        `INSERT INTO test_executions (test_case_id, status, browser, environment)
         VALUES ($1, 'pending', $2, $3)
         RETURNING id`,
        [testCaseId, browser || 'chromium', environment || 'test']
      );

      const executionId = executionResult.rows[0].id;

      // Execute test
      const result = await this.executor.executeTest(testCaseId, executionId);

      res.json({
        success: true,
        message: 'Test execution completed',
        data: result
      });
    } catch (error: any) {
      logger.error('Error executing test case:', error);
      res.status(500).json({
        success: false,
        message: 'Test execution failed',
        error: error.message
      });
    } finally {
      await this.executor.cleanup();
    }
  }

  /**
   * Execute entire test suite
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

      // Execute tests
      const results = await this.executor.executeTestSuite(suiteId, executeOptions);

      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      };

      res.json({
        success: true,
        message: 'Test suite execution completed',
        data: {
          results,
          summary
        }
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
        `SELECT tr.*, u.username as triggered_by_username, ts.name as suite_name
         FROM test_runs tr
         LEFT JOIN users u ON tr.triggered_by = u.id
         LEFT JOIN test_suites ts ON tr.suite_id = ts.id
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

      // Get execution details
      const executionsResult = await pool.query(
        `SELECT te.*, tc.name as test_case_name
         FROM test_executions te
         JOIN test_cases tc ON te.test_case_id = tc.id
         WHERE te.suite_id = $1
         AND te.created_at >= (SELECT start_time FROM test_runs WHERE id = $2)
         ORDER BY te.created_at`,
        [runResult.rows[0].suite_id, runId]
      );

      res.json({
        success: true,
        data: {
          run: runResult.rows[0],
          executions: executionsResult.rows
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
}

export default new TestExecutionController();