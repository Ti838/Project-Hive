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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0e14] border-l border-foreground/10 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center font-bold text-sm">
              {user.first_name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>
                  {user.first_name} {user.last_name}
                </span>
                {user.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Overview Card */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-foreground/5 space-y-3">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Academic & Institutional Status
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">University</span>
              <span className="text-white font-semibold">{user.university || 'General Campus'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Department / Major</span>
              <span className="text-white font-semibold">{user.major || 'Computer Science'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Security Role</span>
              <span className="text-amber-400 font-mono font-bold uppercase">{user.role || 'student'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Account Status</span>
              <span className={user.is_banned ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {user.is_banned ? 'BANNED' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Network Identity */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-foreground/5 space-y-3">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" /> Geographical & Network Attribution
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Last Seen IP</span>
              <span className="text-white font-mono">{user.lastLoginIp || user.last_login_ip || '127.0.0.1'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Location Region</span>
              <span className="text-white">
                {user.lastLoginCity || user.last_login_city || 'Campus'},{' '}
                {user.lastLoginCountry || user.last_login_country || 'Network'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Primary OS</span>
              <span className="text-white font-mono">{user.lastLoginOs || user.last_login_os || 'Desktop OS'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Primary Browser</span>
              <span className="text-white font-mono">
                {user.lastLoginBrowser || user.last_login_browser || 'Web Browser'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Device Active Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-amber-400" /> Active Authenticated Sessions
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {inspectingSessions.length} Devices
            </span>
          </div>

          {loadingUserSessions ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-amber-400" />
              Querying session tokens...
            </div>
          ) : inspectingSessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/[0.01] border border-foreground/5 text-center text-xs text-slate-400">
              No active session tokens found in registry.
            </div>
          ) : (
            <div className="space-y-2">
              {inspectingSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-foreground/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                      <span>{s.device_model || 'Device'}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({s.os_name || 'OS'} · {s.browser_name || 'Browser'})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      IP: {s.ip_address} {s.city ? `· ${s.city}, ${s.country}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAdminRevokeSession(s.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
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
        <div className="pt-4 border-t border-foreground/10 flex items-center gap-3">
          <button
            onClick={() => {
              const u = user;
              onClose();
              onOpenStrikesModal(u);
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Issue Infraction Strike</span>
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
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30'
            )}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{user.is_banned ? 'Unban Account' : 'Ban Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

