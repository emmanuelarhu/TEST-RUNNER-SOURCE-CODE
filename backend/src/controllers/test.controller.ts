import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { CreateTestSuiteDTO, CreateTestCaseDTO } from '../models/types';

export class TestController {
  /**
   * Get all test suites for a project
   */
  async getProjectTestSuites(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const result = await pool.query(
        `SELECT ts.*, 
                COUNT(tc.id) as test_count,
                u.username as created_by_username
         FROM test_suites ts
         LEFT JOIN test_cases tc ON ts.id = tc.suite_id
         LEFT JOIN users u ON ts.created_by = u.id
         WHERE ts.project_id = $1
         GROUP BY ts.id, u.username
         ORDER BY ts.created_at DESC`,
        [projectId]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching test suites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test suites',
        error: error.message
      });
    }
  }

  /**
   * Get test suite by ID
   */
  async getTestSuiteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const suiteResult = await pool.query(
        `SELECT ts.*, u.username as created_by_username
         FROM test_suites ts
         LEFT JOIN users u ON ts.created_by = u.id
         WHERE ts.id = $1`,
        [id]
      );

      if (suiteResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test suite not found'
        });
        return;
      }

      // Get test cases
      const casesResult = await pool.query(
        'SELECT * FROM test_cases WHERE suite_id = $1 ORDER BY created_at',
        [id]
      );

      res.json({
        success: true,
        data: {
          ...suiteResult.rows[0],
          test_cases: casesResult.rows
        }
      });
    } catch (error: any) {
      logger.error('Error fetching test suite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test suite',
        error: error.message
      });
    }
  }

  /**
   * Create test suite
   */
  async createTestSuite(req: Request, res: Response): Promise<void> {
    try {
      const { project_id, name, description }: CreateTestSuiteDTO = req.body;
      const userId = (req as any).user?.id;

      const result = await pool.query(
        `INSERT INTO test_suites (project_id, name, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project_id, name, description, userId]
      );

      logger.info(`Test suite created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Test suite created successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error creating test suite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test suite',
        error: error.message
      });
    }
  }

  /**
   * Update test suite
   */
  async updateTestSuite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;

      const result = await pool.query(
        `UPDATE test_suites 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             status = COALESCE($3, status)
         WHERE id = $4
         RETURNING *`,
        [name, description, status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test suite not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test suite updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error updating test suite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update test suite',
        error: error.message
      });
    }
  }

  /**
   * Delete test suite
   */
  async deleteTestSuite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM test_suites WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test suite not found'
        });
        return;
      }

      logger.info(`Test suite deleted: ${id}`);

      res.json({
        success: true,
        message: 'Test suite deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting test suite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete test suite',
        error: error.message
      });
    }
  }

  /**
   * Get all test cases in a suite
   */
  async getSuiteTestCases(req: Request, res: Response): Promise<void> {
    try {
      const { suiteId } = req.params;

      const result = await pool.query(
        `SELECT tc.*,
                (SELECT COUNT(*) FROM test_executions WHERE test_case_id = tc.id) as execution_count,
                (SELECT COUNT(*) FROM test_executions WHERE test_case_id = tc.id AND status = 'passed') as passed_count,
                (SELECT COUNT(*) FROM test_executions WHERE test_case_id = tc.id AND status = 'failed') as failed_count
         FROM test_cases tc
         WHERE tc.suite_id = $1
         ORDER BY tc.created_at DESC`,
        [suiteId]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching test cases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test cases',
        error: error.message
      });
    }
  }

  /**
   * Get test case by ID
   */
  async getTestCaseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM test_cases WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test case not found'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error fetching test case:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test case',
        error: error.message
      });
    }
  }

  /**
   * Create test case
   */
  async createTestCase(req: Request, res: Response): Promise<void> {
    try {
      const {
        suite_id,
        name,
        description,
        test_type,
        priority,
        test_script,
        expected_result,
        tags
      }: CreateTestCaseDTO = req.body;

      const result = await pool.query(
        `INSERT INTO test_cases (suite_id, name, description, test_type, priority, test_script, expected_result, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [suite_id, name, description, test_type, priority, test_script, expected_result, tags]
      );

      logger.info(`Test case created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Test case created successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error creating test case:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test case',
        error: error.message
      });
    }
  }

  /**
   * Update test case
   */
  async updateTestCase(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        test_type,
        priority,
        test_script,
        expected_result,
        tags
      } = req.body;

      const result = await pool.query(
        `UPDATE test_cases 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             test_type = COALESCE($3, test_type),
             priority = COALESCE($4, priority),
             test_script = COALESCE($5, test_script),
             expected_result = COALESCE($6, expected_result),
             tags = COALESCE($7, tags)
         WHERE id = $8
         RETURNING *`,
        [name, description, test_type, priority, test_script, expected_result, tags, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test case not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test case updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error updating test case:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update test case',
        error: error.message
      });
    }
  }

  /**
   * Delete test case
   */
  async deleteTestCase(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM test_cases WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Test case not found'
        });
        return;
      }

      logger.info(`Test case deleted: ${id}`);

      res.json({
        success: true,
        message: 'Test case deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting test case:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete test case',
        error: error.message
      });
    }
  }
}

export default new TestController();