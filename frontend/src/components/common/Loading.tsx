import styles from './Loading.module.css';

interface LoadingProps {
  message?: string;
  subtitle?: string;
}

const Loading = ({ message = 'Loading...', subtitle }: LoadingProps) => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinner}></div>
      <div className={styles.loadingText}>
        <div className={styles.loadingTitle}>{message}</div>
        {subtitle && <div className={styles.loadingSubtitle}>{subtitle}</div>}
      </div>
    </div>
  );
};

export default Loading;
