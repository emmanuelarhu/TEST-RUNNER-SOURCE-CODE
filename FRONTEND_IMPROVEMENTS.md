# Frontend UI Improvements Guide

## Overview
The backend now automatically discovers and extracts test cases from `.spec.ts` files in the test-projects directory. The frontend should be updated to leverage this functionality.

---

## Key Features to Implement

### 1. **Automatic Test Discovery** ✅ (Backend Complete)
- When a repository is cloned, tests are automatically discovered
- Test suites and test cases are extracted from `.spec.ts`, `.test.ts`, `.e2e.ts` files
- No manual test creation needed in the UI

### 2. **Remove Manual Test/Suite Creation UI**
**Current:** Users manually create test suites and test cases
**New:** Tests are automatically discovered from the repository

**Actions:**
- Hide or remove "Create Test Suite" button
- Hide or remove "Create Test Case" button
- Replace with "Sync Tests" button (to re-scan if needed)

---

## API Endpoints for Frontend

### 🔄 Sync Tests After Clone
```http
POST /api/v1/test-discovery/project/{projectId}/sync
```

**Response:**
```json
{
  "success": true,
  "message": "Tests synced successfully",
  "data": {
    "projectName": "My Project",
    "suitesCreated": 5,
    "testsCreated": 23
  }
}
```

**When to Call:**
- Automatically called after cloning (already implemented in backend)
- Manually triggered by "Refresh Tests" button
- After pulling latest changes from repository

---

### 📊 Get Test Statistics
```http
GET /api/v1/test-discovery/project/{projectId}/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSuites": 5,
    "totalTests": 23,
    "testFiles": [
      "tests/auth.spec.ts",
      "tests/dashboard.spec.ts",
      "tests/api/users.spec.ts"
    ]
  }
}
```

**Display:**
- Show count of test suites
- Show count of test cases
- Show count of test files discovered

---

### 📁 Get Test Files List
```http
GET /api/v1/test-discovery/project/{projectId}/files
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectName": "My Project",
    "testFiles": [
      "tests/auth.spec.ts",
      "tests/dashboard.spec.ts",
      "tests/api/users.spec.ts"
    ],
    "count": 3
  }
}
```

**Use Case:**
- Display file tree of discovered test files
- Show which files contain tests
- Allow filtering/searching test files

---

### 📝 Get Latest Test Report
```http
GET /api/v1/executions/project/{projectId}/latest-report
```

**Response:**
```json
{
  "success": true,
  "message": "Latest test run retrieved successfully",
  "data": {
    "projectName": "My Project",
    "testRun": {
      "id": "abc-123",
      "run_name": "Run 2025-11-11T14:07:16.000Z",
      "status": "completed",
      "total_tests": 23,
      "passed_tests": 20,
      "failed_tests": 3,
      "skipped_tests": 0,
      "duration_ms": 45000,
      "browser": "chromium",
      "reportPath": "/reports/report-abc-123/index.html",
      "reportUrl": "http://localhost:5000/reports/report-abc-123/index.html",
      "start_time": "2025-11-11T14:07:16.000Z",
      "end_time": "2025-11-11T14:08:01.000Z"
    }
  }
}
```

**Display:**
- Show latest test run statistics prominently
- "View Report" button linking to `reportUrl`
- Test pass/fail rate visualization
- Time taken for test execution

---

## UI Component Suggestions

### Project Detail Page

```
┌─────────────────────────────────────────────────┐
│ 📦 HUBTEL-MA-PORTAL-AUTOMATION                 │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 📊 Test Statistics                      │   │
│ │                                         │   │
│ │ Test Suites: 5                         │   │
│ │ Test Cases: 23                         │   │
│ │ Test Files: 8                          │   │
│ │                                         │   │
│ │ [🔄 Refresh Tests] [▶️ Run All Tests]  │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 📈 Latest Test Run                     │   │
│ │                                         │   │
│ │ Status: ✅ Completed                   │   │
│ │ Total: 23 tests                        │   │
│ │ Passed: 20 (87%)                       │   │
│ │ Failed: 3 (13%)                        │   │
│ │ Duration: 45s                          │   │
│ │                                         │   │
│ │ [📋 View Full Report]                  │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 📁 Test Suites                         │   │
│ │                                         │   │
│ │ 📂 Auth Tests (5 tests)                │   │
│ │   ├─ ✅ User login                     │   │
│ │   ├─ ✅ User logout                    │   │
│ │   ├─ ❌ Invalid credentials            │   │
│ │   └─ ...                               │   │
│ │                                         │   │
│ │ 📂 Dashboard Tests (10 tests)          │   │
│ │   ├─ ✅ Load dashboard                 │   │
│ │   └─ ...                               │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### Test Suite List View

```
┌───────────────────────────────────────────────────┐
│ Test Suites for Project                          │
├───────────────────────────────────────────────────┤
│                                                   │
│ 📂 Auth Tests                                     │
│ ├─ File: tests/auth.spec.ts                      │
│ ├─ Tests: 5                                       │
│ └─ [▶️ Run Suite] [📄 View Code]                 │
│                                                   │
│ 📂 Dashboard Tests                                │
│ ├─ File: tests/dashboard.spec.ts                 │
│ ├─ Tests: 10                                      │
│ └─ [▶️ Run Suite] [📄 View Code]                 │
│                                                   │
│ 📂 API Tests                                      │
│ ├─ File: tests/api/users.spec.ts                 │
│ ├─ Tests: 8                                       │
│ └─ [▶️ Run Suite] [📄 View Code]                 │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

### Test Case Detail View

```
┌───────────────────────────────────────────────────┐
│ 📝 Test: User should be able to login            │
├───────────────────────────────────────────────────┤
│                                                   │
│ Suite: Auth Tests                                 │
│ File: tests/auth.spec.ts:15                      │
│                                                   │
│ Last Run:                                         │
│ ├─ Status: ✅ Passed                             │
│ ├─ Duration: 2.3s                                 │
│ └─ Browser: Chromium                              │
│                                                   │
│ [▶️ Run Test] [📋 View Report] [📄 View Code]    │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update Project Clone Flow
1. After cloning, show loading state: "Discovering tests..."
2. Display sync results: "✅ Found 5 suites and 23 tests"
3. Automatically navigate to test list or project detail page

### Step 2: Update Project Detail Page
1. Fetch and display test statistics using `/test-discovery/project/{id}/stats`
2. Add "Refresh Tests" button that calls `/test-discovery/project/{id}/sync`
3. Display latest test run using `/executions/project/{id}/latest-report`
4. Add "View Report" button linking to HTML report

### Step 3: Update Test Suite List
1. Fetch test suites using existing `/api/v1/tests/suites?projectId={id}`
2. Display file_path for each suite (now available in database)
3. Show test count per suite
4. Add "Run Suite" button for each suite

### Step 4: Update Test Case List
1. Fetch test cases using existing `/api/v1/tests/cases?suiteId={id}`
2. Display file_path and line_number for each test
3. Add link to view test code in repository (if possible)
4. Show last run status for each test

### Step 5: Remove Manual Creation UI
1. Remove "Create Test Suite" form/modal
2. Remove "Create Test Case" form/modal
3. Replace with informational message: "Tests are automatically discovered from your repository"

---

## API Response Enhancements

### Test Suites API
```http
GET /api/v1/tests/suites?projectId={projectId}
```

Now includes:
- `description` - Contains "Test file: {path}"
- All test cases with `file_path` and `line_number`

### Test Cases API
```http
GET /api/v1/tests/cases?suiteId={suiteId}
```

Now includes:
- `file_path` - Path to .spec.ts file
- `line_number` - Line number where test is defined
- `description` - Contains "Test at line {number}"

---

## Benefits

### For Users
✅ No manual test creation needed
✅ Always in sync with actual test files
✅ Easy to see which tests exist
✅ Can map UI tests back to code
✅ Automatic updates when repository changes

### For Developers
✅ Single source of truth (code)
✅ No database/UI sync issues
✅ Fast onboarding for new projects
✅ Clear traceability from UI to code

---

## Example Workflow

1. **Clone Repository**
   ```
   User clones: https://github.com/org/tests
   → Backend automatically discovers 23 tests in 5 files
   → UI shows: "✅ Found 5 test suites and 23 tests"
   ```

2. **View Tests**
   ```
   User navigates to project
   → Sees 5 test suites listed
   → Each suite shows file path and test count
   ```

3. **Run Tests**
   ```
   User clicks "Run All Tests"
   → Tests execute using Playwright
   → Results saved to database
   → UI shows pass/fail statistics
   ```

4. **View Report**
   ```
   User clicks "View Latest Report"
   → Opens Playwright HTML report
   → Shows detailed test results with screenshots
   ```

5. **Refresh Tests** (if repository updated)
   ```
   User pulls latest code changes
   → Clicks "Refresh Tests"
   → Backend re-scans files
   → New tests appear in UI
   ```

---

## Technical Notes

### Test File Patterns Supported
- `*.spec.ts`
- `*.spec.js`
- `*.test.ts`
- `*.test.js`
- `*.e2e.ts`
- `*.e2e-spec.ts`

### Test Extraction Patterns
```typescript
test('test name', ...)       ✅ Detected
it('test name', ...)         ✅ Detected
test.only('name', ...)       ✅ Detected
it.only('name', ...)         ✅ Detected
test.skip('name', ...)       ✅ Detected
it.skip('name', ...)         ✅ Detected
```

### Suite Name Extraction
1. First tries to find `describe('Suite Name', ...)` block
2. Falls back to filename (e.g., `auth.spec.ts` → "Auth")

---

## Error Handling

### No Tests Found
```
Message: "No test files found in this project."
Action: "Make sure your repository contains .spec.ts or .test.ts files"
```

### Test Discovery Failed
```
Message: "Could not discover tests (non-critical)"
Action: "You can manually trigger discovery using the Refresh Tests button"
```

### Repository Not Cloned
```
Message: "Please clone the repository first"
Action: "Navigate to Settings → Clone Repository"
```

---

## Future Enhancements

### Phase 2
- [ ] Filter tests by status (passed/failed/skipped)
- [ ] Search tests by name
- [ ] Run individual tests
- [ ] View test code inline
- [ ] Test history and trends
- [ ] Schedule automated runs

### Phase 3
- [ ] Test coverage visualization
- [ ] Performance tracking over time
- [ ] Flaky test detection
- [ ] Test failure analysis
- [ ] Integration with CI/CD

---

## Questions?

Refer to the backend code:
- Service: `/backend/src/services/test-discovery.service.ts`
- Controller: `/backend/src/controllers/test-discovery.controller.ts`
- Routes: `/backend/src/routes/test-discovery.routes.ts`

API Documentation: `http://localhost:5000/api-docs` (Swagger UI)
