'use client';
// ─── ProjectHive Sidebar & Responsive Drawer ───────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Rss, MessageSquare, Users, FolderKanban,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles,
  Bookmark, UserCircle, X,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn, displayName, getInitials, getAvatarColor } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/feed',         label: 'Feed',         icon: Rss },
  { href: '/messages',     label: 'Messages',     icon: MessageSquare },
  { href: '/teams',        label: 'Teams',        icon: Users },
  { href: '/showcase',     label: 'Projects',     icon: FolderKanban },
  { href: '/people',       label: 'People',       icon: UserCircle },
  { href: '/generator',    label: 'AI Studio',    icon: Sparkles },
  { href: '/saved',        label: 'Saved',        icon: Bookmark },
  { href: '/notifications',label: 'Notifications',icon: Bell },
  { href: '/settings',     label: 'Settings',     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/login');
  };

  const avatarColor = user?.avatar_color || getAvatarColor(user?.id || '');
  const name = displayName(user ?? undefined);

  return (
    <>
      {/* ─── Mobile Drawer Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border flex flex-col z-50 md:hidden shadow-2xl"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden shadow-xs">
                    <img src="/logo.png" alt="ProjectHive" className="w-6 h-6 object-contain rounded-lg" />
                  </div>
                  <span className="font-bold text-lg">ProjectHive</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="relative shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.university || user?.email}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 70 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex relative flex-col h-screen bg-card border-r border-border shrink-0 overflow-hidden z-40"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden shadow-xs">
            <img src="/logo.png" alt="ProjectHive Logo" className="w-6 h-6 object-contain rounded-lg" />
          </div>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg tracking-tight whitespace-nowrap"
              >
                ProjectHive
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Tooltip when collapsed */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            {/* Avatar */}
            <Link href="/profile" className="relative shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(name)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            </Link>

            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <Link href="/profile" className="text-sm font-medium truncate block hover:underline">{name}</Link>
                  <p className="text-xs text-muted-foreground truncate">{user?.university || user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute top-1/2 -right-3 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>
    </>
  );
}
