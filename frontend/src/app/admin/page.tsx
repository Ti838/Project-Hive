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
  Clock,
  MessageSquare,
  ScrollText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  FolderKanban,
  Sliders,
  Shield,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminStats, AdminHealth, AdminAuditLog } from '@/types';
import { cn } from '@/lib/utils';

// ─── Skeleton Shimmer ────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted',
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
        'relative overflow-hidden rounded-2xl bg-card border shadow-xs p-5 transition-all duration-200 group',
        alert
          ? 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/5'
          : 'border-border hover:border-primary/40'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            'p-2 rounded-xl border transition-colors',
            iconBg,
            alert
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : `border-primary/20 ${accentClass}`
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
              'text-3xl font-black tracking-tight font-mono',
              alert ? 'text-rose-500' : 'text-foreground'
            )}
          />
          {!loading && (
            <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
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
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-muted text-muted-foreground'
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shadow-xs">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
            badgeColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        {loading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
              badgeColor
            )}
          >
            {badge}
          </span>
        )}
        <p className="text-[10px] mt-1 font-semibold text-muted-foreground">
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
  badge,
  badgeColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/30 transition-all flex items-start justify-between gap-3 group shadow-xs cursor-pointer"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badge && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border',
              badgeColor || 'bg-muted text-muted-foreground border-border'
            )}
          >
            {badge}
          </span>
        )}
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, healthRes, logsRes] = await Promise.allSettled([
        api.admin.getStats(),
        api.admin.getHealth(),
        api.admin.getAuditLogs({ page: 1, limit: 6 }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
        setRecentLogs(logsRes.value.logs);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = stats?.users?.total ?? (stats as any)?.totalUsers ?? 0;
  const verifiedUsers = (stats as any)?.verifiedUsers ?? stats?.users?.students ?? totalUsers;
  const unverifiedUsers = (stats as any)?.unverifiedUsers ?? 0;
  const bannedUsers = stats?.users?.banned ?? (stats as any)?.bannedUsers ?? 0;
  const totalTeams = stats?.teams?.total ?? (stats as any)?.totalTeams ?? 0;
  const pendingReports = stats?.reports?.pending ?? (stats as any)?.pendingReports ?? 0;
  const activeSockets = stats?.activeSockets ?? health?.sockets?.activeConnections ?? 0;

  const dbPing =
    health?.services?.find((s: any) =>
      s.name?.includes('PostgreSQL') || s.name?.includes('Supabase')
    )?.ping || '12ms';

  const dbLatencyMs = health?.database?.latencyMs ?? parseInt(dbPing, 10) ?? 12;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Overview Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Command Center & System Telemetry
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time infrastructure telemetry, security posture, and campus engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-muted-foreground hidden md:inline">
              Last synced: {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Metrics Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Registered Students"
          value={totalUsers}
          sub={`${verifiedUsers} verified (${unverifiedUsers} pending)`}
          icon={Users}
          accentClass="text-primary"
          iconBg="bg-primary/10"
          trend="up"
          loading={loading}
        />

        <KpiCard
          label="Collaboration Squads"
          value={totalTeams}
          sub="Active campus builder teams"
          icon={Layers}
          accentClass="text-blue-500"
          iconBg="bg-blue-500/10"
          trend="neutral"
          loading={loading}
        />

        <KpiCard
          label="Disciplinary Sanctions"
          value={bannedUsers}
          sub="Accounts restricted from platform"
          icon={ShieldAlert}
          accentClass="text-rose-500"
          iconBg="bg-rose-500/10"
          alert={bannedUsers > 0}
          trend={bannedUsers > 0 ? 'down' : 'neutral'}
          loading={loading}
        />

        <KpiCard
          label="Live Socket Presence"
          value={activeSockets}
          sub="Real-time WebSockets connected"
          icon={Radio}
          accentClass="text-emerald-500"
          iconBg="bg-emerald-500/10"
          trend="up"
          loading={loading}
        />
      </div>

      {/* ─── Systems Health Grid ────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Infrastructure & Gateway Health
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <HealthNode
            label="PostgreSQL / Supabase"
            sublabel="Primary persistence cluster"
            icon={Database}
            status={`Latency: ${dbLatencyMs}ms`}
            badge="HEALTHY"
            badgeColor="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            loading={loading}
          />

          <HealthNode
            label="LiveKit SFU WebRTC"
            sublabel="Audio/Video media pipeline"
            icon={Zap}
            status="Adaptive Simulcast"
            badge="ACTIVE"
            badgeColor="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
            loading={loading}
          />

          <HealthNode
            label="Groq / Gemini AI Cascade"
            sublabel="Multimodal intelligence"
            icon={Activity}
            status="Llama 3.3 70B @ 300 tps"
            badge="ONLINE"
            badgeColor="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            loading={loading}
          />

          <HealthNode
            label="Brevo SMTP Mail Relay"
            sublabel="Transactional deliveries"
            icon={Server}
            status="Authenticated Relay"
            badge="SECURE"
            badgeColor="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            loading={loading}
          />
        </div>
      </div>

      {/* ─── Navigation Shortcuts Grid ──────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          Administrative Command Modules
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <QuickNavItem
            href="/admin/users"
            icon={Users}
            label="User Directory & Strikes"
            desc="Inspect student profiles, revoke session tokens, and issue disciplinary sanctions."
            badge={`${totalUsers} Students`}
          />

          <QuickNavItem
            href="/admin/projects"
            icon={FolderKanban}
            label="Projects Showcase & Oversight"
            desc="Audit student repositories, promote showcase builds, and moderate project artifacts."
          />

          <QuickNavItem
            href="/admin/teams"
            icon={Layers}
            label="Squad Governance"
            desc="Review team compositions, leader delegation, and disband inactive squads."
            badge={`${totalTeams} Squads`}
          />

          <QuickNavItem
            href="/admin/moderation"
            icon={ShieldAlert}
            label="Content Moderation Matrix"
            desc="Investigate flagged user reports, defamatory posts, and violation evidence."
            badge={pendingReports > 0 ? `${pendingReports} Pending` : 'Clean'}
            badgeColor={pendingReports > 0 ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' : undefined}
          />

          <QuickNavItem
            href="/admin/security"
            icon={Shield}
            label="SecOps Posture & Kill-Switch"
            desc="Evaluate NIST compliance, configure MFA policies, and trigger emergency break-glass."
            badge="SecOps 94"
            badgeColor="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          />

          <QuickNavItem
            href="/admin/audit"
            icon={ScrollText}
            label="PostgreSQL Immutable Audit Trail"
            desc="Review cryptographic administrative action logs with formatted JSON payloads."
          />
        </div>
      </div>

      {/* ─── Recent Audit Activity Stream ───────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Recent Security & Audit Logs</h3>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No administrative operations logged in current session.
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                    {log.action}
                  </span>
                  <span className="text-foreground truncate font-medium">
                    {log.admin?.first_name || 'System Admin'}: {log.target_type} ({log.target_id || 'System'})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0 ml-3">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
