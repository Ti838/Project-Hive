'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  FileText,
  Users,
  Eye,
  ChevronRight,
  Send
} from 'lucide-react';
import { api } from '@/lib/api';
import { ContentReport } from '@/types';
import { cn } from '@/lib/utils';

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

      // If action is delete_post and target_type is post, also delete the post
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
      case 'post': return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'user': return <User className="w-4 h-4 text-purple-400" />;
      case 'team': return <Users className="w-4 h-4 text-emerald-400" />;
      default: return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  const getReasonColor = (reason: string) => {
    const r = reason.toLowerCase();
    if (r.includes('harass') || r.includes('hate') || r.includes('threat')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (r.includes('plagiar') || r.includes('cheat') || r.includes('academic')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (r.includes('spam') || r.includes('bot')) {
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    }
    return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Queue Filter Suite ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b0e14] border border-white/5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Content Moderation & Incident Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review reported campus contributions, harassment flags, code plagiarism, and spam incidents.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
            {(['pending', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
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
            className="h-9 px-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Entities</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="user">User Accounts</option>
            <option value="team">Squads</option>
          </select>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={cn('w-4 h-4 text-amber-400', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Reports Grid / Cards ─────────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 rounded-2xl bg-[#0b0e14] border border-white/5">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <p className="font-mono text-xs">Querying Flagged Incidents...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400 rounded-2xl bg-[#0b0e14] border border-white/5 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400/60" />
            <h3 className="text-sm font-bold text-white">Queue is Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No {statusFilter || 'flagged'} reports currently waiting for administrative review.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-[#0b0e14] border border-white/5 hover:border-white/10 transition-all space-y-4"
            >
              {/* Card Header: Target Type & Reason Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    {getTargetIcon(report.target_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        {report.target_type} Flagged
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', getReasonColor(report.reason))}>
                        {report.reason}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Target UUID: {report.target_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
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
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : report.status === 'resolved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    )}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Card Body: Reporter Info & Report Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                {/* Reporter Metadata */}
                <div className="md:col-span-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Filed By
                  </p>
                  <p className="font-bold text-white">
                    {report.reporter?.first_name ? `${report.reporter.first_name} ${report.reporter.last_name || ''}` : 'Anonymous Student'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {report.reporter?.email || 'N/A'}
                  </p>
                </div>

                {/* Report Content Details / Evidence */}
                <div className="md:col-span-8 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Report Details / Claim Evidence
                  </p>
                  <p className="text-slate-200 leading-relaxed">
                    {report.details || 'No additional statement provided by reporter.'}
                  </p>

                  {report.resolution_notes && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-amber-400/90 font-mono">
                      Resolution Note: {report.resolution_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (for Pending reports) */}
              {report.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleResolveAction(report, 'dismissed', 'dismiss')}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>

                  <button
                    onClick={() => setActiveReport(report)}
                    disabled={submitting}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Resolve Incident…</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── Resolution Action Modal ───────────────────────────────────── */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e131b] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Resolve Content Violation</h3>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Violating Entity: <strong className="text-white uppercase">{activeReport.target_type}</strong> (ID: {activeReport.target_id})
              </p>
              <p>
                Report Reason: <strong className="text-amber-400">{activeReport.reason}</strong>
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Resolution Notes (Recorded in Audit Ledger)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe disciplinary action or reason for resolution..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveReport(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={() => handleResolveAction(activeReport, 'resolved', 'delete_content', resolutionNotes)}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Content & Resolve</span>
              </button>

              <button
                onClick={() => handleResolveAction(activeReport, 'resolved', 'resolve_only', resolutionNotes)}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve Without Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
