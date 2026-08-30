'use client';
// ─── Mobile Bottom Navigation Bar ──────────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Rss, MessageSquare, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { href: '/feed',      label: 'Feed',     icon: Rss },
  { href: '/messages',  label: 'Chat',     icon: MessageSquare },
  { href: '/teams',     label: 'Teams',    icon: Users },
  { href: '/profile',   label: 'Profile',  icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border z-40 px-2 py-1.5 flex items-center justify-around">
      {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs transition-colors',
              active
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', active && 'stroke-[2.5px]')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

