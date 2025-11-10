import { useState, useRef, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import styles from './ProjectSelector.module.css';

const ProjectSelector = () => {
  const { currentProject, projects, setCurrentProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (project: typeof currentProject) => {
    if (project) {
      setCurrentProject(project);
      setIsOpen(false);
    }
  };

  if (!currentProject) {
    return <div className={styles.loading}>Loading projects...</div>;
  }

  return (
    <div className={styles.projectSelector} ref={dropdownRef}>
      <button
        className={styles.projectButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={styles.projectIcon}>📁</div>
        <div className={styles.projectInfo}>
          <div className={styles.projectLabel}>Project</div>
          <div className={styles.projectName}>{currentProject.name}</div>
        </div>
        <div className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}>
          ›
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Select Project</span>
            <span className={styles.projectCount}>{projects.length} projects</span>
          </div>
          <div className={styles.dropdownList}>
            {projects.map((project) => (
              <button
                key={project.id}
                className={`${styles.dropdownItem} ${
                  currentProject.id === project.id ? styles.active : ''
                }`}
                onClick={() => handleProjectSelect(project)}
              >
                <div className={styles.itemIcon}>📁</div>
                <div className={styles.itemContent}>
                  <div className={styles.itemName}>{project.name}</div>
                  {project.description && (
                    <div className={styles.itemDescription}>{project.description}</div>
                  )}
                </div>
                {currentProject.id === project.id && (
                  <div className={styles.checkIcon}>✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
