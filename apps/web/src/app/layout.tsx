import React from 'react';
import '@/styles/globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './layout.module.css';

export const metadata = {
  title: 'LeadGen System AI — Lead Generation & Outreach CRM',
  description: 'AI-powered local business lead discovery and outreach automation platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
          <Sidebar />
          <div className={styles.mainContent}>
            <main className={styles.pageBody}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
