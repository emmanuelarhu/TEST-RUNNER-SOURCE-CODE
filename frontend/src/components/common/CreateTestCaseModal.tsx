import { useState } from 'react';
import api from '../../services/api.service';
import styles from './Modal.module.css';

interface CreateTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suiteId: string;
  onCaseCreated: () => void;
}

const CreateTestCaseModal = ({ isOpen, onClose, suiteId, onCaseCreated }: CreateTestCaseModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_type: 'functional' as 'functional' | 'api' | 'e2e' | 'integration' | 'smoke' | 'regression',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    test_script: '',
    expected_result: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.testCases.create({
        suite_id: suiteId,
        name: formData.name,
        description: formData.description,
        test_type: formData.test_type,
        priority: formData.priority,
        test_script: formData.test_script,
        expected_result: formData.expected_result,
        tags: formData.tags
      });

      setFormData({
        name: '',
        description: '',
        test_type: 'functional',
        priority: 'medium',
        test_script: '',
        expected_result: '',
        tags: []
      });
      onCaseCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating test case:', err);
      setError(err.response?.data?.message || 'Failed to create test case');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Test Case</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Test Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., User login with valid credentials"
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
              placeholder="Describe what this test validates (optional)"
              rows={2}
              disabled={loading}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Test Type <span className={styles.required}>*</span>
              </label>
              <select
                name="test_type"
                value={formData.test_type}
                onChange={handleChange}
                className={styles.select}
                required
                disabled={loading}
              >
                <option value="functional">Functional</option>
                <option value="api">API</option>
                <option value="e2e">End-to-End</option>
                <option value="integration">Integration</option>
                <option value="smoke">Smoke</option>
                <option value="regression">Regression</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Priority <span className={styles.required}>*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={styles.select}
                required
                disabled={loading}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Test Script (Playwright Code) <span className={styles.required}>*</span>
            </label>
            <textarea
              name="test_script"
              value={formData.test_script}
              onChange={handleChange}
              className={`${styles.textarea} ${styles.codeEditor}`}
              placeholder={`await page.goto('/login');
await page.fill('#username', 'test@example.com');
await page.fill('#password', 'password123');
await page.click('button[type="submit"]');
await expect(page).toHaveURL('/dashboard');`}
              required
              disabled={loading}
            />
            <div className={styles.hint}>
              Write your Playwright test code here. Use standard Playwright API.
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Expected Result</label>
            <textarea
              name="expected_result"
              value={formData.expected_result}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Describe the expected outcome (optional)"
              rows={2}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tags</label>
            <div className={styles.tagsInput}>
              {formData.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={styles.tagRemove}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className={styles.tagInput}
                placeholder="Type and press Enter to add tags"
                disabled={loading}
              />
            </div>
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
              disabled={loading || !formData.name || !formData.test_script}
            >
              {loading ? 'Creating...' : 'Create Test Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestCaseModal;
