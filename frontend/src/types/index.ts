// API Types matching backend
export interface Project {
  id: string;
  name: string;
  description?: string;
  base_url?: string;
  logo?: string; // Base64 image or URL
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Stats from last run
  last_run?: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    run_date: string;
    status: 'completed' | 'failed' | 'in_progress';
  };
}

export interface TestSuite {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  file_path?: string;
  status: 'active' | 'archived' | 'draft';
  created_by?: string;
  created_at: string;
  updated_at: string;
  totalTests?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  lastRun?: string;
  icon?: string;
}

export interface TestCase {
  id: string;
  suite_id: string;
  name: string;
  description?: string;
  test_type: 'functional' | 'api' | 'e2e' | 'integration' | 'smoke' | 'regression';
  priority: 'critical' | 'high' | 'medium' | 'low';
  test_script?: string;
  expected_result?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TestExecution {
  id: string;
  test_case_id: string;
  suite_id: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'error';
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
  error_message?: string;
  stack_trace?: string;
  screenshot_path?: string;
  video_path?: string;
  executed_by?: string;
  browser?: string;
  environment?: string;
  created_at: string;
}

export interface TestRun {
  id: string;
  project_id: string;
  suite_id?: string;
  run_name?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  triggered_by?: string;
  environment?: string;
  browser?: string;
  created_at: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  base_url?: string;
  logo?: string;
}

export interface CreateTestSuiteDTO {
  project_id: string;
  name: string;
  description?: string;
}

export interface CreateTestCaseDTO {
  suite_id: string;
  name: string;
  description?: string;
  test_type: TestCase['test_type'];
  priority: TestCase['priority'];
  test_script?: string;
  expected_result?: string;
  tags?: string[];
}

export interface ExecuteTestDTO {
  test_case_ids?: string[];
  suite_id?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  environment?: string;
  headless?: boolean;
}

export interface TestExecutionResult {
  execution_id: string;
  test_case_id: string;
  status: TestExecution['status'];
  duration_ms: number;
  error_message?: string;
  screenshot_path?: string;
}

export interface StatsData {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'skipped';
  duration: string;
  path: string;
  browser: string;
  error?: string;
  expected?: string;
  received?: string;
  steps: TestStep[];
}

export interface TestStep {
  name: string;
  status: 'passed' | 'failed';
  duration: string;
  path?: string;
}

export type BrowserType = 'chromium' | 'firefox' | 'webkit';
export type EnvironmentType = 'production' | 'staging' | 'development';
export type TestFilterType = 'all' | 'passed' | 'failed' | 'skipped';

// User & Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
