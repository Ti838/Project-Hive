'use client';
// ─── Native-Grade Topbar & Command Search Navigation ─────────────────────────

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, Sun, Moon, Monitor, Menu, ArrowLeft,
  User, Settings, Bookmark, LogOut, ShieldCheck,
  X, CheckCheck, Sparkles, MessageSquare, Users, FolderKanban, Rss, LayoutDashboard,
  Loader2, ArrowRight, Star, Building2, GraduationCap,
} from 'lucide-react';
import { useAuthStore, useUIStore, useSocketStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { cn, displayName, getInitials, getAvatarColor } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Notification, User as UserType, Team as TeamType, Project as ProjectType } from '@/types';

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
  const { user, logout } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { unreadNotifications, setUnreadNotifications, incrementUnread, toggleMobileMenu } = useUIStore();
  const isConnected = useSocketStore((s) => s.isConnected);

  const [isMac, setIsMac] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [liveUsers, setLiveUsers] = useState<UserType[]>([]);
  const [liveTeams, setLiveTeams] = useState<TeamType[]>([]);
  const [liveProjects, setLiveProjects] = useState<ProjectType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // Live multi-entity search across Users, Teams, and Projects with 200ms debounce
  useEffect(() => {
    const q = cmdQuery.trim();
    if (!q) {
      setLiveUsers([]);
      setLiveTeams([]);
      setLiveProjects([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [uRes, tRes, pRes] = await Promise.allSettled([
          api.users.getPeople({ search: q, limit: 4 }),
          api.teams.getAll({ search: q, limit: 4 }),
          api.projects.list({ search: q }),
        ]);

        if (uRes.status === 'fulfilled' && uRes.value?.users) {
          setLiveUsers(uRes.value.users.slice(0, 4));
        } else {
          setLiveUsers([]);
        }

        if (tRes.status === 'fulfilled') {
          const list: TeamType[] = Array.isArray(tRes.value)
            ? tRes.value
            : (tRes.value as any)?.teams || [];
          setLiveTeams(list.slice(0, 4));
        } else {
          setLiveTeams([]);
        }

        if (pRes.status === 'fulfilled' && pRes.value?.projects) {
          setLiveProjects(pRes.value.projects.slice(0, 4));
        } else {
          setLiveProjects([]);
        }
      } catch (err) {
        console.error('Command search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [cmdQuery]);

  // Platform detection for keyboard badge
  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Global Shortcut Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
        setThemeMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Outside click listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when command palette opens
  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 50);
    } else {
      setCmdQuery('');
    }
  }, [commandOpen]);

  // Socket listener for dynamic real-time notification badge
  useSocket({
    onNotification: (notif: any) => {
      if (notif) {
        setRecentNotifs((prev) => [
          {
            id: notif.id || `notif_${Date.now()}`,
            user_id: notif.user_id || '',
            type: notif.type || 'system',
            title: notif.title,
            message: notif.message || '',
            data: notif.data,
            is_read: false,
            created_at: notif.created_at || new Date().toISOString(),
          },
          ...prev.slice(0, 4),
        ]);
        incrementUnread();
      }
    },
  });

  // Fetch unread notification count and preview list
  useEffect(() => {
    api.notifications.list().then((res) => {
      if (res.ok && res.notifications) {
        setRecentNotifs(res.notifications.slice(0, 5));
        setUnreadNotifications(res.notifications.filter((n) => !n.is_read).length);
      }
    });
  }, [setUnreadNotifications]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await api.auth.logout();
    logout();
    router.push('/login');
  };

  const handleCommandSelect = (href: string) => {
    setCommandOpen(false);
    router.push(href);
  };

  const handleCommandSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdQuery.trim()) return;
    setCommandOpen(false);
    router.push(`/people?search=${encodeURIComponent(cmdQuery.trim())}`);
  };

  const { title: pageTitle, isChild } = getPageMeta(pathname);
  const name = displayName(user ?? undefined);
  const avatarColor = user?.avatar_color || getAvatarColor(user?.id || '');

  return (
    <>
      <header className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-5 surface-overlay transition-colors">
        {/* ─── Left Section: Mobile Back / Hamburger & Command Trigger ────── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Dynamic Mobile Back vs Drawer Toggle */}
          {isChild ? (
            <button
              onClick={() => router.back()}
              className="md:hidden p-2 -ml-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-transform tap-press"
              aria-label="Go back to previous screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 -ml-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-transform tap-press"
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

          {/* Linear/Raycast-Style Desktop Command Trigger */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center justify-between w-64 lg:w-80 h-9 px-3 text-xs bg-muted/60 hover:bg-muted/90 border border-border/70 hover:border-primary/40 rounded-xl transition-all group text-muted-foreground shadow-2xs tap-press cursor-pointer"
            aria-label="Open command palette"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate group-hover:text-foreground transition-colors font-medium">
                Search students, teams, showcase…
              </span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground group-hover:text-foreground bg-background/80 border border-border/80 rounded-md pointer-events-none transition-colors shrink-0">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
        </div>

        {/* ─── Right Section: Socket Status, Theme, Notifications & Profile ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Real-time Socket Indicator Dot */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-muted/40 border border-border/50 select-none"
            title={isConnected ? 'Real-time WebSocket connected' : 'Reconnecting to real-time gateway...'}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2 transition-all',
                  isConnected
                    ? 'bg-emerald-500 glow-primary'
                    : 'bg-amber-500 animate-pulse'
                )}
              />
            </span>
            <span className="hidden xl:inline text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              {isConnected ? 'Live' : 'Syncing'}
            </span>
          </div>

          {/* Mobile Search Trigger Icon */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="md:hidden p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher Menu */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors cursor-pointer"
              title={`Theme: ${theme === 'system' ? 'Auto (System)' : theme === 'dark' ? 'Dark' : 'Light'}`}
              aria-label="Toggle theme menu"
            >
              {theme === 'system' ? (
                <Monitor className="w-4 h-4 text-primary" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Quick Theme Selection Popover */}
            <AnimatePresence>
              {themeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-36 surface-floating rounded-2xl border border-border/70 shadow-xl p-1.5 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer tap-press',
                      theme === 'light'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer tap-press',
                      theme === 'dark'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <Moon className="w-3.5 h-3.5 text-primary" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTheme('system'); setThemeMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer tap-press',
                      theme === 'system'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Auto (System)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-4 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 ring-2 ring-background ambient-badge-glow animate-pulse">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-88 surface-floating rounded-2xl border border-border/70 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3.5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                    {recentNotifs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        <CheckCheck className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/60" />
                        No new notifications
                      </div>
                    ) : (
                      recentNotifs.map((n) => (
                        <Link
                          key={n.id}
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className={cn(
                            'block p-3 hover:bg-muted/60 transition-colors text-left tap-press',
                            !n.is_read && 'bg-primary/5'
                          )}
                        >
                          <p className="text-xs font-medium text-foreground line-clamp-2">{n.title ? `${n.title}: ${n.message}` : n.message}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-border/60 bg-muted/30 text-center">
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-foreground/80 hover:text-foreground tap-press inline-block py-1"
                    >
                      Open Notification Center →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown Container */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-border/60 hover:bg-accent/70 tap-press transition-all cursor-pointer group"
              aria-label="User menu"
            >
              <UserAvatar
                user={user}
                size="xs"
                showStatus
                status={isConnected ? 'online' : 'away'}
              />
              <span className="hidden md:inline text-xs font-semibold text-foreground max-w-[110px] truncate group-hover:text-primary transition-colors">
                {name}
              </span>
            </button>

            {/* Profile Dropdown Popover */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-60 surface-floating rounded-2xl border border-border/70 shadow-2xl p-1.5 z-50 overflow-hidden"
                >
                  {/* User Card */}
                  <div className="p-3 border-b border-border/60 bg-muted/25 rounded-xl mb-1">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.university || user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                        <ShieldCheck className="w-3 h-3" /> ADMIN
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors tap-press"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      href="/saved"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors tap-press"
                    >
                      <Bookmark className="w-4 h-4 text-muted-foreground" />
                      <span>Saved Items</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors tap-press"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors tap-press"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 mt-1 border-t border-border/60">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer tap-press text-left"
                    >
                      <LogOut className="w-4 h-4 text-destructive" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── Command-Grade Raycast Search Modal Overlay ──────────────────── */}
      <AnimatePresence>
        {commandOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommandOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="relative w-full max-w-xl surface-floating rounded-2xl border border-border/70 shadow-2xl overflow-hidden z-10"
            >
              {/* Search Bar Input */}
              <form onSubmit={handleCommandSearch} className="flex items-center border-b border-border/60 px-4 h-14">
                <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <input
                  ref={cmdInputRef}
                  type="text"
                  value={cmdQuery}
                  onChange={(e) => setCmdQuery(e.target.value)}
                  placeholder="Search students, teams, showcase, or jump to route..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {cmdQuery && (
                  <button
                    type="button"
                    onClick={() => setCmdQuery('')}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-lg tap-press mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border/60 rounded-md">
                  ESC
                </kbd>
              </form>

              {/* Suggestions / Results */}
              <div className="p-2 max-h-96 overflow-y-auto space-y-2">
                {cmdQuery.trim() ? (
                  <>
                    {/* Live Search Status Indicator */}
                    {searchLoading && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Searching students, squads, and projects…</span>
                      </div>
                    )}

                    {/* Quick Direct Search Actions */}
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                        Quick Jump
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCommandSelect(`/people?search=${encodeURIComponent(cmdQuery.trim())}`)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">Search students directory for &ldquo;{cmdQuery}&rdquo;</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">↵ Enter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCommandSelect(`/teams?search=${encodeURIComponent(cmdQuery.trim())}`)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">Search squads & hubs for &ldquo;{cmdQuery}&rdquo;</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">Jump</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCommandSelect(`/showcase?search=${encodeURIComponent(cmdQuery.trim())}`)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">Search showcase for &ldquo;{cmdQuery}&rdquo;</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">Jump</span>
                      </button>
                    </div>

                    {/* Live Matching Students & Peers */}
                    {liveUsers.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3 text-primary" /> Students & Peers ({liveUsers.length})
                        </div>
                        {liveUsers.map((u) => {
                          const uName = displayName(u);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleCommandSelect(`/profile/${u.id}`)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <UserAvatar user={u} size="xs" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground group-hover:text-primary transition-colors">
                                    <span className="truncate">{uName}</span>
                                    {u.is_verified && (
                                      <span className="text-primary text-[10px]">✓</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {u.university || u.major || u.email}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Live Matching Teams / Squads */}
                    {liveTeams.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-primary" /> Squads & Hubs ({liveTeams.length})
                        </div>
                        {liveTeams.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleCommandSelect(`/teams`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {t.name?.charAt(0)?.toUpperCase() || 'T'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {t.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {t.category || (t.type === 'community' ? 'Community Hub' : 'Project Squad')} • {t.member_count ?? t.members?.length ?? 1} members
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Live Matching Showcase Projects */}
                    {liveProjects.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                          <FolderKanban className="w-3 h-3 text-primary" /> Showcase Projects ({liveProjects.length})
                        </div>
                        {liveProjects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleCommandSelect(`/showcase`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-500/30" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {p.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {p.category || 'Innovation'} • {p.upvotes ?? p.upvote_count ?? p.likes ?? 0} upvotes
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {!searchLoading && liveUsers.length === 0 && liveTeams.length === 0 && liveProjects.length === 0 && (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No direct live records found. Click a quick jump option above or press Enter to search.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      Quick Navigate
                    </div>
                    {[
                      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                      { href: '/feed', label: 'Feed & Campus Updates', icon: Rss },
                      { href: '/messages', label: 'Real-time Chat & Direct Messages', icon: MessageSquare },
                      { href: '/people', label: 'Students & Peer Discovery', icon: Users },
                      { href: '/teams', label: 'Teams & Project Squads', icon: Building2 },
                      { href: '/showcase', label: 'Project Showcase', icon: FolderKanban },
                      { href: '/generator', label: 'Hive AI Studio', icon: Sparkles },
                    ].map(({ href, label, icon: Icon }) => (
                      <button
                        key={href}
                        type="button"
                        onClick={() => handleCommandSelect(href)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors text-left tap-press cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{href}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Footer status */}
              <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Navigation & Search</span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">↵</kbd>
                  to select
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
