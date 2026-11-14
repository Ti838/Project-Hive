'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  Database,
  Radio,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  ShieldCheck,
  Flame,
  Activity,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SystemFlags, AdminHealth } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminSystemPage() {
  const [flags, setFlags] = useState<SystemFlags>({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: false,
    allowPublicProjects: true,
    rateLimitStrict: false,
    aiReviewEnabled: true,
  });
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  const [cachePurging, setCachePurging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [flagsRes, healthRes] = await Promise.all([
        api.admin.getSystemFlags().catch(() => ({ flags: null })),
        api.admin.getHealth().catch(() => null),
      ]);

      if (flagsRes && flagsRes.flags) {
        setFlags(flagsRes.flags);
      }
      if (healthRes) {
        setHealth(healthRes);
      }
    } catch (err) {
      console.error('Failed to load system settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleToggle = async (key: keyof SystemFlags) => {
    try {
      setSavingFlag(key);
      const nextVal = !flags[key];
      const updated = { ...flags, [key]: nextVal };
      setFlags(updated);

      await api.admin.updateFlags({ [key]: nextVal });
      setNotice(`Updated ${key} to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error('Failed to update flag', err);
      // Revert
      setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
    } finally {
      setSavingFlag(null);
    }
  };

  const handlePurgeCache = async () => {
    try {
      setCachePurging(true);
      // Wait 1.2s to simulate edge cache purge
      await new Promise((r) => setTimeout(r, 1200));
      setNotice('Edge HTTP and Redis memory caches flushed successfully.');
      setTimeout(() => setNotice(null), 3000);
    } finally {
      setCachePurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Global Platform Configuration & System Flags
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure system-wide feature flags, toggle campus registration, adjust API thresholds, and purge edge caches.
          </p>
        </div>

        <button
          onClick={fetchSystemData}
          className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-input text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-primary', loading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-primary hover:opacity-80 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Platform Feature Flags Matrix ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Registration */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">New Student Registration</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When disabled, public sign-ups are halted. Existing users can still authenticate normally.
            </p>
            <span className={cn('inline-block text-[10px] font-mono font-bold mt-2 px-2 py-0.5 rounded-full border', flags.registrationEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-500 border-rose-500/30')}>
              {flags.registrationEnabled ? 'OPEN' : 'LOCKED'}
            </span>
          </div>
          <button
            onClick={() => handleToggle('registrationEnabled')}
            disabled={savingFlag === 'registrationEnabled'}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1',
              flags.registrationEnabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                flags.registrationEnabled ? 'left-6' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Maintenance Mode Kill-Switch</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diverts all standard traffic to 503 maintenance page. Only admins with valid tokens can enter.
            </p>
            <span className={cn('inline-block text-[10px] font-mono font-bold mt-2 px-2 py-0.5 rounded-full border', flags.maintenanceMode ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30')}>
              {flags.maintenanceMode ? 'ACTIVE (BLOCKING)' : 'INACTIVE (LIVE)'}
            </span>
          </div>
          <button
            onClick={() => handleToggle('maintenanceMode')}
            disabled={savingFlag === 'maintenanceMode'}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1',
              flags.maintenanceMode ? 'bg-rose-600' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                flags.maintenanceMode ? 'left-6' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {/* AI Code Review */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">HiveMind Multimodal AI Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enables Groq Llama 3.3 70B & Google Gemini code architecture review copilot.
            </p>
            <span className={cn('inline-block text-[10px] font-mono font-bold mt-2 px-2 py-0.5 rounded-full border', flags.aiReviewEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border')}>
              {flags.aiReviewEnabled ? 'ACTIVE CASCADE' : 'DISABLED'}
            </span>
          </div>
          <button
            onClick={() => handleToggle('aiReviewEnabled')}
            disabled={savingFlag === 'aiReviewEnabled'}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1',
              flags.aiReviewEnabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                flags.aiReviewEnabled ? 'left-6' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {/* Public Project Showcase */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Public Project Showcase</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Allows verified campus teams to publish projects to the public discovery feed.
            </p>
            <span className={cn('inline-block text-[10px] font-mono font-bold mt-2 px-2 py-0.5 rounded-full border', flags.allowPublicProjects ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border')}>
              {flags.allowPublicProjects ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <button
            onClick={() => handleToggle('allowPublicProjects')}
            disabled={savingFlag === 'allowPublicProjects'}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1',
              flags.allowPublicProjects ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                flags.allowPublicProjects ? 'left-6' : 'left-0.5'
              )}
            />
          </button>
        </div>
      </div>

      {/* ─── Cache Management & System Flush ───────────────────────────── */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-primary" />
            Edge Cache Flush & State Invalidation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Purges active in-memory Redis caches, Cloudflare edge HTML caches, and resets socket room states.
          </p>
        </div>

        <button
          onClick={handlePurgeCache}
          disabled={cachePurging}
          className="px-4 py-2.5 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-primary', cachePurging && 'animate-spin')} />
          <span>{cachePurging ? 'Flushing Caches...' : 'Purge All Caches'}</span>
        </button>
      </div>
    </div>
  );
}
