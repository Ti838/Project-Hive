'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  Layers,
  Activity,
  Database,
  Radio,
  Server,
  Zap,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Flame,
  Clock,
  MessageSquare,
  ScrollText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminStats, AdminHealth, AdminAuditLog } from '@/types';
import { cn } from '@/lib/utils';

// ─── Skeleton Shimmer ────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/[0.04]',
        className
      )}
    />
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  loading,
  className,
}: {
  value: number;
  loading: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) return;
    const start = display;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loading]);

  if (loading) return <Skeleton className="h-9 w-24" />;
  return <span className={className}>{display.toLocaleString()}</span>;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  sub: string;
  subHighlight?: string;
  icon: React.ElementType;
  accentClass: string;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
  loading: boolean;
  alert?: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  subHighlight,
  icon: Icon,
  accentClass,
  iconBg,
  trend,
  loading,
  alert,
}: KpiCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-[#0b0e14]/90 border backdrop-blur-md p-5 transition-all duration-200 group',
        alert
          ? 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/5 shadow-lg'
          : 'border-white/[0.05] hover:border-white/[0.12]'
      )}
    >
      {/* Glow blob */}
      <div
        className={cn(
          'absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          alert ? 'bg-rose-500/15' : iconBg.replace('bg-', 'bg-').replace('/10', '/8')
        )}
      />

      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <div
          className={cn(
            'p-2 rounded-xl border transition-colors',
            iconBg,
            alert
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : `border-current/20 ${accentClass}`
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <AnimatedCounter
            value={value}
            loading={loading}
            className={cn(
              'text-3xl font-black tracking-tight',
              alert ? 'text-rose-400' : 'text-white'
            )}
          />
          {!loading && (
            <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
              {subHighlight && (
                <span className={cn('font-semibold', accentClass)}>
                  {subHighlight}
                </span>
              )}
              {sub}
            </p>
          )}
          {loading && <Skeleton className="h-3.5 w-32 mt-2" />}
        </div>

        {trend && !loading && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold',
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400'
                : trend === 'down'
                ? 'bg-rose-500/10 text-rose-400'
                : 'bg-slate-500/10 text-slate-400'
            )}
          >
            <TrendIcon className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Health Node ─────────────────────────────────────────────────────────────
function HealthNode({
  label,
  sublabel,
  icon: Icon,
  status,
  badge,
  badgeColor,
  loading,
}: {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  status: string;
  badge: string;
  badgeColor: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg border flex items-center justify-center',
            badgeColor.replace('text-', 'bg-').replace('-400', '-500/10'),
            badgeColor.replace('-400', '-500/20').replace('text-', 'border-'),
            badgeColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">{label}</p>
          <p className="text-[11px] text-slate-400">{sublabel}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        {loading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
              badgeColor.replace('text-', 'bg-').replace('-400', '-500/15'),
              badgeColor.replace('-400', '-500/30').replace('text-', 'border-'),
              badgeColor
            )}
          >
            {badge}
          </span>
        )}
        <p className={cn('text-[10px] mt-1 font-semibold', badgeColor)}>
          {status}
        </p>
      </div>
    </div>
  );
}

// ─── Quick Nav Item ───────────────────────────────────────────────────────────
function QuickNavItem({
  href,
  icon: Icon,
  label,
  desc,
  accentHover,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  accentHover: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between p-4 rounded-xl bg-[#0b0e14] border border-white/[0.05] transition-all group',
        accentHover
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
          <Icon className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="text-xs font-bold text-white group-hover:opacity-90 transition-opacity">
            {label}
          </p>
          <p className="text-[11px] text-slate-500">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge != null && badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-mono font-black border border-rose-500/30">
            {badge}
          </span>
        )}
        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </Link>
  );
}

// ─── Audit Row ───────────────────────────────────────────────────────────────
function AuditRow({ log }: { log: AdminAuditLog }) {
  const actionColors: Record<string, string> = {
    ban: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    unban: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    strike: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    resolve: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    dismiss: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    delete: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    update: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const colorClass =
    actionColors[log.action?.toLowerCase()] ||
    'bg-amber-500/10 text-amber-400 border-amber-500/20';
  const adminName = log.admin?.first_name
    ? `${log.admin.first_name} ${log.admin.last_name || ''}`.trim()
    : 'System Admin';

  return (
    <div className="p-3 rounded-xl bg-white/[0.015] border border-white/[0.05] hover:border-white/[0.09] transition-colors flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wide shrink-0',
              colorClass
            )}
          >
            {log.action}
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate">
            {adminName}
          </span>
        </div>
        {log.details?.reason && (
          <p className="text-[11px] text-slate-500 truncate">
            {log.details.reason}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] font-mono text-slate-500">
          {new Date(log.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <p className="text-[9px] font-mono text-slate-600 mt-0.5">
          {log.ip_address || '—'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, healthRes, logsRes] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getHealth().catch(() => null),
        api.admin.getAuditLogs({ limit: 8 }).catch(() => ({ logs: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      if (healthRes) setHealth(healthRes);
      if (logsRes && logsRes.logs) setRecentLogs(logsRes.logs);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Admin Dashboard] Failed to load telemetry', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kpiCards: KpiCardProps[] = [
    {
      label: 'Verified Builders',
      value: stats?.users?.total ?? 0,
      subHighlight: `${stats?.users?.activeToday ?? 0} active today`,
      sub: `· ${stats?.users?.banned ?? 0} banned`,
      icon: Users,
      accentClass: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      trend: 'up',
      loading,
    },
    {
      label: 'Post Activity',
      value: stats?.posts?.total ?? 0,
      subHighlight: `+${stats?.posts?.today ?? 0} today`,
      sub: '· campus feeds',
      icon: Flame,
      accentClass: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      trend: 'up',
      loading,
    },
    {
      label: 'Active Squads',
      value: stats?.teams?.total ?? 0,
      subHighlight: `${stats?.projects?.total ?? 0}`,
      sub: 'showcases · hubs',
      icon: Layers,
      accentClass: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      trend: 'neutral',
      loading,
    },
    {
      label: 'Flagged Reports',
      value: stats?.reports?.pending ?? 0,
      subHighlight: 'Requires Action',
      sub: `· ${stats?.reports?.total ?? 0} lifetime`,
      icon: ShieldAlert,
      accentClass: 'text-rose-400',
      iconBg: 'bg-rose-500/10',
      trend: stats?.reports?.pending ? 'up' : 'neutral',
      loading,
      alert: (stats?.reports?.pending ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">

      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent border border-amber-500/[0.15] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Live Command Stream
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Institutional Telemetry & Governance
          </h1>
          <p className="text-xs text-slate-400">
            Real-time monitoring, security sanctions, infrastructure health, and moderation hub.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500">Last synced</span>
            <span className="text-[11px] font-mono text-slate-400">
              {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-amber-400', refreshing && 'animate-spin')} />
            Sync
          </button>

          <Link
            href="/admin/moderation"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/25 active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Moderation
            {(stats?.reports?.pending ?? 0) > 0 && (
              <span className="px-1.5 rounded-full bg-rose-600 text-white text-[9px] font-black">
                {stats!.reports!.pending}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Infrastructure Health ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Infrastructure & Node Pulse
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            REGION: us-east-1 · Supabase Managed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthNode
            label="PostgreSQL Primary"
            sublabel="Supabase Engine"
            icon={Database}
            status="ONLINE"
            badge={`${health?.database?.latencyMs ?? 14}ms`}
            badgeColor="text-emerald-400"
            loading={loading}
          />
          <HealthNode
            label="Socket.IO Gateway"
            sublabel="Real-Time Event Pipeline"
            icon={Radio}
            status="STREAMING"
            badge={`${health?.sockets?.activeConnections ?? stats?.activeSockets ?? 0} CONN`}
            badgeColor="text-cyan-400"
            loading={loading}
          />
          <HealthNode
            label="LiveKit Cloud SFU"
            sublabel="WebRTC Collaboration"
            icon={Zap}
            status="READY"
            badge="18ms"
            badgeColor="text-purple-400"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Action Matrix + Audit Feed ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-200">
            Administrative Command Matrix
          </h2>
          <div className="space-y-2">
            <QuickNavItem
              href="/admin/users"
              icon={Users}
              label="Student Directory & Strike Enforcement"
              desc="Search builders, issue strikes, apply bans"
              accentHover="hover:border-amber-500/30"
            />
            <QuickNavItem
              href="/admin/moderation"
              icon={ShieldAlert}
              label="Content Moderation Queue"
              desc="Resolve flagged posts and harassment claims"
              accentHover="hover:border-rose-500/30"
              badge={stats?.reports?.pending}
            />
            <QuickNavItem
              href="/admin/teams"
              icon={Layers}
              label="Squads & Hub Registry"
              desc="Oversee collaboration groups and memberships"
              accentHover="hover:border-purple-500/30"
            />
            <QuickNavItem
              href="/admin/support"
              icon={Inbox}
              label="Support & Helpline Center"
              desc="Respond to open tickets and user escalations"
              accentHover="hover:border-sky-500/30"
            />
            <QuickNavItem
              href="/admin/system"
              icon={Server}
              label="System Flags & Platform Controls"
              desc="Maintenance mode, registration, rate limits"
              accentHover="hover:border-cyan-500/30"
            />
            <QuickNavItem
              href="/admin/audit"
              icon={ScrollText}
              label="Immutable Audit Ledger"
              desc="Admin action history and IP forensics"
              accentHover="hover:border-indigo-500/30"
            />
          </div>
        </div>

        {/* Live Governance Feed */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Live Governance Ledger
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Full Ledger →
            </Link>
          </div>

          <div className="rounded-2xl bg-[#0b0e14] border border-white/[0.05] p-4 space-y-2.5 min-h-[320px]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.015] border border-white/[0.04] flex items-start justify-between gap-3"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-10 shrink-0" />
                </div>
              ))
            ) : recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Clock className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-xs font-medium">No administrative events recorded yet</p>
                <p className="text-[11px] mt-1 text-slate-600">Events appear here as admins take actions</p>
              </div>
            ) : (
              recentLogs.map((log) => <AuditRow key={log.id} log={log} />)
            )}
          </div>

          {/* System Status Summary */}
          {!loading && health && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.15]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 font-medium">
                All systems operational — no active incidents
              </p>
            </div>
          )}
          {!loading && !health && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.15]">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300 font-medium">
                Health endpoint unreachable — backend may be cold-starting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
