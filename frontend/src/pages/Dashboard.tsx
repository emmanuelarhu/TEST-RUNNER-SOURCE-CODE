import { useState } from 'react';
import Loading from '../components/common/Loading';
import CreateProjectModal from '../components/common/CreateProjectModal';
import ProjectCard from '../components/common/ProjectCard';
import { useProject } from '../contexts/ProjectContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { loading: projectsLoading, projects: allProjects, refreshProjects } = useProject();
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const handleRunProject = async (projectId: string) => {
    // TODO: Implement test execution
    console.log('Running tests for project:', projectId);
    // This will trigger the test runner API endpoint
    // For now, just log the action
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
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <span>Home</span>
          <span>›</span>
          <span>Dashboard</span>
        </div>
        <h1 className={styles.pageTitle}>My Projects</h1>
        <p className={styles.pageSubtitle}>
          View and manage your test automation projects
        </p>
      </div>

      <div className={styles.projectsGrid}>
        {allProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onRun={handleRunProject}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
