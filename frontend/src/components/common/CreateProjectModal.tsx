import { useState } from 'react';
import api from '../../services/api.service';
import styles from './CreateProjectModal.module.css';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repoUrl: '',
    branch: 'main'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCloneStatus(null);

    try {
      // Step 1: Create the project
      setCloneStatus('Creating project...');
      const projectResponse = await api.projects.create({
        name: formData.name,
        description: formData.description,
        base_url: formData.repoUrl || undefined
      });

      const newProject = projectResponse.data;

      // Step 2: Clone repository if URL provided
      if (formData.repoUrl) {
        setCloneStatus('Cloning repository... This may take a few minutes.');
        await api.executions.cloneRepository(newProject.id, {
          repoUrl: formData.repoUrl,
          branch: formData.branch || 'main'
        });
        setCloneStatus('Repository cloned successfully!');
      }

      // Success - close modal and refresh
      setTimeout(() => {
        setFormData({ name: '', description: '', repoUrl: '', branch: 'main' });
        setCloneStatus(null);
        onProjectCreated();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Error creating project:', err);
      // Normalize error to extract a meaningful message without using `any`
      let message = 'Failed to create project';
      if (typeof err === 'string') {
        message = err;
      } else if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === 'object' && err !== null) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        message = e.response?.data?.message || e.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Project</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter project name"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Enter project description (optional)"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.separator}>
            <span className={styles.separatorText}>Azure DevOps / Git Integration</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Repository URL</label>
            <input
              type="text"
              name="repoUrl"
              value={formData.repoUrl}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://token@dev.azure.com/org/project/_git/repo"
              disabled={loading}
            />
            <div className={styles.hint}>
              Supports GitHub, GitLab, and Azure DevOps. For private repos, include PAT in URL.
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Branch</label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className={styles.input}
              placeholder="main"
              disabled={loading}
            />
          </div>

          {cloneStatus && (
            <div className={styles.statusMessage}>
              <div className={styles.statusIcon}>⏳</div>
              {cloneStatus}
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠️</div>
              {error}
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !formData.name}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
