'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Download, RefreshCw } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onRefresh, onExport }) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.actions}>
        {onRefresh && (
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={onRefresh}>
            Refresh
          </Button>
        )}
        {onExport && (
          <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={onExport}>
            Export Excel Sheet (.csv)
          </Button>
        )}
      </div>
    </header>
  );
};
