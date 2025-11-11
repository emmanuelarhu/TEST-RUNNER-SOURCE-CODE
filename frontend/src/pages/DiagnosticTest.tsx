import { useState, useEffect } from 'react';
import authService from '../services/auth.service';
import api from '../services/api.service';

const DiagnosticTest = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnosticResults: Record<string, any> = {};

    // Test 1: Check if authenticated
    diagnosticResults.isAuthenticated = authService.isAuthenticated();
    diagnosticResults.user = authService.getUser();
    diagnosticResults.token = localStorage.getItem('auth_token') ? 'Token exists' : 'No token';

    // Test 2: Check environment variables
    diagnosticResults.apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    diagnosticResults.apiVersion = import.meta.env.VITE_API_VERSION;

    // Test 3: Try to fetch projects
    try {
      const projectsResponse = await api.projects.getAll();
      diagnosticResults.projectsAPI = {
        status: 'SUCCESS',
        count: projectsResponse.data.data.length,
        projects: projectsResponse.data
      };
    } catch (error: any) {
      diagnosticResults.projectsAPI = {
        status: 'FAILED',
        error: error.message,
        response: error.response?.data
      };
    }

    // Test 4: Try health check
    try {
      const healthResponse = await api.health.check();
      diagnosticResults.healthAPI = {
        status: 'SUCCESS',
        data: healthResponse.data
      };
    } catch (error: any) {
      diagnosticResults.healthAPI = {
        status: 'FAILED',
        error: error.message
      };
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Running Diagnostics...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Frontend Diagnostic Results</h1>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>Authentication Status</h2>
        <pre style={{ background: '#f9fafb', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify({
            isAuthenticated: results.isAuthenticated,
            user: results.user,
            token: results.token
          }, null, 2)}
        </pre>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>Environment Configuration</h2>
        <pre style={{ background: '#f9fafb', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify({
            apiBaseUrl: results.apiBaseUrl,
            apiVersion: results.apiVersion
          }, null, 2)}
        </pre>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>Projects API Test</h2>
        <pre style={{ background: '#f9fafb', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(results.projectsAPI, null, 2)}
        </pre>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>Health API Test</h2>
        <pre style={{ background: '#f9fafb', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(results.healthAPI, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fbbf24' }}>
        <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>How to use these results:</h3>
        <ul style={{ marginLeft: '1.5rem', color: '#78350f' }}>
          <li>If "isAuthenticated" is false, you need to login first</li>
          <li>If Projects API shows "FAILED", check if backend is running on port 5000</li>
          <li>If there's a CORS error, check backend CORS_ORIGIN setting</li>
          <li>If there's a network error, verify the API_BASE_URL is correct</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '0.75rem 2rem',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Go to Login
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.75rem 2rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default DiagnosticTest;
