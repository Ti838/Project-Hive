'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Layers,
  Sliders,
  ScrollText,
  MessageSquare,
  LogOut,
  ExternalLink,
  Shield,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADMIN_NAV_ITEMS = [
  { name: 'Overview / Telemetry', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'User Directory & Strikes', href: '/admin/users', icon: Users },
  { name: 'Security Operations', href: '/admin/security', icon: Shield },
  { name: 'Moderation Queue', href: '/admin/moderation', icon: ShieldAlert },
  { name: 'Squads & Hubs', href: '/admin/teams', icon: Layers },
  { name: 'Support & Helpline', href: '/admin/support', icon: MessageSquare },
  { name: 'System Flags & Health', href: '/admin/system', icon: Sliders },
  { name: 'Audit Ledger', href: '/admin/audit', icon: ScrollText },
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
    <aside className="hidden lg:flex w-64 shrink-0 bg-[#0b0e14] border-r border-foreground/5 flex-col justify-between sticky top-0 h-screen z-40 select-none">
      <div>
        {/* Top Brand Header */}
        <div className="p-4 border-b border-foreground/5 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  PROJECT<span className="text-amber-400">HIVE</span>
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  SEC-LEVEL 4
                </p>
              </div>
            </div>
          </div>

          {/* Status Pulse Bar */}
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
                SYSTEM NORMAL / ONLINE
              </span>
            </div>
            <Radio className="w-3 h-3 text-emerald-400/70" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Command Modules
          </div>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                    )}
                  />
                  <span>{item.name}</span>
                  {item.href === '/admin/support' && unreadSupportCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black animate-pulse">
                      {unreadSupportCount}
                    </span>
                  )}
                </div>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card & Student Shell Link */}
      <div className="p-3 border-t border-foreground/5 bg-slate-950/40 space-y-2">
        <Link
          href="/feed"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-foreground/5 text-xs text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Launch Student Shell</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
            OPEN
          </span>
        </Link>

        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-foreground/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] font-mono text-amber-400/90 truncate">
                SUPER_ADMIN
              </p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Terminate Admin Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

