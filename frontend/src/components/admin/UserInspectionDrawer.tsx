'use client';

import React from 'react';
import { X, CheckCircle2, MapPin, Laptop, RefreshCw, ShieldAlert, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface UserInspectionDrawerProps {
  user: any;
  onClose: () => void;
  inspectingSessions: any[];
  loadingUserSessions: boolean;
  handleAdminRevokeSession: (sessionId: string) => void;
  onOpenStrikesModal: (u: User) => void;
  handleToggleBan: (u: User) => void;
}

export function UserInspectionDrawer({
  user,
  onClose,
  inspectingSessions,
  loadingUserSessions,
  handleAdminRevokeSession,
  onOpenStrikesModal,
  handleToggleBan,
}: UserInspectionDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {user.first_name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <span>
                  {user.first_name} {user.last_name}
                </span>
                {user.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Overview Card */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Academic & Institutional Status
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">University</span>
              <span className="text-foreground font-semibold">{user.university || 'General Campus'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Department / Major</span>
              <span className="text-foreground font-semibold">{user.major || 'Computer Science'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Security Role</span>
              <span className="text-primary font-mono font-bold uppercase">{user.role || 'student'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Account Status</span>
              <span className={user.is_banned ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                {user.is_banned ? 'BANNED' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Network Identity */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Geographical & Network Attribution
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Last Seen IP</span>
              <span className="text-foreground font-mono">{user.lastLoginIp || user.last_login_ip || '127.0.0.1'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Location Region</span>
              <span className="text-foreground">
                {user.lastLoginCity || user.last_login_city || 'Campus'},{' '}
                {user.lastLoginCountry || user.last_login_country || 'Network'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Primary OS</span>
              <span className="text-foreground font-mono">{user.lastLoginOs || user.last_login_os || 'Desktop OS'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Primary Browser</span>
              <span className="text-foreground font-mono">
                {user.lastLoginBrowser || user.last_login_browser || 'Web Browser'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Device Active Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-primary" /> Active Authenticated Sessions
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {inspectingSessions.length} Devices
            </span>
          </div>

          {loadingUserSessions ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
              Querying session tokens...
            </div>
          ) : inspectingSessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/20 border border-border text-center text-xs text-muted-foreground">
              No active session tokens found in registry.
            </div>
          ) : (
            <div className="space-y-2">
              {inspectingSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3 text-xs shadow-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                      <span>{s.device_model || 'Device'}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ({s.os_name || 'OS'} · {s.browser_name || 'Browser'})
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      IP: {s.ip_address} {s.city ? `· ${s.city}, ${s.country}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAdminRevokeSession(s.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    title="Administratively terminate session token"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Disciplinary Actions */}
        <div className="pt-4 border-t border-border flex items-center gap-3">
          <button
            onClick={() => {
              const u = user;
              onClose();
              onOpenStrikesModal(u);
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Issue Strike</span>
          </button>
          <button
            onClick={() => {
              const u = user;
              onClose();
              handleToggleBan(u);
            }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer',
              user.is_banned
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border-rose-500/30'
            )}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{user.is_banned ? 'Unban User' : 'Ban User'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
