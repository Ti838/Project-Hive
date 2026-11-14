'use client';

import React from 'react';
import {
  Menu,
  Database,
  Clock,
  Volume2,
  VolumeX,
  Shield,
  Sun,
  Moon,
  Laptop,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
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
  liveAlert,
  onDismissAlert,
}: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <>
      <header className="h-14 bg-card/90 backdrop-blur-md border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none transition-colors">
        {/* Left: Mobile Toggle & System Status Badge */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 cursor-pointer"
            aria-label="Open Admin Navigation"
          >
            <Menu className="w-4 h-4 text-primary" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground tracking-tight">System Operational</span>
          </div>

          {/* Database Latency Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground">
            <Database className="w-3 h-3 text-emerald-500" />
            <span>Database:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {dbLatency !== null ? `${dbLatency}ms` : 'Connected'}
            </span>
          </div>

          {/* Client IP */}
          {detectedIp && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border text-[10px] font-mono text-muted-foreground">
              <span>IP:</span>
              <span className="text-foreground font-semibold">{detectedIp}</span>
            </div>
          )}
        </div>

        {/* Right: Theme Switcher, Audio Chimes, Live UTC Clock & Clearance Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline capitalize text-[11px] font-medium text-muted-foreground">{theme}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={cn(
              'p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs',
              soundEnabled
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title={soundEnabled ? 'Alert chimes enabled' : 'Alert chimes muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Live UTC Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border text-xs font-mono text-foreground">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{currentTime || 'UTC'}</span>
          </div>

          {/* Admin Role Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/15 border border-primary/30 text-xs font-semibold text-primary">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </div>
        </div>
      </header>

      {/* Floating Critical Alert Toast */}
      {liveAlert && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-card border border-primary/40 rounded-2xl p-4 shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{liveAlert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{liveAlert.message}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">{liveAlert.timestamp}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissAlert}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
