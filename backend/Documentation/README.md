# Test Runner Platform - Backend API

A comprehensive test automation platform backend built with Express, TypeScript, PostgreSQL, and Playwright integration.

## 🚀 Features

- **Project Management**: Create and manage test automation projects
- **Test Suite Organization**: Group related test cases into suites
- **Test Case Management**: Create, update, and organize test cases
- **Playwright Integration**: Execute automated tests using Playwright
- **Real-time Updates**: WebSocket support for live test execution updates
- **Execution History**: Track and analyze test execution results
- **Multiple Browsers**: Support for Chromium, Firefox, and WebKit
- **Screenshot & Video Capture**: Automatic capture on test failures
- **RESTful API**: Clean and well-documented API endpoints

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd test-runner-platform/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_runner_db
DB_USER=postgres
DB_PASSWORD=your_password
```

4. **Set up PostgreSQL database**
```bash
# Create database
createdb test_runner_db

# The application will automatically create tables on first run
```

5. **Install Playwright browsers**
```bash
npx playwright install
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Projects
```
GET    /api/v1/projects           - Get all projects
GET    /api/v1/projects/:id       - Get project by ID
GET    /api/v1/projects/:id/stats - Get project statistics
POST   /api/v1/projects           - Create new project
PUT    /api/v1/projects/:id       - Update project
DELETE /api/v1/projects/:id       - Delete project
```

### Test Execution
```
POST   /api/v1/executions/test-case/:testCaseId/execute  - Execute single test
POST   /api/v1/executions/suite/:suiteId/execute         - Execute test suite
GET    /api/v1/executions/test-case/:testCaseId/history  - Get execution history
GET    /api/v1/executions/run/:runId                     - Get test run details
GET    /api/v1/executions/project/:projectId/runs        - Get project test runs
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.ts     # Database connection
│   │   └── logger.ts       # Winston logger
│   ├── controllers/        # Request handlers
│   │   ├── project.controller.ts
│   │   └── execution.controller.ts
│   ├── middleware/         # Express middleware
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/            # Data models and types
│   │   ├── database.schema.ts
│   │   └── types.ts
│   ├── routes/            # API routes
│   │   ├── project.routes.ts
│   │   └── execution.routes.ts
│   ├── services/          # Business logic
│   │   └── playwright.service.ts
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── uploads/               # Test artifacts (screenshots, videos)
├── logs/                  # Application logs
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Database Schema

The application automatically creates the following tables:
- `users` - User management
- `projects` - Test projects
- `test_suites` - Test suite organization
- `test_cases` - Individual test cases
- `test_executions` - Test execution results
- `test_runs` - Batch test execution tracking

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | test_runner_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |
| LOG_LEVEL | Logging level | debug |

## 🧪 Example Usage

### Create a Project
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Test Suite",
    "description": "Testing e-commerce platform",
    "base_url": "https://example.com"
  }'
```

### Execute a Test Suite
```bash
curl -X POST http://localhost:5000/api/v1/executions/suite/{suiteId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "browser": "chromium",
    "environment": "staging",
    "headless": true
  }'
```

## 🔍 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

Console logging is enabled in development mode.

## 🛡️ Error Handling

The application includes comprehensive error handling:
- Validation errors (400)
- Not found errors (404)
- Server errors (500)
- Database errors
- Test execution errors

## 🚀 Next Steps

1. Add user authentication (JWT)
2. Implement role-based access control
3. Add test case import/export
4. Integrate with CI/CD platforms
5. Add test scheduling
6. Implement test result analytics dashboard
7. Add support for custom test reporters

## 👤 Author

**Emmanuel Arhu**
- GitHub: [@emmanuelarhu](https://github.com/emmanuelarhu)
- LinkedIn: [emmanuelarhu](https://www.linkedin.com/in/emmanuelarhu)

## 📄 License

MIT

---

**Built by Emmanuel Arhu -  QA Test Automation Engineer**