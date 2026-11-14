'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Users,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Team } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Deletion state
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const res = await api.admin.getTeams({
        search: debouncedSearch || undefined,
        limit,
        offset,
      });
      if (res && res.teams) {
        setTeams(res.teams);
        setTotal(res.total || res.teams.length);
      }
    } catch (err) {
      console.error('Failed to load squads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [page, debouncedSearch]);

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      setIsDeleting(true);
      await api.admin.deleteTeam(teamToDelete.id);
      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setTeamToDelete(null);
    } catch (err) {
      console.error('Failed to delete squad', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Squad Roster & Team Governance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total of {total} campus collaboration squads. Oversee membership capacity, leadership roles, and disband squads.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search squads by name, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchTeams}
            className="h-9 px-3 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Teams Data Table ───────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Squad Identity</th>
                <th className="py-3.5 px-4 font-semibold">Leadership</th>
                <th className="py-3.5 px-4 font-semibold">Members</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Created Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-mono text-xs">Loading Squad Roster...</p>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-xs">No squads found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Try adjusting your search query</p>
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                    {/* Squad Identity */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: t.avatar_color || '#f59e0b' }}
                        >
                          {t.name?.[0] || 'T'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {t.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Leader */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium truncate">
                          {(t as any).leader?.first_name
                            ? `${(t as any).leader.first_name} ${(t as any).leader.last_name || ''}`
                            : t.leader_id
                            ? 'Squad Lead'
                            : 'Assigned Lead'}
                        </span>
                      </div>
                    </td>

                    {/* Members & Capacity */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-foreground">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{t.member_count ?? 1} / {t.max_members || 5}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {t.status || 'Active'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teams`}
                          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Open Squad in Workspace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setTeamToDelete(t)}
                          className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Disband squad"
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
            Showing {teams.length} of {total} registered squads
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

      {/* ─── Disband Confirmation Dialog ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(teamToDelete)}
        onClose={() => setTeamToDelete(null)}
        onConfirm={handleConfirmDeleteTeam}
        title="Disband Campus Squad"
        description={`WARNING: Disbanding "${teamToDelete?.name}" will dissolve all member rosters, purge squad channels, and remove its team workspace permanently.`}
        confirmText="Disband Squad"
        variant="danger"
        requiredMatchText="DISBAND"
        isLoading={isDeleting}
      />
    </div>
  );
}
