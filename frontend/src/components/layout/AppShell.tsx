'use client';
// ─── App Shell Layout (authenticated pages) ───────────────────────────────────

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useSocket } from '@/hooks/useSocket';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuthStore();

  // Initialise socket connection for authenticated users
  useSocket();

  // Revalidate user on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    api.users.me().then((res) => {
      if (res.ok && res.id) {
        const token = localStorage.getItem('access_token') ?? '';
        const refresh = localStorage.getItem('refresh_token') ?? '';
        login(res as import('@/types').User, token, refresh);
      }
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="page-enter">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
