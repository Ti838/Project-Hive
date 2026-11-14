'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Clock,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Code,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminAuditLog } from '@/types';
import { cn } from '@/lib/utils';
import { AuditLogDrawer } from '@/components/admin/AuditLogDrawer';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Log for JSON Drawer
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        search: debouncedSearch || undefined,
      });
      if (res && res.logs) {
        setLogs(res.logs);
        setTotal(res.total || res.logs.length);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, debouncedSearch]);

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadgeColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('ban') || a.includes('delete') || a.includes('break_glass') || a.includes('purge')) {
      return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    }
    if (a.includes('strike') || a.includes('flag') || a.includes('role')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (a.includes('feature') || a.includes('resolve') || a.includes('promote')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Search Controls ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Immutable Audit Trail & Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total of {total} append-only administrative records with cryptographic actor identities and JSON inspection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search action, target UUID, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Operations</option>
            <option value="user.banned">user.banned</option>
            <option value="user.unbanned">user.unbanned</option>
            <option value="user.strike_issued">user.strike_issued</option>
            <option value="user.role_changed">user.role_changed</option>
            <option value="user.deleted">user.deleted</option>
            <option value="team.disbanded">team.disbanded</option>
            <option value="project.featured">project.featured</option>
            <option value="flags.updated">flags.updated</option>
            <option value="security.break_glass">security.break_glass</option>
          </select>

          <button
            type="button"
            onClick={fetchLogs}
            className="h-9 px-3 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Refresh logs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Audit Log Table Matrix ────────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp (UTC)</th>
                <th className="py-3.5 px-4 font-semibold">Administrator</th>
                <th className="py-3.5 px-4 font-semibold">Action / Operation</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                <th className="py-3.5 px-4 font-semibold">IP Origin</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-mono text-xs">Loading Audit Ledger Entries...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-xs">No audit logs found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Try widening your search filter</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Admin Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                          {log.admin?.first_name?.[0] || 'A'}
                        </div>
                        <span className="font-bold text-foreground">
                          {log.admin ? `${log.admin.first_name} ${log.admin.last_name || ''}` : 'System Task'}
                        </span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider',
                          getActionBadgeColor(log.action)
                        )}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-foreground">
                      <span className="text-muted-foreground">{log.target_type}:</span>{' '}
                      <span className="font-semibold">{log.target_id || 'Global'}</span>
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg border border-input bg-card hover:bg-muted text-foreground text-[11px] font-mono font-medium transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                        title="View Raw JSON Payload"
                      >
                        <Code className="w-3 h-3 text-primary" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {logs.length} of {total} audit records
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-foreground font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── JSON Drawer Modal ─────────────────────────────────────────── */}
      <AuditLogDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        copied={copied}
        onCopy={handleCopyJson}
      />
    </div>
  );
}
