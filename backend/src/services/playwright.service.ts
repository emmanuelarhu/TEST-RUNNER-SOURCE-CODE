import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
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

    return result;
  }

  /**
   * Run test script
   */
  private async runTestScript(script: string, page: Page): Promise<void> {
    // Create an async function from the script
    const testFunction = new Function('page', 'expect', `
      return (async () => {
        ${script}
      })();
    `);

    // Execute the test script
    await testFunction(page, null);
  }

  /**
   * Capture screenshot
   */
  private async captureScreenshot(testCaseId: string): Promise<string> {
    const screenshotDir = path.join(process.cwd(), 'uploads', 'screenshots');

    // Ensure directory exists
    await fs.mkdir(screenshotDir, { recursive: true });

    const filename = `${testCaseId}-${uuidv4()}.png`;
    const filepath = path.join(screenshotDir, filename);

    if (this.page) {
      await this.page.screenshot({ path: filepath, fullPage: true });
      logger.info(`📸 Screenshot saved: ${filepath}`);
    }

    return filepath;
  }

  /**
   * Close browser
   */
  async closeBrowser(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      logger.info('✅ Browser closed successfully');
    } catch (error) {
      logger.error('❌ Error closing browser:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources (alias for closeBrowser)
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }

  /**
   * Execute entire test suite
   */
  async executeTestSuite(suiteId: string, options: ExecuteTestDTO): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];

    try {
      // Fetch all test cases in the suite
      const casesQuery = await pool.query(
        'SELECT * FROM test_cases WHERE suite_id = $1 ORDER BY created_at',
        [suiteId]
      );

      if (casesQuery.rows.length === 0) {
        logger.warn(`No test cases found in suite ${suiteId}`);
        return results;
      }

      logger.info(`Executing ${casesQuery.rows.length} test cases in suite ${suiteId}`);

      // Initialize browser once for all tests
      await this.initBrowser(options.browser || 'chromium', options.headless ?? true);

      // Execute each test case
      for (const testCase of casesQuery.rows) {
        try {
          // Create execution record
          const executionResult = await pool.query(
            `INSERT INTO test_executions (test_case_id, suite_id, status, browser, environment)
             VALUES ($1, $2, 'pending', $3, $4)
             RETURNING id`,
            [testCase.id, suiteId, options.browser || 'chromium', options.environment || 'test']
          );

          const executionId = executionResult.rows[0].id;

          // Execute test
          const result = await this.executeTest(testCase.id, executionId);
          results.push(result);

          logger.info(`Test case ${testCase.name}: ${result.status}`);
        } catch (error: any) {
          logger.error(`Failed to execute test case ${testCase.id}:`, error);
          results.push({
            test_case_id: testCase.id,
            execution_id: '',
            status: 'failed',
            error_message: error.message,
            duration_ms: 0
          });
        }
      }

      logger.info(`Suite execution complete: ${results.filter((r: TestExecutionResult) => r.status === 'passed').length}/${results.length} passed`);
    } catch (error: any) {
      logger.error('Error executing test suite:', error);
      throw error;
    } finally {
      await this.cleanup();
    }

    return results;
  }
}

export default new PlaywrightExecutor();
