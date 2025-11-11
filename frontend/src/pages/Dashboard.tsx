import { useState } from 'react';
import Loading from '../components/common/Loading';
import CreateProjectModal from '../components/common/CreateProjectModal';
import ProjectCard from '../components/common/ProjectCard';
import Toast from '../components/common/Toast';
import type { ToastType } from '../components/common/Toast';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api.service';
import styles from './Dashboard.module.css';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

const Dashboard = () => {
  const { loading: projectsLoading, projects: allProjects, refreshProjects } = useProject();
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [runningProjects, setRunningProjects] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const handleRunProject = async (projectId: string) => {
    try {
      // Add project to running set
      setRunningProjects(prev => new Set(prev).add(projectId));

      showToast('Starting test execution...', 'info');

      // Execute project tests
      const response = await api.executions.executeProject(projectId, {
        browser: 'chromium',
        headless: true,
        workers: 4
      });

      console.log('Test execution started:', response.data);

      showToast('Tests started successfully! Check Results page for updates.', 'success');

      // Refresh projects to get updated status
      setTimeout(() => refreshProjects(), 1000);

    } catch (error: any) {
      console.error('Error running tests:', error);
      const errorMsg = error.response?.data?.message || 'Failed to run tests. Please ensure the project has test suites.';
      showToast(errorMsg, 'error');
    } finally {
      // Remove project from running set after a delay
      setTimeout(() => {
        setRunningProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }, 2000);
    }
  };

  // Show loading while projects are being fetched
  if (projectsLoading) return <Loading message="Loading projects..." subtitle="Setting up your workspace" />;

  // Show empty state if no projects exist
  if (allProjects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}>📁</div>
        <div className={styles.emptyTitle}>No Projects Yet</div>
        <div className={styles.emptyDescription}>
          Create your first project to start building test automation
        </div>
        <button className={styles.createButton} onClick={() => setIsCreateProjectModalOpen(true)}>
          <span>+</span>
          Create Your First Project
        </button>
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onProjectCreated={async () => {
            await refreshProjects();
            setIsCreateProjectModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div>
        <div className={styles.pageHeader}>
          <div className={styles.breadcrumb}>
            <span>Home</span>
            <span>›</span>
            <span>Dashboard</span>
          </div>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>My Projects</h1>
              <p className={styles.pageSubtitle}>
                View and manage your test automation projects
              </p>
            </div>
            <button
              className={styles.createButton}
              onClick={() => setIsCreateProjectModalOpen(true)}
            >
              <span>+</span>
              New Project
            </button>
          </div>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📁</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{allProjects.length}</div>
              <div className={styles.statLabel}>Total Projects</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✓</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {allProjects.reduce((acc, p) => acc + (p.last_run?.passed_tests || 0), 0)}
              </div>
              <div className={styles.statLabel}>Tests Passed</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✗</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {allProjects.reduce((acc, p) => acc + (p.last_run?.failed_tests || 0), 0)}
              </div>
              <div className={styles.statLabel}>Tests Failed</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {allProjects.reduce((acc, p) => acc + (p.last_run?.total_tests || 0), 0)}
              </div>
              <div className={styles.statLabel}>Total Tests</div>
            </div>
          </div>
        </div>

        <div className={styles.projectsGrid}>
          {allProjects.map((project) => (
            <div key={project.id} style={{ position: 'relative' }}>
              {runningProjects.has(project.id) && (
                <div className={styles.runningOverlay}>
                  <div className={styles.spinner}></div>
                  <span>Running tests...</span>
                </div>
              )}
              <ProjectCard
                project={project}
                onRun={handleRunProject}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
