'use client';
// ─── App Shell Layout (authenticated pages) ───────────────────────────────────

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useSocket } from '@/hooks/useSocket';
import { CallManager } from '@/components/calling/CallManager';
import { HiveMindCopilot } from '@/components/ai/HiveMindCopilot';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, login } = useAuthStore();

  // Initialise socket connection for authenticated users
  useSocket();

  // Revalidate user on mount without demoting admin role
  useEffect(() => {
    if (!isAuthenticated) return;
    api.users.me().then((res) => {
      if (res.ok && res.id) {
        const token = localStorage.getItem('access_token') ?? '';
        const refresh = localStorage.getItem('refresh_token') ?? '';
        const updatedUser = {
          ...(res as import('@/types').User),
          role: user?.role === 'admin' ? 'admin' : (res.role || 'user'),
        };
        login(updatedUser, token, refresh);
      }
    });
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden touch-auto scroll-smooth pb-[calc(4.5rem+env(safe-area-inset-bottom,16px))] md:pb-6 focus:outline-none">
          <div className="page-enter min-h-full w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>


      {/* Global LiveKit Native Calling Manager (Ringing, Overlays & PiP Widget) */}
      <CallManager />

      {/* Global HiveMind Multimodal Engineering Copilot */}
      <HiveMindCopilot />
    </div>
  );
}
