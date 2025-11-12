import apiClient, { API_BASE_URL } from './api.config';
import axios from 'axios';
import type { ApiResponse, Project, TestSuite, TestCase, TestRun, TestExecution, CreateProjectDTO, CreateTestSuiteDTO, CreateTestCaseDTO, ExecuteTestDTO } from '../types';

export const projectApi = {
  getAll: () => apiClient.get<ApiResponse<Project[]>>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  getStats: (id: string) => apiClient.get<any>(`/projects/${id}/stats`),
  create: (data: CreateProjectDTO) => apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectDTO>) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

export const testSuiteApi = {
  getByProject: (projectId: string) => apiClient.get<ApiResponse<TestSuite[]>>(`/tests/projects/${projectId}/suites`),
  getById: (id: string) => apiClient.get<TestSuite>(`/tests/suites/${id}`),
  create: (data: CreateTestSuiteDTO) => apiClient.post<TestSuite>('/tests/suites', data),
  update: (id: string, data: Partial<CreateTestSuiteDTO>) => apiClient.put<TestSuite>(`/tests/suites/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tests/suites/${id}`),
};

export const testCaseApi = {
  getBySuite: (suiteId: string) => apiClient.get<ApiResponse<TestCase[]>>(`/tests/suites/${suiteId}/cases`),
  getById: (id: string) => apiClient.get<TestCase>(`/tests/cases/${id}`),
  create: (data: CreateTestCaseDTO) => apiClient.post<TestCase>('/tests/cases', data),
  update: (id: string, data: Partial<CreateTestCaseDTO>) => apiClient.put<TestCase>(`/tests/cases/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tests/cases/${id}`),
};

export const executionApi = {
  executeTestCase: (testCaseId: string, data?: ExecuteTestDTO) => apiClient.post<TestExecution>(`/executions/test-case/${testCaseId}/execute`, data),
  executeTestSuite: (suiteId: string, data?: ExecuteTestDTO) => apiClient.post<TestRun>(`/executions/suite/${suiteId}/execute`, data),
  executeProject: (projectId: string, data?: { browser?: string; headless?: boolean; workers?: number }) => apiClient.post<TestRun>(`/executions/project/${projectId}/execute`, data),
  cloneRepository: (projectId: string, data: { repoUrl: string; branch?: string }) => apiClient.post(`/executions/project/${projectId}/clone`, data),
  getTestReport: (runId: string) => apiClient.get<{ reportPath: string; reportUrl: string }>(`/executions/run/${runId}/report`),
  getLatestReport: (projectId: string) => apiClient.get<any>(`/executions/project/${projectId}/latest-report`),
  getExecutionHistory: (testCaseId: string, limit?: number) => apiClient.get<ApiResponse<TestExecution[]>>(`/executions/test-case/${testCaseId}/history`, { params: { limit } }),
  getTestRun: (runId: string) => apiClient.get<TestRun>(`/executions/run/${runId}`),
  getProjectTestRuns: (projectId: string, limit?: number) => apiClient.get<ApiResponse<TestRun[]>>(`/executions/project/${projectId}/runs`, { params: { limit } }),
  getProjectTestRunsDetailed: (projectId: string, limit?: number, offset?: number) => apiClient.get<any>(`/executions/project/${projectId}/runs/detailed`, { params: { limit, offset } }),
  getTestRunDetailed: (runId: string) => apiClient.get<any>(`/executions/run/${runId}/detailed`),
  getTestRunSuites: (runId: string) => apiClient.get<any>(`/executions/run/${runId}/suites`),
  getTestRunCases: (runId: string, status?: string, suiteName?: string) => apiClient.get<any>(`/executions/run/${runId}/cases`, { params: { status, suiteName } }),
};

export const testDiscoveryApi = {
  syncTests: (projectId: string) => apiClient.post(`/test-discovery/project/${projectId}/sync`),
  getTestFiles: (projectId: string) => apiClient.get(`/test-discovery/project/${projectId}/files`),
  getTestStats: (projectId: string) => apiClient.get(`/test-discovery/project/${projectId}/stats`),
};

export const healthApi = {
  // Health endpoint is at root level, not under /api/v1
  check: () => axios.get(`${API_BASE_URL}/health`),
};

export const userApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  getMe: () => apiClient.get('/users/me'),
  updateMe: (data: any) => apiClient.put('/users/me', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  changePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
    apiClient.post(`/users/${id}/change-password`, data),
};

const api = {
  projects: projectApi,
  testSuites: testSuiteApi,
  testCases: testCaseApi,
  executions: executionApi,
  testDiscovery: testDiscoveryApi,
  health: healthApi,
  users: userApi,
};

export default api;
