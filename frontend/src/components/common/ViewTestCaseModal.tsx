import type { TestCase } from '../../types';
import styles from './Modal.module.css';

interface ViewTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ViewTestCaseModal = ({ isOpen, onClose, testCase, onEdit, onDelete }: ViewTestCaseModalProps) => {
  if (!isOpen || !testCase) return null;

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#6b7280'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{testCase.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <div className={styles.viewText}>
              {testCase.description || 'No description provided'}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Test Type</label>
              <div className={styles.badge} style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                {testCase.test_type}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Priority</label>
              <div
                className={styles.badge}
                style={{ background: getPriorityColor(testCase.priority) + '20', color: getPriorityColor(testCase.priority) }}
              >
                {testCase.priority.toUpperCase()}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Test Script</label>
            <div className={`${styles.codeBlock} ${styles.codeEditor}`}>
              <pre>{testCase.test_script}</pre>
            </div>
          </div>

          {testCase.expected_result && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Expected Result</label>
              <div className={styles.viewText}>
                {testCase.expected_result}
              </div>
            </div>
          )}

          {testCase.tags && testCase.tags.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Tags</label>
              <div className={styles.tagsDisplay}>
                {testCase.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Test Case ID</label>
            <div className={styles.viewText} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {testCase.id}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Created At</label>
            <div className={styles.viewText}>
              {new Date(testCase.created_at).toLocaleString()}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button onClick={onClose} className={styles.cancelButton}>
              Close
            </button>
            {onDelete && (
              <button onClick={onDelete} className={styles.deleteButton}>
                Delete Test Case
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit} className={styles.submitButton}>
                Edit Test Case
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTestCaseModal;
