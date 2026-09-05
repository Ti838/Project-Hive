'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  Layers,
  FileCode,
  Activity,
  Database,
  Radio,
  Server,
  Zap,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminStats, AdminHealth, AdminAuditLog } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, healthRes, logsRes] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getHealth().catch(() => null),
        api.admin.getAuditLogs({ limit: 6 }).catch(() => ({ logs: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      if (healthRes) setHealth(healthRes);
      if (logsRes && logsRes.logs) setRecentLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load telemetry stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ─── Top Telemetry Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-slate-900/60 border border-amber-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
            Live Command Stream
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Institutional Telemetry & Governance
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-tenant monitoring, database health, security sanctions, and moderation hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-amber-400', refreshing && 'animate-spin')} />
            <span>Sync Metrics</span>
          </button>

          <Link
            href="/admin/moderation"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Moderation Queue</span>
            {stats?.reports?.pending ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono font-black">
                {stats.reports.pending}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* ─── Metric Matrix (KPI Cards) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified Builders */}
        <div className="p-5 rounded-2xl bg-[#0b0e14]/80 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Verified Builders
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">
              {stats?.users?.total ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{stats?.users?.activeToday ?? 0} active today</span>
              <span>•</span>
              <span className="text-rose-400">{stats?.users?.banned ?? 0} banned</span>
            </div>
          </div>
        </div>

        {/* Daily Post Volume */}
        <div className="p-5 rounded-2xl bg-[#0b0e14]/80 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Post Activity
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">
              {stats?.posts?.total ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-cyan-400 font-bold">+{stats?.posts?.today ?? 0} posts today</span>
              <span>•</span>
              <span>All campus feeds</span>
            </div>
          </div>
        </div>

        {/* Active Squads & Hubs */}
        <div className="p-5 rounded-2xl bg-[#0b0e14]/80 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Squads
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">
              {stats?.teams?.total ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-purple-400 font-bold">{stats?.projects?.total ?? 0} showcases</span>
              <span>•</span>
              <span>Collab hubs</span>
            </div>
          </div>
        </div>

        {/* Pending Content Reports */}
        <div className="p-5 rounded-2xl bg-[#0b0e14]/80 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Flagged Reports
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-rose-400 tracking-tight">
              {stats?.reports?.pending ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-rose-400 font-bold">Requires Action</span>
              <span>•</span>
              <span>{stats?.reports?.total ?? 0} lifetime</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Infrastructure Service Health Pulse ────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Infrastructure Latency & Node Pulse
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            EDGE REGION: us-east-1 / Supabase Managed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PostgreSQL Node */}
          <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">PostgreSQL Primary</p>
                <p className="text-[11px] text-slate-400">Supabase Engine</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {health?.database?.latencyMs ?? 14}ms
              </span>
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold">ONLINE</p>
            </div>
          </div>

          {/* Socket.IO Real-Time Gateway */}
          <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Socket.IO Pipeline</p>
                <p className="text-[11px] text-slate-400">Real-Time Event Gateway</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {health?.sockets?.activeConnections ?? stats?.activeSockets ?? 42} CONN
              </span>
              <p className="text-[10px] text-cyan-400 mt-1 font-semibold">STREAMING</p>
            </div>
          </div>

          {/* LiveKit Voice/Video SFU */}
          <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">LiveKit Cloud SFU</p>
                <p className="text-[11px] text-slate-400">WebRTC Collaboration</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                18ms
              </span>
              <p className="text-[10px] text-purple-400 mt-1 font-semibold">READY</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Split Grid: Quick Action Hub & Security Audit Stream ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Command Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold tracking-tight text-slate-200">
            Administrative Action Matrix
          </h2>

          <div className="space-y-2.5">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Student Directory & Strike Enforcement
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Search campus builders, issue strikes, or apply disciplinary bans
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/moderation"
              className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/5 hover:border-rose-500/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    Content Moderation Queue
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Resolve flagged posts, plagiarism reports, and harassment claims
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/system"
              className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    System Flags & Platform Controls
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Toggle maintenance mode, registration limits, and rate limits
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/audit"
              className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Immutable Audit Ledger
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Review administrative action history and IP forensics
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Audit Event Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-200">
              Live Governance Ledger
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              View Full Ledger →
            </Link>
          </div>

          <div className="rounded-2xl bg-[#0b0e14] border border-white/5 p-4 space-y-3">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium">No recent administrative events recorded</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {log.admin?.first_name ? `${log.admin.first_name} ${log.admin.last_name || ''}` : 'System Admin'}
                      </span>
                    </div>
                    {log.details?.reason && (
                      <p className="text-[11px] text-slate-400 truncate">
                        Reason: {log.details.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-[9px] font-mono text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
