# Test Runner Platform

> A comprehensive test automation platform with Playwright integration - built for QA engineers, by a QA engineer.

## 🎯 Overview

Test Runner Platform is a full-stack application designed to streamline test automation workflows. It provides a centralized platform for managing test projects, organizing test suites, creating test cases, and executing automated tests using Playwright.

**Built by:** Emmanuel Arhu - Senior QA Test Engineer  
**Tech Stack:** Node.js, TypeScript, Express, PostgreSQL, Playwright, Socket.io

## ✨ Key Features

- **Project Management**: Organize tests by projects
- **Test Suite Organization**: Group related tests together
- **Test Case Management**: Create, edit, and manage test cases with metadata
- **Playwright Integration**: Execute tests using Playwright (Chromium, Firefox, WebKit)
- **Real-time Updates**: Live test execution updates via WebSockets
- **Execution History**: Track test results and execution history
- **Rich Reporting**: Detailed execution logs, screenshots, and videos
- **REST API**: Well-documented API for all operations
- **Type-Safe**: Built with TypeScript for better developer experience

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/emmanuelarhu/test-runner-platform.git
cd test-runner-platform/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
./setup-db.sh

# Install Playwright browsers
npx playwright install

# Start development server
npm run dev
```

Server will be running at `http://localhost:5000`

## 📚 Documentation

- **[Quick Start Guide](backend/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Complete README](backend/README.md)** - Full documentation
- **[API Documentation](backend/README.md#-api-endpoints)** - All API endpoints
- **[Deployment Guide](backend/DEPLOYMENT.md)** - Production deployment options
- **[Next Steps](backend/NEXT_STEPS.md)** - Roadmap and feature ideas
- **[Project Summary](backend/PROJECT_SUMMARY.md)** - Architecture overview

## 🏗️ Architecture

```
Test Runner Platform
├── Backend (Node.js + Express + TypeScript)
│   ├── REST API
│   ├── PostgreSQL Database
│   ├── Playwright Integration
│   └── Socket.io for Real-time Updates
└── Frontend (Coming Soon - React + TypeScript)
```

## 📊 Database Schema

- **Projects**: Test project organization
- **Test Suites**: Logical grouping of test cases
- **Test Cases**: Individual test definitions
- **Test Executions**: Execution results and history
- **Test Runs**: Batch execution tracking
- **Users**: User management (for future auth)

## 🔌 API Endpoints

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Test Suites & Cases
- `GET /api/v1/tests/projects/:projectId/suites` - List test suites
- `POST /api/v1/tests/suites` - Create test suite
- `GET /api/v1/tests/suites/:suiteId/cases` - List test cases
- `POST /api/v1/tests/cases` - Create test case

### Execution
- `POST /api/v1/executions/test-case/:id/execute` - Execute single test
- `POST /api/v1/executions/suite/:id/execute` - Execute test suite
- `GET /api/v1/executions/test-case/:id/history` - Get execution history

## 🧪 Example Usage

### Create a Test Project
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform Tests",
    "description": "Automated tests for e-commerce site",
    "base_url": "https://example.com"
  }'
```

### Execute a Test
```bash
curl -X POST http://localhost:5000/api/v1/executions/test-case/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "browser": "chromium",
    "environment": "staging",
    "headless": true
  }'
```

## 🛠️ Development

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Clean build files
npm run clean
```

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Test Automation**: Playwright
- **Real-time**: Socket.io
- **Logging**: Winston
- **Validation**: express-validator

## 🔒 Security Features

- Input validation on all endpoints
- Parameterized database queries (SQL injection prevention)
- Environment-based configuration
- Error handling middleware
- CORS configuration
- Rate limiting ready (to be implemented)

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Backend API
- [x] Database schema
- [x] Playwright integration
- [x] Test execution
- [x] Execution history

### Phase 2 (Next)
- [ ] Frontend (React + TypeScript)
- [ ] User authentication (JWT)
- [ ] Real-time execution dashboard
- [ ] Test result analytics

### Phase 3 (Future)
- [ ] Test scheduling
- [ ] CI/CD integration
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Test recorder

## 🤝 Contributing

Contributions are welcome! This is a portfolio/learning project, but I'm open to:
- Bug reports
- Feature suggestions
- Code improvements
- Documentation updates

## 📄 License

MIT License - feel free to use this project for learning or in your own work.

## 👤 Author

**Emmanuel Arhu**
- Role: Senior QA Test Engineer
- Experience: 6+ years in QA & Test Automation
- LinkedIn: [emmanuelarhu](https://www.linkedin.com/in/emmanuelarhu)
- GitHub: [@emmanuelarhu](https://github.com/emmanuelarhu)
- Website: [emmanuelarhu.link](https://emmanuelarhu.link)

## 🎓 Skills Demonstrated

This project showcases:
- ✅ Backend Development (Node.js, Express, TypeScript)
- ✅ Database Design (PostgreSQL)
- ✅ REST API Design
- ✅ Test Automation (Playwright)
- ✅ Real-time Communication (WebSockets)
- ✅ Error Handling & Logging
- ✅ API Documentation
- ✅ DevOps (Docker, deployment strategies)

## ⭐ Show Your Support

If you find this project helpful:
- Give it a ⭐ on GitHub
- Share it with others
- Contribute improvements
- Use it in your projects

## 📝 Notes

This is a working project built to demonstrate:
1. Full-stack development capabilities
2. QA engineering expertise
3. Modern software architecture
4. Production-ready code practices

**Perfect for showcasing in senior QA/SDET job applications!**

---

**Built with ❤️ by Emmanuel Arhu**

*"Quality is not an act, it is a habit." - Aristotle*
EOF
cat /root/test-runner-platform/README.md
Output

# Test Runner Platform

> A comprehensive test automation platform with Playwright integration - built for QA engineers, by a QA engineer.

## 🎯 Overview

Test Runner Platform is a full-stack application designed to streamline test automation workflows. It provides a centralized platform for managing test projects, organizing test suites, creating test cases, and executing automated tests using Playwright.

**Built by:** Emmanuel Arhu - Senior QA Test Engineer  
**Tech Stack:** Node.js, TypeScript, Express, PostgreSQL, Playwright, Socket.io

## ✨ Key Features

- **Project Management**: Organize tests by projects
- **Test Suite Organization**: Group related tests together
- **Test Case Management**: Create, edit, and manage test cases with metadata
- **Playwright Integration**: Execute tests using Playwright (Chromium, Firefox, WebKit)
- **Real-time Updates**: Live test execution updates via WebSockets
- **Execution History**: Track test results and execution history
- **Rich Reporting**: Detailed execution logs, screenshots, and videos
- **REST API**: Well-documented API for all operations
- **Type-Safe**: Built with TypeScript for better developer experience

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/emmanuelarhu/test-runner-platform.git
cd test-runner-platform/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
./setup-db.sh

# Install Playwright browsers
npx playwright install

# Start development server
npm run dev
```

Server will be running at `http://localhost:5000`

## 📚 Documentation

- **[Quick Start Guide](backend/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Complete README](backend/README.md)** - Full documentation
- **[API Documentation](backend/README.md#-api-endpoints)** - All API endpoints
- **[Deployment Guide](backend/DEPLOYMENT.md)** - Production deployment options
- **[Next Steps](backend/NEXT_STEPS.md)** - Roadmap and feature ideas
- **[Project Summary](backend/PROJECT_SUMMARY.md)** - Architecture overview

## 🏗️ Architecture

```
Test Runner Platform
├── Backend (Node.js + Express + TypeScript)
│   ├── REST API
│   ├── PostgreSQL Database
│   ├── Playwright Integration
│   └── Socket.io for Real-time Updates
└── Frontend (Coming Soon - React + TypeScript)
```

## 📊 Database Schema

- **Projects**: Test project organization
- **Test Suites**: Logical grouping of test cases
- **Test Cases**: Individual test definitions
- **Test Executions**: Execution results and history
- **Test Runs**: Batch execution tracking
- **Users**: User management (for future auth)

## 🔌 API Endpoints

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Test Suites & Cases
- `GET /api/v1/tests/projects/:projectId/suites` - List test suites
- `POST /api/v1/tests/suites` - Create test suite
- `GET /api/v1/tests/suites/:suiteId/cases` - List test cases
- `POST /api/v1/tests/cases` - Create test case

### Execution
- `POST /api/v1/executions/test-case/:id/execute` - Execute single test
- `POST /api/v1/executions/suite/:id/execute` - Execute test suite
- `GET /api/v1/executions/test-case/:id/history` - Get execution history

## 🧪 Example Usage

### Create a Test Project
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform Tests",
    "description": "Automated tests for e-commerce site",
    "base_url": "https://example.com"
  }'
```

### Execute a Test
```bash
curl -X POST http://localhost:5000/api/v1/executions/test-case/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "browser": "chromium",
    "environment": "staging",
    "headless": true
  }'
```

## 🛠️ Development

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Clean build files
npm run clean
```

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Test Automation**: Playwright
- **Real-time**: Socket.io
- **Logging**: Winston
- **Validation**: express-validator

## 🔒 Security Features

- Input validation on all endpoints
- Parameterized database queries (SQL injection prevention)
- Environment-based configuration
- Error handling middleware
- CORS configuration
- Rate limiting ready (to be implemented)

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Backend API
- [x] Database schema
- [x] Playwright integration
- [x] Test execution
- [x] Execution history

### Phase 2 (Next)
- [ ] Frontend (React + TypeScript)
- [ ] User authentication (JWT)
- [ ] Real-time execution dashboard
- [ ] Test result analytics

### Phase 3 (Future)
- [ ] Test scheduling
- [ ] CI/CD integration
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Test recorder

## 🤝 Contributing

Contributions are welcome! This is a portfolio/learning project, but I'm open to:
- Bug reports
- Feature suggestions
- Code improvements
- Documentation updates

## 📄 License

MIT License - feel free to use this project for learning or in your own work.

## 👤 Author

**Emmanuel Arhu**
- Role: Senior QA Test Engineer
- Experience: 6+ years in QA & Test Automation
- LinkedIn: [emmanuelarhu](https://www.linkedin.com/in/emmanuelarhu)
- GitHub: [@emmanuelarhu](https://github.com/emmanuelarhu)
- Website: [emmanuelarhu.link](https://emmanuelarhu.link)

## 🎓 Skills Demonstrated

This project showcases:
- ✅ Backend Development (Node.js, Express, TypeScript)
- ✅ Database Design (PostgreSQL)
- ✅ REST API Design
- ✅ Test Automation (Playwright)
- ✅ Real-time Communication (WebSockets)
- ✅ Error Handling & Logging
- ✅ API Documentation
- ✅ DevOps (Docker, deployment strategies)

## ⭐ Show Your Support

If you find this project helpful:
- Give it a ⭐ on GitHub
- Share it with others
- Contribute improvements
- Use it in your projects

## 📝 Notes

This is a working project built to demonstrate:
1. Full-stack development capabilities
2. QA engineering expertise
3. Modern software architecture
4. Production-ready code practices

**Perfect for showcasing in senior QA/SDET job applications!**

---

**Built with ❤️ by Emmanuel Arhu**

*"Quality is not an act, it is a habit." - Aristotle*