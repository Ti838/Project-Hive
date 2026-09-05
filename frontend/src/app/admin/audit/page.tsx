'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Code,
  X,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminAuditLog } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Log for JSON Drawer
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        search: search || undefined,
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
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadgeColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('BAN') || a.includes('DELETE') || a.includes('STRIKE')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (a.includes('RESOLVE') || a.includes('FEATURE') || a.includes('VERIFY')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (a.includes('FLAG') || a.includes('UPDATE') || a.includes('ROLE')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Search ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b0e14] border border-white/5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            Immutable Audit Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Forensic cryptographic event stream recording all administrative actions, ban sanctions, and flag alterations.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, reason, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Actions</option>
            <option value="BAN_USER">BAN_USER</option>
            <option value="UNBAN_USER">UNBAN_USER</option>
            <option value="ISSUE_STRIKE">ISSUE_STRIKE</option>
            <option value="RESOLVE_REPORT">RESOLVE_REPORT</option>
            <option value="DELETE_POST">DELETE_POST</option>
            <option value="DELETE_TEAM">DELETE_TEAM</option>
            <option value="UPDATE_SYSTEM_FLAGS">UPDATE_SYSTEM_FLAGS</option>
            <option value="CHANGE_ROLE">CHANGE_ROLE</option>
          </select>

          <button
            type="submit"
            className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ─── Audit Log Table ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0b0e14] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Admin Identity</th>
                <th className="py-3.5 px-4 font-semibold">Action Performed</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                <th className="py-3.5 px-4 font-semibold">IP Forensics</th>
                <th className="py-3.5 px-4 font-semibold text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <p className="font-mono text-xs">Querying Audit Ledger...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-xs">No audit events found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Admin Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                          {log.admin?.first_name?.[0] || 'A'}
                        </div>
                        <span className="font-semibold text-white">
                          {log.admin?.first_name ? `${log.admin.first_name} ${log.admin.last_name || ''}` : 'Super Admin'}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border', getActionBadgeColor(log.action))}>
                        {log.action}
                      </span>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {log.target_type ? `${log.target_type}: ` : ''}
                      <span className="text-slate-400 truncate max-w-[120px] inline-block align-bottom">
                        {log.target_id || 'N/A'}
                      </span>
                    </td>

                    {/* IP Forensics */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    {/* Payload JSON Inspector */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Code className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── JSON Details Drawer ──────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0e131b] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Audit Entry: {selectedLog.action}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 p-4 border border-white/5 font-mono text-xs text-amber-300">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
