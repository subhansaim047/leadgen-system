'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card/Card';
import { fetchStats } from '@/lib/api';
import { OverviewStats } from '@/types';
import { Users, Globe, AlertTriangle, Send, MessageSquare, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Header title="Dashboard Overview" onRefresh={loadData} />
      <div className={styles.grid}>
        <Card
          title="Total Leads Found"
          value={loading ? '...' : stats?.total_leads || 0}
          subtext="Discovered across all niches"
          icon={<Users size={20} color="var(--accent-primary)" />}
        />
        <Card
          title="No Website Opportunities"
          value={loading ? '...' : stats?.no_website || 0}
          subtext="High priority target leads"
          icon={<Globe size={20} color="var(--accent-danger)" />}
        />
        <Card
          title="Outdated Websites"
          value={loading ? '...' : stats?.outdated_website || 0}
          subtext="Redesign & SEO prospects"
          icon={<AlertTriangle size={20} color="var(--accent-warning)" />}
        />
        <Card
          title="Contacted"
          value={loading ? '...' : stats?.by_status?.contacted || 0}
          subtext="Emails / DMs dispatched"
          icon={<Send size={20} color="var(--accent-secondary)" />}
        />
        <Card
          title="Replies Received"
          value={loading ? '...' : stats?.by_status?.replied || 0}
          subtext="Active conversations"
          icon={<MessageSquare size={20} color="var(--accent-success)" />}
        />
      </div>

      <div className={styles.chartGrid}>
        <div>
          <h2 className={styles.sectionTitle}>Conversion Funnel</h2>
          <div className={styles.funnelList}>
            {Object.entries(stats?.by_status || {}).map(([key, val]) => (
              <div key={key} className={styles.funnelItem}>
                <span className={styles.funnelLabel}>{key.replace('_', ' ')}</span>
                <span className={styles.funnelValue}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className={styles.sectionTitle}>System Performance</h2>
          <Card title="Avg Response Rate" value="8.4%" subtext="Industry avg is ~2%">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--accent-success)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>+2.1% this week</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
