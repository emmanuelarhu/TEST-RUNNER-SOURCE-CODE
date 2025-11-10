import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconType: 'success' | 'error' | 'warning' | 'info';
  change?: { value: string; isPositive: boolean; };
}

const StatCard = ({ label, value, icon, iconType, change }: StatCardProps) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        <div className={`${styles.statIcon} ${styles[iconType]}`}><span>{icon}</span></div>
      </div>
      <div className={styles.statValue}>{value}</div>
      {change && <div className={`${styles.statChange} ${change.isPositive ? styles.positive : styles.negative}`}><span>{change.isPositive ? '↑' : '↓'}</span><span>{change.value}</span></div>}
    </div>
  );
};

export default StatCard;
