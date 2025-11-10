import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <TopBar />
        <div className={styles.contentArea}>
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
