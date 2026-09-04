'use client';
// ─── Teams Page ────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Lock, Globe, CheckCircle, Clock, X, AlertCircle, RefreshCw, Video } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useCallStore } from '@/lib/callStore';
import { useSocket } from '@/hooks/useSocket';
import { cn, getInitials, getAvatarColor, timeAgo, parseDescription } from '@/lib/utils';
import type { Team } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  recruiting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function TeamCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-full" />
        <div className="h-3.5 bg-muted rounded w-4/5" />
      </div>

      {/* Skills */}
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-muted rounded-md" />
        <div className="h-5 w-16 bg-muted rounded-md" />
        <div className="h-5 w-12 bg-muted rounded-md" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-7 w-16 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

function TeamCard({
  team,
  currentUserId,
  onJoin,
  onStartCall,
}: {
  team: Team;
  currentUserId: string;
  onJoin: (id: string) => void;
  onStartCall?: (team: Team) => void;
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
      className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/teams/${team.id}`} className="shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs hover:opacity-90 transition-opacity"
            style={{ backgroundColor: team.avatar_color || getAvatarColor(team.id) }}
          >
            {getInitials(team.name)}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/teams/${team.id}`} className="hover:text-primary transition-colors">
              <h3 className="font-bold text-base text-foreground truncate cursor-pointer hover:underline">{team.name}</h3>
            </Link>
            {team.is_private
              ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              : <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full inline-block mt-0.5', STATUS_COLORS[team.status] ?? STATUS_COLORS.active)}>
            {team.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {parseDescription(team.description)}
        </p>
      )}

      {/* Skills */}
      {team.required_skills && team.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.required_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-[10px] uppercase tracking-wider bg-secondary/80 text-secondary-foreground px-2.5 py-0.5 rounded-full font-semibold">
              {skill}
            </span>
          ))}
          {team.required_skills.length > 4 && (
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 font-medium">+{team.required_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{team.member_count ?? 0}{team.max_members || (team as any).max_size ? `/${team.max_members || (team as any).max_size}` : ''} members</span>
        </div>

        {isLeader || team.is_member ? (
          <div className="flex items-center gap-2">
            {onStartCall && (
              <button
                onClick={() => onStartCall(team)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 tap-press transition-colors shadow-xs"
                title="Start LiveKit Group Call"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Call Team</span>
              </button>
            )}
            <span
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-semibold',
                isLeader
                  ? 'text-primary bg-primary/10'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              )}
            >
              {isLeader ? 'Leader' : 'Joined'}
            </span>
          </div>
        ) : team.has_pending_request ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-semibold">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining || team.status === 'completed'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 tap-press transition-colors shadow-xs"
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
  const { startCall: triggerLiveKitCall } = useCallStore();
  const socket = useSocket();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStartTeamCall = (team: Team) => {
    triggerLiveKitCall({
      scope: 'team',
      targetId: team.id,
      callType: 'video',
      targetTeam: team,
      socketEmit: (ev, data) => socket.socket?.emit(ev, data),
    });
  };

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, mine] = await Promise.all([api.teams.list(), api.teams.myTeams()]);
      if (all.ok && all.teams) {
        const mapped = all.teams.map((t: any) => ({ ...t, max_members: t.max_members || t.max_size }));
        setTeams(mapped);
      }
      if (mine.ok && mine.teams) {
        const mapped = mine.teams.map((t: any) => ({ ...t, max_members: t.max_members || t.max_size }));
        setMyTeams(mapped);
      }
      if (!all.ok && !mine.ok) {
        setError(all.error || mine.error || 'Failed to load teams');
      }
    } catch (e: any) {
      setError(e?.message || 'An unexpected error occurred while loading teams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground text-sm">Find your squad or create a new one</p>
        </div>
        <Link
          href="/teams/create"
          className="flex items-center justify-center gap-2 h-11 sm:h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 tap-press transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Team
        </Link>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams by name, description, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-10 text-base sm:text-sm bg-card/90 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground tap-press"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-border/60 overflow-hidden bg-card/90 h-12 shrink-0 p-1 gap-1 shadow-2xs">
          {(['discover', 'mine'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 sm:flex-none px-4 sm:px-5 h-full text-xs sm:text-sm font-semibold rounded-lg tap-press transition-all flex items-center justify-center',
                tab === t ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {t === 'discover' ? `All Teams (${teams.length})` : `My Teams (${myTeams.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={loadTeams}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive/25 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {/* Grid / Skeletons */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card border border-border/60 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {search
              ? 'No matching teams'
              : tab === 'mine'
              ? "You haven't joined any teams yet"
              : 'No teams available'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-5">
            {search
              ? 'Try adjusting your search terms or filter criteria.'
              : tab === 'mine'
              ? 'Browse open squads to join projects, or start your own team now.'
              : 'Be the pioneer to assemble a team for hackathons or open-source.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {tab === 'mine' && (
              <button
                onClick={() => { setTab('discover'); setSearch(''); }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Browse All Teams
              </button>
            )}
            <Link
              href="/teams/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create a Team
            </Link>
          </div>
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              currentUserId={user?.id ?? ''}
              onJoin={handleJoin}
              onStartCall={handleStartTeamCall}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
