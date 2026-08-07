'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Send, Settings, Sparkles } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/leads', label: 'Lead CRM', icon: <Users size={18} /> },
    { href: '/outreach', label: 'Social DM Hub', icon: <Send size={18} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <Sparkles size={20} />
        </div>
        <span className={styles.logoText}>LeadGen AI</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <span>LeadGen System v1.0</span>
      </div>
    </aside>
  );
};
