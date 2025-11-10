import { Router } from 'express';
import testController from '../controllers/test.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Validation rules for test suite
const createTestSuiteValidation = [
  body('project_id').isUUID().withMessage('Valid project ID is required'),
  body('name').trim().notEmpty().withMessage('Test suite name is required'),
  body('description').optional().trim(),
];

const updateTestSuiteValidation = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']),
];

// Validation rules for test case
const createTestCaseValidation = [
  body('suite_id').isUUID().withMessage('Valid suite ID is required'),
  body('name').trim().notEmpty().withMessage('Test case name is required'),
  body('description').optional().trim(),
  body('test_type').optional().isIn(['functional', 'regression', 'smoke', 'integration', 'e2e']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('test_script').notEmpty().withMessage('Test script is required'),
  body('expected_result').optional().trim(),
  body('tags').optional().isArray(),
];

const updateTestCaseValidation = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('test_type').optional().isIn(['functional', 'regression', 'smoke', 'integration', 'e2e']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('test_script').optional().notEmpty(),
  body('expected_result').optional().trim(),
  body('tags').optional().isArray(),
];

/**
 * @swagger
 * /api/v1/tests/projects/{projectId}/suites:
 *   get:
 *     summary: Get all test suites for a project
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of test suites
 */
router.get('/projects/:projectId/suites', testController.getProjectTestSuites.bind(testController));

/**
 * @swagger
 * /api/v1/tests/suites/{id}:
 *   get:
 *     summary: Get test suite by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test suite details with test cases
 *       404:
 *         description: Test suite not found
 */
router.get('/suites/:id', testController.getTestSuiteById.bind(testController));

/**
 * @swagger
 * /api/v1/tests/suites:
 *   post:
 *     summary: Create a new test suite
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - name
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Authentication Tests
 *               description:
 *                 type: string
 *                 example: Test suite for user authentication flows
 *     responses:
 *       201:
 *         description: Test suite created successfully
 */
router.post('/suites', createTestSuiteValidation, validateRequest, testController.createTestSuite.bind(testController));

/**
 * @swagger
 * /api/v1/tests/suites/{id}:
 *   put:
 *     summary: Update a test suite
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Test suite updated successfully
 *       404:
 *         description: Test suite not found
 */
router.put('/suites/:id', updateTestSuiteValidation, validateRequest, testController.updateTestSuite.bind(testController));

/**
 * @swagger
 * /api/v1/tests/suites/{id}:
 *   delete:
 *     summary: Delete a test suite
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test suite deleted successfully
 *       404:
 *         description: Test suite not found
 */
router.delete('/suites/:id', testController.deleteTestSuite.bind(testController));

/**
 * @swagger
 * /api/v1/tests/suites/{suiteId}/cases:
 *   get:
 *     summary: Get all test cases in a suite
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: suiteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of test cases
 */
router.get('/suites/:suiteId/cases', testController.getSuiteTestCases.bind(testController));

/**
 * @swagger
 * /api/v1/tests/cases/{id}:
 *   get:
 *     summary: Get test case by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test case details
 *       404:
 *         description: Test case not found
 */
router.get('/cases/:id', testController.getTestCaseById.bind(testController));

/**
 * @swagger
 * /api/v1/tests/cases:
 *   post:
 *     summary: Create a new test case
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - suite_id
 *               - name
 *               - test_script
 *             properties:
 *               suite_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Login with valid credentials
 *               description:
 *                 type: string
 *               test_type:
 *                 type: string
 *                 enum: [functional, regression, smoke, integration, e2e]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               test_script:
 *                 type: string
 *                 example: "await page.goto('/login'); await page.fill('#username', 'test@example.com');"
 *               expected_result:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Test case created successfully
 */
router.post('/cases', createTestCaseValidation, validateRequest, testController.createTestCase.bind(testController));

/**
 * @swagger
 * /api/v1/tests/cases/{id}:
 *   put:
 *     summary: Update a test case
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               test_type:
 *                 type: string
 *                 enum: [functional, regression, smoke, integration, e2e]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               test_script:
 *                 type: string
 *               expected_result:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Test case updated successfully
 *       404:
 *         description: Test case not found
 */
router.put('/cases/:id', updateTestCaseValidation, validateRequest, testController.updateTestCase.bind(testController));

/**
 * @swagger
 * /api/v1/tests/cases/{id}:
 *   delete:
 *     summary: Delete a test case
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test case deleted successfully
 *       404:
 *         description: Test case not found
 */
router.delete('/cases/:id', testController.deleteTestCase.bind(testController));

export default router;
