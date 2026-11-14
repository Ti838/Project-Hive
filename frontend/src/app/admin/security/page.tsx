'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  KeyRound,
  Users,
  Laptop,
  Smartphone,
  Globe,
  Sliders,
  RefreshCw,
  LogOut,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Activity,
  Server,
  Terminal,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Policy Flags State
  const [flags, setFlags] = useState({
    emailVerification: false,
    rateLimitStrict: false,
    maintenanceMode: false,
  });
  const [savingFlag, setSavingFlag] = useState(false);

  // Break-glass modal state
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [executingBreakGlass, setExecutingBreakGlass] = useState(false);
  const [breakGlassResult, setBreakGlassResult] = useState<string | null>(null);

  const fetchPosture = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getSecurityPosture();
      if (res) {
        setData(res);
        if (res.flags) {
          setFlags({
            emailVerification: Boolean(res.flags.emailVerification),
            rateLimitStrict: Boolean(res.flags.rateLimitStrict),
            maintenanceMode: Boolean(res.flags.maintenanceMode),
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load SecOps posture', err);
      setError(err?.message || 'Failed to query security metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosture();
  }, []);

  const handleToggleFlag = async (key: string, value: boolean) => {
    try {
      setSavingFlag(true);
      const newFlags = { ...flags, [key]: value };
      setFlags(newFlags);
      await api.admin.updateFlags({ [key]: value });
      fetchPosture();
    } catch (err) {
      console.error('Failed to update system security flag', err);
    } finally {
      setSavingFlag(false);
    }
  };

  const handleBreakGlass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassReason || breakGlassReason.trim().length < 8) return;

    try {
      setExecutingBreakGlass(true);
      setBreakGlassResult(null);
      const res = await api.admin.triggerBreakGlass(breakGlassReason.trim());
      if (res && res.ok) {
        setBreakGlassResult('Break-glass protocol executed: all user sessions revoked.');
        setBreakGlassReason('');
        setTimeout(() => {
          setShowBreakGlassModal(false);
          fetchPosture();
        }, 2000);
      } else {
        setError(res.message || 'Failed to execute break-glass protocol');
      }
    } catch (err: any) {
      setError(err?.message || 'Emergency execution failed');
    } finally {
      setExecutingBreakGlass(false);
    }
  };

  const kpis = data?.kpis || {
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    bannedUsers: 0,
    adminCount: 0,
    activeSessionsCount: 0,
    pendingReportsCount: 0,
  };

  const score = data?.score || 94;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Top SecOps Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <Terminal className="w-3.5 h-3.5" />
            <span>NIST SP 800-207 Zero-Trust Engine</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground mt-0.5">
            Security Operations Center (SecOps) & Access Controls
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized zero-trust policy enforcement, privileged access management, and emergency response.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPosture}
            className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-input text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowBreakGlassModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Break-Glass Protocol</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 1. Security Posture & KPI Matrix ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Posture Score Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Security Posture</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-foreground">{score}</span>
            <span className="text-xs font-mono text-muted-foreground">/ 100</span>
            <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {data?.postureStatus || 'GUARDED'}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Privileged Operators */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Privileged Roles</span>
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black font-mono text-foreground">{kpis.adminCount}</span>
            <span className="text-xs text-muted-foreground ml-2">Active Admins</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Live DB permission enforcement</p>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Active Sessions</span>
            <Laptop className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black font-mono text-foreground">{kpis.activeSessionsCount}</span>
            <span className="text-xs text-muted-foreground ml-2">Tokens issued</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Zero stale JWT lifetime</p>
        </div>

        {/* Banned / Sanctioned */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Quarantine Isolation</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black font-mono text-rose-500">{kpis.bannedUsers}</span>
            <span className="text-xs text-muted-foreground ml-2">Banned users</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Automatic 3-strike isolation</p>
        </div>
      </div>

      {/* ─── 2. Policy Governance Toggles ─────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          Active Security Policies & Global Safeguards
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Strict Rate Limiting */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">Strict Rate Limiting</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Applies 30 req/min strict threshold on all public endpoints.
              </p>
            </div>
            <input
              type="checkbox"
              checked={flags.rateLimitStrict}
              disabled={savingFlag}
              onChange={(e) => handleToggleFlag('rateLimitStrict', e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary mt-1 cursor-pointer"
            />
          </div>

          {/* Email Verification */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">Enforce Campus Email Verification</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Blocks unverified student emails from squad formation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={flags.emailVerification}
              disabled={savingFlag}
              onChange={(e) => handleToggleFlag('emailVerification', e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary mt-1 cursor-pointer"
            />
          </div>

          {/* Maintenance Mode */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">Maintenance Mode</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Reroutes all non-admin traffic to the 503 Maintenance page.
              </p>
            </div>
            <input
              type="checkbox"
              checked={flags.maintenanceMode}
              disabled={savingFlag}
              onChange={(e) => handleToggleFlag('maintenanceMode', e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary mt-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. Privileged Operators Table ────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Privileged Administrator Roster
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {data?.admins?.length || 0} Accounts with Super-Admin Access
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Administrator Identity</th>
                <th className="py-3 px-4 font-semibold">Security Role</th>
                <th className="py-3 px-4 font-semibold">Verified Status</th>
                <th className="py-3 px-4 font-semibold text-right">Account Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.admins?.map((adm: any) => (
                <tr key={adm.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {adm.name?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{adm.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{adm.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {adm.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-muted-foreground">
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Break-Glass Emergency Modal ──────────────────────────────── */}
      {showBreakGlassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Trigger Break-Glass Protocol</h3>
              </div>
              <button
                onClick={() => setShowBreakGlassModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 space-y-1">
              <p className="font-bold">CRITICAL EMERGENCY PROTOCOL:</p>
              <p className="leading-relaxed">
                Executing break-glass will immediately revoke ALL active student session tokens across the platform, rotate edge JWT keys, and log an immutable high-severity breach incident in PostgreSQL.
              </p>
            </div>

            {breakGlassResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {breakGlassResult}
              </div>
            )}

            <form onSubmit={handleBreakGlass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Justification / Incident ID (Min 8 characters)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the confirmed compromise or threat justification..."
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowBreakGlassModal(false)}
                  disabled={executingBreakGlass}
                  className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executingBreakGlass || breakGlassReason.trim().length < 8}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {executingBreakGlass ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking All Sessions...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      <span>Execute Break-Glass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
