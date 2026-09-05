'use client';

// ─── Squads & Campus Communities Hub ──────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Lock,
  Globe,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  Video,
  Rocket,
  Landmark,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useCallStore } from '@/lib/callStore';
import { useSocket } from '@/hooks/useSocket';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { JoinRequestModal } from '@/components/teams/JoinRequestModal';
import { cn, getInitials, getAvatarColor, parseDescription } from '@/lib/utils';
import type { Team } from '@/types';

type HubTab = 'squads' | 'communities' | 'mine';

const CATEGORIES = [
  'All',
  'Engineering',
  'AI / Data',
  'Web3',
  'Design',
  'Competitive Programming',
  'General',
];

export default function TeamsHubPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { startCall: triggerLiveKitCall } = useCallStore();
  const socket = useSocket();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<HubTab>('squads');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Teams Data States
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join Flow States
  const [selectedTeamForJoin, setSelectedTeamForJoin] = useState<Team | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [pendingOverrides, setPendingOverrides] = useState<Record<string, boolean>>({});
  const [memberOverrides, setMemberOverrides] = useState<Record<string, boolean>>({});

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Teams according to tab & filters
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'mine') {
        const res = await api.teams.myTeams();
        if (res.ok && res.teams) {
          setMyTeams(res.teams);
        } else {
          setError('Could not load your memberships.');
        }
      } else {
        const typeParam = activeTab === 'communities' ? 'community' : 'team';
        const catParam =
          selectedCategory !== 'All'
            ? activeTab === 'communities'
              ? `community:${selectedCategory}`
              : selectedCategory
            : undefined;

        const res = await api.teams.getAll({
          type: typeParam,
          search: debouncedSearch || undefined,
          category: catParam,
          limit: 30,
        });

        const list: Team[] = Array.isArray(res)
          ? res
          : (res as any)?.teams || [];

        setTeams(list);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while loading squads.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Group Video Calls via LiveKit
  const handleStartTeamCall = (team: Team) => {
    triggerLiveKitCall({
      scope: 'team',
      targetId: team.id,
      callType: 'video',
      targetTeam: team,
      socketEmit: (ev, data) => socket.socket?.emit(ev, data),
    });
  };

  // Trigger Join Request Modal
  const openJoinModal = (team: Team) => {
    setSelectedTeamForJoin(team);
    setIsJoinModalOpen(true);
  };

  // Submit Join Request with pitch message
  const handleJoinSubmit = async (message: string) => {
    if (!selectedTeamForJoin) return;
    const teamId = selectedTeamForJoin.id;

    const res = await api.teams.join(teamId, { message });
    if (res.ok) {
      if (res.joined) {
        // Instantly joined public community
        setMemberOverrides((prev) => ({ ...prev, [teamId]: true }));
      } else {
        // Pending approval by leader
        setPendingOverrides((prev) => ({ ...prev, [teamId]: true }));
      }
    } else {
      throw new Error((res as any)?.error || 'Failed to submit join request');
    }
  };

  // Filter displayed teams for client-side category/search refinements if needed
  const activeList = activeTab === 'mine' ? myTeams : teams;
  const filteredList = activeList.filter((t) => {
    if (activeTab === 'mine') {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    return true; // Already filtered server-side via API parameters
  });

  return (
    <div className="min-h-screen pb-20 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ─── Hero Header & Creation CTA ────────────────────────────────────── */}
      <div className="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
            <Rocket className="w-3.5 h-3.5" />
            <span>Collaboration & Campus Ecosystem</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Squads & Communities Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Form cross-disciplinary hackathon squads, join specialized campus chapters, and build
            production systems with fellow university builders.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/teams/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:bg-primary/90 tap-press transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Squad or Hub</span>
          </Link>
        </div>
      </div>

      {/* ─── Three-Tier Segmented Hub Navigation ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div className="inline-flex p-1.5 rounded-2xl bg-muted/50 border border-border/80 backdrop-blur-md self-start">
          <button
            onClick={() => {
              setActiveTab('squads');
              setSelectedCategory('All');
            }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
              activeTab === 'squads'
                ? 'bg-card text-foreground shadow-sm shadow-black/10 dark:shadow-white/5 border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Rocket className="w-3.5 h-3.5 text-primary" />
            <span>🚀 Active Squads</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('communities');
              setSelectedCategory('All');
            }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
              activeTab === 'communities'
                ? 'bg-card text-foreground shadow-sm shadow-black/10 dark:shadow-white/5 border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Landmark className="w-3.5 h-3.5 text-indigo-500" />
            <span>🏛️ Campus Communities</span>
          </button>

          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
              activeTab === 'mine'
                ? 'bg-card text-foreground shadow-sm shadow-black/10 dark:shadow-white/5 border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>⭐ My Memberships</span>
          </button>
        </div>

        {/* Quick Result Indicator */}
        <div className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing <span className="font-bold text-foreground">{filteredList.length}</span>{' '}
          {activeTab === 'communities' ? 'communities' : 'squads'}
        </div>
      </div>

      {/* ─── Search & Category Pill Strip ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'communities'
                ? 'Search campus communities, tech chapters, or university clubs...'
                : 'Search squads by project name, tech stack, or mission...'
            }
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card/90 border border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/15 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 shadow-xs transition-all outline-hidden"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips (Active for Squads and Communities tabs) */}
        {activeTab !== 'mine' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs shadow-primary/30'
                      : 'bg-card/70 border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Studio Grid Display ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-3xl bg-muted/40 border border-border/40 animate-pulse p-5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-foreground text-base">{error}</h3>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-20 bg-card/40 border border-dashed border-border/80 rounded-3xl p-8 space-y-4">
          <Layers className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {activeTab === 'mine'
                ? "You haven't joined any squads or communities yet"
                : 'No squads or communities match your search'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {activeTab === 'mine'
                ? 'Explore active squads recruiting developers or discover student-run chapters on campus.'
                : 'Try clearing your search term or switching categories to discover more hubs.'}
            </p>
          </div>
          {activeTab === 'mine' ? (
            <button
              onClick={() => setActiveTab('squads')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              Browse Active Squads
            </button>
          ) : (
            (search || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                Clear All Filters
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((team) => {
            const isLeader =
              currentUser?.id === team.leader_id ||
              team.isLeader ||
              team.is_leader ||
              (team as any).myRole === 'leader';
            const isMember =
              memberOverrides[team.id] ||
              isLeader ||
              team.isMember ||
              team.is_member;
            const hasPending =
              pendingOverrides[team.id] ||
              team.hasPendingRequest ||
              team.has_pending_request;
            const isCommunity =
              team.type === 'community' || team.category?.startsWith('community:');
            const cleanCat = team.category?.replace('community:', '') || 'General';
            const members = team.team_members || [];
            const memberCount = team.member_count ?? members.length ?? 0;
            const maxSize = team.max_members || (team as any).max_size || 5;

            return (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="surface-glass rounded-3xl border border-white/10 dark:border-white/5 hover:border-primary/40 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden bg-card/70 backdrop-blur-md group"
              >
                {/* ─── Top Banner & Avatar Header ─── */}
                <div>
                  <div className="h-28 relative bg-linear-to-r from-primary/30 via-indigo-500/20 to-purple-500/20 overflow-hidden">
                    {team.banner_url ? (
                      <img
                        src={team.banner_url}
                        alt={team.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-40"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-accent/15 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" />

                    {/* Type & Privacy Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
                        {team.is_private ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" /> Private
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 text-emerald-400" /> Public
                          </>
                        )}
                      </span>
                    </div>

                    {/* Entity Avatar */}
                    <div className="absolute -bottom-4 left-5">
                      <div
                        className="w-14 h-14 rounded-2xl border-2 border-card flex items-center justify-center text-white font-extrabold text-xl shadow-lg overflow-hidden group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor:
                            team.avatar_color || getAvatarColor(team.id || team.name),
                        }}
                      >
                        {team.avatar_url || team.avatar ? (
                          <img
                            src={team.avatar_url || team.avatar}
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(team.name)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ─── Body Details ─── */}
                  <div className="p-5 pt-6 space-y-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                          {isCommunity ? 'Community' : 'Squad'}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground truncate">
                          {cleanCat}
                        </span>
                      </div>
                      <Link
                        href={`/teams/${team.id}`}
                        className="font-extrabold text-base text-foreground hover:text-primary transition-colors block mt-1 truncate"
                      >
                        {team.name}
                      </Link>
                    </div>

                    {/* Description */}
                    {team.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                        {parseDescription(team.description)}
                      </p>
                    )}

                    {/* Recruiting Pill if open */}
                    {team.status === 'recruiting' || (team as any).is_open ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl w-fit font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Recruiting Members</span>
                      </div>
                    ) : null}

                    {/* Required Skills or Tags */}
                    {team.required_skills && team.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {team.required_skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="text-[10px] font-medium bg-muted/60 text-foreground/80 px-2 py-0.5 rounded-md border border-border/50"
                          >
                            {sk}
                          </span>
                        ))}
                        {team.required_skills.length > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center px-1 font-medium">
                            +{team.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Footer: Stacked Members & Action CTA ─── */}
                <div className="p-5 pt-3 border-t border-border/50 flex items-center justify-between gap-3 bg-muted/20">
                  {/* Stacked Members Preview */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-2 overflow-hidden">
                      {members.slice(0, 3).map((m: any, idx: number) => {
                        const memUser = m.users || m.user || { id: m.user_id };
                        return (
                          <UserAvatar
                            key={m.user_id || idx}
                            user={memUser}
                            size="xs"
                            className="ring-2 ring-card"
                          />
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      <strong className="text-foreground">{memberCount}</strong>
                      {maxSize ? `/${maxSize}` : ''} builders
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* LiveKit Team Video Call */}
                    {isMember && (
                      <button
                        onClick={() => handleStartTeamCall(team)}
                        className="p-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                        title="Start LiveKit Group Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isMember ? (
                      <Link
                        href={`/teams/${team.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 tap-press transition-all shadow-xs"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : hasPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 select-none">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => openJoinModal(team)}
                        disabled={team.status === 'completed'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 tap-press transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCommunity ? 'Join Hub' : 'Join Squad'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Interactive Join Pitch Modal ─────────────────────────────────── */}
      <JoinRequestModal
        team={selectedTeamForJoin}
        isOpen={isJoinModalOpen}
        onClose={() => {
          setIsJoinModalOpen(false);
          setSelectedTeamForJoin(null);
        }}
        onSubmit={handleJoinSubmit}
      />
    </div>
  );
}
