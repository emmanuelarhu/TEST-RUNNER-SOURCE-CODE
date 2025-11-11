# Test Statistics & Report Viewing - Quick Integration Guide

## Overview
The backend now properly captures and stores test statistics. Here's how to display them in the frontend.

---

## API Response Format

When you execute tests or get latest report, you'll receive:

```json
{
  "success": true,
  "message": "Tests completed: 62 passed, 4 failed",
  "data": {
    "projectId": "71d12e9e-6465-4bcf-b607-e0eb272758f3",
    "runName": "Run 2025-11-11T17:04:54.000Z",
    "status": "failed",
    "totalTests": 66,
    "passedTests": 62,
    "failedTests": 4,
    "skippedTests": 0,
    "duration": 180000,
    "reportPath": "/reports/report-abc-123/index.html",
    "reportUrl": "http://localhost:5000/reports/report-abc-123/index.html"
  }
}
```

---

## Display Test Statistics

### React Component Example

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProjectTestStats({ projectId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestStats();
  }, [projectId]);

  const fetchLatestStats = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/v1/executions/project/${projectId}/latest-report`
      );
      setStats(data.data.testRun);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading test stats...</div>;
  if (!stats) return <div>No test runs yet. Run tests to see statistics.</div>;

  const passRate = ((stats.passed_tests / stats.total_tests) * 100).toFixed(1);
  const failRate = ((stats.failed_tests / stats.total_tests) * 100).toFixed(1);

  return (
    <div className="test-stats-container">
      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total_tests}</div>
          <div className="stat-label">Total Tests</div>
        </div>

        <div className="stat-card passed">
          <div className="stat-number">{stats.passed_tests}</div>
          <div className="stat-label">Passed</div>
          <div className="stat-percentage">{passRate}%</div>
        </div>

        <div className="stat-card failed">
          <div className="stat-number">{stats.failed_tests}</div>
          <div className="stat-label">Failed</div>
          <div className="stat-percentage">{failRate}%</div>
        </div>

        <div className="stat-card skipped">
          <div className="stat-number">{stats.skipped_tests}</div>
          <div className="stat-label">Skipped</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-passed"
            style={{ width: `${passRate}%` }}
          />
          <div
            className="progress-failed"
            style={{ width: `${failRate}%` }}
          />
        </div>
        <div className="progress-label">
          {stats.passed_tests} passed / {stats.failed_tests} failed
        </div>
      </div>

      {/* Test Status Badge */}
      <div className={`status-badge ${stats.status}`}>
        {stats.status === 'completed' ? '✅ All Tests Passed' : '⚠️ Some Tests Failed'}
      </div>

      {/* Duration */}
      <div className="duration">
        ⏱️ Completed in {(stats.duration_ms / 1000).toFixed(1)}s
      </div>

      {/* View Report Button */}
      {stats.reportPath && (
        <button
          onClick={() => window.open(stats.reportUrl, '_blank')}
          className="view-report-btn"
        >
          📋 View Full Report
        </button>
      )}
    </div>
  );
}

export default ProjectTestStats;
```

---

## CSS Styling

```css
.test-stats-container {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.total {
  border-left: 4px solid #3498db;
}

.stat-card.passed {
  border-left: 4px solid #27ae60;
}

.stat-card.failed {
  border-left: 4px solid #e74c3c;
}

.stat-card.skipped {
  border-left: 4px solid #f39c12;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-card.passed .stat-number {
  color: #27ae60;
}

.stat-card.failed .stat-number {
  color: #e74c3c;
}

.stat-card.skipped .stat-number {
  color: #f39c12;
}

.stat-label {
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
}

.stat-percentage {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  height: 30px;
  background: #ecf0f1;
  border-radius: 15px;
  overflow: hidden;
  display: flex;
}

.progress-passed {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-failed {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-label {
  text-align: center;
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  margin: 15px 0;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.duration {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

.view-report-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;
  transition: background 0.2s;
}

.view-report-btn:hover {
  background: #2980b9;
}
```

---

## Complete Page with Report Viewer

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProjectDetailPage({ projectId }) {
  const [testRun, setTestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTestData();
  }, [projectId]);

  const fetchTestData = async () => {
    try {
      setRefreshing(true);
      const { data } = await axios.get(
        `http://localhost:5000/api/v1/executions/project/${projectId}/latest-report`
      );
      setTestRun(data.data.testRun);
    } catch (error) {
      console.error('Error fetching test data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runTests = async () => {
    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/v1/executions/project/${projectId}/execute`,
        {
          browser: 'chromium',
          headless: true,
          workers: 4
        }
      );
      // Fetch updated results
      await fetchTestData();
    } catch (error) {
      console.error('Error running tests:', error);
      alert('Failed to run tests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !testRun) return <div>Loading...</div>;

  return (
    <div className="project-detail-page">
      <div className="page-header">
        <h1>Test Dashboard</h1>
        <div className="action-buttons">
          <button onClick={fetchTestData} disabled={refreshing}>
            🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={runTests} disabled={loading}>
            ▶️ {loading ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {testRun ? (
        <>
          {/* Test Statistics */}
          <div className="stats-section">
            <h2>Test Results</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-number">{testRun.total_tests}</div>
                <div className="stat-label">Total Tests</div>
              </div>

              <div className="stat-card passed">
                <div className="stat-number">{testRun.passed_tests}</div>
                <div className="stat-label">Passed</div>
                <div className="stat-percentage">
                  {((testRun.passed_tests / testRun.total_tests) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="stat-card failed">
                <div className="stat-number">{testRun.failed_tests}</div>
                <div className="stat-label">Failed</div>
                <div className="stat-percentage">
                  {((testRun.failed_tests / testRun.total_tests) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="stat-card skipped">
                <div className="stat-number">{testRun.skipped_tests}</div>
                <div className="stat-label">Skipped</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-passed"
                  style={{
                    width: `${(testRun.passed_tests / testRun.total_tests) * 100}%`
                  }}
                />
                <div
                  className="progress-failed"
                  style={{
                    width: `${(testRun.failed_tests / testRun.total_tests) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Run Info */}
            <div className="run-info">
              <div>
                <strong>Status:</strong>{' '}
                <span className={`badge ${testRun.status}`}>{testRun.status}</span>
              </div>
              <div>
                <strong>Duration:</strong> {(testRun.duration_ms / 1000).toFixed(1)}s
              </div>
              <div>
                <strong>Browser:</strong> {testRun.browser}
              </div>
              <div>
                <strong>Run Time:</strong>{' '}
                {new Date(testRun.start_time).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Report Viewer */}
          {testRun.reportPath && (
            <div className="report-section">
              <div className="report-header">
                <h2>Test Report</h2>
                <button
                  onClick={() => window.open(testRun.reportUrl, '_blank')}
                  className="open-tab-btn"
                >
                  📱 Open in New Tab
                </button>
              </div>

              <div className="report-iframe-container">
                <iframe
                  src={`http://localhost:5000/api/v1/executions/run/${testRun.id}/view-report`}
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
        </>
      ) : (
        <div className="no-tests">
          <h3>No Test Runs Yet</h3>
          <p>Click "Run Tests" to execute your test suite.</p>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;
```

---

## Database Storage

All test statistics are automatically saved to the `test_runs` table:

```sql
SELECT
  id,
  project_id,
  run_name,
  status,
  total_tests,
  passed_tests,
  failed_tests,
  skipped_tests,
  duration_ms,
  browser,
  start_time,
  end_time
FROM test_runs
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Tracking Test History

Get all test runs for trend analysis:

```jsx
const [testHistory, setTestHistory] = useState([]);

useEffect(() => {
  async function fetchHistory() {
    const { data } = await axios.get(
      `http://localhost:5000/api/v1/executions/project/${projectId}/runs?limit=10`
    );
    setTestHistory(data.data);
  }
  fetchHistory();
}, [projectId]);

// Display as chart or table
return (
  <div className="test-history">
    <h3>Test Run History</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {testHistory.map(run => (
          <tr key={run.id}>
            <td>{new Date(run.start_time).toLocaleDateString()}</td>
            <td>{run.total_tests}</td>
            <td className="passed">{run.passed_tests}</td>
            <td className="failed">{run.failed_tests}</td>
            <td>{(run.duration_ms / 1000).toFixed(1)}s</td>
            <td>
              <span className={`badge ${run.status}`}>{run.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

---

## Real-time Updates with WebSocket (Optional)

```jsx
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

useEffect(() => {
  // Join execution room
  socket.emit('join-execution', projectId);

  // Listen for test updates
  socket.on('test-progress', (data) => {
    console.log('Test progress:', data);
    // Update UI with real-time progress
  });

  return () => {
    socket.off('test-progress');
  };
}, [projectId]);
```

---

## Summary

### What You Get:
✅ **Total test count** - Accurately captured from test output
✅ **Passed tests** - Green checkmarks counted
✅ **Failed tests** - Red X marks counted
✅ **Skipped tests** - Skipped indicators counted
✅ **Duration** - Time taken for test execution
✅ **Status** - completed/failed based on results
✅ **Report Path** - Link to HTML report
✅ **Report URL** - Direct URL for viewing

### What's Tracked:
✅ Saved in database (test_runs table)
✅ Historical data for trends
✅ Test run metadata (browser, environment)
✅ Timestamps for start and end
✅ Duration in milliseconds

### How to Use:
1. Run tests via API
2. Fetch latest report
3. Display statistics in UI
4. Embed report in iframe
5. Track history over time

All data persists in the database for analytics and tracking!
