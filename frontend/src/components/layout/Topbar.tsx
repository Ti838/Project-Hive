'use client';
// ─── Topbar with Responsive Mobile Controls ────────────────────────────────────

import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { unreadNotifications, setUnreadNotifications, toggleMobileMenu } = useUIStore();
  const [dark, setDark] = useState(false);

  // Fetch unread notification count
  useEffect(() => {
    api.notifications.list().then((res) => {
      if (res.ok && res.notifications) {
        setUnreadNotifications(res.notifications.filter((n) => !n.is_read).length);
      }
    });
  }, []);

  // Dark mode toggle
  useEffect(() => {
    const saved = localStorage.getItem('ph-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ph-theme', next ? 'dark' : 'light');
  };

  return (
    <header className="flex items-center justify-between h-14 px-3 sm:px-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 sticky top-0 z-30">
      {/* Left: Mobile hamburger & logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center p-1">
            <img src="/bee-logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm">ProjectHive</span>
        </div>

        {/* Desktop Search */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search people, teams, projects…"
            className="pl-9 pr-4 py-1.5 text-sm bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors w-64"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
