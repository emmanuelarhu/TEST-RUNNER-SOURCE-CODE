# TestFlow - Modern Test Automation Platform

A modern, React-based test automation platform with Playwright integration. This application provides a comprehensive dashboard for managing, executing, and monitoring automated tests.

## Features

- 🎯 **Dashboard** - Real-time test execution monitoring and metrics
- 📁 **Test Suites Management** - Organize and manage your test collections
- 📊 **Test Results** - Detailed test execution results with real-time updates
- 🔄 **WebSocket Integration** - Live test execution updates
- 🌐 **Multi-Browser Support** - Run tests on Chromium, Firefox, and WebKit
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Socket.io Client** - Real-time bidirectional communication
- **CSS Modules** - Scoped and maintainable styling

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Backend API running (see backend README)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and configure:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_API_VERSION=v1
   ```

## Development

**Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── common/         # Common UI components (Button, Loading, StatCard)
│   └── layout/         # Layout components (Sidebar, TopBar, MainLayout)
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard page
│   ├── TestSuites.tsx  # Test suites management page
│   └── TestResults.tsx # Test execution results page
├── services/           # API and WebSocket services
│   ├── api.config.ts   # Axios configuration
│   ├── api.service.ts  # API service functions
│   └── socket.service.ts # WebSocket service
├── styles/             # Global styles
│   └── index.css       # Global CSS variables and styles
├── types/              # TypeScript type definitions
│   └── index.ts        # Type definitions
├── App.tsx             # Main App component with routing
└── main.tsx            # Application entry point
```

## API Integration

The frontend communicates with the backend API using:

1. **REST API** - For CRUD operations (projects, test suites, test cases)
2. **WebSocket** - For real-time test execution updates

### API Endpoints

- `GET /api/v1/projects` - Get all projects
- `GET /api/v1/tests/projects/:projectId/suites` - Get test suites
- `POST /api/v1/executions/suite/:suiteId/execute` - Execute test suite
- `GET /api/v1/executions/project/:projectId/runs` - Get test runs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_API_VERSION` | API version | `v1` |

## Troubleshooting

### API Connection Issues

If the frontend cannot connect to the backend:

1. Verify the backend is running on the correct port
2. Check the `VITE_API_BASE_URL` in `.env`
3. Ensure CORS is properly configured in the backend

### WebSocket Connection Issues

If real-time updates aren't working:

1. Check that Socket.io server is running in the backend
2. Verify firewall settings allow WebSocket connections
3. Check browser console for WebSocket errors

## License

MIT License - see LICENSE file for details
