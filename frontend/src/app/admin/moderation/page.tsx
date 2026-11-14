'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Clock,
  User,
  MessageSquare,
  FileText,
  Users,
  Eye,
  ChevronRight,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ContentReport } from '@/types';
import { cn } from '@/lib/utils';
import { ReportResolutionModal } from '@/components/admin';

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | ''>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [activeReport, setActiveReport] = useState<ContentReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getReports({
        status: statusFilter || undefined,
        target_type: typeFilter || undefined,
      });
      if (res && res.reports) {
        setReports(res.reports);
        setTotal(res.total || res.reports.length);
      }
    } catch (err) {
      console.error('Failed to load moderation reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const handleResolveAction = async (
    report: ContentReport,
    status: 'resolved' | 'dismissed',
    actionTaken?: string,
    notes?: string
  ) => {
    try {
      setSubmitting(true);
      await api.admin.resolveReport(report.id, {
        status,
        action_taken: actionTaken,
        resolution_notes: notes || `Report ${status} by admin`,
      });

      // If action is delete_content and target_type is post, also delete the post
      if (actionTaken === 'delete_content' && report.target_type === 'post') {
        try {
          await api.admin.deletePost(report.target_id);
        } catch (e) {
          console.warn('Post delete call failed or already removed', e);
        }
      }

      setFeedback(`Report ${status} successfully.`);
      setActiveReport(null);
      setResolutionNotes('');
      fetchReports();
    } catch (err: any) {
      console.error('Failed to resolve report', err);
      setFeedback(err.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4 text-sky-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'user': return <User className="w-4 h-4 text-purple-500" />;
      case 'team': return <Users className="w-4 h-4 text-emerald-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getReasonColor = (reason: string) => {
    const r = reason.toLowerCase();
    if (r.includes('harass') || r.includes('hate') || r.includes('threat')) {
      return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    }
    if (r.includes('plagiar') || r.includes('cheat') || r.includes('academic')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (r.includes('spam') || r.includes('bot')) {
      return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    }
    return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Queue Filter Suite ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Content Moderation & Incident Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review reported campus contributions, harassment flags, code plagiarism, and spam incidents.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted border border-border">
            {(['pending', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer',
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Target Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Entities</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="user">User Accounts</option>
            <option value="team">Squads</option>
          </select>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-card hover:bg-muted text-foreground border border-input transition-colors cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={cn('w-4 h-4 text-primary', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-500 hover:opacity-80 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Reports Grid / Cards ─────────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground rounded-2xl bg-card border border-border">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="font-mono text-xs">Querying Flagged Incidents...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500/60" />
            <h3 className="text-sm font-bold text-foreground">Queue is Clear</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No {statusFilter || 'flagged'} reports currently waiting for administrative review.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-4 shadow-xs"
            >
              {/* Card Header: Target Type & Reason Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-muted border border-border">
                    {getTargetIcon(report.target_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                        {report.target_type} Flagged
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', getReasonColor(report.reason))}>
                        {report.reason}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      Target ID: {report.target_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(report.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                      report.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : report.status === 'resolved'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Reported Content Details */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                    Incident Description / Evidence
                  </span>
                  {report.reporter && (
                    <span className="text-[11px] text-muted-foreground">
                      Reported by:{' '}
                      <span className="font-semibold text-foreground">
                        {report.reporter.first_name} {report.reporter.last_name || ''}
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-foreground leading-relaxed">
                  {report.details || report.reason || 'No supplementary context provided by reporting party.'}
                </p>
              </div>

              {/* Resolution details if already processed */}
              {report.resolution_notes && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                    Resolution Ledger Note
                  </span>
                  <p className="text-foreground font-medium">{report.resolution_notes}</p>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Report ID: {report.id}
                </span>

                {report.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveAction(report, 'dismissed')}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => setActiveReport(report)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Take Action</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Case Closed</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Resolution Action Modal ──────────────────────────────────── */}
      <ReportResolutionModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
        resolutionNotes={resolutionNotes}
        onNotesChange={setResolutionNotes}
        onSubmit={handleResolveAction}
        submitting={submitting}
      />
    </div>
  );
}
