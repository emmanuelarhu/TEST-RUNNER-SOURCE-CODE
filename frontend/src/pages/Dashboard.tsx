import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import { useProject } from '../contexts/ProjectContext';
import type { TestSuite } from '../types';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, skipped: 0, passRate: '0%' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      fetchDashboardData();
    }
  }, [currentProject]);

  const fetchDashboardData = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      setError(null);
      const [suitesResponse, statsResponse] = await Promise.all([
        api.testSuites.getByProject(currentProject.id),
        api.projects.getStats(currentProject.id).catch(() => ({ data: null }))
      ]);
      setTestSuites(suitesResponse.data);

      // Use real stats if available, otherwise use calculated stats
      if (statsResponse.data) {
        // Real stats from backend
        const { totalTests, passedTests, failedTests, skippedTests } = statsResponse.data;
        const total = totalTests || 0;
        const passed = passedTests || 0;
        const failed = failedTests || 0;
        const passRate = total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%';
        setStats({ total, passed, failed, skipped: skippedTests || 0, passRate });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally { setLoading(false); }
  };

  if (!currentProject) return <Loading message="Loading project..." subtitle="Setting up your workspace" />;
  if (loading) return <Loading message="Loading dashboard..." subtitle="Fetching your test data" />;
  if (error) return (<div className={styles.errorContainer}><div className={styles.errorIcon}>⚠️</div><h2 className={styles.errorTitle}>Error Loading Dashboard</h2><p className={styles.errorMessage}>{error}</p><button onClick={fetchDashboardData} className={styles.retryButton}>Retry</button></div>);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}><span>Home</span><span>›</span><span>Dashboard</span></div>
        <h1 className={styles.pageTitle}>Test Automation Dashboard</h1>
        <p className={styles.pageSubtitle}>Monitor your test execution and quality metrics</p>
      </div>
      <div className={styles.statsGrid}>
        <StatCard label="Total Tests" value={stats.total} icon="📝" iconType="info" />
        <StatCard label="Tests Passed" value={stats.passed} icon="✓" iconType="success" />
        <StatCard label="Tests Failed" value={stats.failed} icon="✗" iconType="error" />
        <StatCard label="Success Rate" value={stats.passRate} icon="📊" iconType="warning" />
      </div>
      <div className={styles.pageHeader} style={{ marginTop: '2rem' }}><h2 className={styles.pageTitle} style={{ fontSize: '1.5rem' }}>Test Suites</h2><p className={styles.pageSubtitle}>Click on a suite to view details</p></div>
      {testSuites.length === 0 ? (
        <div className={styles.emptyState}><div className={styles.emptyIllustration}>📁</div><div className={styles.emptyTitle}>No Test Suites Yet</div><div className={styles.emptyDescription}>Create your first test suite to get started with automated testing</div><button className={styles.createButton} onClick={() => navigate('/suites')}><span>+</span>Create Test Suite</button></div>
      ) : (
        <div className={styles.testSuitesGrid}>
          {testSuites.map((suite) => (
            <div key={suite.id} className={styles.suiteCard} onClick={() => navigate(`/suites/${suite.id}`)}>
              <div className={styles.suiteHeader}><div className={styles.suiteIcon}>{suite.icon || '📦'}</div><div className={styles.suiteInfo}><div className={styles.suiteTitle}>{suite.name}</div><div className={styles.suiteDescription}>{suite.description || 'No description'}</div></div></div>
              <div className={styles.suiteStats}>
                <div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>✓</div><span>{suite.passed || 0}</span></div>
                <div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{ background: 'var(--error-50)', color: 'var(--error-600)' }}>✗</div><span>{suite.failed || 0}</span></div>
                <div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>⊘</div><span>{suite.skipped || 0}</span></div>
              </div>
              <div className={`${styles.suiteBadge} ${styles[suite.status]}`}><span>●</span><span>{suite.status}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
