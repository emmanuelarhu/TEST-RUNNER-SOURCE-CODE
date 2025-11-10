# Test Runner Platform - Quick Start Guide

Get your Test Runner Platform up and running in **5 minutes**!

## Prerequisites

Before starting, ensure you have:
-  **Node.js** 16 or higher ([Download](https://nodejs.org/))
-  **PostgreSQL** 12 or higher ([Download](https://www.postgresql.org/download/))
-  **npm** or **yarn** (comes with Node.js)
-  **Git** (for cloning the repository)

## Step 1: Clone & Navigate

```bash
# Clone the repository
git clone https://github.com/emmanuelarhu/test-runner-platform.git

# Navigate to backend directory
cd test-runner-platform/backend
```

## Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# Install Playwright browsers (Chromium, Firefox, WebKit)
npx playwright install
```

This will install all dependencies including Express, TypeScript, Playwright, Socket.io, and more.

## Step 3: Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use your preferred editor
```

**Required environment variables:**

```env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_runner_db
DB_USER=postgres
DB_PASSWORD=your_password

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
```

**Important**: Replace `your_password` with your PostgreSQL password!

## Step 4: Setup Database

### Option A: Automated Setup (Recommended)

```bash
# Make setup script executable
chmod +x setup-db.sh

# Run the setup script
./setup-db.sh
```

This script will:
- Create the database
- Create all tables
- Set up relationships and indexes
- Insert sample data (optional)

### Option B: Manual Setup

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE test_runner_db;

-- Connect to the database
\c test_runner_db

-- Run the schema from database.schema.ts
-- (Copy SQL from src/models/database.schema.ts and execute)
```

## Step 5: Start the Server

```bash
# Start development server with auto-reload
npm run dev
```

You should see:

```
TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW
Q                                                            Q
Q   =€ Test Runner Platform API                             Q
Q                                                            Q
Q   Environment: development                                 Q
Q   Port: 5000                                              Q
Q   API Version: v1                                         Q
Q                                                            Q
Q   =Í Server: http://localhost:5000                        Q
Q   =Í Health: http://localhost:5000/health                Q
Q                                                            Q
ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]
```

## Step 6: Verify Installation

### Test the API

```bash
# Check health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "success": true,
#   "message": "Test Runner API is running",
#   "version": "v1",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### Access API Documentation

Open your browser and navigate to:

**Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

Here you'll find interactive API documentation where you can test all endpoints.

## Quick Test: Create Your First Project

### Using cURL

```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Test Project",
    "description": "Learning Test Runner Platform",
    "base_url": "https://example.com"
  }'
```

### Using Postman

1. Import the Postman collection: `Test_Runner_Platform.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:5000`
3. Run the "Create Project" request

### Expected Response

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My First Test Project",
    "description": "Learning Test Runner Platform",
    "base_url": "https://example.com",
    "status": "active",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Quick Workflow Example

### 1. Create a Project

```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "E-Commerce Tests", "base_url": "https://shop.example.com"}'
```

Save the returned `project_id`.

### 2. Create a Test Suite

```bash
curl -X POST http://localhost:5000/api/v1/tests/suites \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "name": "Login Tests",
    "description": "Authentication test suite"
  }'
```

Save the returned `suite_id`.

### 3. Create a Test Case

```bash
curl -X POST http://localhost:5000/api/v1/tests/cases \
  -H "Content-Type: application/json" \
  -d '{
    "suite_id": "YOUR_SUITE_ID",
    "name": "Login with valid credentials",
    "test_type": "functional",
    "priority": "high",
    "test_script": "await page.goto(\"https://shop.example.com/login\");\nawait page.fill(\"#email\", \"test@example.com\");\nawait page.fill(\"#password\", \"password123\");\nawait page.click(\"#login-button\");\nawait page.waitForURL(\"**/dashboard\");\nawait expect(page.locator(\"h1\")).toContainText(\"Dashboard\");",
    "expected_result": "User successfully logs in and sees dashboard"
  }'
```

Save the returned `test_case_id`.

### 4. Execute the Test

```bash
curl -X POST http://localhost:5000/api/v1/executions/test-case/YOUR_TEST_CASE_ID/execute \
  -H "Content-Type: application/json" \
  -d '{
    "browser": "chromium",
    "headless": true
  }'
```

### 5. View Execution History

```bash
curl http://localhost:5000/api/v1/executions/test-case/YOUR_TEST_CASE_ID/history
```

## Common Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm run build            # Build for production
npm start                # Run production build

# Database
./setup-db.sh           # Setup database
npm run db:setup        # Alternative database setup

# Code Quality
npm run lint            # Run ESLint
npm test               # Run tests (when available)

# Cleanup
npm run clean          # Remove build files
```

## Troubleshooting

### Port Already in Use

If port 5000 is already in use:

```bash
# Change PORT in .env file
PORT=5001
```

### Database Connection Failed

1. **Check PostgreSQL is running:**
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql

   # Windows
   # Start from Services app
   ```

2. **Verify credentials in .env**
3. **Check database exists:**
   ```bash
   psql -U postgres -l
   ```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --force
```

## Next Steps

Now that you're up and running:

1. =Ö **Read the Full Documentation**: [README.md](README.md)
2. <× **Understand the Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
3. =€ **Deploy to Production**: [DEPLOYMENT.md](DEPLOYMENT.md)
4. =Ý **Review Project Summary**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
5. =. **See Future Plans**: [NEXT_STEPS.md](NEXT_STEPS.md)

## Development Tips

### Using Nodemon

The development server uses nodemon for auto-reloading:

- Edit any `.ts` file
- Server automatically restarts
- Check terminal for errors

### Testing with Postman

1. Import `Test_Runner_Platform.postman_collection.json`
2. Collection includes all API endpoints
3. Variables auto-update after creating resources
4. Perfect for manual testing

### Viewing Logs

Logs are output to console with Winston:

```bash
# Development logs are verbose
# Check terminal for detailed logs including:
# - HTTP requests
# - Database queries
# - Playwright execution
# - Errors and warnings
```

## Getting Help

- =Ú **Documentation**: Check the `Documentation/` folder
- = **Issues**: Report bugs on GitHub
- =¡ **Questions**: Open a discussion on GitHub
- =ç **Contact**: Reach out to Emmanuel Arhu

## Production Build

When ready for production:

```bash
# Build TypeScript
npm run build

# Start production server
NODE_ENV=production npm start
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production deployment guide.

---

**Congratulations!** <‰ You now have Test Runner Platform running locally!

Start creating projects, test suites, and automated tests with Playwright.

---

**Built by Emmanuel Arhu** | Senior QA Test Engineer
