import { NavLink } from 'react-router-dom';
import authService from '../../services/auth.service';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const user = authService.getUser();

  // Get user initials for avatar
  const getInitials = (name?: string, username?: string) => {
    if (name) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return username ? username.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>🧪</div>
          <div>
            <div className={styles.brandName}>Test Runner</div>
            <div className={styles.brandTagline}>Playwright Integration</div>
          </div>
        </div>
      </div>
      <nav className={styles.sidebarNav}>
        <div className={styles.navSection}>
          <div className={styles.navSectionTitle}>Main</div>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>📊</span>Dashboard
          </NavLink>
          <NavLink to="/suites" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>📁</span>Test Suites
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>📈</span>Test Results
          </NavLink>
        </div>
        <div className={styles.navSection}>
          <div className={styles.navSectionTitle}>Settings</div>
          <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>⚙️</span>Settings
          </NavLink>
        </div>
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {getInitials(user?.full_name, user?.username)}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.full_name || user?.username || 'User'}</div>
            <div className={styles.userRole}>{user?.role || 'user'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
