import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetailEnhanced from './pages/ProjectDetailEnhanced';
import TestSuites from './pages/TestSuites';
import TestSuiteDetail from './pages/TestSuiteDetail';
import TestResults from './pages/TestResults';
import Settings from './pages/Settings';
import DiagnosticTest from './pages/DiagnosticTest';
import './styles/index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/diagnostic" element={<DiagnosticTest />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProjectProvider><MainLayout /></ProjectProvider>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="project/:projectId" element={<ProjectDetailEnhanced />} />
            <Route path="suites" element={<TestSuites />} />
            <Route path="suites/:id" element={<TestSuiteDetail />} />
            <Route path="results" element={<TestResults />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
