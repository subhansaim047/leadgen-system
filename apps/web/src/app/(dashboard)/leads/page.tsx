'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { fetchLeads, fetchLeadDetail, triggerAudit, sendEmail, updateLeadStatus } from '@/lib/api';
import { Lead } from '@/types';
import { Search, Filter, Eye, Send, Play, ExternalLink, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchLeads({
        page,
        per_page: 20,
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
    loadLeads();
  };

  const handleSendEmail = async (leadId: string) => {
    await sendEmail(leadId);
    alert('Email queued for dispatch!');
    loadLeads();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'outreach_ready':
        return <Badge variant="info">Ready</Badge>;
      case 'contacted':
        return <Badge variant="warning">Contacted</Badge>;
      case 'replied':
        return <Badge variant="success">Replied</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <>
      <Header
        title="Lead CRM Workspace"
        onRefresh={loadLeads}
        onExport={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/export/csv`)}
      />

      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search business name..."
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
          <option value="outreach_ready">Outreach Ready</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
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
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className={styles.businessName}>{lead.business_name}</div>
                    <div className={styles.businessSub}>{lead.phone || 'No phone'}</div>
                  </td>
                  <td>
                    <div>{lead.city}, {lead.country}</div>
                    <div className={styles.businessSub}>{lead.niche}</div>
                  </td>
                  <td>{getWebsiteBadge(lead.website_type)}</td>
                  <td>
                    <span style={{ fontWeight: '700', color: lead.opportunity_score > 60 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                      {lead.opportunity_score}/100
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
                      {lead.email && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={() => handleSendEmail(lead.id)}
                        >
                          Email
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>Total: {total} leads</span>
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
            disabled={leads.length < 20}
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
              {selectedLead.email && (
                <Button variant="primary" icon={<Send size={14} />} onClick={() => handleSendEmail(selectedLead.id)}>
                  Send AI Email
                </Button>
              )}
            </>
          }
        >
          <div className={styles.detailGrid}>
            <div>
              <div className={styles.sectionHeader}>Business Overview</div>
              <p><strong>Niche:</strong> {selectedLead.niche}</p>
              <p><strong>Location:</strong> {selectedLead.city}, {selectedLead.country}</p>
              <p><strong>Phone:</strong> {selectedLead.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedLead.email || 'Not found'} ({selectedLead.email_status})</p>
              <p><strong>Rating:</strong> {selectedLead.google_rating} ★ ({selectedLead.review_count} reviews)</p>
            </div>

            <div>
              <div className={styles.sectionHeader}>Website Audit</div>
              <p><strong>Type:</strong> {selectedLead.website_type}</p>
              <p><strong>SSL:</strong> {selectedLead.audit?.ssl_valid ? 'Valid' : 'Missing'}</p>
              <p><strong>Mobile:</strong> {selectedLead.audit?.is_mobile_responsive ? 'Yes' : 'No'}</p>
              <p><strong>Load Time:</strong> {selectedLead.audit?.load_time_ms ? `${selectedLead.audit.load_time_ms}ms` : 'N/A'}</p>
              <p><strong>Summary:</strong> {selectedLead.audit?.audit_summary}</p>
            </div>
          </div>

          {selectedLead.ai_analysis && (
            <div style={{ marginTop: '20px' }}>
              <div className={styles.sectionHeader}>AI Generated Pitch</div>
              <p><strong>Subject:</strong> {selectedLead.ai_analysis.email_subject}</p>
              <div className={styles.copyBox}>{selectedLead.ai_analysis.email_body}</div>
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? <Check size={14} color="var(--accent-success)" /> : undefined}
                onClick={() => copyText(selectedLead.ai_analysis?.email_body || '')}
              >
                {copied ? 'Copied!' : 'Copy Body Text'}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
