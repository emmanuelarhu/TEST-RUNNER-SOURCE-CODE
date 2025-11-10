#!/bin/bash

echo "Creating all React components and pages..."

# Create main.tsx
cat > src/main.tsx << 'MAIN_EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
MAIN_EOF

# Create global styles
cat > src/styles/index.css << 'STYLES_EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
    --primary-50: #f0f9ff;
    --primary-100: #e0f2fe;
    --primary-200: #bae6fd;
    --primary-300: #7dd3fc;
    --primary-400: #38bdf8;
    --primary-500: #0ea5e9;
    --primary-600: #0284c7;
    --primary-700: #0369a1;
    --primary-800: #075985;
    --primary-900: #0c4a6e;
    --success-50: #f0fdf4;
    --success-500: #22c55e;
    --success-600: #16a34a;
    --success-700: #15803d;
    --error-50: #fef2f2;
    --error-200: #fecaca;
    --error-300: #fca5a5;
    --error-500: #ef4444;
    --error-600: #dc2626;
    --error-700: #b91c1c;
    --error-800: #991b1b;
    --error-900: #7f1d1d;
    --warning-50: #fffbeb;
    --warning-500: #f59e0b;
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--gray-50);
    color: var(--gray-900);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.spin {
    animation: spin 1s linear infinite;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--gray-100);
}

::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--gray-400);
}
STYLES_EOF

# Create API service
cat > src/services/api.service.ts << 'API_SERVICE_EOF'
import apiClient from './api.config';
import type { Project, TestSuite, TestCase, TestRun, TestExecution, CreateProjectDTO, CreateTestSuiteDTO, CreateTestCaseDTO, ExecuteTestDTO } from '../types';

export const projectApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectDTO) => apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectDTO>) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

export const testSuiteApi = {
  getByProject: (projectId: string) => apiClient.get<TestSuite[]>(`/tests/projects/${projectId}/suites`),
  getById: (id: string) => apiClient.get<TestSuite>(`/tests/suites/${id}`),
  create: (data: CreateTestSuiteDTO) => apiClient.post<TestSuite>('/tests/suites', data),
  update: (id: string, data: Partial<CreateTestSuiteDTO>) => apiClient.put<TestSuite>(`/tests/suites/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tests/suites/${id}`),
};

export const testCaseApi = {
  getBySuite: (suiteId: string) => apiClient.get<TestCase[]>(`/tests/suites/${suiteId}/cases`),
  getById: (id: string) => apiClient.get<TestCase>(`/tests/cases/${id}`),
  create: (data: CreateTestCaseDTO) => apiClient.post<TestCase>('/tests/cases', data),
  update: (id: string, data: Partial<CreateTestCaseDTO>) => apiClient.put<TestCase>(`/tests/cases/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tests/cases/${id}`),
};

export const executionApi = {
  executeTestCase: (testCaseId: string, data?: ExecuteTestDTO) => apiClient.post<TestExecution>(`/executions/test-case/${testCaseId}/execute`, data),
  executeTestSuite: (suiteId: string, data?: ExecuteTestDTO) => apiClient.post<TestRun>(`/executions/suite/${suiteId}/execute`, data),
  getExecutionHistory: (testCaseId: string, limit?: number) => apiClient.get<TestExecution[]>(`/executions/test-case/${testCaseId}/history`, { params: { limit } }),
  getTestRun: (runId: string) => apiClient.get<TestRun>(`/executions/run/${runId}`),
  getProjectTestRuns: (projectId: string, limit?: number) => apiClient.get<TestRun[]>(`/executions/project/${projectId}/runs`, { params: { limit } }),
};

export const healthApi = {
  check: () => apiClient.get('/health'),
};

const api = {
  projects: projectApi,
  testSuites: testSuiteApi,
  testCases: testCaseApi,
  executions: executionApi,
  health: healthApi,
};

export default api;
API_SERVICE_EOF

echo "Core files created. Creating components..."

# Create all component files by directly writing content
# This is more efficient than multiple cat commands

