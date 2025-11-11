import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import authService from '../services/auth.service';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import EditProfileModal from '../components/common/EditProfileModal';
import { useProject } from '../contexts/ProjectContext';
import type { User } from '../types';
import styles from './Settings.module.css';

const Settings = () => {
  const navigate = useNavigate();
  const { currentProject, projects, setCurrentProject, refreshProjects } = useProject();
  const [activeTab, setActiveTab] = useState<'profile' | 'project' | 'users'>('profile');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(authService.getUser());

  const isAdmin = currentUserData?.role === 'admin';

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.users.getAll();
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.projects.delete(projectId);
      setSuccess('Project deleted successfully');
      await refreshProjects();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.users.delete(userId);
      setSuccess('User deleted successfully');
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setCurrentUserData(updatedUser);
    authService.setUser(updatedUser);
    setSuccess('Profile updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.sectionTitle}>Profile Information</h2>
        <Button variant="primary" onClick={() => setIsEditProfileModalOpen(true)}>
          ✏️ Edit Profile
        </Button>
      </div>
      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          {currentUserData?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
           currentUserData?.username?.substring(0, 2).toUpperCase() || 'U'}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>{currentUserData?.full_name || currentUserData?.username}</div>
          <div className={styles.profileEmail}>{currentUserData?.email}</div>
          <div className={styles.profileRole}>
            <span className={styles.roleBadge}>{currentUserData?.role?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Username</div>
          <div className={styles.infoValue}>{currentUserData?.username}</div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Email</div>
          <div className={styles.infoValue}>{currentUserData?.email}</div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Role</div>
          <div className={styles.infoValue}>{currentUserData?.role}</div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Account Status</div>
          <div className={styles.infoValue}>
            {currentUserData?.is_active ? (
              <span className={styles.statusActive}>Active</span>
            ) : (
              <span className={styles.statusInactive}>Inactive</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoLabel}>User ID</div>
        <div className={styles.infoValue} style={{ fontFamily: 'monospace', fontSize: '0.813rem' }}>
          {currentUserData?.id}
        </div>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoLabel}>Member Since</div>
        <div className={styles.infoValue}>
          {currentUserData?.created_at ? new Date(currentUserData.created_at).toLocaleDateString() : 'N/A'}
        </div>
      </div>
    </div>
  );

  const renderProjectTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.sectionTitle}>Project Management</h2>
        <Button variant="primary" onClick={() => navigate('/')}>
          <span>+</span>
          Create New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>📁</div>
          <div className={styles.emptyTitle}>No Projects</div>
          <div className={styles.emptyDescription}>Create your first project to get started</div>
        </div>
      ) : (
        <div className={styles.projectsList}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <div className={styles.projectIcon}>📁</div>
                <div className={styles.projectInfo}>
                  <div className={styles.projectName}>{project.name}</div>
                  <div className={styles.projectDescription}>
                    {project.description || 'No description'}
                  </div>
                  {project.base_url && (
                    <div className={styles.projectUrl}>🔗 {project.base_url}</div>
                  )}
                </div>
              </div>
              <div className={styles.projectMeta}>
                <span className={styles.metaItem}>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.projectActions}>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentProject(project)}
                  disabled={currentProject?.id === project.id}
                >
                  {currentProject?.id === project.id ? 'Current' : 'Switch To'}
                </Button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUsersTab = () => {
    if (!isAdmin) {
      return (
        <div className={styles.tabContent}>
          <div className={styles.noAccess}>
            <div className={styles.noAccessIcon}>🔒</div>
            <h2>Access Denied</h2>
            <p>You need administrator privileges to view this section.</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return <Loading message="Loading users..." subtitle="Fetching user data" />;
    }

    return (
      <div className={styles.tabContent}>
        <h2 className={styles.sectionTitle}>User Management</h2>
        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>👥</div>
            <div className={styles.emptyTitle}>No Users</div>
          </div>
        ) : (
          <div className={styles.usersTable}>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.full_name || '-'}</td>
                    <td>
                      <span className={styles.roleBadge}>{user.role}</span>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span className={styles.statusActive}>Active</span>
                      ) : (
                        <span className={styles.statusInactive}>Inactive</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      {user.id !== currentUserData?.id && (
                        <button
                          className={styles.tableDeleteButton}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <a onClick={() => navigate('/')}>Home</a>
          <span>›</span>
          <span>Settings</span>
        </div>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account, projects, and application settings</p>
      </div>

      {error && (
        <div className={styles.alert} style={{ background: 'var(--error-50)', borderColor: 'var(--error-200)', color: 'var(--error-700)' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className={styles.alert} style={{ background: 'var(--success-50)', borderColor: 'var(--success-200)', color: 'var(--success-700)' }}>
          ✓ {success}
        </div>
      )}

      <div className={styles.settingsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span>👤</span>
            Profile
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'project' ? styles.active : ''}`}
            onClick={() => setActiveTab('project')}
          >
            <span>📁</span>
            Projects
          </button>
          {isAdmin && (
            <button
              className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span>👥</span>
              Users
            </button>
          )}
        </div>

        <div className={styles.tabsContent}>
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'project' && renderProjectTab()}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>

      {currentUserData && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          user={currentUserData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default Settings;
