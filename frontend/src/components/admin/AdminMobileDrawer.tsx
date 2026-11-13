'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  X,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_NAV_ITEMS } from './AdminSidebar';

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  user: any;
  unreadSupportCount: number;
  onSignOut: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  pathname,
  user,
  unreadSupportCount,
  onSignOut,
}: AdminMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer menu */}
      <div className="relative w-72 max-w-[85vw] bg-[#0b0e14] border-r border-amber-500/20 h-full flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        <div>
          {/* Drawer Header */}
          <div className="p-4 border-b border-foreground/10 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-inner">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  PROJECT<span className="text-amber-400">HIVE</span>
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                  SEC-LEVEL 4 • MOBILE
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.05]"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Nav Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
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
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all group min-h-[44px]',
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
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

        {/* Mobile Drawer Bottom User Card */}
        <div className="p-3 border-t border-foreground/10 bg-slate-950/50 space-y-2">
          <Link
            href="/feed"
            target="_blank"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.04] border border-foreground/10 text-xs text-slate-300"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Launch Student Shell</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
              OPEN
            </span>
          </Link>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-foreground/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                {user?.first_name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] font-mono text-amber-400 truncate">
                  SUPER_ADMIN
                </p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
