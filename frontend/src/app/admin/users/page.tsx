'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Trash2,
  Award,
  MoreVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { User, UserStrike } from '@/types';
import { UserStrikesModal } from '@/components/admin/UserStrikesModal';
import { UserInspectionDrawer } from '@/components/admin/UserInspectionDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'ban' | 'role' | 'delete';
    user: User;
    newRole?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    } catch {
      console.error('Failed to revoke session');
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

  const handleExecuteConfirm = async () => {
    if (!confirmDialog) return;
    setActionLoading(true);
    try {
      if (confirmDialog.type === 'ban') {
        const isBanning = !confirmDialog.user.is_banned;
        await api.admin.banUser(
          confirmDialog.user.id,
          isBanning,
          isBanning ? 'Administrative ban via User Matrix' : undefined
        );
      } else if (confirmDialog.type === 'role' && confirmDialog.newRole) {
        await api.admin.changeRole(confirmDialog.user.id, confirmDialog.newRole);
      } else if (confirmDialog.type === 'delete') {
        await api.admin.deleteUser(confirmDialog.user.id);
      }
      setConfirmDialog(null);
      fetchUsers();
    } catch (err) {
      console.error('Operation failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Search Controls ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Directory & Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total of {total} registered students and staff. Manage roles, review strikes, and inspect telemetry.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, email, major..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
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
            className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
            className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          <button
            type="submit"
            className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ─── User Table Matrix ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">University & Major</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-mono text-xs">Querying Authority Records...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-xs">No users matching search filters</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {u.first_name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate flex items-center gap-1.5">
                            <span>{u.first_name} {u.last_name}</span>
                            {u.is_verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* University & Major */}
                    <td className="py-3.5 px-4">
                      <p className="text-foreground truncate">{u.university || 'General Campus'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.major || 'Computer Science'}</p>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider',
                          u.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        )}
                      >
                        {u.role || 'student'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider',
                          u.is_banned
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {u.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectUser(u)}
                          className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-medium transition-colors cursor-pointer"
                          title="Inspect telemetry & sessions"
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          onClick={() => openStrikesModal(u)}
                          className="px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="View strikes & infractions"
                        >
                          Strikes
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              type: 'ban',
                              user: u,
                            })
                          }
                          className={cn(
                            'p-1.5 rounded-lg border text-xs transition-colors cursor-pointer',
                            u.is_banned
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                          )}
                          title={u.is_banned ? 'Restore platform access' : 'Ban user account'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              type: 'delete',
                              user: u,
                            })
                          }
                          className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Permanently delete user"
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

        {/* ─── Pagination Footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {users.length} of {total} registered users
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-foreground font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modals & Drawers ───────────────────────────────────────────── */}
      {inspectingUser && (
        <UserInspectionDrawer
          user={inspectingUser}
          onClose={() => setInspectingUser(null)}
          inspectingSessions={inspectingSessions}
          loadingUserSessions={loadingUserSessions}
          handleAdminRevokeSession={handleAdminRevokeSession}
          onOpenStrikesModal={openStrikesModal}
          handleToggleBan={(u) =>
            setConfirmDialog({
              type: 'ban',
              user: u,
            })
          }
        />
      )}

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

      {/* ─── Accessible Confirmation Dialog ─────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleExecuteConfirm}
        title={
          confirmDialog?.type === 'ban'
            ? confirmDialog.user.is_banned
              ? 'Restore Platform Access'
              : 'Ban User Account'
            : confirmDialog?.type === 'delete'
            ? 'Delete User Account'
            : 'Change User Role'
        }
        description={
          confirmDialog?.type === 'ban'
            ? confirmDialog.user.is_banned
              ? `Are you sure you want to restore platform access for ${confirmDialog.user.first_name} ${confirmDialog.user.last_name}?`
              : `Are you sure you want to suspend and ban ${confirmDialog.user.first_name} ${confirmDialog.user.last_name}? They will immediately lose platform access.`
            : confirmDialog?.type === 'delete'
            ? `WARNING: This action is irreversible. All profile data, team associations, and messages for ${confirmDialog?.user.first_name} ${confirmDialog?.user.last_name} will be permanently purged.`
            : `Update security role for ${confirmDialog?.user.first_name} to ${confirmDialog?.newRole?.toUpperCase()}?`
        }
        confirmText={
          confirmDialog?.type === 'delete'
            ? 'Delete User'
            : confirmDialog?.type === 'ban'
            ? confirmDialog.user.is_banned
              ? 'Restore Access'
              : 'Ban Account'
            : 'Update Role'
        }
        variant={confirmDialog?.type === 'delete' ? 'danger' : 'warning'}
        requiredMatchText={confirmDialog?.type === 'delete' ? 'DELETE' : undefined}
        isLoading={actionLoading}
      />
    </div>
  );
}
