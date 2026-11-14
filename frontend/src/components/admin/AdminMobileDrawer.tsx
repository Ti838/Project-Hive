'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  X,
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer menu */}
      <div className="relative w-72 max-w-[85vw] bg-card border-r border-border h-full flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-xs">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1">
                  Project<span className="text-primary">Hive</span>
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">
                  Admin Console
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-muted cursor-pointer"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Nav Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
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
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      )}
                    />
                    <span>{item.name}</span>
                    {item.href === '/admin/support' && unreadSupportCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                        {unreadSupportCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer */}
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
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border border-border"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Student App</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="flex items-center justify-center p-2 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-500/20"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
