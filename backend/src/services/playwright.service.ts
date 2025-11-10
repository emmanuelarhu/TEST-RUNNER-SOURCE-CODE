import { chromium, firefox, webkit, Browser, BrowserContext, Page } from '@playwright/test';
import { ExecuteTestDTO, TestExecutionResult } from '../models/types';
import pool from '../config/database';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class PlaywrightExecutor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Initialize browser instance
   */
  async initBrowser(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium', headless: boolean = true): Promise<void> {
    try {
      logger.info(`Initializing ${browserType} browser (headless: ${headless})`);
      
      const launchOptions = {
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };

      switch (browserType) {
        case 'firefox':
          this.browser = await firefox.launch(launchOptions);
          break;
        case 'webkit':
          this.browser = await webkit.launch(launchOptions);
          break;
        default:
          this.browser = await chromium.launch(launchOptions);
      }

      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
          dir: path.join(process.cwd(), 'uploads', 'videos'),
          size: { width: 1920, height: 1080 }
        }
      });

      this.page = await this.context.newPage();
      logger.info('✅ Browser initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Execute a single test case
   */
  async executeTest(testCaseId: string, executionId: string): Promise<TestExecutionResult> {
    const startTime = Date.now();
    let result: TestExecutionResult = {
      execution_id: executionId,
      test_case_id: testCaseId,
      status: 'running',
      duration_ms: 0
    };

    try {
      // Fetch test case details from database
      const testCaseQuery = await pool.query(
        'SELECT * FROM test_cases WHERE id = $1',
        [testCaseId]
      );

      if (testCaseQuery.rows.length === 0) {
        throw new Error(`Test case ${testCaseId} not found`);
      }

      const testCase = testCaseQuery.rows[0];
      logger.info(`Executing test: ${testCase.name}`);

      // Update execution status to running
      await pool.query(
        `UPDATE test_executions 
         SET status = 'running', start_time = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [executionId]
      );

      // Execute the test script
      if (testCase.test_script && this.page) {
        await this.runTestScript(testCase.test_script, this.page);
        
        result.status = 'passed';
        logger.info(`✅ Test ${testCase.name} passed`);
      } else {
        throw new Error('No test script found or page not initialized');
      }

    } catch (error: any) {
      result.status = 'failed';
      result.error_message = error.message;
      logger.error(`❌ Test failed:`, error);

      // Take screenshot on failure
      if (this.page) {
        const screenshotPath = await this.captureScreenshot(testCaseId);
        result.screenshot_path = screenshotPath;
      }
    } finally {
      const endTime = Date.now();
      result.duration_ms = endTime - startTime;

      // Update execution record in database
      await pool.query(
        `UPDATE test_executions 
         SET status = $1, end_time = CURRENT_TIMESTAMP, duration_ms = $2, 
             error_message = $3, screenshot_path = $4
         WHERE id = $5`,
        [result.status, result.duration_ms, result.error_message || null, result.screenshot_path || null, executionId]
      );
    }
