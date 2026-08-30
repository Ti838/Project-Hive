'use client';
// ─── Teams Page ────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Lock, Globe, CheckCircle, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, getInitials, getAvatarColor, timeAgo } from '@/lib/utils';
import type { Team } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  recruiting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function TeamCard({ team, currentUserId, onJoin }: {
  team: Team;
  currentUserId: string;
  onJoin: (id: string) => void;
}) {
  const [joining, setJoining] = useState(false);
  const isLeader = team.leader_id === currentUserId;

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(team.id);
    setJoining(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
          style={{ backgroundColor: team.avatar_color || getAvatarColor(team.id) }}
        >
          {getInitials(team.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{team.name}</h3>
            {team.is_private
              ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              : <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[team.status] ?? STATUS_COLORS.active)}>
            {team.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
      )}

      {/* Skills */}
      {team.required_skills && team.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.required_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              {skill}
            </span>
          ))}
          {team.required_skills.length > 4 && (
            <span className="text-xs text-muted-foreground px-2 py-0.5">+{team.required_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{team.member_count ?? 0}{team.max_members ? `/${team.max_members}` : ''} members</span>
        </div>

        {isLeader ? (
          <span className="text-xs text-primary font-medium">Your team</span>
        ) : team.is_member ? (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Joined
          </span>
        ) : team.has_pending_request ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining || team.status === 'completed'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {joining ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {team.status === 'completed' ? 'Closed' : 'Join'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.teams.list(), api.teams.myTeams()]).then(([all, mine]) => {
      if (all.ok && all.teams) setTeams(all.teams);
      if (mine.ok && mine.teams) setMyTeams(mine.teams);
    }).finally(() => setLoading(false));
  }, []);

  const handleJoin = async (teamId: string) => {
    const res = await api.teams.join(teamId);
    if (res.ok) {
      setTeams((prev) => prev.map((t) =>
        t.id === teamId ? { ...t, has_pending_request: true } : t
      ));
    }
  };

  const displayed = (tab === 'mine' ? myTeams : teams).filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.required_skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground text-sm">Find your squad or create a new one</p>
        </div>
        <Link href="/teams/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Team
        </Link>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams by name, description, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-border overflow-hidden bg-card">
          {(['discover', 'mine'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('px-4 py-2.5 text-sm font-medium transition-colors', tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
            >
              {t === 'discover' ? `All Teams (${teams.length})` : `My Teams (${myTeams.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">{search ? 'No teams match your search.' : tab === 'mine' ? "You haven't joined any teams yet." : 'No teams available.'}</p>
          {tab === 'mine' && !search && (
            <Link href="/teams" onClick={() => setTab('discover')} className="text-primary text-sm mt-2 inline-block hover:underline">
              Browse all teams →
            </Link>
          )}
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              currentUserId={user?.id ?? ''}
              onJoin={handleJoin}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
