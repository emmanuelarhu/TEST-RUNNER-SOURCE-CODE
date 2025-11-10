# Playwright Integration Guide

This guide explains how to complete the Playwright integration and use Azure DevOps repositories.

## ✅ What's Been Completed

### 1. User Authentication
- ✅ Login/Register system with JWT
- ✅ Protected routes
- ✅ User profile in sidebar (shows logged-in user)
- ✅ Logout functionality

### 2. Playwright Backend Service
- ✅ Playwright installed (`@playwright/test` and `playwright`)
- ✅ Playwright service created (`backend/src/services/playwright.service.ts`)
- ✅ Supports cloning repos from GitHub, GitLab, and Azure DevOps
- ✅ Automatic dependency installation
- ✅ Test execution with HTML reports
- ✅ Results stored in database

## 🚧 What Needs to Be Done Next

### Step 1: Install Playwright System Dependencies

```bash
cd backend
npx playwright install-deps
```

This installs required system libraries for running browsers.

### Step 2: Add Playwright Execution Endpoints

Create `backend/src/controllers/playwright.controller.ts`:

```typescript
import { Request, Response } from 'express';
import playwrightService from '../services/playwright.service';
import logger from '../config/logger';

export class PlaywrightController {
  /**
   * Clone a repository
   */
  async cloneRepository(req: Request, res: Response): Promise<void> {
    try {
      const { repoUrl, projectName, branch } = req.body;
      
      const projectPath = await playwrightService.cloneRepository(
        repoUrl,
        projectName,
        branch || 'main'
      );
      
      res.json({
        success: true,
        message: 'Repository cloned successfully',
        data: { projectPath }
      });
    } catch (error: any) {
      logger.error('Error cloning repository:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Run Playwright tests
   */
  async runTests(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, suiteId, browser, headed, workers } = req.body;
      
      const result = await playwrightService.runTests({
        projectId,
        suiteId,
        browser: browser || 'chromium',
        headed: headed || false,
        workers: workers || 1
      });
      
      res.json({
        success: true,
        message: 'Tests executed successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error running tests:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get test report
   */
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { testRunId } = req.params;
      
      const reportPath = await playwrightService.getReportPath(testRunId);
      
      if (!reportPath) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: { reportPath }
      });
    } catch (error: any) {
      logger.error('Error getting report:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new PlaywrightController();
```

### Step 3: Add Playwright Routes

Create `backend/src/routes/playwright.routes.ts`:

```typescript
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
```

### Step 4: Register Routes in `app.ts`

Add to `backend/src/app.ts`:

```typescript
import playwrightRoutes from './routes/playwright.routes';

// In initializeRoutes():
this.app.use(`/api/${apiVersion}/playwright`, playwrightRoutes);

// In app.ts static files section, add:
this.app.use('/reports', express.static(path.join(__dirname, '../public/reports')));
```

### Step 5: Create Project UI Component

Create `frontend/src/components/common/CreateProjectModal.tsx` for creating projects with repo URLs.

### Step 6: Update Project List

Add a "+" button to create new projects from the frontend.

## 🔧 Azure DevOps Integration

### Getting Azure DevOps Repository URL

#### Option 1: Using Personal Access Token (Recommended)

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create a new token with "Code (Read)" permission
3. Use format: `https://{PAT}@dev.azure.com/{organization}/{project}/_git/{repo}`

Example:
```
https://yourtoken@dev.azure.com/yourorg/yourproject/_git/yourrepo
```

#### Option 2: Using SSH

1. Set up SSH key in Azure DevOps
2. Use format: `git@ssh.dev.azure.com:v3/{organization}/{project}/{repo}`

Example:
```
git@ssh.dev.azure.com:v3/yourorg/yourproject/yourrepo
```

### Creating a Project from Azure DevOps

```bash
# Using the API
curl -X POST http://localhost:5000/api/v1/playwright/clone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "repoUrl": "https://token@dev.azure.com/org/project/_git/repo",
    "projectName": "my-test-project",
    "branch": "main"
  }'
```

## 📊 Running Tests

### Via API

```bash
curl -X POST http://localhost:5000/api/v1/playwright/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "uuid-of-project",
    "browser": "chromium",
    "headed": false,
    "workers": 2
  }'
```

### Via Frontend

1. Select project from dropdown
2. Click "Run Tests" button
3. View results in Test Results page
4. Click on test run to see HTML report

## 📈 Viewing Reports

After test execution:
- Reports are available at: `http://localhost:5000/reports/report-{runId}/index.html`
- Frontend will show a link to the report
- Reports include:
  - Test timeline
  - Screenshots on failure
  - Video recordings
  - Detailed error traces
  - Performance metrics

## 🛠️ Playwright Configuration

Create `playwright.config.ts` in your test project:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## 🔐 Environment Variables

Add to `backend/.env`:

```env
# Playwright Configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_WORKERS=2

# Azure DevOps (optional)
AZURE_DEVOPS_PAT=your_personal_access_token
AZURE_DEVOPS_ORG=your_organization
```

## 🚀 Complete Workflow

1. **Create Project in Database**
   ```sql
   INSERT INTO projects (name, description, base_url)
   VALUES ('My Test Project', 'E2E tests', 'https://myapp.com');
   ```

2. **Clone Repository**
   - Use frontend "Create Project" button
   - Enter Azure DevOps URL with PAT
   - System clones and installs dependencies

3. **Run Tests**
   - Select project from dropdown
   - Click "Run Tests" in Test Suites page
   - Tests execute in background

4. **View Results**
   - Go to Test Results page
   - See pass/fail status
   - Click to view HTML report with screenshots

## 📝 Example Test File

Create `tests/example.spec.ts` in your project:

```typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/.*intro/);
});
```

## 🐛 Troubleshooting

### Missing System Dependencies
```bash
npx playwright install-deps
```

### Chromium Won't Start
```bash
# Check logs
tail -f backend/logs/app.log

# Try webkit instead
curl -X POST .../playwright/run -d '{"browser": "webkit", ...}'
```

### Clone Fails for Azure DevOps
- Ensure PAT has "Code (Read)" permission
- Check URL format: `https://PAT@dev.azure.com/org/project/_git/repo`
- Verify branch exists

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Reduce workers
- Check network connectivity

## 📚 Next Steps

1. Complete the controller and routes implementation
2. Create frontend UI for project creation
3. Add "Run Tests" button with Playwright integration
4. Display HTML reports in iframe or new tab
5. Add real-time progress updates via WebSocket
6. Implement scheduled test runs
7. Add email notifications on test failures

## 🎯 Best Practices

- Use environment variables for sensitive data (PATs)
- Run tests in headless mode in production
- Store reports for 30 days, then auto-delete
- Use parallel execution wisely (max 4 workers)
- Configure retries for flaky tests
- Enable video only on failures to save space
- Use Docker for consistent browser versions
- Implement test result trends over time

