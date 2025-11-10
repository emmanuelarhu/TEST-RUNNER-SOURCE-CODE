import { Request, Response } from 'express';
import playwrightService from '../services/playwright.service';
import logger from '../config/logger';

export class PlaywrightController {
  /**
   * Clone a repository
   */
  async cloneRepository(req: Request, res: Response): Promise<void> {
    try {
      const { repoUrl, projectName, branch } = req.body;
      
      const projectPath = await playwrightService.cloneRepository(
        repoUrl,
        projectName,
        branch || 'main'
      );
      
      res.json({
        success: true,
        message: 'Repository cloned successfully',
        data: { projectPath }
      });
    } catch (error: any) {
      logger.error('Error cloning repository:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Run Playwright tests
   */
  async runTests(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, suiteId, browser, headed, workers } = req.body;
      
      const result = await playwrightService.runTests({
        projectId,
        suiteId,
        browser: browser || 'chromium',
        headed: headed || false,
        workers: workers || 1
      });
      
      res.json({
        success: true,
        message: 'Tests executed successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error running tests:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get test report
   */
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { testRunId } = req.params;
      
      const reportPath = await playwrightService.getReportPath(testRunId);
      
      if (!reportPath) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: { reportPath }
      });
    } catch (error: any) {
      logger.error('Error getting report:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new PlaywrightController();