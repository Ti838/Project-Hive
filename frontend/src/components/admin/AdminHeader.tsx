'use client';

import React from 'react';
import {
  Menu,
  Database,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  X,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeviceTelemetry } from '@/lib/deviceTelemetry';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
  detectedIp: string;
  telemetry: DeviceTelemetry | null;
  dbLatency: number | null;
  currentTime: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTestSound: () => void;
  liveAlert: { title: string; message: string; timestamp: string } | null;
  onDismissAlert: () => void;
}

export function AdminHeader({
  onOpenMobileMenu,
  detectedIp,
  telemetry,
  dbLatency,
  currentTime,
  soundEnabled,
  onToggleSound,
  onTestSound,
  liveAlert,
  onDismissAlert,
}: AdminHeaderProps) {
  return (
    <>
      <header className="h-14 bg-[#090d16]/95 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Mobile Toggle & System Status Badge */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Open Admin Navigation"
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 tracking-tight">System Operational</span>
          </div>

          {/* Database Latency Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-400">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Database:</span>
            <span className="text-emerald-400 font-semibold">
              {dbLatency !== null ? `${dbLatency}ms` : 'Connected'}
            </span>
          </div>
        </div>

        {/* Right: Audio Chimes, Live UTC Clock & Clearance Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={cn(
              'p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs',
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            )}
            title={soundEnabled ? 'Alert chimes enabled' : 'Alert chimes muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Live UTC Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || 'UTC'}</span>
          </div>

          {/* Admin Role Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </div>
        </div>
      </header>

      {/* Floating Alert Notification Toast */}
      {liveAlert && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-[#121826] border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{liveAlert.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{liveAlert.message}</p>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">{liveAlert.timestamp}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissAlert}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
