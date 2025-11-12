import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import '../styles/TestRunHistory.css';

interface TestRun {
  id: string;
  run_name: string;
  run_number: number;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  flaky_tests: number;
  duration_ms: number;
  browser: string;
  report_path: string;
  report_url: string;
  start_time: string;
  end_time: string;
  created_at: string;
  triggered_by_username: string;
  suitesCount: number;
  casesCount: number;
  passRate: string;
}

interface TestRunHistoryProps {
  projectId: string;
  projectName: string;
}

const TestRunHistory: React.FC<TestRunHistoryProps> = ({ projectId, projectName }) => {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchTestRuns();
  }, [projectId, pagination.offset]);

  const fetchTestRuns = async () => {
    try {
      setLoading(true);
      const response = await api.executions.getProjectTestRunsDetailed(
        projectId,
        pagination.limit,
        pagination.offset
      );

      if (response.data.success) {
        setTestRuns(response.data.data.testRuns);
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test runs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    try {
      const response = await api.executions.getTestRunDetailed(runId);
      if (response.data.success) {
        setRunDetails(response.data.data);
        setSelectedRun(runId);
        setShowDetails(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load run details');
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'in_progress': return '#3b82f6';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'in_progress': return '⟳';
      case 'cancelled': return '⊘';
      default: return '?';
    }
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const loadPrevious = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  if (loading && testRuns.length === 0) {
    return <div className="test-run-history-loading">Loading test runs...</div>;
  }

  if (error && testRuns.length === 0) {
    return <div className="test-run-history-error">Error: {error}</div>;
  }

  return (
    <div className="test-run-history">
      <div className="test-run-history-header">
        <h2>Test Run History</h2>
        <div className="history-summary">
          <span className="total-runs">{pagination.total} runs</span>
        </div>
      </div>

      <div className="test-runs-timeline">
        {testRuns.map((run, index) => (
          <div key={run.id} className="test-run-card">
            <div className="run-timeline-marker" style={{ backgroundColor: getStatusColor(run.status) }}>
              <span className="status-icon">{getStatusIcon(run.status)}</span>
            </div>

            <div className="run-card-content">
              <div className="run-header">
                <div className="run-title-section">
                  <h3 className="run-title">{run.run_name}</h3>
                  <span className="run-number">#{run.run_number}</span>
                  <span className={`run-status status-${run.status}`}>
                    {run.status}
                  </span>
                </div>
                <div className="run-meta">
                  <span className="run-date">{formatDate(run.created_at)}</span>
                  <span className="run-browser">{run.browser}</span>
                </div>
              </div>

              <div className="run-stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Total Tests</div>
                  <div className="stat-value">{run.total_tests}</div>
                </div>
                <div className="stat-item stat-passed">
                  <div className="stat-label">Passed</div>
                  <div className="stat-value">{run.passed_tests}</div>
                </div>
                <div className="stat-item stat-failed">
                  <div className="stat-label">Failed</div>
                  <div className="stat-value">{run.failed_tests}</div>
                </div>
                <div className="stat-item stat-skipped">
                  <div className="stat-label">Skipped</div>
                  <div className="stat-value">{run.skipped_tests}</div>
                </div>
                {run.flaky_tests > 0 && (
                  <div className="stat-item stat-flaky">
                    <div className="stat-label">Flaky</div>
                    <div className="stat-value">{run.flaky_tests}</div>
                  </div>
                )}
                <div className="stat-item">
                  <div className="stat-label">Duration</div>
                  <div className="stat-value">{formatDuration(run.duration_ms)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Pass Rate</div>
                  <div className="stat-value">{run.passRate}%</div>
                </div>
              </div>

              <div className="run-progress-bar">
                <div className="progress-segment progress-passed" style={{ width: `${(run.passed_tests / run.total_tests) * 100}%` }} />
                <div className="progress-segment progress-failed" style={{ width: `${(run.failed_tests / run.total_tests) * 100}%` }} />
                <div className="progress-segment progress-skipped" style={{ width: `${(run.skipped_tests / run.total_tests) * 100}%` }} />
              </div>

              <div className="run-actions">
                <button
                  className="btn-view-details"
                  onClick={() => fetchRunDetails(run.id)}
                >
                  View Details
                </button>
                {run.report_url && (
                  <a
                    href={run.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-report"
                  >
                    View Report
                  </a>
                )}
              </div>

              {selectedRun === run.id && showDetails && runDetails && (
                <div className="run-details-section">
                  <div className="details-header">
                    <h4>Test Suites ({runDetails.suites.length})</h4>
                    <button className="btn-close" onClick={() => setShowDetails(false)}>✕</button>
                  </div>

                  <div className="suites-list">
                    {runDetails.suites.map((suite: any) => (
                      <div key={suite.id} className="suite-item">
                        <div className="suite-name">{suite.suite_name}</div>
                        <div className="suite-file">{suite.file_path}</div>
                        <div className="suite-stats">
                          <span className="suite-stat passed">{suite.passed_tests} passed</span>
                          <span className="suite-stat failed">{suite.failed_tests} failed</span>
                          <span className="suite-stat skipped">{suite.skipped_tests} skipped</span>
                          <span className="suite-stat duration">{formatDuration(suite.duration_ms)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="test-cases-section">
                    <h4>Test Cases ({runDetails.cases.length})</h4>
                    <div className="cases-list">
                      {runDetails.cases.map((testCase: any, idx: number) => (
                        <div key={idx} className={`case-item case-${testCase.status}`}>
                          <span className="case-icon">
                            {testCase.status === 'passed' ? '✓' : testCase.status === 'failed' ? '✗' : '⊘'}
                          </span>
                          <div className="case-info">
                            <div className="case-name">{testCase.test_name}</div>
                            <div className="case-meta">
                              <span className="case-suite">{testCase.suite_name}</span>
                              <span className="case-file">{testCase.file_path}</span>
                              {testCase.duration_ms > 0 && (
                                <span className="case-duration">{formatDuration(testCase.duration_ms)}</span>
                              )}
                            </div>
                            {testCase.error_message && (
                              <div className="case-error">{testCase.error_message}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {testRuns.length === 0 && (
        <div className="no-runs-message">
          <p>No test runs found for this project.</p>
          <p>Run some tests to see them here!</p>
        </div>
      )}

      {testRuns.length > 0 && (
        <div className="pagination-controls">
          <button
            className="btn-pagination"
            onClick={loadPrevious}
            disabled={pagination.offset === 0}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Showing {pagination.offset + 1} - {pagination.offset + testRuns.length} of {pagination.total}
          </span>
          <button
            className="btn-pagination"
            onClick={loadMore}
            disabled={!pagination.hasMore}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default TestRunHistory;
