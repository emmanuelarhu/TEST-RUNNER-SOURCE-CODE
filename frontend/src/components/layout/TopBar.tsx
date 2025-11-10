import { useNavigate } from 'react-router-dom';
import ProjectSelector from '../common/ProjectSelector';
import authService from '../../services/auth.service';
import styles from './TopBar.module.css';

const TopBar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className={styles.topBar}>
      <ProjectSelector />
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" className={styles.searchInput} placeholder="Search tests, suites, or results..." />
      </div>
      <div className={styles.topBarActions}>
        <button className={styles.iconButton}><span>🔔</span><span className={styles.notificationBadge}></span></button>
        <button className={styles.iconButton}><span>⚙️</span></button>
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.username || 'User'}</span>
            <span className={styles.userRole}>{user?.role || 'user'}</span>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
