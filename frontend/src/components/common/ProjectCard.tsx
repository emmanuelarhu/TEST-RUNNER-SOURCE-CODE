import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onRun?: (projectId: string) => void;
}

const ProjectCard = ({ project, onRun }: ProjectCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleRunClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRun) {
      onRun(project.id);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'var(--success-500)';
      case 'failed': return 'var(--error-500)';
      case 'in_progress': return 'var(--primary-500)';
      default: return 'var(--gray-400)';
    }
  };

  const calculateSuccessRate = () => {
    if (!project.last_run) return 0;
    const { total_tests, passed_tests } = project.last_run;
    if (total_tests === 0) return 0;
    return Math.round((passed_tests / total_tests) * 100);
  };

  return (
    <div className={styles.projectCard} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        {project.logo ? (
          <img src={project.logo} alt={project.name} className={styles.projectLogo} />
        ) : (
          <div className={styles.projectLogoPlaceholder}>
            {project.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className={styles.projectInfo}>
          <h3 className={styles.projectName}>{project.name}</h3>
          <p className={styles.projectDescription}>
            {project.description || 'No description'}
          </p>
        </div>
      </div>

      {project.last_run && (
        <div className={styles.metricsSection}>
          <div className={styles.metricRow}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Tests</span>
              <span className={styles.metricValue}>{project.last_run.total_tests}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Passed</span>
              <span className={styles.metricValue} style={{ color: 'var(--success-600)' }}>
                {project.last_run.passed_tests}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Failed</span>
              <span className={styles.metricValue} style={{ color: 'var(--error-600)' }}>
                {project.last_run.failed_tests}
              </span>
            </div>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${calculateSuccessRate()}%`,
                background: calculateSuccessRate() >= 80 ? 'var(--success-500)' :
                           calculateSuccessRate() >= 50 ? 'var(--warning-500)' : 'var(--error-500)'
              }}
            />
          </div>
          <div className={styles.successRate}>
            Success Rate: {calculateSuccessRate()}%
          </div>
        </div>
      )}

      {!project.last_run && (
        <div className={styles.noRunsYet}>
          <span className={styles.noRunsIcon}>🚀</span>
          <span className={styles.noRunsText}>No test runs yet</span>
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.lastRun}>
          {project.last_run ? (
            <>
              <span
                className={styles.statusDot}
                style={{ background: getStatusColor(project.last_run.status) }}
              />
              <span className={styles.lastRunText}>
                Last run: {new Date(project.last_run.run_date).toLocaleDateString()}
              </span>
            </>
          ) : (
            <span className={styles.lastRunText}>Never run</span>
          )}
        </div>
        <button
          className={styles.runButton}
          onClick={handleRunClick}
          title="Run all tests in this project"
        >
          ▶ Run Tests
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
