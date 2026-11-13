'use client';
// ─── Responsive Workstation Security Boundary & Telemetry Provider ──────────

import { useEffect, useState } from 'react';
import { ShieldCheck, Smartphone, Laptop, Radio } from 'lucide-react';
import { getExactDeviceTelemetry, DeviceTelemetry } from '@/lib/deviceTelemetry';
import { api } from '@/lib/api';

interface DesktopGateProps {
  children: React.ReactNode;
}

export function DesktopGate({ children }: DesktopGateProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [clientIp, setClientIp] = useState<string>('Resolving...');
  const [showDismissibleMobileBanner, setShowDismissibleMobileBanner] = useState<boolean>(true);

  useEffect(() => {
    const evaluateViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
      setIsMobileViewport(w < 1024);
    };

    evaluateViewport();
    window.addEventListener('resize', evaluateViewport);

    // Probe hardware & telemetry silently for audit ledger
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
      } catch (_) {}

      try {
        const ipifyRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const data = await ipifyRes.json();
        if (data && data.ip) {
          setClientIp(data.ip);
          return;
        }
      } catch (_) {}

      setClientIp('127.0.0.1 (Workstation)');
    };

    resolveIp();

    return () => window.removeEventListener('resize', evaluateViewport);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Responsive SecOps Advisory for Mobile Viewports (Non-blocking, dismissible) */}
      {isMobileViewport && showDismissibleMobileBanner && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-3 py-1.5 text-[11px] font-mono text-amber-300 flex items-center justify-between z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">
              <strong>SEC-OPS MOBILE CONSOLE:</strong> Responsive mode active ({dimensions.width}px) • Encrypted channel
            </span>
          </div>
          <button
            onClick={() => setShowDismissibleMobileBanner(false)}
            className="text-[10px] text-amber-400/80 hover:text-amber-200 px-2 py-0.5 rounded border border-amber-500/30 ml-2 shrink-0 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </div>
  );
}


