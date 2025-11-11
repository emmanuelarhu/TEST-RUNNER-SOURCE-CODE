import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../config/logger';
import pool from '../config/database';

interface TestSuite {
  name: string;
  filePath: string;
  tests: TestCase[];
}

interface TestCase {
  name: string;
  line: number;
}

class TestDiscoveryService {
  private readonly projectsDir = path.join(__dirname, '../../test-projects');

  /**
   * Discover all test files in a project directory
   */
  async discoverTestFiles(projectName: string): Promise<string[]> {
    const projectPath = path.join(this.projectsDir, projectName);
    const testFiles: string[] = [];

    try {
      await this.findTestFilesRecursive(projectPath, projectPath, testFiles);
      logger.info(`Found ${testFiles.length} test files in project: ${projectName}`);
      return testFiles;
    } catch (error) {
      logger.error(`Error discovering test files in ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * Recursively find all .spec.ts, .spec.js, .test.ts, .test.js files
   */
  private async findTestFilesRecursive(
    currentPath: string,
    basePath: string,
    testFiles: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip node_modules and other common directories
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
            await this.findTestFilesRecursive(fullPath, basePath, testFiles);
          }
        } else if (entry.isFile()) {
          // Check if file is a test file
          if (this.isTestFile(entry.name)) {
            const relativePath = path.relative(basePath, fullPath);
            testFiles.push(relativePath);
          }
        }
      }
    } catch (error) {
      logger.debug(`Could not read directory ${currentPath}:`, error);
    }
  }

  /**
   * Check if filename is a test file
   */
  private isTestFile(filename: string): boolean {
    const testPatterns = [
      /\.spec\.ts$/,
      /\.spec\.js$/,
      /\.test\.ts$/,
      /\.test\.js$/,
      /\.e2e\.ts$/,
      /\.e2e-spec\.ts$/
    ];

    return testPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Parse a test file to extract test suites and test cases
   */
  async parseTestFile(projectName: string, relativeFilePath: string): Promise<TestSuite> {
    const projectPath = path.join(this.projectsDir, projectName);
    const fullPath = path.join(projectPath, relativeFilePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const tests = this.extractTestCases(content);

      // Extract suite name from file path or describe block
      const suiteName = this.extractSuiteName(relativeFilePath, content);

      return {
        name: suiteName,
        filePath: relativeFilePath,
        tests
      };
    } catch (error) {
      logger.error(`Error parsing test file ${relativeFilePath}:`, error);
      throw error;
    }
  }

  /**
   * Extract suite name from file path or describe block
   */
  private extractSuiteName(filePath: string, content: string): string {
    // Try to find describe block name
    const describeMatch = content.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (describeMatch) {
      return describeMatch[1];
    }

    // Fallback to file name
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName
      .replace(/\.spec$|\.test$|\.e2e$/, '')
      .split(/[-_.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract test cases from file content using regex patterns
   */
  private extractTestCases(content: string): TestCase[] {
    const tests: TestCase[] = [];
    const lines = content.split('\n');

    // Patterns to match test declarations
    const testPatterns = [
      /^\s*test\s*\(\s*['"`]([^'"`]+)['"`]/,           // test('name')
      /^\s*it\s*\(\s*['"`]([^'"`]+)['"`]/,             // it('name')
      /^\s*test\.only\s*\(\s*['"`]([^'"`]+)['"`]/,     // test.only('name')
      /^\s*it\.only\s*\(\s*['"`]([^'"`]+)['"`]/,       // it.only('name')
      /^\s*test\.skip\s*\(\s*['"`]([^'"`]+)['"`]/,     // test.skip('name')
      /^\s*it\.skip\s*\(\s*['"`]([^'"`]+)['"`]/        // it.skip('name')
    ];

    lines.forEach((line, index) => {
      for (const pattern of testPatterns) {
        const match = line.match(pattern);
        if (match) {
          tests.push({
            name: match[1],
            line: index + 1
          });
          break;
        }
      }
    });

    return tests;
  }

  /**
   * Sync discovered tests to database for a project
   */
  async syncTestsToDatabase(projectId: string, projectName: string): Promise<{
    suitesCreated: number;
    testsCreated: number;
  }> {
    try {
      logger.info(`Starting test sync for project: ${projectName}`);

      // Discover all test files
      const testFiles = await this.discoverTestFiles(projectName);

      if (testFiles.length === 0) {
        logger.warn(`No test files found in project: ${projectName}`);
        return { suitesCreated: 0, testsCreated: 0 };
      }

      let suitesCreated = 0;
      let testsCreated = 0;

      // Parse each test file and save to database
      for (const testFile of testFiles) {
        const suite = await this.parseTestFile(projectName, testFile);

        // Check if suite already exists
        const existingSuite = await pool.query(
          'SELECT id FROM test_suites WHERE project_id = $1 AND name = $2',
          [projectId, suite.name]
        );

        let suiteId: string;

        if (existingSuite.rows.length > 0) {
          suiteId = existingSuite.rows[0].id;
          logger.debug(`Suite already exists: ${suite.name}`);
        } else {
          // Create new suite
          const suiteResult = await pool.query(
            `INSERT INTO test_suites (project_id, name, description)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [projectId, suite.name, `Test file: ${suite.filePath}`]
          );
          suiteId = suiteResult.rows[0].id;
          suitesCreated++;
          logger.info(`Created suite: ${suite.name}`);
        }

        // Create test cases for this suite
        for (const test of suite.tests) {
          // Check if test case already exists
          const existingTest = await pool.query(
            'SELECT id FROM test_cases WHERE suite_id = $1 AND name = $2',
            [suiteId, test.name]
          );

          if (existingTest.rows.length === 0) {
            await pool.query(
              `INSERT INTO test_cases (suite_id, name, description, file_path, line_number)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                suiteId,
                test.name,
                `Test at line ${test.line}`,
                suite.filePath,
                test.line
              ]
            );
            testsCreated++;
            logger.debug(`Created test: ${test.name}`);
          }
        }
      }

      logger.info(`Test sync completed: ${suitesCreated} suites, ${testsCreated} tests created`);

      return { suitesCreated, testsCreated };
    } catch (error) {
      logger.error('Error syncing tests to database:', error);
      throw error;
    }
  }

  /**
   * Get test statistics for a project
   */
  async getProjectTestStats(projectId: string): Promise<{
    totalSuites: number;
    totalTests: number;
    testFiles: string[];
  }> {
    try {
      // Get project name from database
      const projectResult = await pool.query(
        'SELECT name FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const projectName = projectResult.rows[0].name;

      // Discover test files
      const testFiles = await this.discoverTestFiles(projectName);

      // Get database counts
      const suiteCount = await pool.query(
        'SELECT COUNT(*) as count FROM test_suites WHERE project_id = $1',
        [projectId]
      );

      const testCount = await pool.query(
        `SELECT COUNT(*) as count FROM test_cases tc
         JOIN test_suites ts ON tc.suite_id = ts.id
         WHERE ts.project_id = $1`,
        [projectId]
      );

      return {
        totalSuites: parseInt(suiteCount.rows[0].count),
        totalTests: parseInt(testCount.rows[0].count),
        testFiles
      };
    } catch (error) {
      logger.error('Error getting project test stats:', error);
      throw error;
    }
  }
}

export default new TestDiscoveryService();
