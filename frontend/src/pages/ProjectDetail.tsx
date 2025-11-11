import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import Loading from '../components/common/Loading';
import type { Project, TestSuite, BrowserType } from '../types';
import styles from './ProjectDetail.module.css';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>('chromium');
  const [runningTest, setRunningTest] = useState(false);
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch project details and test suites in parallel
      const [projectResponse, suitesResponse] = await Promise.all([
        api.projects.getById(projectId),
        api.testSuites.getByProject(projectId)
      ]);

      setProject(projectResponse.data);
      setTestSuites(suitesResponse.data.data);
    } catch (err: any) {
      console.error('Error fetching project details:', err);
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!projectId) return;
    setRunningTest(true);
    try {
      // TODO: Call backend API to run all tests
      console.log(`Running all tests for project ${projectId} with ${selectedBrowser}`);
      // await api.testRuns.execute({ project_id: projectId, browser: selectedBrowser });
    } catch (err: any) {
      console.error('Error running tests:', err);
    } finally {
      setRunningTest(false);
    }
  };

  const handleRunTestSuite = async (suiteId: string) => {
    if (!projectId) return;
    setRunningTest(true);
    setRunningSuiteId(suiteId);
    try {
      // Call backend API to run specific test suite
      const response = await api.executions.executeTestSuite(suiteId, {
        browser: selectedBrowser,
        headless: false
      });
      console.log('Test suite execution started:', response.data);
      // Refresh test suites to get updated stats
      await fetchProjectDetails();
    } catch (err: any) {
      console.error('Error running test suite:', err);
      setError(err.response?.data?.message || 'Failed to run test suite');
    } finally {
      setRunningTest(false);
      setRunningSuiteId(null);
    }
  };

  if (loading) return <Loading message="Loading project details..." />;
  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>Error Loading Project</h2>
      <p className={styles.errorMessage}>{error}</p>
      <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
        ← Back to Dashboard
      </button>
    </div>
  );
  if (!project) return null;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <div className={styles.breadcrumb}>
          <span onClick={() => navigate('/dashboard')}>Projects</span>
          <span>›</span>
          <span>{project.name}</span>
        </div>
      </div>

      <div className={styles.projectHeader}>
        <div className={styles.projectInfo}>
          {project.logo ? (
            <img src={project.logo} alt={project.name} className={styles.projectLogo} />
          ) : (
            <div className={styles.projectLogoPlaceholder}>
              {project.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className={styles.projectName}>{project.name}</h1>
            <p className={styles.projectDescription}>{project.description || 'No description'}</p>
          </div>
        </div>

        <div className={styles.actionBar}>
          <div className={styles.browserSelector}>
            <label htmlFor="browser">Browser:</label>
            <select
              id="browser"
              value={selectedBrowser}
              onChange={(e) => setSelectedBrowser(e.target.value as BrowserType)}
              className={styles.select}
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit</option>
            </select>
          </div>
          <button
            onClick={handleRunAllTests}
            disabled={runningTest}
            className={styles.runAllButton}
          >
            {runningTest ? '⏳ Running...' : '▶ Run All Tests'}
          </button>
        </div>
      </div>

      {project.last_run && (
        <div className={styles.statsCard}>
          <h2 className={styles.statsTitle}>Last Test Run</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tests</span>
              <span className={styles.statValue}>{project.last_run.total_tests}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Passed</span>
              <span className={styles.statValue} style={{ color: 'var(--success-600)' }}>
                {project.last_run.passed_tests}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Failed</span>
              <span className={styles.statValue} style={{ color: 'var(--error-600)' }}>
                {project.last_run.failed_tests}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Run Date</span>
              <span className={styles.statValue}>
                {new Date(project.last_run.run_date).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.testSuitesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Test Suites</h2>
          <button
            className={styles.createSuiteButton}
            onClick={() => navigate(`/suites?projectId=${projectId}`)}
          >
            + Create Test Suite
          </button>
        </div>

        {testSuites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyText}>No test suites found</div>
            <div className={styles.emptySubtext}>
              Create your first test suite to organize your Playwright tests
            </div>
          </div>
        ) : (
          <div className={styles.suitesGrid}>
            {testSuites.map((suite) => (
              <div key={suite.id} className={styles.suiteCard}>
                <div className={styles.suiteHeader}>
                  <div className={styles.suiteIcon}>📦</div>
                  <div className={styles.suiteInfo}>
                    <h3 className={styles.suiteName}>{suite.name}</h3>
                    {suite.description && (
                      <p className={styles.suiteDescription}>{suite.description}</p>
                    )}
                  </div>
                </div>

                {/* Test counts */}
                <div className={styles.suiteStats}>
                  <div className={styles.statBox}>
                    <span className={styles.statValue}>{suite.totalTests || 0}</span>
                    <span className={styles.statLabel}>Total</span>
                  </div>
                  <div className={styles.statBox} style={{ color: 'var(--success-600)' }}>
                    <span className={styles.statValue}>{suite.passed || 0}</span>
                    <span className={styles.statLabel}>Passed</span>
                  </div>
                  <div className={styles.statBox} style={{ color: 'var(--error-600)' }}>
                    <span className={styles.statValue}>{suite.failed || 0}</span>
                    <span className={styles.statLabel}>Failed</span>
                  </div>
                  <div className={styles.statBox} style={{ color: 'var(--gray-500)' }}>
                    <span className={styles.statValue}>{suite.skipped || 0}</span>
                    <span className={styles.statLabel}>Skipped</span>
                  </div>
                </div>

                {/* Last run info */}
                {suite.lastRun && (
                  <div className={styles.lastRun}>
                    Last run: {new Date(suite.lastRun).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className={styles.suiteActions}>
                  <button
                    onClick={() => navigate(`/suites/${suite.id}`)}
                    className={styles.viewButton}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRunTestSuite(suite.id)}
                    disabled={runningTest}
                    className={`${styles.runButton} ${runningSuiteId === suite.id ? styles.running : ''}`}
                  >
                    {runningSuiteId === suite.id ? '⏳ Running...' : '▶ Run Suite'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
