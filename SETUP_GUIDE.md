# TestFlow - Complete Setup Guide

Complete guide to set up and run the TestFlow Test Automation Platform.

## Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 12.0
- **Git**

## Quick Start (5 Minutes)

### 1. Database Setup

```bash
# Make sure PostgreSQL is running
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# Create the database
cd backend
bash setup-db.sh

# Seed with sample data (creates test suites from the design)
npm run db:seed
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment (already set up)
# Check backend/.env for settings

# Start backend server
npm run dev
```

The backend will start at **http://localhost:5000**

You should see:
```
╔════════════════════════════════════════════════════════════╗
║   🚀 Test Runner Platform API                             ║
║   Environment: development                                 ║
║   Port: 5000                                              ║
║   📍 Server: http://localhost:5000                        ║
║   📍 Health: http://localhost:5000/health                ║
╚════════════════════════════════════════════════════════════╝
```

### 3. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at **http://localhost:5173**

## What You'll See

The application will show:

### Dashboard
- **Statistics Cards**: Total Tests (143), Tests Passed (133), Tests Failed (6), Success Rate (93%)
- **Test Suites**:
  - Consumer Web Portal 🛍️ (42 passed, 2 failed, 1 skipped)
  - ECG PowerApp ⚡ (30 passed, 1 failed, 1 skipped)
  - MA Portal Dashboard 📊 (25 passed, 2 failed, 1 skipped)
  - Partners Integration 🤝 (36 passed, 1 failed, 1 skipped)

### Navigation
- **Dashboard** - Overview and metrics
- **Test Suites** - Manage and execute tests
- **Test Results** - View execution history

## Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_runner_db
DB_USER=postgres
DB_PASSWORD=Examplegh1!
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_VERSION=v1
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/projects` | GET | Get all projects |
| `/api/v1/tests/projects/:id/suites` | GET | Get test suites |
| `/api/v1/tests/suites/:id` | GET | Get suite details |
| `/api/v1/executions/suite/:id/execute` | POST | Execute test suite |
| `/api/v1/executions/project/:id/runs` | GET | Get test runs |
| `/health` | GET | Health check |
| `/api-docs` | GET | Swagger documentation |

## Features

✅ **Modern React UI** - Clean, responsive interface matching the design
✅ **Real-time Updates** - WebSocket integration for live test results
✅ **Multi-browser Support** - Chromium, Firefox, WebKit
✅ **Test Management** - Create, edit, and organize test suites
✅ **Execution Control** - Run individual tests or entire suites
✅ **Results Tracking** - Detailed execution history and analytics
✅ **RESTful API** - Complete backend API with Swagger docs
✅ **TypeScript** - Full type safety across the stack

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Reset database
cd backend
bash setup-db.sh
npm run db:seed
```

### Port Already in Use

```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:5000/health`
2. Check CORS settings in `backend/.env`
3. Verify `frontend/.env` has correct API URL

### No Data Showing

```bash
# Reseed the database
cd backend
npm run db:seed
```

## Development Commands

### Backend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run db:seed  # Seed sample data
npm run lint     # Run linter
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

```
TestFlow/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── config/       # Configuration
│   │   ├── middleware/   # Express middleware
│   │   ├── seed-data.ts  # Sample data seeder
│   │   └── server.ts     # Entry point
│   └── package.json
│
├── frontend/             # React + TypeScript UI
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API & WebSocket
│   │   ├── types/        # TypeScript types
│   │   └── styles/       # Global styles
│   └── package.json
│
└── SETUP_GUIDE.md       # This file
```

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- Socket.io (WebSockets)
- Playwright (Test execution)

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- Axios
- Socket.io Client
- CSS Modules

## Next Steps

1. ✅ Explore the Dashboard
2. ✅ View Test Suites
3. ✅ Run a test suite
4. ✅ Check Test Results
5. 📝 Create your own test cases
6. 🚀 Integrate with your CI/CD pipeline

## Support

For issues or questions:
- Check the troubleshooting section above
- Review API docs at http://localhost:5000/api-docs
- Check the console for error messages

## License

MIT License - see LICENSE file for details
