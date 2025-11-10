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
