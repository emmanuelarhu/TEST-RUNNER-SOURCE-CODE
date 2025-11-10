import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Validation rules
const createProjectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('base_url').optional().isURL().withMessage('Base URL must be a valid URL'),
];

const updateProjectValidation = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('base_url').optional().isURL(),
];

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 count:
 *                   type: integer
 */
router.get('/', projectController.getAllProjects.bind(projectController));

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', projectController.getProjectById.bind(projectController));

/**
 * @swagger
 * /api/v1/projects/{id}/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project statistics
 */
router.get('/:id/stats', projectController.getProjectStats.bind(projectController));

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: E-Commerce Test Suite
 *               description:
 *                 type: string
 *                 example: Automated tests for e-commerce platform
 *               base_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', createProjectValidation, validateRequest, projectController.createProject.bind(projectController));

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *               base_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', updateProjectValidation, validateRequest, projectController.updateProject.bind(projectController));

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', projectController.deleteProject.bind(projectController));

export default router;