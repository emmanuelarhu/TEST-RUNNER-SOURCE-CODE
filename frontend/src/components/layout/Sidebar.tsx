import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>TF</div>
          <div>
            <div className={styles.brandName}>TestFlow</div>
            <div className={styles.brandTagline}>QA Automation Platform</div>
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
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>EA</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Emmanuel Arhu</div>
            <div className={styles.userRole}>QA Engineer</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
