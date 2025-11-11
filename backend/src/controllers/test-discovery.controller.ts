import { Request, Response } from 'express';
import testDiscoveryService from '../services/test-discovery.service';
import logger from '../config/logger';

export class TestDiscoveryController {
  /**
   * Scan and sync tests from a project directory to database
   */
  async syncProjectTests(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      // Get project name from database
      const pool = require('../config/database').default;
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

      logger.info(`Syncing tests for project: ${projectName}`);

      // Sync tests to database
      const result = await testDiscoveryService.syncTestsToDatabase(projectId, projectName);

      res.json({
        success: true,
        message: 'Tests synced successfully',
        data: {
          projectName,
          suitesCreated: result.suitesCreated,
          testsCreated: result.testsCreated
        }
      });
    } catch (error: any) {
      logger.error('Error syncing project tests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync tests',
        error: error.message
      });
    }
  }

  /**
   * Get discovered test files for a project
   */
  async getProjectTestFiles(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      // Get project name from database
      const pool = require('../config/database').default;
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

      // Discover test files
      const testFiles = await testDiscoveryService.discoverTestFiles(projectName);

      res.json({
        success: true,
        data: {
          projectName,
          testFiles,
          count: testFiles.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting test files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test files',
        error: error.message
      });
    }
  }

  /**
   * Get test statistics for a project
   */
  async getProjectTestStats(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const stats = await testDiscoveryService.getProjectTestStats(projectId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting test stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test stats',
        error: error.message
      });
    }
  }

  /**
   * Parse a specific test file
   */
  async parseTestFile(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { filePath } = req.body;

      if (!filePath) {
        res.status(400).json({
          success: false,
          message: 'File path is required'
        });
        return;
      }

      // Get project name from database
      const pool = require('../config/database').default;
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

      // Parse the test file
      const suite = await testDiscoveryService.parseTestFile(projectName, filePath);

      res.json({
        success: true,
        data: suite
      });
    } catch (error: any) {
      logger.error('Error parsing test file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to parse test file',
        error: error.message
      });
    }
  }
}

export default new TestDiscoveryController();
