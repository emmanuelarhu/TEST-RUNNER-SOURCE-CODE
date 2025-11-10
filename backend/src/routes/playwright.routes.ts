import { Router } from 'express';
import playwrightController from '../controllers/playwright.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

const cloneRepoValidation = [
  body('repoUrl').isURL().withMessage('Valid repository URL is required'),
  body('projectName').trim().notEmpty().withMessage('Project name is required'),
  body('branch').optional().trim()
];

const runTestsValidation = [
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('suiteId').optional().isUUID(),
  body('browser').optional().isIn(['chromium', 'firefox', 'webkit']),
  body('headed').optional().isBoolean(),
  body('workers').optional().isInt({ min: 1, max: 10 })
];

router.post('/clone', cloneRepoValidation, validateRequest, playwrightController.cloneRepository.bind(playwrightController));
router.post('/run', runTestsValidation, validateRequest, playwrightController.runTests.bind(playwrightController));
router.get('/report/:testRunId', playwrightController.getReport.bind(playwrightController));

export default router;