import { useState } from 'react';
import api from '../../services/api.service';
import styles from './Modal.module.css';

interface CreateTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuiteCreated: () => void;
}

const CreateTestSuiteModal = ({ isOpen, onClose, projectId, onSuiteCreated }: CreateTestSuiteModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.testSuites.create({
        project_id: projectId,
        name: formData.name,
        description: formData.description
      });

      setFormData({ name: '', description: '' });
      onSuiteCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating test suite:', err);
      setError(err.response?.data?.message || 'Failed to create test suite');
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
          <h2 className={styles.modalTitle}>Create Test Suite</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Suite Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., Authentication Tests"
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
              placeholder="Describe what this test suite covers (optional)"
              rows={3}
              disabled={loading}
            />
          </div>

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
              {loading ? 'Creating...' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestSuiteModal;
