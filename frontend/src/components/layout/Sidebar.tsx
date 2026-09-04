'use client';
// ─── ProjectHive Sidebar & Resizable Workspace Drawer ──────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Rss, MessageSquare, Users, FolderKanban,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Bookmark, UserCircle, X, ShieldCheck, GripVertical, type LucideIcon,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn, displayName, getInitials, getAvatarColor } from '@/lib/utils';
import { HiveAIIcon } from '@/components/ai/HiveAIIcon';

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  isAi?: boolean;
  isAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/feed',          label: 'Feed',          icon: Rss },
  { href: '/messages',      label: 'Messages',      icon: MessageSquare },
  { href: '/teams',         label: 'Teams',         icon: Users },
  { href: '/showcase',      label: 'Projects',      icon: FolderKanban },
  { href: '/people',        label: 'People',        icon: UserCircle },
  { href: '/generator',     label: 'AI Studio',     isAi: true },
  { href: '/saved',         label: 'Saved',         icon: Bookmark },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings',      label: 'Settings',      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    sidebarWidth,
    toggleSidebar,
    setSidebarWidth,
    mobileMenuOpen,
    setMobileMenuOpen,
    hiveAiEnabled,
  } = useUIStore();

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/login');
  };

  const avatarColor = user?.avatar_color || getAvatarColor(user?.id || '');
  const name = displayName(user ?? undefined);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Mouse drag resize handler for Desktop
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.min(380, Math.max(200, e.clientX));
        setSidebarWidth(newWidth);
      }
    },
    [isResizing, setSidebarWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  const navItems = NAV_ITEMS.filter((item) => !item.isAi || hiveAiEnabled);

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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border flex flex-col z-50 md:hidden shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom,16px))] pt-[env(safe-area-inset-top,0px)]"
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
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors tap-press"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Admin Link */}
              {user?.role === 'admin' && (
                <div className="px-3 pt-3">
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>ADMIN CONSOLE</span>
                  </Link>
                </div>
              )}

              {/* Mobile Nav Links */}
              <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon, isAi, isAdmin }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors tap-press',
                        isAdmin && 'text-amber-500 bg-amber-500/10 border border-amber-500/20 font-semibold',
                        active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : !isAdmin && 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {isAi ? <HiveAIIcon size={18} /> : Icon ? <Icon className="w-5 h-5 shrink-0" /> : null}
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Profile Footer */}
              <div className="border-t border-border p-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 min-w-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.university || user?.email}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors tap-press"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Desktop Resizable Sidebar ───────────────────────────────────── */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          width: sidebarCollapsed ? 68 : sidebarWidth,
        }}
        transition={{ duration: isResizing ? 0 : 0.15, ease: 'easeInOut' }}
        style={{ width: sidebarCollapsed ? 68 : sidebarWidth }}
        className={cn(
          'hidden md:flex flex-col h-full bg-card border-r border-border shrink-0 select-none relative z-30 group/sidebar',
          isResizing && 'transition-none pointer-events-auto'
        )}
      >
        {/* Resize Handle (Desktop Only) */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={() => setSidebarWidth(260)}
            title="Drag to resize sidebar • Double-click to reset"
            className={cn(
              'absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-40 transition-colors group-hover/sidebar:bg-primary/20',
              'hover:w-2 hover:bg-primary/40 active:bg-primary',
              isResizing && 'bg-primary w-2 shadow-sm'
            )}
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity pointer-events-none">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn(
          'h-16 flex items-center border-b border-border shrink-0 px-3.5',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar (Ctrl+B)"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden shadow-xs hover:bg-primary/25 hover:border-primary/40 transition-all cursor-pointer tap-press group relative"
            >
              <img src="/logo.png" alt="ProjectHive Logo" className="w-6 h-6 object-contain rounded-lg group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden shadow-xs">
                  <img src="/logo.png" alt="ProjectHive Logo" className="w-6 h-6 object-contain rounded-lg" />
                </div>
                <span className="font-bold text-lg tracking-tight whitespace-nowrap truncate text-foreground">
                  ProjectHive
                </span>
              </div>

              <button
                type="button"
                onClick={toggleSidebar}
                title="Collapse sidebar (Ctrl+B)"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors tap-press cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Admin Navigation Banner (if user is admin) */}
        {user?.role === 'admin' && (
          <div className="p-2 border-b border-border/60">
            <Link
              href="/admin/dashboard"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-all',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title="Admin Console"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">ADMIN CONSOLE</span>}
            </Link>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon, isAi, isAdmin }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                  isAdmin && 'text-amber-500 bg-amber-500/10 border border-amber-500/20 font-semibold mb-1',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : !isAdmin && 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {isAi ? (
                  <HiveAIIcon size={18} className={active ? 'text-primary-foreground' : 'text-amber-500'} />
                ) : Icon ? (
                  <Icon className="w-5 h-5 shrink-0" />
                ) : null}

                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip on collapsed mode */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-popover text-popover-foreground text-xs font-semibold rounded-lg shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-border p-3 shrink-0">
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
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapsed expand toggle row at bottom */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-border flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar (Ctrl+B)"
              className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors tap-press cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
