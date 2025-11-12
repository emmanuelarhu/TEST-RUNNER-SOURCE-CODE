import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import Loading from '../components/common/Loading';
import TestRunHistory from '../components/TestRunHistory';
import type { Project, TestSuite, BrowserType } from '../types';
import styles from './ProjectDetail.module.css';

interface TestRunStats {
  id: string;
  run_name: string;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  duration_ms: number;
  browser: string;
  start_time: string;
  end_time: string;
  reportPath?: string;
  reportUrl?: string;
}

const ProjectDetailEnhanced = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [latestRun, setLatestRun] = useState<TestRunStats | null>(null);
  const [testStats, setTestStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>('chromium');
  const [runningTest, setRunningTest] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const [projectResponse, suitesResponse] = await Promise.all([
        api.projects.getById(projectId),
        api.testSuites.getByProject(projectId)
      ]);

      const projectData = projectResponse.data.data || projectResponse.data;
      const suitesData = suitesResponse.data.data || [];

      setProject(projectData);
      setTestSuites(suitesData);

      // Fetch latest test run
      await fetchLatestReport();

      // Fetch test discovery stats
      await fetchTestStats();

    } catch (err: any) {
      console.error('Error fetching project data:', err);
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestReport = async () => {
    if (!projectId) return;

    try {
      const response = await api.executions.getLatestReport(projectId);
      if (response.data.success && response.data.data.testRun) {
        setLatestRun(response.data.data.testRun);
      }
    } catch (err: any) {
      console.log('No latest report found (this is ok for new projects)');
    }
  };

  const fetchTestStats = async () => {
    if (!projectId) return;

    try {
      const response = await api.testDiscovery.getTestStats(projectId);
      if (response.data.success) {
        setTestStats(response.data.data);
      }
    } catch (err: any) {
      console.log('Test stats not available');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleSyncTests = async () => {
    if (!projectId) return;

    try {
      setRefreshing(true);
      const response = await api.testDiscovery.syncTests(projectId);
      if (response.data.success) {
        alert(`✅ Tests synced successfully!\n\nSuites: ${response.data.data.suitesCreated}\nTests: ${response.data.data.testsCreated}`);
        await fetchAllData();
      }
    } catch (err: any) {
      alert('Failed to sync tests: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!projectId) return;
    setRunningTest(true);
    try {
      const response = await api.executions.executeProject(projectId, {
        browser: selectedBrowser,
        headless: true,
        workers: 4
      });

      if (response.data.success) {
        const data = response.data.data;
        alert(`✅ Test execution completed!\n\nTotal: ${data.totalTests}\nPassed: ${data.passedTests}\nFailed: ${data.failedTests}\nSkipped: ${data.skippedTests}`);
        await fetchLatestReport();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to run tests';
      alert('❌ ' + errorMsg);
    } finally {
      setRunningTest(false);
    }
  };

  if (loading) return <Loading message="Loading project details..." subtitle="Fetching project information" />;
  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>Error Loading Project</h2>
      <p className={styles.errorMessage}>{error}</p>
      <button onClick={() => navigate('/')} className={styles.backButton}>
        ← Back to Dashboard
      </button>
    </div>
  );
  if (!project) return null;

  const passRate = latestRun && latestRun.total_tests > 0
    ? ((latestRun.passed_tests / latestRun.total_tests) * 100).toFixed(1)
    : '0';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <div className={styles.breadcrumb}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--primary-600)' }}>Projects</span>
          <span>›</span>
          <span>{project.name}</span>
        </div>
      </div>

      {/* Project Header */}
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
          <button onClick={handleRefresh} disabled={refreshing} className={styles.refreshButton}>
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={handleSyncTests} disabled={refreshing} className={styles.syncButton}>
            📥 Sync Tests
          </button>
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

      {/* Test Discovery Stats */}
      {testStats && (
        <div className={styles.statsCard}>
          <h3>📊 Test Discovery</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Test Suites</span>
              <span className={styles.statValue}>{testStats.totalSuites}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Test Cases</span>
              <span className={styles.statValue}>{testStats.totalTests}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Test Files</span>
              <span className={styles.statValue}>{testStats.testFiles?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Latest Test Run Stats */}
      {latestRun && (
        <div className={styles.statsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className={styles.statsTitle}>📈 Latest Test Run</h2>
            {latestRun.reportPath && (
              <button onClick={() => setShowReport(!showReport)} className={styles.toggleReportButton}>
                {showReport ? '📋 Hide Report' : '📋 View Report'}
              </button>
            )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tests</span>
              <span className={styles.statValue}>{latestRun.total_tests}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Passed</span>
              <span className={styles.statValue} style={{ color: 'var(--success-600)' }}>
                {latestRun.passed_tests} ({((latestRun.passed_tests / latestRun.total_tests) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Failed</span>
              <span className={styles.statValue} style={{ color: 'var(--error-600)' }}>
                {latestRun.failed_tests} ({((latestRun.failed_tests / latestRun.total_tests) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Skipped</span>
              <span className={styles.statValue} style={{ color: 'var(--warning-600)' }}>
                {latestRun.skipped_tests}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Duration</span>
              <span className={styles.statValue}>
                {(latestRun.duration_ms / 1000).toFixed(1)}s
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Status</span>
              <span className={styles.statValue} style={{
                color: latestRun.status === 'completed' ? 'var(--success-600)' : 'var(--error-600)'
              }}>
                {latestRun.status === 'completed' ? '✅ Passed' : '⚠️ Failed'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressContainer} style={{ marginTop: '1rem' }}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressPassed}
                style={{
                  width: `${passRate}%`,
                  background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                  height: '100%'
                }}
              />
              <div
                className={styles.progressFailed}
                style={{
                  width: `${((latestRun.failed_tests / latestRun.total_tests) * 100).toFixed(1)}%`,
                  background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                  height: '100%'
                }}
              />
            </div>
            <div className={styles.progressLabel} style={{ textAlign: 'center', marginTop: '0.5rem', color: '#666', fontSize: '14px' }}>
              {latestRun.passed_tests} passed / {latestRun.failed_tests} failed
            </div>
          </div>

          {/* Report Viewer */}
          {showReport && latestRun.reportPath && (
            <div className={styles.reportViewer} style={{ marginTop: '1.5rem' }}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h4>Playwright Test Report</h4>
                  <a
                    href={latestRun.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      background: '#3498db',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                  >
                    📱 Open in New Tab
                  </a>
                </div>
                <iframe
                  src={`http://localhost:5000/api/v1/executions/run/${latestRun.id}/view-report`}
                  style={{
                    width: '100%',
                    height: '800px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  title="Playwright Test Report"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Suites Section */}
      {/* Test Run History Section */}
      {project && (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <TestRunHistory projectId={project.id} projectName={project.name} />
        </div>
      )}

      <div className={styles.testSuitesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Test Suites ({testSuites.length})</h2>
        </div>

        {testSuites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyText}>No test suites found</div>
            <div className={styles.emptySubtext}>
              Tests are automatically discovered from your repository.
              Click "Sync Tests" to scan your .spec.ts files.
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
                    {suite.file_path && (
                      <p className={styles.suiteFilePath} style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        📄 {suite.file_path}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.suiteActions}>
                  <button
                    onClick={() => navigate(`/suites/${suite.id}`)}
                    className={styles.viewButton}
                  >
                    View Details
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

export default ProjectDetailEnhanced;
