import styles from './TopBar.module.css';

const TopBar = () => {
  return (
    <div className={styles.topBar}>
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" className={styles.searchInput} placeholder="Search tests, suites, or results..." />
      </div>
      <div className={styles.topBarActions}>
        <button className={styles.iconButton}><span>🔔</span><span className={styles.notificationBadge}></span></button>
        <button className={styles.iconButton}><span>⚙️</span></button>
      </div>
    </div>
  );
};

export default TopBar;
