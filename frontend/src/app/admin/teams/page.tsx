'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Users,
  Shield,
  Trash2,
  Lock,
  Globe,
  RefreshCw,
  Award,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Team } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getTeams({ search: search || undefined });
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
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleDeleteTeam = async (t: Team) => {
    if (!window.confirm(`CAUTION: Permanently disband and delete squad "${t.name}"? All squad chats, roles, and member links will be wiped.`)) {
      return;
    }
    try {
      setDeletingId(t.id);
      await api.admin.deleteTeam(t.id);
      fetchTeams();
    } catch (err) {
      console.error('Failed to delete squad', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Search ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b0e14] border border-white/5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Squad Oversight & Campus Hubs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total of {total} campus collaboration squads & student communities. Audit membership and enforce campus team standards.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search squads by name, tag, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* ─── Squads Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 rounded-2xl bg-[#0b0e14] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
          <p className="font-mono text-xs">Querying Campus Squad Nodes...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center text-slate-400 rounded-2xl bg-[#0b0e14] border border-white/5 space-y-2">
          <Layers className="w-10 h-10 mx-auto text-purple-400/40" />
          <h3 className="text-sm font-bold text-white">No Squads Found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or create a new squad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-[#0b0e14] border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {t.name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400">
                        {t.type === 'community' ? 'Campus Community' : 'Hackathon Squad'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0',
                      t.privacy === 'private'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    {t.privacy || 'public'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {t.description || 'No description provided by team leader.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <strong className="text-slate-200">{t.member_count ?? (t as any).membersCount ?? 1}</strong> members
                  </span>

                  {t.open_roles && (Array.isArray(t.open_roles) ? t.open_roles.length > 0 : Number(t.open_roles) > 0) && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300">
                      {Array.isArray(t.open_roles) ? t.open_roles.length : t.open_roles} Open Roles
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <a
                    href={`/teams/${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleDeleteTeam(t)}
                    disabled={deletingId === t.id}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disband</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
