# Report Viewing in Portal Guide

## Overview
The test runner now supports viewing Playwright HTML reports directly within the portal using iframes. No need to open reports in new tabs!

---

## Backend Improvements

### 1. **Fixed Browser Installation** ✅
- **Issue:** Browsers were being installed locally in each project's `node_modules`
- **Fix:**
  - Removed `PLAYWRIGHT_BROWSERS_PATH=0` environment variable
  - Install browsers with `--with-deps` flag
  - Install specific browser: `chromium`, `firefox`, or `webkit`
  - Longer timeout (10 minutes) for browser downloads

### 2. **CORS Headers for Reports** ✅
- Added proper CORS headers to `/reports` endpoint
- Allows embedding in iframes from same origin
- Set `X-Frame-Options: SAMEORIGIN`
- Set `Content-Security-Policy` to allow localhost origins

### 3. **New View Report Endpoint** ✅
```http
GET /api/v1/executions/run/{runId}/view-report
```

Returns HTML report directly with proper headers for iframe embedding.

---

## Frontend Integration

### Method 1: Using Iframe (Recommended)

```jsx
import React from 'react';

function TestReportViewer({ runId }) {
  const reportUrl = `http://localhost:5000/api/v1/executions/run/${runId}/view-report`;

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <iframe
        src={reportUrl}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
        title="Test Report"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}

export default TestReportViewer;
```

### Method 2: Direct Link

```jsx
function TestReportLink({ runId }) {
  const reportUrl = `http://localhost:5000/api/v1/executions/run/${runId}/view-report`;

  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary"
    >
      📋 View Full Report
    </a>
  );
}
```

### Method 3: Static Report Files

```jsx
function TestReportDirect({ reportPath }) {
  // reportPath comes from API like: /reports/report-abc-123/index.html
  const reportUrl = `http://localhost:5000${reportPath}`;

  return (
    <iframe
      src={reportUrl}
      style={{ width: '100%', height: '800px', border: 'none' }}
      title="Test Report"
    />
  );
}
```

---

## API Endpoints for Reports

### 1. Get Latest Report with URL
```http
GET /api/v1/executions/project/{projectId}/latest-report
```

**Response:**
```json
{
  "success": true,
  "message": "Latest test run retrieved successfully",
  "data": {
    "projectName": "My Project",
    "testRun": {
      "id": "abc-123-def",
      "status": "completed",
      "total_tests": 23,
      "passed_tests": 20,
      "failed_tests": 3,
      "reportPath": "/reports/report-abc-123-def/index.html",
      "reportUrl": "http://localhost:5000/reports/report-abc-123-def/index.html"
    }
  }
}
```

**Frontend Usage:**
```jsx
const { data } = await fetch(`/api/v1/executions/project/${projectId}/latest-report`);
const reportUrl = data.testRun.reportUrl;

// Embed in iframe
<iframe src={reportUrl} ... />
```

### 2. View Report Directly
```http
GET /api/v1/executions/run/{runId}/view-report
```

**Returns:** HTML content that can be embedded in iframe

**Frontend Usage:**
```jsx
<iframe
  src={`http://localhost:5000/api/v1/executions/run/${runId}/view-report`}
  style={{ width: '100%', height: '800px' }}
/>
```

### 3. Get Report Metadata
```http
GET /api/v1/executions/run/{runId}/report
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportPath": "/reports/report-abc-123/index.html",
    "reportUrl": "http://localhost:5000/reports/report-abc-123/index.html"
  }
}
```

---

## Complete Example: Project Detail Page

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProjectDetailPage({ projectId }) {
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestReport();
  }, [projectId]);

  const fetchLatestReport = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/v1/executions/project/${projectId}/latest-report`
      );
      setLatestRun(data.data.testRun);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!latestRun) {
    return (
      <div className="alert alert-info">
        <h4>No Test Runs Yet</h4>
        <p>Run tests to generate a report.</p>
      </div>
    );
  }

  return (
    <div className="project-detail">
      <h1>Project Test Results</h1>

      {/* Test Statistics */}
      <div className="test-stats">
        <div className="stat-card">
          <h3>{latestRun.total_tests}</h3>
          <p>Total Tests</p>
        </div>
        <div className="stat-card passed">
          <h3>{latestRun.passed_tests}</h3>
          <p>Passed</p>
        </div>
        <div className="stat-card failed">
          <h3>{latestRun.failed_tests}</h3>
          <p>Failed</p>
        </div>
        <div className="stat-card skipped">
          <h3>{latestRun.skipped_tests}</h3>
          <p>Skipped</p>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="pass-rate">
        <h3>Pass Rate: {Math.round((latestRun.passed_tests / latestRun.total_tests) * 100)}%</h3>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${(latestRun.passed_tests / latestRun.total_tests) * 100}%`,
              backgroundColor: latestRun.failed_tests > 0 ? '#e74c3c' : '#27ae60'
            }}
          />
        </div>
      </div>

      {/* Report Viewer */}
      <div className="report-viewer">
        <h2>Test Report</h2>
        <div className="report-actions">
          <button onClick={fetchLatestReport} className="btn btn-secondary">
            🔄 Refresh Report
          </button>
          <a
            href={latestRun.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            📱 Open in New Tab
          </a>
        </div>

        {/* Embedded Report */}
        <div className="report-iframe-container">
          <iframe
            src={`http://localhost:5000/api/v1/executions/run/${latestRun.id}/view-report`}
            style={{
              width: '100%',
              height: '800px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginTop: '20px'
            }}
            title="Playwright Test Report"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
```

---

## CSS Styling Example

```css
.project-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.test-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat-card {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  font-size: 36px;
  margin: 0 0 10px 0;
  color: #333;
}

.stat-card.passed h3 {
  color: #27ae60;
}

.stat-card.failed h3 {
  color: #e74c3c;
}

.stat-card.skipped h3 {
  color: #f39c12;
}

.pass-rate {
  margin: 30px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #ecf0f1;
  border-radius: 15px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.report-viewer {
  margin-top: 30px;
}

.report-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.report-iframe-container {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

---

## Security Considerations

### Iframe Sandbox Attributes

```jsx
<iframe
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
  ...
/>
```

**Permissions:**
- `allow-same-origin` - Allows accessing parent page (required for CORS)
- `allow-scripts` - Allows JavaScript execution (needed for Playwright reports)
- `allow-popups` - Allows opening links in new tabs
- `allow-forms` - Allows form submissions (if any in reports)

### CORS Headers Set by Backend

```javascript
Access-Control-Allow-Origin: *
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self' http://localhost:* https://localhost:*
```

---

## Error Handling

### Handle Missing Reports

```jsx
function ReportViewer({ runId }) {
  const [error, setError] = useState(null);

  const reportUrl = `http://localhost:5000/api/v1/executions/run/${runId}/view-report`;

  return (
    <div>
      {error ? (
        <div className="alert alert-danger">
          <h4>Failed to Load Report</h4>
          <p>{error}</p>
        </div>
      ) : (
        <iframe
          src={reportUrl}
          onError={() => setError('Report could not be loaded')}
          style={{ width: '100%', height: '800px' }}
          title="Test Report"
        />
      )}
    </div>
  );
}
```

### Handle Loading State

```jsx
function ReportViewer({ runId }) {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <div className="spinner">Loading report...</div>
        </div>
      )}

      <iframe
        src={`http://localhost:5000/api/v1/executions/run/${runId}/view-report`}
        onLoad={() => setLoading(false)}
        style={{
          width: '100%',
          height: '800px',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
        title="Test Report"
      />
    </div>
  );
}
```

---

## Browser Compatibility

### Supported Browsers
✅ Chrome/Chromium (recommended)
✅ Firefox
✅ Safari
✅ Edge

### Mobile Support
- Reports are responsive
- May require horizontal scrolling on small screens
- Best viewed on tablets or desktops

---

## Troubleshooting

### Issue: Iframe Shows Blank Page
**Solution:** Check browser console for CORS errors. Ensure backend is running and CORS headers are set correctly.

### Issue: Report Not Found
**Solution:** Verify test run has completed and report was generated. Check `/reports` directory on backend.

### Issue: Iframe Too Small
**Solution:** Adjust iframe height using CSS or JavaScript:
```jsx
<iframe style={{ height: 'calc(100vh - 200px)' }} ... />
```

### Issue: Report Doesn't Update
**Solution:** Add timestamp to iframe src to force reload:
```jsx
const reportUrl = `${baseUrl}?t=${Date.now()}`;
```

---

## Performance Tips

### 1. Lazy Load Reports
```jsx
import { lazy, Suspense } from 'react';

const ReportViewer = lazy(() => import('./ReportViewer'));

function ProjectPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <ReportViewer runId={runId} />
    </Suspense>
  );
}
```

### 2. Cache Report URLs
```jsx
const [reportCache, setReportCache] = useState({});

const getReportUrl = (runId) => {
  if (reportCache[runId]) {
    return reportCache[runId];
  }

  const url = `http://localhost:5000/api/v1/executions/run/${runId}/view-report`;
  setReportCache({ ...reportCache, [runId]: url });
  return url;
};
```

---

## Next Steps

1. ✅ Integrate report viewer into project detail page
2. ✅ Add loading states and error handling
3. ✅ Style iframe container
4. ✅ Add "Open in New Tab" button
5. ✅ Display test statistics above report
6. ✅ Add refresh button to reload latest report

---

## Questions?

- Backend endpoints: Check Swagger UI at `http://localhost:5000/api-docs`
- Frontend examples: See this guide
- Issues: Check browser console and backend logs
