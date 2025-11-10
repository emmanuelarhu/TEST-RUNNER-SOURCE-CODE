import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import TestSuites from './pages/TestSuites';
import TestResults from './pages/TestResults';
import './styles/index.css';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="suites" element={<TestSuites />} />
            <Route path="results" element={<TestResults />} />
          </Route>
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
