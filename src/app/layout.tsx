import React from 'react';
import '@/styles/globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';
import styles from './layout.module.css';

export const metadata = {
  title: 'LeadGen Studio — Enterprise Lead Discovery & Outreach Engine',
  description: 'Real-time commercial business directory harvester and multi-channel outreach platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MobileNavProvider>
          <div className={styles.container}>
            <Sidebar />
            <div className={styles.mainContent}>
              <main className={styles.pageBody}>{children}</main>
            </div>
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
