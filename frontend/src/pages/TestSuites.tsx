import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import CreateTestSuiteModal from '../components/common/CreateTestSuiteModal';
import { useProject } from '../contexts/ProjectContext';
import type { TestSuite, BrowserType, EnvironmentType } from '../types';
import styles from './TestSuites.module.css';

const TestSuites = () => {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [browser, setBrowser] = useState<BrowserType>('chromium');
  const [environment, setEnvironment] = useState<EnvironmentType>('production');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (currentProject) {
      fetchData();
    }
  }, [currentProject]);

  const fetchData = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      setError(null);
      const suitesResponse = await api.testSuites.getByProject(currentProject.id);
      setTestSuites(suitesResponse.data);
    } catch (err: any) {
      console.error('Error fetching test suites:', err);
      setError(err.response?.data?.message || 'Failed to load test suites');
    } finally { setLoading(false); }
  };

  const handleRunTests = async (suiteId?: string) => {
    if (!currentProject) return;

    try {
      setIsRunning(true);
      setError(null);

      let response;
      if (suiteId) {
        // Run specific test suite with Playwright
        response = await api.executions.executeTestSuite(suiteId, { browser, environment, headless: true });
      } else {
        // Run all project tests with Playwright
        response = await api.executions.executeProject(currentProject.id, {
          browser,
          headless: true,
          workers: 1
        });
      }

      // Show success message with report link
      const testRun = response.data;
      const message = `Tests ${testRun.status === 'completed' ? 'completed successfully' : 'finished'}!\n\nTotal: ${testRun.total_tests}\nPassed: ${testRun.passed_tests}\nFailed: ${testRun.failed_tests}\n\nView results page for the HTML report.`;

      alert(message);
      navigate('/results');
    } catch (err: any) {
      console.error('Error running tests:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Failed to run tests: ${errorMsg}`);
      alert(`Failed to run tests: ${errorMsg}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!currentProject) return <Loading message="Loading project..." subtitle="Setting up your workspace" />;
  if (loading) return <Loading message="Loading test suites..." subtitle="Fetching your test data" />;
  if (error) return (<div className={styles.errorContainer}><div className={styles.errorIcon}>⚠️</div><h2 className={styles.errorTitle}>Error Loading Test Suites</h2><p className={styles.errorMessage}>{error}</p><button onClick={fetchData} className={styles.retryButton}>Retry</button></div>);

  return (
    <div>
      <div className={styles.pageHeader}><div className={styles.breadcrumb}><a onClick={() => navigate('/')}>Home</a><span>›</span><span>Test Suites</span></div><h1 className={styles.pageTitle}>Test Suites</h1><p className={styles.pageSubtitle}>Manage and execute your test collections</p></div>
      <div className={styles.actionBar}>
        <div className={styles.filterGroup}><span className={styles.filterLabel}>Browser:</span><select className={styles.selectInput} value={browser} onChange={(e) => setBrowser(e.target.value as BrowserType)}><option value="chromium">Chromium</option><option value="firefox">Firefox</option><option value="webkit">WebKit</option></select></div>
        <div className={styles.filterGroup}><span className={styles.filterLabel}>Environment:</span><select className={styles.selectInput} value={environment} onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}><option value="production">Production</option><option value="staging">Staging</option><option value="development">Development</option></select></div>
        <div className={styles.actionBarRight}><Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}><span>+</span>New Suite</Button><Button variant="primary" onClick={() => handleRunTests()} disabled={isRunning || testSuites.length === 0}><span>▶</span>{isRunning ? 'Running...' : 'Run All Tests'}</Button></div>
      </div>
      {testSuites.length === 0 ? <div className={styles.emptyState}><div className={styles.emptyIllustration}>📁</div><div className={styles.emptyTitle}>No Test Suites Yet</div><div className={styles.emptyDescription}>Create your first test suite to start automating your tests</div><button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}><span>+</span>Create Test Suite</button></div> :
        <div className={styles.testSuitesGrid}>{testSuites.map((suite) => (<div key={suite.id} className={styles.suiteCard}><div className={styles.suiteHeader}><div className={styles.suiteIcon}>{suite.icon || '📦'}</div><div className={styles.suiteInfo}><div className={styles.suiteTitle}>{suite.name}</div><div className={styles.suiteDescription}>{suite.description || 'No description'}</div></div></div><div className={styles.suiteStats}><div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{background:'var(--success-50)',color:'var(--success-600)'}}>✓</div><span>{suite.passed||0}</span></div><div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{background:'var(--error-50)',color:'var(--error-600)'}}>✗</div><span>{suite.failed||0}</span></div><div className={styles.suiteStat}><div className={styles.suiteStatIcon} style={{background:'var(--gray-100)',color:'var(--gray-600)'}}>⊘</div><span>{suite.skipped||0}</span></div></div><div className={`${styles.suiteBadge} ${styles[suite.status]}`}><span>●</span><span>{suite.status}•Last run {suite.lastRun||'never'}</span></div><div className={styles.suiteActions}><Button variant="primary" onClick={(e)=>{e.stopPropagation();handleRunTests(suite.id);}} disabled={isRunning}><span>▶</span>Run</Button><Button variant="secondary" onClick={(e)=>{e.stopPropagation();navigate(`/suites/${suite.id}`);}}>View Details</Button></div></div>))}</div>
      }

      {currentProject && (
        <CreateTestSuiteModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={currentProject.id}
          onSuiteCreated={fetchData}
        />
      )}
    </div>
  );
};

export default TestSuites;
