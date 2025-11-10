import { Router } from 'express';
import executionController from '../controllers/execution.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/executions/test-case/{testCaseId}/execute:
 *   post:
 *     summary: Execute a single test case
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: testCaseId
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
 *               environment:
 *                 type: string
 *                 default: test
 *               headless:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Test execution completed
 */
router.post('/test-case/:testCaseId/execute', executionController.executeTestCase.bind(executionController));

/**
 * @swagger
 * /api/v1/executions/suite/{suiteId}/execute:
 *   post:
 *     summary: Execute entire test suite
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

export default router;