'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Layers,
  FolderKanban,
  Sliders,
  ScrollText,
  MessageSquare,
  LogOut,
  Shield,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Squads & Teams', href: '/admin/teams', icon: Layers },
  { name: 'Projects Showcase', href: '/admin/projects', icon: FolderKanban },
  { name: 'Content Moderation', href: '/admin/moderation', icon: ShieldAlert },
  { name: 'Security & Access', href: '/admin/security', icon: Shield },
  { name: 'Support Tickets', href: '/admin/support', icon: MessageSquare },
  { name: 'System Settings', href: '/admin/system', icon: Sliders },
  { name: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
];

interface AdminSidebarProps {
  pathname: string;
  user: any;
  unreadSupportCount: number;
  onSignOut: () => void;
}

export function AdminSidebar({
  pathname,
  user,
  unreadSupportCount,
  onSignOut,
}: AdminSidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-card border-r border-border flex-col justify-between sticky top-0 h-screen z-40 select-none transition-colors">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Brand Header */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-xs">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1">
                Project<span className="text-primary">Hive</span>
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                Admin Console
              </p>
            </div>
          </div>

          {/* Operational Status Indicator */}
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                Services Active
              </span>
            </div>
            <Radio className="w-3 h-3 text-emerald-500/70" />
          </div>
        </div>

        {/* Navigation Items (Scrollable if needed) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const isSupport = item.href === '/admin/support';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                  isActive
                    ? 'bg-primary/15 text-primary font-bold border border-primary/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {isSupport && unreadSupportCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 animate-pulse shrink-0">
                    {unreadSupportCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Clearance & Portal Exit */}
        <div className="p-3 border-t border-border shrink-0 space-y-2 bg-muted/20">
          <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {user?.first_name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  Super Administrator
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active clearance" />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border border-border"
              title="Return to Student Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Student App</span>
            </Link>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center justify-center p-2 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-500/20"
              title="Terminate Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
