'use client';
// ─── App Shell Layout (authenticated pages) ───────────────────────────────────

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useSocket } from '@/hooks/useSocket';
import { CallManager } from '@/components/calling/CallManager';
import { HiveAICopilotDrawer } from '@/components/ai/HiveAICopilotDrawer';
import { cn } from '@/lib/utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  // Pages with internal scroll containers (e.g., chat) require overflow-hidden to eliminate nested double-scrollbars
  const hasInternalScroll = pathname.startsWith('/messages');

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop Resizable Sidebar & Mobile Navigation Drawer */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        {/* Command-Grade Topbar */}
        <Topbar />

        {/* Central Viewport with clean scroll ergonomics */}
        <main
          className={cn(
            'flex-1 min-h-0 focus:outline-none',
            hasInternalScroll
              ? 'h-full overflow-hidden flex flex-col'
              : 'overflow-y-auto overflow-x-hidden touch-auto scroll-smooth pb-[calc(4.5rem+env(safe-area-inset-bottom,16px))] md:pb-6'
          )}
        >
          {/* Subtle page transition without flashing full layout resets */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              hasInternalScroll
                ? 'h-full w-full'
                : 'min-h-full w-full max-w-7xl mx-auto'
            )}
          >
            {children}
          </motion.div>
        </main>

        {/* Safe-Area Bottom Tab Navigation for Mobile */}
        <MobileNav />
      </div>

      {/* Global LiveKit Native Calling Manager (Ringing, Overlays & PiP Widget) */}
      <CallManager />

      {/* Global Hive AI Multimodal Engineering Copilot Drawer */}
      <HiveAICopilotDrawer />
    </div>
  );
}
