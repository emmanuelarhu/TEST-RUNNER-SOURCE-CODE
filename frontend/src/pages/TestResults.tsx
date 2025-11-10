import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import socketService from '../services/socket.service';
import Loading from '../components/common/Loading';
import { useProject } from '../contexts/ProjectContext';
import type { TestRun, TestFilterType } from '../types';
import styles from './TestResults.module.css';

const TestResults = () => {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [filter, setFilter] = useState<TestFilterType>('all');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      fetchTestRuns();
      socketService.connect();
      socketService.onTestRunUpdate(() => fetchTestRuns());
    }
    return () => { socketService.offTestRunUpdate(); };
  }, [currentProject]);

  const fetchTestRuns = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      setError(null);
      const runsResponse = await api.executions.getProjectTestRuns(currentProject.id, 20);
      setTestRuns(runsResponse.data);
    } catch (err: any) {
      console.error('Error fetching test runs:', err);
      setError(err.response?.data?.message || 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const toggleTestExpansion = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    return { completed: '✓', failed: '✗', in_progress: '⟳', cancelled: '⊘' }[status] || '?';
  };

  const getStatusClass = (status: string) => {
    return { completed: styles.passed, failed: styles.failed, in_progress: styles.running }[status] || styles.skipped;
  };

  if (!currentProject) return <Loading message="Loading project..." subtitle="Setting up your workspace" />;
  if (loading) return <Loading message="Loading test results..." subtitle="Fetching execution history" />;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Error Loading Test Results</h2>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={fetchTestRuns} className={styles.retryButton}>Retry</button>
      </div>
    );
  }

  const filteredRuns = testRuns.filter((run) => {
    if (filter === 'all') return true;
    if (filter === 'passed') return run.status === 'completed' && run.failed_tests === 0;
    if (filter === 'failed') return run.status === 'failed' || run.failed_tests > 0;
    return false;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <a onClick={() => navigate('/')}>Home</a>
          <span>›</span>
          <span>Test Results</span>
        </div>
        <h1 className={styles.pageTitle}>Test Execution Results</h1>
        <p className={styles.pageSubtitle}>Detailed test run analysis and debugging</p>
      </div>

      {testRuns.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>🧪</div>
          <div className={styles.emptyTitle}>No Test Results Yet</div>
          <div className={styles.emptyDescription}>
            Run your first test suite to see detailed results here
          </div>
          <button className={styles.createButton} onClick={() => navigate('/suites')}>
            <span>📁</span>
            Go to Test Suites
          </button>
        </div>
      ) : (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitle}>Test Runs ({testRuns.length})</div>
            <div className={styles.resultsFilters}>
              <button
                className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
              >
                All
                <span className={styles.filterCount}>{testRuns.length}</span>
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'passed' ? styles.active : ''}`}
                onClick={() => setFilter('passed')}
              >
                ✓ Passed
                <span className={styles.filterCount}>
                  {testRuns.filter(r => r.status === 'completed' && r.failed_tests === 0).length}
                </span>
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'failed' ? styles.active : ''}`}
                onClick={() => setFilter('failed')}
              >
                ✗ Failed
                <span className={styles.filterCount}>
                  {testRuns.filter(r => r.status === 'failed' || r.failed_tests > 0).length}
                </span>
              </button>
            </div>
          </div>

          {filteredRuns.map((run) => (
            <div
              key={run.id}
              className={`${styles.testRow} ${expandedTests.has(run.id) ? styles.expanded : ''}`}
            >
              <div className={styles.testRowHeader} onClick={() => toggleTestExpansion(run.id)}>
                <div className={`${styles.testStatusIndicator} ${getStatusClass(run.status)}`}>
                  {getStatusIcon(run.status)}
                </div>

                <div className={styles.testMainInfo}>
                  <div className={styles.testName}>
                    {run.run_name || `Test Run #${run.id.substring(0, 8)}`}
                  </div>
                  <div className={styles.testPath}>
                    {new Date(run.start_time).toLocaleString()}
                  </div>
                </div>

                <div className={styles.testMeta}>
                  <div className={styles.testMetaItem}>
                    <span>✓ {run.passed_tests}</span>
                  </div>
                  <div className={styles.testMetaItem}>
                    <span>✗ {run.failed_tests}</span>
                  </div>
                  <div className={styles.testMetaItem}>
                    <span>⊘ {run.skipped_tests}</span>
                  </div>
                  <div className={styles.testMetaItem}>
                    <span>⏱️ {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : 'N/A'}</span>
                  </div>
                </div>

                <span className={styles.expandIcon}>›</span>
              </div>

              {expandedTests.has(run.id) && (
                <div className={styles.testDetails}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Environment:</span>
                      <span className={styles.detailValue}>{run.environment || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Browser:</span>
                      <span className={styles.detailValue}>{run.browser || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status:</span>
                      <span className={styles.detailValue}>{run.status}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Total Tests:</span>
                      <span className={styles.detailValue}>{run.total_tests}</span>
                    </div>
                  </div>

                  {run.failed_tests > 0 && (
                    <>
                      <div className={styles.errorPanel}>
                        <div className={styles.errorHeader}>
                          <div className={styles.errorIcon}>!</div>
                          <div className={styles.errorTitle}>Test Failures Detected</div>
                        </div>
                        <div className={styles.errorMessage}>
                          {run.failed_tests} test{run.failed_tests > 1 ? 's' : ''} failed in this run
                        </div>
                      </div>

                      <div className={styles.comparisonGrid}>
                        <div className={`${styles.comparisonBox} ${styles.expected}`}>
                          <div className={`${styles.comparisonLabel} ${styles.expected}`}>
                            Expected Behavior
                          </div>
                          <div className={`${styles.comparisonValue} ${styles.expected}`}>
                            All tests should pass successfully
                          </div>
                        </div>
                        <div className={`${styles.comparisonBox} ${styles.received}`}>
                          <div className={`${styles.comparisonLabel} ${styles.received}`}>
                            Actual Result
                          </div>
                          <div className={`${styles.comparisonValue} ${styles.received}`}>
                            {run.failed_tests} test(s) failed - Check logs for details
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.stepsTimeline}>
                    <div className={styles.timelineTitle}>Execution Summary</div>
                    <div className={styles.stepItem}>
                      <div className={`${styles.stepIndicator} ${run.passed_tests > 0 ? styles.passed : ''}`}>
                        ✓
                      </div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepName}>Tests Passed</div>
                        <div className={styles.stepDetails}>
                          <span className={styles.stepPath}>{run.passed_tests} / {run.total_tests} tests</span>
                          <span className={styles.stepDuration}>Success</span>
                        </div>
                      </div>
                    </div>

                    {run.failed_tests > 0 && (
                      <div className={styles.stepItem}>
                        <div className={`${styles.stepIndicator} ${styles.failed}`}>
                          ✗
                        </div>
                        <div className={styles.stepContent}>
                          <div className={styles.stepName}>Tests Failed</div>
                          <div className={styles.stepDetails}>
                            <span className={styles.stepPath}>{run.failed_tests} tests</span>
                            <span className={styles.stepDuration}>Needs attention</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {run.skipped_tests > 0 && (
                      <div className={styles.stepItem}>
                        <div className={`${styles.stepIndicator} ${styles.skipped}`}>
                          ⊘
                        </div>
                        <div className={styles.stepContent}>
                          <div className={styles.stepName}>Tests Skipped</div>
                          <div className={styles.stepDetails}>
                            <span className={styles.stepPath}>{run.skipped_tests} tests</span>
                            <span className={styles.stepDuration}>Not executed</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestResults;
