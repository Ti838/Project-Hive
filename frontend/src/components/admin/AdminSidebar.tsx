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
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Security & Access', href: '/admin/security', icon: Shield },
  { name: 'Content Moderation', href: '/admin/moderation', icon: ShieldAlert },
  { name: 'Squads & Teams', href: '/admin/teams', icon: Layers },
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
    <aside className="hidden lg:flex w-64 shrink-0 bg-[#090d16] border-r border-white/[0.08] flex-col justify-between sticky top-0 h-screen z-40 select-none">
      <div>
        {/* Top Brand Header */}
        <div className="p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                Project<span className="text-amber-400">Hive</span>
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Admin Console
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
                Services Active
              </span>
            </div>
            <Radio className="w-3 h-3 text-emerald-400/70" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
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
                    ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {isSupport && unreadSupportCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {unreadSupportCount}
                  </span>
                )}

                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400/60" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card & Sign Out */}
      <div className="p-3 border-t border-white/[0.08] bg-[#070a10]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {user?.email || 'admin@projecthive.app'}
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            ADMIN
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Student App</span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
