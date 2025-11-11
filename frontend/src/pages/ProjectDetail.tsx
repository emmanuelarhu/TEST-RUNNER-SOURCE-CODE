import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import Loading from '../components/common/Loading';
import type { Project, BrowserType } from '../types';
import styles from './ProjectDetail.module.css';

interface TestFile {
  path: string;
  name: string;
  describes: TestDescribe[];
}

interface TestDescribe {
  name: string;
  line: number;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>('chromium');
  const [runningTest, setRunningTest] = useState(false);

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
      const response = await api.projects.getById(projectId);
      setProject(response.data);
      // TODO: Fetch test files from backend
      // For now, using mock data
      setTestFiles([]);
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

  const handleRunTestFile = async (filePath: string) => {
    if (!projectId) return;
    setRunningTest(true);
    try {
      // TODO: Call backend API to run specific test file
      console.log(`Running test file ${filePath} with ${selectedBrowser}`);
    } catch (err: any) {
      console.error('Error running test file:', err);
    } finally {
      setRunningTest(false);
    }
  };

  const handleRunDescribe = async (filePath: string, describeName: string) => {
    if (!projectId) return;
    setRunningTest(true);
    try {
      // TODO: Call backend API to run specific describe block
      console.log(`Running describe "${describeName}" in ${filePath} with ${selectedBrowser}`);
    } catch (err: any) {
      console.error('Error running describe block:', err);
    } finally {
      setRunningTest(false);
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

      <div className={styles.testFilesSection}>
        <h2 className={styles.sectionTitle}>Test Files</h2>
        {testFiles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <div className={styles.emptyText}>No test files found</div>
            <div className={styles.emptySubtext}>
              Clone your repository and add test files to get started
            </div>
          </div>
        ) : (
          <div className={styles.filesList}>
            {testFiles.map((file) => (
              <div key={file.path} className={styles.fileCard}>
                <div className={styles.fileHeader}>
                  <div className={styles.fileName}>
                    <span className={styles.fileIcon}>📄</span>
                    {file.name}
                  </div>
                  <button
                    onClick={() => handleRunTestFile(file.path)}
                    disabled={runningTest}
                    className={styles.runFileButton}
                  >
                    ▶ Run File
                  </button>
                </div>
                {file.describes.length > 0 && (
                  <div className={styles.describesList}>
                    {file.describes.map((describe) => (
                      <div key={`${file.path}-${describe.line}`} className={styles.describeItem}>
                        <span className={styles.describeName}>{describe.name}</span>
                        <button
                          onClick={() => handleRunDescribe(file.path, describe.name)}
                          disabled={runningTest}
                          className={styles.runDescribeButton}
                        >
                          ▶ Run
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
