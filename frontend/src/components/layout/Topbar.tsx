'use client';
// ─── Native-Grade Topbar & Contextual Mobile Navigation ─────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Sun, Moon, Menu, ArrowLeft } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { cn, displayName, getInitials, getAvatarColor } from '@/lib/utils';

function getPageMeta(pathname: string): { title: string; isChild: boolean } {
  if (pathname === '/teams/create') return { title: 'Create Team', isChild: true };
  if (pathname.startsWith('/profile/')) return { title: 'User Profile', isChild: true };
  if (pathname === '/settings') return { title: 'Settings', isChild: true };
  if (pathname === '/notifications') return { title: 'Notifications', isChild: true };
  if (pathname === '/saved') return { title: 'Saved Items', isChild: true };
  if (pathname === '/generator') return { title: 'AI Studio', isChild: true };
  if (pathname === '/dashboard') return { title: 'Dashboard', isChild: false };
  if (pathname === '/feed') return { title: 'Feed', isChild: false };
  if (pathname === '/messages') return { title: 'Chat', isChild: false };
  if (pathname === '/teams') return { title: 'Teams', isChild: false };
  if (pathname === '/profile') return { title: 'Profile', isChild: false };
  if (pathname === '/showcase' || pathname === '/projects') return { title: 'Showcase', isChild: false };
  if (pathname === '/people' || pathname === '/friends') return { title: 'People', isChild: false };
  return { title: 'ProjectHive', isChild: false };
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { unreadNotifications, setUnreadNotifications, toggleMobileMenu } = useUIStore();
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useState<HTMLInputElement | null>(null)[0] as any;

  // Shortcut Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const el = document.querySelector('input[placeholder*="Search students"]') as HTMLInputElement;
        el?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { title: pageTitle, isChild } = getPageMeta(pathname);

  // Fetch unread notification count
  useEffect(() => {
    api.notifications.list().then((res) => {
      if (res.ok && res.notifications) {
        setUnreadNotifications(res.notifications.filter((n) => !n.is_read).length);
      }
    });
  }, [setUnreadNotifications]);

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

  const name = displayName(user ?? undefined);
  const avatarColor = user?.avatar_color || getAvatarColor(user?.id || '');

  return (
    <header className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-5 border-b border-border/60 bg-background/80 dark:bg-card/80 backdrop-blur-md transition-colors">
      {/* ─── Left Section: Mobile Back / Hamburger & Title ───────────────── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Dynamic Mobile Back vs Drawer Toggle */}
        {isChild ? (
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 -ml-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:scale-90 transition-transform"
            aria-label="Go back to previous screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 -ml-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:scale-90 transition-transform"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand / Contextual Page Title */}
        <div className="flex items-center gap-2 min-w-0">
          {!isChild ? (
            <div className="flex md:hidden items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
                <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain rounded-md" />
              </div>
              <span className="font-extrabold text-base tracking-tight truncate">ProjectHive</span>
            </div>
          ) : (
            <h1 className="md:hidden font-bold text-base tracking-tight truncate text-foreground">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Desktop Global Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              router.push(`/people?search=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
          className="relative hidden md:flex items-center"
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, squads, showcase…"
            className="pl-9 pr-14 py-1.5 text-sm bg-muted/70 rounded-xl border border-border/50 focus:border-primary focus:bg-background focus:outline-none transition-all w-72"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-background/80 border border-border/80 rounded-md pointer-events-none">
            ⌘K
          </kbd>
        </form>
      </div>

      {/* ─── Right Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell with Badge */}
        <Link
          href="/notifications"
          className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-4 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 ring-2 ring-background ambient-badge-glow animate-pulse">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Desktop Mini User Profile Button */}
        <Link
          href="/profile"
          className="hidden md:flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full border border-border/50 hover:bg-accent tap-press transition-colors ml-1"
        >
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(name)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-background" />
          </div>
          <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">{name}</span>
        </Link>
      </div>
    </header>
  );
}
