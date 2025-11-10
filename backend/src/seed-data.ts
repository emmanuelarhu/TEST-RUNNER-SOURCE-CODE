import pool from './config/database';
import logger from './config/logger';

export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Check if data already exists
    const projectCheck = await pool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projectCheck.rows[0].count) > 0) {
      logger.info('⚠️  Database already has data. Skipping seed.');
      return;
    }

    // Create a default project
    const projectResult = await pool.query(`
      INSERT INTO projects (name, description, base_url)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Test Automation Platform', 'Main testing platform for all applications', 'https://example.com']);

    const projectId = projectResult.rows[0].id;
    logger.info(`✅ Created project: ${projectId}`);

    // Create test suites matching the design
    const testSuites = [
      {
        name: 'Consumer Web Portal',
        description: 'End-to-end tests for customer-facing web application',
        icon: '🛍️',
        totalTests: 45,
        passed: 42,
        failed: 2,
        skipped: 1
      },
      {
        name: 'ECG PowerApp',
        description: 'Automated testing suite for energy management system',
        icon: '⚡',
        totalTests: 32,
        passed: 30,
        failed: 1,
        skipped: 1
      },
      {
        name: 'MA Portal Dashboard',
        description: 'Management analytics and reporting interface tests',
        icon: '📊',
        totalTests: 28,
        passed: 25,
        failed: 2,
        skipped: 1
      },
      {
        name: 'Partners Integration',
        description: 'Partner API and integration testing suite',
        icon: '🤝',
        totalTests: 38,
        passed: 36,
        failed: 1,
        skipped: 1
      }
    ];

    for (const suite of testSuites) {
      const suiteResult = await pool.query(`
        INSERT INTO test_suites (project_id, name, description, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [projectId, suite.name, suite.description, 'active']);

      const suiteId = suiteResult.rows[0].id;
      logger.info(`✅ Created suite: ${suite.name}`);

      // Create test cases for each suite
      const testCaseNames = [
        'User login validation',
        'Dashboard data loading',
        'Form submission workflow',
        'API endpoint connectivity',
        'Database transaction integrity',
        'Error handling scenarios',
        'Performance benchmarks',
        'Security validation'
      ];

      for (let i = 0; i < suite.totalTests; i++) {
        const testName = testCaseNames[i % testCaseNames.length] + ` - Test ${i + 1}`;
        await pool.query(`
          INSERT INTO test_cases (suite_id, name, description, test_type, priority, test_script)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          suiteId,
          testName,
          `Automated test for ${suite.name}`,
          ['functional', 'e2e', 'integration', 'smoke'][i % 4],
          ['high', 'medium', 'low'][i % 3],
          `// Test script for ${testName}\nawait page.goto('/');\nawait page.click('button');\nexpect(page).toHaveTitle('Expected Title');`
        ]);
      }

      // Create test run history
      const now = new Date();
      const runTime = new Date(now.getTime() - Math.random() * 7200000); // Random time in last 2 hours

      await pool.query(`
        INSERT INTO test_runs (
          project_id, suite_id, run_name, status,
          total_tests, passed_tests, failed_tests, skipped_tests,
          start_time, end_time, duration_ms, browser, environment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        projectId,
        suiteId,
        `${suite.name} - Automated Run`,
        suite.failed > 0 ? 'failed' : 'completed',
        suite.totalTests,
        suite.passed,
        suite.failed,
        suite.skipped,
        runTime,
        new Date(runTime.getTime() + Math.random() * 300000), // 0-5 min duration
        Math.floor(Math.random() * 300000),
        'chromium',
        'production'
      ]);
    }

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`📊 Created ${testSuites.length} test suites with sample data`);

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
};
