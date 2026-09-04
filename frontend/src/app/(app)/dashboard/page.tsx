'use client';
// ─── Dashboard Page (Ultra-Polished Edition) ───────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FolderKanban, GraduationCap, UserCheck, Plus, ArrowRight,
  Sparkles, Compass, MessageSquare, Trophy, ChevronRight, RefreshCw, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Stats, Post, Team } from '@/types';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: number | string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between card-hover shadow-xs"
    >
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-2xl shrink-0 shadow-inner', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
        </div>
      </div>
      {trend && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          {trend}
        </span>
      )}
    </motion.div>
  );
}

// ─── Quick Action ──────────────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <Link href={href} className={cn(
      'group flex items-center gap-4 p-4 rounded-2xl border border-border/50 dark:border-white/10 bg-card/90 dark:bg-card/60 backdrop-blur-xs',
      'card-hover shadow-xs hover:shadow-md tap-press transition-all duration-200'
    )}>
      <div className={cn('p-3 rounded-xl shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, pRes, tRes] = await Promise.allSettled([
        api.stats(),
        api.posts.list(1, 5),
        api.teams.myTeams(),
      ]);

      let hasSuccess = false;

      if (sRes.status === 'fulfilled' && sRes.value?.ok) {
        setStats(sRes.value as unknown as Stats);
        hasSuccess = true;
      }
      if (pRes.status === 'fulfilled' && pRes.value?.ok && pRes.value.posts) {
        setPosts(pRes.value.posts);
        hasSuccess = true;
      }
      if (tRes.status === 'fulfilled' && tRes.value?.ok && tRes.value.teams) {
        setMyTeams(tRes.value.teams);
        hasSuccess = true;
      }

      // If all three rejected due to total network failure
      if (!hasSuccess && sRes.status === 'rejected' && pRes.status === 'rejected' && tRes.status === 'rejected') {
        setError('Unable to reach the hive network. Please check your connection.');
      }
    } catch (err: any) {
      setError('Unable to reach the hive network. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const name = displayName(user ?? undefined);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ─── Hero Welcome Banner ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-amber-500/10 to-transparent border border-primary/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm"
      >
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> ProjectHive Student Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{user?.first_name ?? 'Student'}</span>! 👋
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ready to find teammates, brainstorm AI-assisted project ideas, and ship your next breakthrough?
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/teams/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 tap-press transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Team
          </Link>
          <Link
            href="/generator"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/80 backdrop-blur-xs border border-border/60 text-sm font-medium hover:bg-accent tap-press transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> AI Studio
          </Link>
        </div>
      </motion.div>

      {/* ─── Network Error Alert ────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-destructive">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 tap-press transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect
          </button>
        </div>
      )}

      {/* ─── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-4 w-full">
                <div className="w-11 h-11 rounded-2xl bg-muted/70 skeleton-shimmer shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-14 rounded-md bg-muted/80 skeleton-shimmer" />
                  <div className="h-3 w-20 rounded-md bg-muted/60 skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard label="Students Active" value={stats?.users ?? 0} icon={Users} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" trend="+Active" />
            <StatCard label="Formed Teams" value={stats?.teams ?? 0} icon={UserCheck} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" trend="Collaborating" />
            <StatCard label="Showcase Projects" value={stats?.projects ?? 0} icon={FolderKanban} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" trend="Live" />
            <StatCard label="Universities" value={stats?.universities ?? 0} icon={GraduationCap} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" trend="Network" />
          </>
        )}
      </div>

      {/* ─── Quick Actions ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Quick Shortcuts</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            href="/teams"
            icon={Users}
            label="Find a Team"
            desc="Join hackathon squads and project groups"
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <QuickAction
            href="/generator"
            icon={Sparkles}
            label="AI Project Studio"
            desc="Generate structured proposals with AI"
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <QuickAction
            href="/showcase"
            icon={FolderKanban}
            label="Explore Showcase"
            desc="Discover projects built by students"
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </div>

      {/* ─── Two-Column: Teams & Feed ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: My Teams */}
        <div className="lg:col-span-5 bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Your Teams</h2>
            <Link href="/teams" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-xl bg-muted/70 skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 bg-muted/80 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-20 bg-muted/60 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">You haven&apos;t joined a team yet</p>
              <Link href="/teams" className="text-xs text-primary font-semibold mt-2 inline-block hover:underline">
                Explore recruiting teams →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTeams.slice(0, 4).map((team) => (
                <Link
                  key={team.id}
                  href={`/teams`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: team.avatar_color || getAvatarColor(team.id) }}
                  >
                    {getInitials(team.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{team.status} · {team.member_count ?? 1} members</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Activity Feed Highlights */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Hive Highlights</h2>
            <Link href="/feed" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              Open feed <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-muted/70 skeleton-shimmer shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3.5 w-24 bg-muted/80 rounded-md skeleton-shimmer" />
                      <div className="h-2.5 w-16 bg-muted/60 rounded-md skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-muted/70 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-3/4 bg-muted/60 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <Compass className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No recent activity yet</p>
              <Link href="/feed" className="text-xs text-primary font-semibold mt-2 inline-block hover:underline">
                Be the first to post →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(post.author?.id ?? 'x') }}
                    >
                      {getInitials(displayName(post.author ?? undefined))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold">{displayName(post.author ?? undefined)}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
