import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.service';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import CreateTestCaseModal from '../components/common/CreateTestCaseModal';
import ViewTestCaseModal from '../components/common/ViewTestCaseModal';
import type { TestSuite, TestCase } from '../types';
import styles from './TestSuiteDetail.module.css';

const TestSuiteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suite, setSuite] = useState<TestSuite | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const [suiteResponse, casesResponse] = await Promise.all([
        api.testSuites.getById(id),
        api.testCases.getBySuite(id)
      ]);
      setSuite(suiteResponse.data);
      setTestCases(casesResponse.data);
    } catch (err: any) {
      console.error('Error fetching suite details:', err);
      setError(err.response?.data?.message || 'Failed to load test suite');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) return;

    try {
      await api.testCases.delete(caseId);
      await fetchData();
    } catch (err: any) {
      alert('Failed to delete test case: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRunSuite = async () => {
    try {
      await api.executions.executeTestSuite(id!, { browser: 'chromium', headless: true });
      navigate('/results');
    } catch (err: any) {
      alert('Failed to run tests: ' + (err.response?.data?.message || err.message));
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'var(--error-500)',
      high: 'var(--orange-500)',
      medium: 'var(--yellow-500)',
      low: 'var(--gray-500)'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      functional: '⚙️',
      api: '🔌',
      e2e: '🔄',
      integration: '🔗',
      smoke: '💨',
      regression: '🔁'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  if (loading) return <Loading message="Loading test suite..." subtitle="Fetching test cases" />;
  if (error || !suite) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Error Loading Test Suite</h2>
        <p className={styles.errorMessage}>{error || 'Suite not found'}</p>
        <button onClick={() => navigate('/suites')} className={styles.retryButton}>
          Back to Test Suites
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <a onClick={() => navigate('/')}>Home</a>
          <span>›</span>
          <a onClick={() => navigate('/suites')}>Test Suites</a>
          <span>›</span>
          <span>{suite.name}</span>
        </div>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>{suite.name}</h1>
            <p className={styles.pageSubtitle}>{suite.description || 'No description'}</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => navigate('/suites')}>
              ← Back
            </Button>
            <Button variant="primary" onClick={handleRunSuite}>
              <span>▶</span>
              Run Suite
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{testCases.length}</div>
          <div className={styles.statLabel}>Total Tests</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{suite.passed || 0}</div>
          <div className={styles.statLabel}>Passed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{suite.failed || 0}</div>
          <div className={styles.statLabel}>Failed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{suite.skipped || 0}</div>
          <div className={styles.statLabel}>Skipped</div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h2 className={styles.sectionTitle}>Test Cases ({testCases.length})</h2>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <span>+</span>
            Add Test Case
          </Button>
        </div>

        {testCases.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>📝</div>
            <div className={styles.emptyTitle}>No Test Cases Yet</div>
            <div className={styles.emptyDescription}>
              Add your first test case to start building your test suite
            </div>
            <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
              <span>+</span>
              Create Test Case
            </button>
          </div>
        ) : (
          <div className={styles.testCasesList}>
            {testCases.map((testCase) => (
              <div key={testCase.id} className={styles.testCaseCard}>
                <div className={styles.caseHeader}>
                  <div className={styles.caseIcon}>{getTypeIcon(testCase.test_type)}</div>
                  <div className={styles.caseInfo}>
                    <div className={styles.caseName}>{testCase.name}</div>
                    <div className={styles.caseDescription}>
                      {testCase.description || 'No description'}
                    </div>
                  </div>
                  <div
                    className={styles.priorityBadge}
                    style={{ background: getPriorityColor(testCase.priority) }}
                  >
                    {testCase.priority}
                  </div>
                </div>

                <div className={styles.caseMeta}>
                  <span className={styles.metaItem}>
                    <span className={styles.metaLabel}>Type:</span>
                    <span className={styles.metaValue}>{testCase.test_type}</span>
                  </span>
                  {testCase.tags && testCase.tags.length > 0 && (
                    <span className={styles.metaItem}>
                      <span className={styles.metaLabel}>Tags:</span>
                      <span className={styles.tags}>
                        {testCase.tags.map((tag, idx) => (
                          <span key={idx} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                </div>

                <div className={styles.caseActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setSelectedCase(testCase)}
                  >
                    View
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleDeleteCase(testCase.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        suiteId={id!}
        onCaseCreated={fetchData}
      />

      <ViewTestCaseModal
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        testCase={selectedCase}
        onDelete={selectedCase ? () => {
          handleDeleteCase(selectedCase.id);
          setSelectedCase(null);
        } : undefined}
      />
    </div>
  );
};

export default TestSuiteDetail;
