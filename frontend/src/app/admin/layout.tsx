'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import {
  DesktopGate,
  AdminSidebar,
  AdminMobileDrawer,
  AdminHeader,
} from '@/components/admin';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getExactDeviceTelemetry, DeviceTelemetry } from '@/lib/deviceTelemetry';
import { useSocket } from '@/hooks/useSocket';
import { soundEngine } from '@/lib/soundEngine';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { soundEnabled, setSoundEnabled } = useUIStore();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeSockets, setActiveSockets] = useState<number | null>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [detectedIp, setDetectedIp] = useState<string>('Resolving...');
  const [liveAlert, setLiveAlert] = useState<{ title: string; message: string; timestamp: string } | null>(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const socketRef = useSocket({
    onNotification: (notif: any) => {
      soundEngine?.play('notification');
      if (notif?.title) {
        setLiveAlert({
          title: notif.title,
          message: notif.message || '',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
  });

  useEffect(() => {
    const raw = socketRef.socket;
    if (!raw) return;

    const onSupportNewTicket = (ticket: any) => {
      soundEngine?.play('notification');
      setUnreadSupportCount((prev) => prev + 1);
      setLiveAlert({
        title: 'New Support Ticket',
        message: `Ticket #${ticket?.ticket_number || 'New'}: ${ticket?.subject || 'User Inquiry'}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const onAdminNotification = (data: any) => {
      soundEngine?.play('notification');
      if (data?.title) {
        setLiveAlert({
          title: data.title,
          message: data.message || '',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    };

    raw.on('support:new_ticket', onSupportNewTicket);
    raw.on('admin:notification', onAdminNotification);

    return () => {
      raw.off('support:new_ticket', onSupportNewTicket);
      raw.off('admin:notification', onAdminNotification);
    };
  }, [socketRef.socket]);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check auth state for non-login pages
  useEffect(() => {
    if (isLoading || isLoginPage) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, isLoading, isLoginPage, router]);

  // Periodic telemetry and hardware probe
  useEffect(() => {
    if (isLoginPage || !isAuthenticated || user?.role !== 'admin') return;

    // Probe unmasked hardware specs
    getExactDeviceTelemetry().then((t) => setTelemetry(t));

    // Fetch verified client IP
    const fetchClientIp = async () => {
      try {
        const clientRes = await api.admin.getClientTelemetry();
        if (clientRes && clientRes.ip) {
          setDetectedIp(clientRes.ip);
          return;
        }
      } catch (_) {}

      try {
        const ipifyRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const data = await ipifyRes.json();
        if (data && data.ip) {
          setDetectedIp(data.ip);
          return;
        }
      } catch (_) {}

      setDetectedIp('127.0.0.1');
    };

    fetchClientIp();

    const fetchHealth = async () => {
      try {
        const res = await api.admin.getHealth();
        if (res && res.services) {
          const dbSvc = res.services.find((s: any) => s.name?.includes('PostgreSQL') || s.name?.includes('Supabase'));
          if (dbSvc && dbSvc.ping) {
            setDbLatency(parseInt(dbSvc.ping, 10) || 12);
          }
        }
        if (res && res.database && typeof res.database.latencyMs === 'number') {
          setDbLatency(res.database.latencyMs);
        }
        if (res && res.sockets && typeof res.sockets.activeConnections === 'number') {
          setActiveSockets(res.sockets.activeConnections);
        }
      } catch (err) {
        setDbLatency(null);
        setActiveSockets(null);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [isLoginPage, isAuthenticated, user]);

  if (isLoginPage) {
    return (
      <DesktopGate>
        <div className="min-h-screen bg-[#07090e] text-slate-100">{children}</div>
      </DesktopGate>
    );
  }

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <DesktopGate>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07090e] text-slate-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Shield className="w-6 h-6" />
            </div>
            <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
              Verifying Cryptographic Workstation Authority...
            </p>
          </div>
        </div>
      </DesktopGate>
    );
  }

  const handleSignOut = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <DesktopGate>
      <div className="min-h-screen flex bg-[#07090e] text-slate-100 font-sans selection:bg-amber-500/30">
        {/* Mobile Slide-Over Drawer */}
        <AdminMobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          pathname={pathname}
          user={user}
          unreadSupportCount={unreadSupportCount}
          onSignOut={handleSignOut}
        />

        {/* Desktop Cybernetic Admin Sidebar */}
        <AdminSidebar
          pathname={pathname}
          user={user}
          unreadSupportCount={unreadSupportCount}
          onSignOut={handleSignOut}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Monospace Telemetry Header */}
          <AdminHeader
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            detectedIp={detectedIp}
            telemetry={telemetry}
            dbLatency={dbLatency}
            currentTime={currentTime}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) soundEngine?.test('notification');
            }}
            onTestSound={() => soundEngine?.test('notification')}
            liveAlert={liveAlert}
            onDismissAlert={() => setLiveAlert(null)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </DesktopGate>
  );
}
