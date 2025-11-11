import { Router } from 'express';
import testDiscoveryController from '../controllers/test-discovery.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/test-discovery/project/{projectId}/sync:
 *   post:
 *     summary: Scan project directory and sync tests to database
 *     description: Automatically discovers test files (.spec.ts, .test.ts) in the project directory and creates test suites and test cases in the database
 *     tags: [Test Discovery]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Tests synced successfully
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
 *                     suitesCreated:
 *                       type: integer
 *                     testsCreated:
 *                       type: integer
 *       404:
 *         description: Project not found
 */
router.post('/project/:projectId/sync', testDiscoveryController.syncProjectTests.bind(testDiscoveryController));

/**
 * @swagger
 * /api/v1/test-discovery/project/{projectId}/files:
 *   get:
 *     summary: Get list of test files in project directory
 *     description: Discovers all test files (.spec.ts, .test.ts, etc.) in the project directory
 *     tags: [Test Discovery]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test files retrieved successfully
 *       404:
 *         description: Project not found
 */
router.get('/project/:projectId/files', testDiscoveryController.getProjectTestFiles.bind(testDiscoveryController));

/**
 * @swagger
 * /api/v1/test-discovery/project/{projectId}/stats:
 *   get:
 *     summary: Get test statistics for a project
 *     description: Returns counts of test suites, test cases, and test files
 *     tags: [Test Discovery]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test statistics retrieved successfully
 *       404:
 *         description: Project not found
 */
router.get('/project/:projectId/stats', testDiscoveryController.getProjectTestStats.bind(testDiscoveryController));

/**
 * @swagger
 * /api/v1/test-discovery/project/{projectId}/parse:
 *   post:
 *     summary: Parse a specific test file
 *     description: Parse a test file to extract test suites and test cases without saving to database
 *     tags: [Test Discovery]
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
 *               - filePath
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: Relative path to test file
 *                 example: tests/example.spec.ts
 *     responses:
 *       200:
 *         description: Test file parsed successfully
 *       404:
 *         description: Project not found
 */
router.post('/project/:projectId/parse', testDiscoveryController.parseTestFile.bind(testDiscoveryController));

export default router;
