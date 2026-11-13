'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Trash2,
  Flame,
  Award,
  Clock,
  Laptop,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  LogOut
} from 'lucide-react';
import { api } from '@/lib/api';
import { User, UserStrike } from '@/types';
import { UserStrikesModal } from '@/components/admin/UserStrikesModal';
import { UserInspectionDrawer } from '@/components/admin/UserInspectionDrawer';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected User for Actions / Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingSessions, setInspectingSessions] = useState<any[]>([]);
  const [loadingUserSessions, setLoadingUserSessions] = useState(false);
  const [strikesModalUser, setStrikesModalUser] = useState<User | null>(null);
  const [userStrikes, setUserStrikes] = useState<UserStrike[]>([]);
  const [loadingStrikes, setLoadingStrikes] = useState(false);

  // Issue Strike Form State
  const [strikeReason, setStrikeReason] = useState('');
  const [strikeSeverity, setStrikeSeverity] = useState<'warning' | 'temporary_suspension' | 'permanent_ban'>('warning');
  const [submittingStrike, setSubmittingStrike] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getUsers({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      if (res && res.users) {
        setUsers(res.users);
        setTotal(res.total || res.users.length);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search.trim());
    setPage(1);
  };

  const openStrikesModal = async (u: User) => {
    setStrikesModalUser(u);
    setLoadingStrikes(true);
    setStrikeReason('');
    setStrikeSeverity('warning');
    setActionFeedback(null);
    try {
      const res = await api.admin.getUserStrikes(u.id);
      if (res && res.strikes) {
        setUserStrikes(res.strikes);
      }
    } catch (err) {
      console.error('Failed to load strikes', err);
    } finally {
      setLoadingStrikes(false);
    }
  };

  const handleInspectUser = async (u: any) => {
    setInspectingUser(u);
    setLoadingUserSessions(true);
    try {
      const res = await api.admin.getUserSessions(u.id);
      setInspectingSessions(res?.sessions || []);
    } catch {
      setInspectingSessions([]);
    } finally {
      setLoadingUserSessions(false);
    }
  };

  const handleAdminRevokeSession = async (sessionId: string) => {
    if (!inspectingUser) return;
    try {
      await api.admin.revokeUserSession(inspectingUser.id, sessionId);
      setInspectingSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert('Failed to revoke session');
    }
  };

  const handleIssueStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikesModalUser || !strikeReason.trim()) return;
    try {
      setSubmittingStrike(true);
      const res = await api.admin.issueStrike(strikesModalUser.id, {
        reason: strikeReason,
        severity: strikeSeverity,
      });
      setActionFeedback({
        type: 'success',
        message: res.isBanned
          ? `Strike issued. User reached ${res.totalStrikes} strikes and was automatically banned!`
          : `Strike issued successfully (Total strikes: ${res.totalStrikes}).`,
      });
      setStrikeReason('');
      // Reload strikes & users
      const strikeData = await api.admin.getUserStrikes(strikesModalUser.id);
      if (strikeData?.strikes) setUserStrikes(strikeData.strikes);
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to issue strike',
      });
    } finally {
      setSubmittingStrike(false);
    }
  };

  const handleToggleBan = async (u: User) => {
    const isBanning = !u.is_banned;
    const confirmMsg = isBanning
      ? `Are you sure you want to permanently ban ${u.first_name} ${u.last_name}?`
      : `Restore platform access for ${u.first_name} ${u.last_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.admin.banUser(u.id, isBanning, isBanning ? 'Administrative ban via User Matrix' : undefined);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update ban status', err);
    }
  };

  const handleChangeRole = async (u: User, newRole: string) => {
    if (!window.confirm(`Change ${u.first_name}'s role to ${newRole.toUpperCase()}?`)) return;
    try {
      await api.admin.changeRole(u.id, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Failed to change role', err);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`CAUTION: Permanently delete ${u.first_name} ${u.last_name}? This action is irreversible.`)) return;
    try {
      await api.admin.deleteUser(u.id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Search Controls ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b0e14] border border-foreground/5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            User Directory & Strike Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total of {total} registered campus builders. Manage role assignments, investigate strikes, and enforce bans.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, major..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900/90 border border-foreground/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-slate-900/90 border border-foreground/10 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-slate-900/90 border border-foreground/10 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          <button
            type="submit"
            className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ─── User Table Matrix ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0b0e14] border border-foreground/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/5 bg-white/[0.02] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">University & Major</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Disciplinary Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <p className="font-mono text-xs">Querying Supabase Authority Records...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-xs">No users matching search filters</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.first_name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate flex items-center gap-1.5">
                            <span>{u.first_name} {u.last_name}</span>
                            {u.is_verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* University & Major */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 truncate">{u.university || 'General Campus'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.major || 'Computer Science'}</p>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider',
                          u.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-foreground/5 text-slate-300 border border-foreground/10'
                        )}
                      >
                        {u.role || 'student'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {u.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <Ban className="w-3 h-3" />
                          BANNED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspect Profile & Device Telemetry */}
                        <button
                          onClick={() => handleInspectUser(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Inspect Devices & Sessions"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {/* Issue Strike / Ledger */}
                        <button
                          onClick={() => openStrikesModal(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Manage Infractions & Strikes"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Strikes</span>
                        </button>

                        {/* Ban / Unban */}
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border',
                            u.is_banned
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                          )}
                          title={u.is_banned ? 'Restore User' : 'Ban User'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{u.is_banned ? 'Unban' : 'Ban'}</span>
                        </button>

                        {/* Role Change */}
                        <button
                          onClick={() => handleChangeRole(u, u.role === 'admin' ? 'student' : 'admin')}
                          className="px-2.5 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-slate-300 border border-foreground/10 text-xs font-semibold transition-colors"
                          title="Toggle Admin Privilege"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-foreground/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Strike Ledger & Infraction Modal ──────────────────────────── */}
      {strikesModalUser && (
        <UserStrikesModal
          user={strikesModalUser}
          onClose={() => setStrikesModalUser(null)}
          userStrikes={userStrikes}
          loadingStrikes={loadingStrikes}
          handleIssueStrike={handleIssueStrike}
          strikeReason={strikeReason}
          setStrikeReason={setStrikeReason}
          strikeSeverity={strikeSeverity}
          setStrikeSeverity={setStrikeSeverity}
          submittingStrike={submittingStrike}
          actionFeedback={actionFeedback}
        />
      )}

      {/* ─── User Deep-Inspection & Session Drawer ─────────────────────────── */}
      {inspectingUser && (
        <UserInspectionDrawer
          user={inspectingUser}
          onClose={() => setInspectingUser(null)}
          inspectingSessions={inspectingSessions}
          loadingUserSessions={loadingUserSessions}
          handleAdminRevokeSession={handleAdminRevokeSession}
          onOpenStrikesModal={openStrikesModal}
          handleToggleBan={handleToggleBan}
        />
      )}
    </div>
  );
}

