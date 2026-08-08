'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Send, Settings, Sparkles, X } from 'lucide-react';
import { useMobileNav } from '@/components/layout/MobileNavContext';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isMobileOpen, closeMobileNav } = useMobileNav();

  const navItems = [
    { href: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/leads', label: 'Lead CRM', icon: <Users size={18} /> },
    { href: '/outreach', label: 'Social DM Hub', icon: <Send size={18} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Backdrop for Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div className={styles.backdrop} onClick={closeMobileNav} />
      )}

      {/* Main Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Sparkles size={18} />
          </div>
          <span className={styles.logoText}>LeadGen Studio</span>
          <button className={styles.closeBtn} onClick={closeMobileNav} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.mobileBottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileNav}
              className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
