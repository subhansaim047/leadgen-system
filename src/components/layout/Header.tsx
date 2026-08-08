'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Download, RefreshCw, Menu, Sparkles } from 'lucide-react';
import { useMobileNav } from '@/components/layout/MobileNavContext';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onRefresh, onExport }) => {
  const { toggleMobileNav } = useMobileNav();

  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <button className={styles.menuToggleBtn} onClick={toggleMobileNav} aria-label="Toggle Navigation">
          <Menu size={20} />
        </button>
        <div className={styles.mobileBrand}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>LeadGen Studio</span>
        </div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.actions}>
        {onRefresh && (
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={onRefresh}>
            <span className={styles.btnLabel}>Refresh</span>
          </Button>
        )}
        {onExport && (
          <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={onExport}>
            <span className={styles.btnLabel}>Export (.xlsx)</span>
          </Button>
        )}
      </div>
    </header>
  );
};
