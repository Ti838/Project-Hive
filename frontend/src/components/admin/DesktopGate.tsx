'use client';
// ─── Desktop-Only Workstation Security Gate ────────────────────────────────────

import { useEffect, useState } from 'react';
import { ShieldAlert, Terminal, ArrowLeft, Lock, Activity, Cpu, Laptop, Radio, Database } from 'lucide-react';
import Link from 'next/link';
import { getExactDeviceTelemetry, DeviceTelemetry } from '@/lib/deviceTelemetry';
import { api } from '@/lib/api';

interface DesktopGateProps {
  children: React.ReactNode;
}

export function DesktopGate({ children }: DesktopGateProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pointerType, setPointerType] = useState<string>('Precision Mouse');
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [clientIp, setClientIp] = useState<string>('Resolving...');

  useEffect(() => {
    const evaluateViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });

      // Coarse pointer / touch-first environment detection
      const hasCoarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const hasHoverNone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none)').matches;
      const isTouchDevice = (hasCoarse && hasHoverNone) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && w < 1024);

      setPointerType(isTouchDevice ? 'Coarse Touch / Mobile' : 'Precision Hardware Pointer');

      // Enterprise Desktop Hard Gate: Strict 1024px minimum width AND blocking touch-only mobile environments
      const desktop = w >= 1024 && !isTouchDevice;
      setIsDesktop(desktop);
    };

    evaluateViewport();
    window.addEventListener('resize', evaluateViewport);

    // Probe hardware & telemetry
    getExactDeviceTelemetry().then((res) => {
      setTelemetry(res);
    });

    // Detect actual verified IP
    const resolveIp = async () => {
      try {
        const adminRes = await api.admin.getClientTelemetry();
        if (adminRes && adminRes.ip) {
          setClientIp(adminRes.ip);
          return;
        }
      } catch (_) {
        // Fallback for unauthenticated access or before admin login
      }

      try {
        const ipifyRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
        const data = await ipifyRes.json();
        if (data && data.ip) {
          setClientIp(data.ip);
          return;
        }
      } catch (_) {}

      setClientIp('127.0.0.1 (Local Workstation)');
    };

    resolveIp();

    return () => window.removeEventListener('resize', evaluateViewport);
  }, []);

  // Initial SSR / Hydration placeholder
  if (isDesktop === null) {
    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-400 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>INITIALIZING WORKSTATION SECURITY ENVIRONMENT...</span>
        </div>
      </div>
    );
  }

  // Mobile / Narrow Viewport Restriction Screen (Hard-Blocks DOM Mounting)
  if (!isDesktop) {
    return (
      <div className="min-h-screen w-full bg-[#07090e] text-zinc-300 flex flex-col justify-between p-6 sm:p-8 font-mono select-none overflow-y-auto">
        {/* Top Telemetry Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold tracking-wider">
            <ShieldAlert className="w-4 h-4 animate-pulse text-rose-500" />
            <span>SEC-OPS // WORKSTATION CLEARANCE REQUIRED</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
            RESTRICTED
          </span>
        </div>

        {/* Center Cybernetic Security Shield */}
        <div className="my-auto py-10 max-w-lg mx-auto w-full space-y-6 text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20">
              <Lock className="w-10 h-10 stroke-[2]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600" />
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              Restricted Workstation Access
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              ProjectHive Admin Command Center requires an authorized desktop terminal environment with a minimum viewport width of <strong className="text-rose-400">1024px</strong>.
            </p>
          </div>

          {/* Diagnostic Telemetry Matrix */}
          <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5 shadow-inner">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" /> Client Hardware Telemetry
              </span>
              <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                BLOCKED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[10px]">
              <div>
                <span className="text-zinc-500 block">Incident Code:</span>
                <span className="text-rose-400 font-bold">ERR_MOBILE_SURFACE_FORBIDDEN</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Workstation IP:</span>
                <span className="text-amber-400 font-bold">{clientIp}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Device Model:</span>
                <span className="text-zinc-200 font-bold truncate block">
                  {telemetry?.deviceModel || telemetry?.osName || 'Personal Terminal'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">CPU Architecture:</span>
                <span className="text-zinc-200 font-bold">{telemetry?.cpuArch || 'x86_64'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Pointer Interface:</span>
                <span className="text-amber-400 font-bold">{pointerType}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block">GPU Hardware:</span>
                <span className="text-cyan-400 font-bold truncate block">
                  {telemetry?.gpuRenderer || 'WebGL Renderer Probed'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block">Display Resolution:</span>
                <span className="text-zinc-300 font-bold">
                  {dimensions.width}px × {dimensions.height}px (Ratio: {telemetry?.pixelRatio || 1}x, Screen: {telemetry?.screenResolution || '1920x1080'})
                </span>
              </div>
            </div>
          </div>

          {/* Exit / Return CTA */}
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all border border-zinc-700 shadow-sm hover:border-zinc-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Workspace</span>
            </Link>
          </div>
        </div>

        {/* Footer Audit Signature */}
        <div className="border-t border-zinc-800/80 pt-4 text-[10px] text-zinc-600 flex items-center justify-between">
          <span>PROJECT_HIVE_OS // SEC_LEVEL_4</span>
          <span>STRICT_AUDIT_TRAIL_ACTIVE</span>
        </div>
      </div>
    );
  }

  // Authorized Desktop Workstation — Mount Admin Tree Cleanly
  return <>{children}</>;
}
