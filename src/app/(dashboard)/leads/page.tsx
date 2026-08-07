'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { fetchLeads, fetchLeadDetail, triggerAudit, sendEmail, updateLeadStatus } from '@/lib/api';
import { Lead } from '@/types';
import { Search, Filter, Eye, Send, Play, ExternalLink, Check, Copy } from 'lucide-react';
import styles from './page.module.css';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState('');

  // Selected Lead Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchLeads({
        page,
        per_page: 50,
        search,
        status: statusFilter,
        website_type: websiteFilter,
      });
      setLeads(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [page, statusFilter, websiteFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLeads();
  };

  const handleOpenDetail = async (leadId: string) => {
    try {
      const detail = await fetchLeadDetail(leadId);
      setSelectedLead(detail);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAudit = async (leadId: string) => {
    await triggerAudit(leadId);
    alert('Audit re-run completed!');
    loadLeads();
  };

  const handleSendEmail = async (leadId: string) => {
    await sendEmail(leadId);
    alert('✅ Email outreach queued for dispatch!');
    loadLeads();
  };

  const copyToClipboard = (text: string, type: 'subject' | 'body' | 'dm') => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else if (type === 'body') {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } else if (type === 'dm') {
      setCopiedDm(true);
      setTimeout(() => setCopiedDm(false), 2000);
    }
  };

  const getWebsiteBadge = (type: string) => {
    switch (type) {
      case 'none':
        return <Badge variant="danger">No Website</Badge>;
      case 'broken':
        return <Badge variant="danger">Broken</Badge>;
      case 'outdated':
        return <Badge variant="warning">Outdated</Badge>;
      case 'modern':
        return <Badge variant="success">Modern</Badge>;
      default:
        return <Badge variant="default">No Website</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="info">New</Badge>;
      case 'outreach_ready':
        return <Badge variant="info">Ready</Badge>;
      case 'contacted':
        return <Badge variant="warning">Contacted</Badge>;
      case 'replied':
        return <Badge variant="success">Replied</Badge>;
      case 'converted':
        return <Badge variant="success">Converted</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <>
      <Header
        title="Lead CRM Workspace"
        onRefresh={loadLeads}
        onExport={() => window.open('/api/export/csv', '_blank')}
      />

      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search business name, city, niche..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" icon={<Search size={14} />}>
            Search
          </Button>
        </form>

        <select
          className={styles.selectInput}
          value={websiteFilter}
          onChange={(e) => setWebsiteFilter(e.target.value)}
        >
          <option value="">All Website Types</option>
          <option value="none">No Website</option>
          <option value="outdated">Outdated Website</option>
          <option value="broken">Broken Website</option>
          <option value="modern">Modern Website</option>
        </select>

        <select
          className={styles.selectInput}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Location / Niche</th>
              <th>Website Status</th>
              <th>Opp. Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                  No leads found. Trigger a job from Settings to generate leads!
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const oppScore = lead.confidence_score || lead.opportunity_score || 85;
                return (
                  <tr key={lead.id}>
                    <td>
                      <div className={styles.businessName}>{lead.business_name}</div>
                      <div className={styles.businessSub}>{lead.phone || 'Phone on Maps'}</div>
                    </td>
                    <td>
                      <div>{lead.city}, {lead.country}</div>
                      <div className={styles.businessSub}>{lead.niche}</div>
                    </td>
                    <td>{getWebsiteBadge(lead.website_type)}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: oppScore > 75 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                        {oppScore}/100
                      </span>
                    </td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={14} />}
                          onClick={() => handleOpenDetail(lead.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Play size={14} />}
                          onClick={() => handleTriggerAudit(lead.id)}
                        >
                          Audit
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={() => handleSendEmail(lead.id)}
                        >
                          Email
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>Total: <strong>{total}</strong> leads in CRM</span>
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span style={{ margin: '0 12px' }}>Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={leads.length < 50}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedLead.business_name}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" icon={<Send size={14} />} onClick={() => handleSendEmail(selectedLead.id)}>
                Send AI Email Pitch
              </Button>
            </>
          }
        >
          <div className={styles.detailGrid}>
            <div>
              <div className={styles.sectionHeader}>Business Overview</div>
              <p><strong>Niche:</strong> {selectedLead.niche}</p>
              <p><strong>Location:</strong> {selectedLead.city}, {selectedLead.country}</p>
              <p><strong>Phone:</strong> {selectedLead.phone || 'Available on Maps'}</p>
              <p><strong>Google Rating:</strong> {selectedLead.google_rating} ★ ({selectedLead.review_count} reviews)</p>
              {selectedLead.google_maps_url && (
                <p>
                  <a href={selectedLead.google_maps_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Open Google Maps Profile <ExternalLink size={12} />
                  </a>
                </p>
              )}
            </div>

            <div>
              <div className={styles.sectionHeader}>Website Audit</div>
              <p><strong>Status:</strong> {selectedLead.website_type === 'none' ? 'No Website (High Opportunity)' : selectedLead.website_type}</p>
              <p><strong>SSL:</strong> {selectedLead.audit?.has_ssl ? 'Valid' : 'Missing / Unsecured'}</p>
              <p><strong>Mobile Friendly:</strong> {selectedLead.audit?.is_mobile_friendly ? 'Yes' : 'No (Fails Viewport)'}</p>
              <p><strong>Audit Summary:</strong> {selectedLead.audit?.summary || 'Top opportunity prospect'}</p>
            </div>
          </div>

          {selectedLead.ai_analysis && (
            <div style={{ marginTop: '20px' }}>
              <div className={styles.sectionHeader}>AI Generated Outreach Copy</div>
              <p style={{ marginTop: '8px' }}>
                <strong>Cold Email Subject:</strong> {selectedLead.ai_analysis.cold_email_subject || selectedLead.ai_analysis.email_subject}
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ marginLeft: '8px' }}
                  icon={copiedSubject ? <Check size={12} color="var(--accent-success)" /> : <Copy size={12} />}
                  onClick={() => copyToClipboard(selectedLead.ai_analysis?.cold_email_subject || selectedLead.ai_analysis?.email_subject || '', 'subject')}
                >
                  {copiedSubject ? 'Copied' : 'Copy'}
                </Button>
              </p>

              <div className={styles.copyBox} style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                {selectedLead.ai_analysis.cold_email_body || selectedLead.ai_analysis.email_body}
              </div>
              <Button
                variant="secondary"
                size="sm"
                style={{ marginTop: '8px' }}
                icon={copiedBody ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
                onClick={() => copyToClipboard(selectedLead.ai_analysis?.cold_email_body || selectedLead.ai_analysis?.email_body || '', 'body')}
              >
                {copiedBody ? 'Copied Body Text!' : 'Copy Email Body'}
              </Button>

              <p style={{ marginTop: '16px' }}><strong>1-Click Social DM Text:</strong></p>
              <div className={styles.copyBox} style={{ marginTop: '4px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                {selectedLead.ai_analysis.social_dm_text || selectedLead.ai_analysis.fb_dm_text || selectedLead.ai_analysis.ig_dm_text}
              </div>
              <Button
                variant="secondary"
                size="sm"
                style={{ marginTop: '8px' }}
                icon={copiedDm ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
                onClick={() => copyToClipboard(selectedLead.ai_analysis?.social_dm_text || selectedLead.ai_analysis?.fb_dm_text || '', 'dm')}
              >
                {copiedDm ? 'Copied Social DM!' : 'Copy Social DM'}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
