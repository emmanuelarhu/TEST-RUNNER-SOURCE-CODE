import { Router } from 'express';
import executionController from '../controllers/execution.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/executions/project/{projectId}/execute:
 *   post:
 *     summary: Execute all tests for a project using Playwright
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               browser:
 *                 type: string
 *                 enum: [chromium, firefox, webkit]
 *                 default: chromium
 *               headless:
 *                 type: boolean
 *                 default: true
 *               workers:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Project test execution completed
 */
router.post('/project/:projectId/execute', executionController.executeProject.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/suite/{suiteId}/execute:
 *   post:
 *     summary: Execute test suite using Playwright
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: suiteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               browser:
 *                 type: string
 *                 enum: [chromium, firefox, webkit]
 *               environment:
 *                 type: string
 *               headless:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Suite execution completed
 */
router.post('/suite/:suiteId/execute', executionController.executeTestSuite.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/project/{projectId}/clone:
 *   post:
 *     summary: Clone repository for a project (GitHub, GitLab, Azure DevOps)
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repoUrl
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 example: https://token@dev.azure.com/org/project/_git/repo
 *               branch:
 *                 type: string
 *                 default: main
 *     responses:
 *       200:
 *         description: Repository cloned successfully
 */
router.post('/project/:projectId/clone', executionController.cloneRepository.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/run/{runId}/report:
 *   get:
 *     summary: Get Playwright HTML report for a test run
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Report path retrieved
 *       404:
 *         description: Report not found
 */
router.get('/run/:runId/report', executionController.getTestReport.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/test-case/{testCaseId}/history:
 *   get:
 *     summary: Get test execution history
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Execution history retrieved
 */
router.get('/test-case/:testCaseId/history', executionController.getExecutionHistory.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/run/{runId}:
 *   get:
 *     summary: Get test run details
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test run details
 */
router.get('/run/:runId', executionController.getTestRun.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/project/{projectId}/runs:
 *   get:
 *     summary: Get all test runs for a project
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Project test runs retrieved
 */
router.get('/project/:projectId/runs', executionController.getProjectTestRuns.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/project/{projectId}/latest-report:
 *   get:
 *     summary: Get the latest test run and report for a project
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Latest test run and report retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     projectName:
 *                       type: string
 *                     testRun:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         run_name:
 *                           type: string
 *                         status:
 *                           type: string
 *                         total_tests:
 *                           type: integer
 *                         passed_tests:
 *                           type: integer
 *                         failed_tests:
 *                           type: integer
 *                         skipped_tests:
 *                           type: integer
 *                         duration_ms:
 *                           type: integer
 *                         browser:
 *                           type: string
 *                         reportPath:
 *                           type: string
 *                         reportUrl:
 *                           type: string
 *       404:
 *         description: Project not found or no test runs available
 */
router.get('/project/:projectId/latest-report', executionController.getLatestReport.bind(executionController));

export default router;