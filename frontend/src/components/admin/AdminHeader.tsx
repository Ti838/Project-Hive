'use client';

import React from 'react';
import {
  Menu,
  Radio,
  Laptop,
  Database,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  X,
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
      <header className="min-h-12 py-2 lg:py-0 bg-[#090d13]/90 backdrop-blur-md border-b border-foreground/5 px-4 lg:px-6 flex flex-wrap items-center justify-between sticky top-0 z-30 font-mono text-[11px] text-slate-400 gap-2 select-none">
        {/* Left Telemetry Indicators & Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:gap-6 min-w-0 overflow-hidden">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Open Admin Navigation"
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>

          {/* Real Client IP Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">IP:</span>
            <span className="text-emerald-400 font-bold">{detectedIp}</span>
            <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              SECURE_NODE
            </span>
          </div>

          {/* Hardware & GPU Chipset Badge */}
          <div className="hidden md:flex items-center gap-1.5 min-w-0 truncate">
            <Laptop className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="shrink-0">HARDWARE:</span>
            <span className="text-slate-200 font-bold truncate">
              {telemetry?.deviceModel || telemetry?.osName || 'Personal Workstation'}
            </span>
            <span className="text-slate-600 shrink-0">|</span>
            <span className="text-cyan-400 font-medium truncate">
              {telemetry?.gpuRenderer || 'WebGL Probing...'}
            </span>
          </div>

          {/* Database Node Latency */}
          <div className="hidden 2xl:flex items-center gap-1.5 shrink-0">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>DB:</span>
            <span className="text-emerald-400 font-bold">
              {dbLatency !== null ? `${dbLatency}ms` : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Right Telemetry Clock & Clearance */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Admin Audio Chime Toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={onToggleSound}
              className={cn(
                'p-1 rounded transition-colors cursor-pointer',
                soundEnabled
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-slate-500 hover:bg-white/5'
              )}
              title={
                soundEnabled
                  ? 'Admin Chimes: ACTIVE • Click to Mute'
                  : 'Admin Chimes: MUTED • Click to Enable'
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onTestSound}
              className="px-1.5 py-0.5 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
              title="Test chime"
            >
              Test 🔔
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime || 'SYNCHRONIZING...'}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
            ROOT AUTH
          </span>
        </div>
      </header>

      {/* Live Alert Toast Banner */}
      {liveAlert && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200 animate-in fade-in slide-in-from-top-1 duration-200 select-none">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-bold text-amber-300">[{liveAlert.title}]</span>
            <span>{liveAlert.message}</span>
            <span className="text-[10px] text-amber-400/60 font-mono ml-2">
              {liveAlert.timestamp}
            </span>
          </div>
          <button
            onClick={onDismissAlert}
            className="p-1 hover:bg-amber-500/20 rounded text-amber-300 transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

