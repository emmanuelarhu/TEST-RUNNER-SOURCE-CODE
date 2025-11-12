import pool from '../config/database';
import logger from '../config/logger';

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_url VARCHAR(255),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test suites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_suites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        file_path VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test cases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        test_type VARCHAR(30) DEFAULT 'functional' CHECK (test_type IN ('functional', 'api', 'e2e', 'integration', 'smoke', 'regression')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
        test_script TEXT,
        expected_result TEXT,
        tags TEXT[],
        file_path VARCHAR(500),
        line_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add file_path and line_number columns if they don't exist (for existing databases)
    await pool.query(`
      ALTER TABLE test_cases
      ADD COLUMN IF NOT EXISTS file_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS line_number INTEGER;
    `);

    // Test executions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
        suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'skipped', 'error')),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        duration_ms INTEGER,
        error_message TEXT,
        stack_trace TEXT,
        screenshot_path VARCHAR(255),
        video_path VARCHAR(255),
        executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        browser VARCHAR(20),
        environment VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test run history table (for batch executions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
        run_name VARCHAR(100),
        run_number INTEGER,
        status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        skipped_tests INTEGER DEFAULT 0,
        flaky_tests INTEGER DEFAULT 0,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        duration_ms INTEGER,
        triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        environment VARCHAR(50),
        browser VARCHAR(20),
        report_path VARCHAR(500),
        report_url VARCHAR(500),
        exit_code INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add new columns to existing test_runs table
    await pool.query(`
      ALTER TABLE test_runs
      ADD COLUMN IF NOT EXISTS flaky_tests INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS report_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS report_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS exit_code INTEGER,
      ADD COLUMN IF NOT EXISTS run_number INTEGER;
    `);

    // Test run suites table (suite-level results for each run)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_run_suites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
        suite_name VARCHAR(200) NOT NULL,
        file_path VARCHAR(500),
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        skipped_tests INTEGER DEFAULT 0,
        flaky_tests INTEGER DEFAULT 0,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test run cases table (individual test case results for each run)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_run_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
        suite_name VARCHAR(200),
        test_name VARCHAR(300) NOT NULL,
        file_path VARCHAR(500),
        line_number INTEGER,
        status VARCHAR(20) CHECK (status IN ('passed', 'failed', 'skipped', 'flaky')),
        duration_ms INTEGER,
        error_message TEXT,
        stack_trace TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON test_cases(suite_id);
      CREATE INDEX IF NOT EXISTS idx_test_executions_test_case_id ON test_executions(test_case_id);
      CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
      CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON test_runs(project_id);
      CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
      CREATE INDEX IF NOT EXISTS idx_test_run_suites_test_run_id ON test_run_suites(test_run_id);
      CREATE INDEX IF NOT EXISTS idx_test_run_cases_test_run_id ON test_run_cases(test_run_id);
      CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at DESC);
    `);

    // Create trigger to update 'updated_at' timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply trigger to tables
    const tables = ['users', 'projects', 'test_suites', 'test_cases'];
    for (const table of tables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    logger.info('✅ Database schema initialized successfully');
  } catch (error) {
    logger.error('❌ Error initializing database schema:', error);
    throw error;
  }
};