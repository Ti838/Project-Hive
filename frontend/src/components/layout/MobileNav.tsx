'use client';
// ─── Native-Grade Mobile Bottom Tab Bar ────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const { unreadNotifications } = useUIStore();

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 inset-x-0 z-40',
        'bg-card/90 backdrop-blur-xl border-t border-border/80 shadow-2xl',
        'px-3 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]',
        'flex items-center justify-around select-none'
      )}
      aria-label="Mobile Bottom Navigation"
    >
      {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all duration-150 active:scale-90"
          >
            <div className="relative">
              {active && (
                <motion.div
                  layoutId="mobileTabGlow"
                  className="absolute -inset-1.5 bg-primary/15 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-150',
                  active
                    ? 'text-primary stroke-[2.4px] scale-110'
                    : 'text-muted-foreground stroke-[1.8px]'
                )}
              />
              {href === '/messages' && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                'text-[10px] mt-1 font-medium transition-colors',
                active ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
