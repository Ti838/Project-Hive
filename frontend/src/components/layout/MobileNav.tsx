'use client';
// ─── Native-Grade Mobile Bottom Navigation Bar ─────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Rss, MessageSquare, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';

const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/feed',      label: 'Feed',    icon: Rss },
  { href: '/messages',  label: 'Chat',    icon: MessageSquare },
  { href: '/teams',     label: 'Teams',   icon: Users },
  { href: '/profile',   label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { unreadNotifications, mobileMenuOpen } = useUIStore();

  // Hide mobile bottom navigation if the slide-out drawer is open to resolve collisions
  return (
    <AnimatePresence>
      {!mobileMenuOpen && (
        <motion.nav
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="navigation"
          aria-label="Mobile Navigation"
          className={cn(
            'md:hidden fixed bottom-0 inset-x-0 z-40',
            'bg-background/90 dark:bg-card/90 backdrop-blur-2xl',
            'border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
            'px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,16px))]',
            'flex items-center justify-around select-none transition-colors'
          )}
        >
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[48px] rounded-2xl tap-press transition-colors touch-target"
              >
                <div className="relative flex items-center justify-center w-10 h-7">
                  {active && (
                    <motion.div
                      layoutId="mobileTabPill"
                      className="absolute inset-0 bg-primary/15 dark:bg-primary/20 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-150',
                      active
                        ? 'text-primary stroke-[2.4px]'
                        : 'text-muted-foreground stroke-[1.8px] hover:text-foreground'
                    )}
                  />
                  {href === '/messages' && unreadNotifications > 0 && (
                    <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background glow-primary animate-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-0.5 tracking-tight transition-colors duration-150',
                    active
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground font-medium'
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
