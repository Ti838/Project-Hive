'use client';
// ─── Dashboard Page (Studio-Grade Metric-Driven Architecture) ───────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FolderKanban, GraduationCap, UserCheck, Plus, ArrowRight,
  Sparkles, Compass, MessageSquare, Trophy, ChevronRight, RefreshCw, AlertCircle,
  TrendingUp, Activity, Video, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Stats, Post, Team } from '@/types';

// ─── Studio-Grade Stat Card with Micro-Sparkline & Trend ───────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  progress = 75,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend: string;
  progress?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-glass rounded-2xl p-5 sm:p-6 border border-white/10 dark:border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">{value}</p>
        </div>
        <div className={cn('p-3 rounded-2xl shrink-0 shadow-inner group-hover:scale-105 transition-transform', color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Trend Badge & Micro Progress Sparkline */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>

        {/* Micro progress line */}
        <div className="flex-1 max-w-[70px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Pill ─────────────────────────────────────────────────────────
function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group surface-glass rounded-2xl p-4 sm:p-5 border border-white/10 dark:border-white/5 shadow-lg hover:border-primary/40 tap-press transition-all duration-200 flex items-center gap-4"
    >
      <div className={cn('p-3 rounded-xl shrink-0 shadow-xs group-hover:scale-105 transition-transform', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
          {label}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
      </div>
      <div className="w-8 h-8 rounded-full surface-glass flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
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

      if (!hasSuccess && sRes.status === 'rejected' && pRes.status === 'rejected' && tRes.status === 'rejected') {
        setError('Unable to reach the hive network. Please check your connection.');
      }
    } catch {
      setError('Unable to reach the hive network. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ─── Refined Obsidian Hero Welcome Banner ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl surface-floating border border-white/15 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl backdrop-blur-2xl glow-primary-subtle"
      >
        <div className="space-y-2.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-glass border border-white/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>ProjectHive Engineering Grid</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{user?.first_name ?? 'Student'}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Collaborate with peers across campus, build verified team projects, and brainstorm with multimodal AI intelligence.
          </p>
        </div>

        {/* Hero Quick Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/teams/create"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 tap-press transition-all shadow-lg shadow-primary/25 glow-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create Squad</span>
          </Link>

          <Link
            href="/generator"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl surface-glass border border-white/15 text-xs sm:text-sm font-semibold text-foreground hover:bg-white/10 tap-press transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Studio</span>
          </Link>

          <Link
            href="/showcase"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl surface-glass border border-white/15 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/10 tap-press transition-all"
          >
            <span>Showcase</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* ─── Network Error Alert ────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-destructive shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 tap-press transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect
          </button>
        </div>
      )}

      {/* ─── Studio Metric Cards with Micro-Sparklines ──────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-glass rounded-2xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-muted/70 rounded-md skeleton-shimmer" />
                  <div className="h-8 w-20 bg-muted/80 rounded-md skeleton-shimmer" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-muted/70 skeleton-shimmer shrink-0" />
              </div>
              <div className="h-2 w-full bg-muted/60 rounded-full skeleton-shimmer mt-2" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Active Students"
              value={stats?.users ?? 0}
              icon={Users}
              color="bg-primary/10 text-primary border border-primary/20"
              trend="+14% active"
              progress={84}
            />
            <StatCard
              label="Formed Squads"
              value={stats?.teams ?? 0}
              icon={UserCheck}
              color="bg-blue-500/10 text-blue-400 border border-blue-500/20"
              trend="Collaborating"
              progress={68}
            />
            <StatCard
              label="Showcase Projects"
              value={stats?.projects ?? 0}
              icon={FolderKanban}
              color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              trend="+9 shipped"
              progress={92}
            />
            <StatCard
              label="Universities"
              value={stats?.universities ?? 0}
              icon={GraduationCap}
              color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
              trend="Global Mesh"
              progress={55}
            />
          </>
        )}
      </div>

      {/* ─── Quick Shortcuts ────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Navigation Shortcuts</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <QuickAction
            href="/teams"
            icon={Users}
            label="Join a Squad"
            desc="Explore campus teams & recruiting hackathon squads"
            color="bg-blue-500/10 text-blue-400 border border-blue-500/20"
          />
          <QuickAction
            href="/generator"
            icon={Sparkles}
            label="AI Project Studio"
            desc="Generate blueprints, code schemas & MVP specs"
            color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
          />
          <QuickAction
            href="/showcase"
            icon={FolderKanban}
            label="Project Showcase"
            desc="Discover verified production software built by students"
            color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          />
        </div>
      </div>

      {/* ─── Active Squads & Highlights Grid ────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Active Squads */}
        <div className="lg:col-span-5 surface-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-base text-foreground">Your Squads</h3>
            </div>
            <Link href="/teams" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/5 surface-glass">
                  <div className="w-11 h-11 rounded-xl bg-muted/70 skeleton-shimmer shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-muted/80 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-20 bg-muted/60 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-white/10 rounded-2xl p-4">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              <p className="text-sm font-semibold text-foreground">You haven&apos;t joined a squad yet</p>
              <p className="text-xs text-muted-foreground mt-1">Join an existing squad or create your own</p>
              <Link href="/teams" className="text-xs text-primary font-bold mt-3 inline-block hover:underline">
                Explore recruiting teams →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTeams.slice(0, 4).map((team) => (
                <Link
                  key={team.id}
                  href={`/teams`}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/10 surface-glass hover:border-primary/40 tap-press transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: team.avatar_color || getAvatarColor(team.id) }}
                  >
                    {getInitials(team.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {team.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
                        {team.status || 'Active'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {team.member_count ?? 1} members
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Activity Highlights */}
        <div className="lg:col-span-7 surface-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-base text-foreground">Hive Highlights</h3>
            </div>
            <Link href="/feed" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              Open feed <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/5 surface-glass space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted/70 skeleton-shimmer shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-28 bg-muted/80 rounded-md skeleton-shimmer" />
                      <div className="h-2.5 w-20 bg-muted/60 rounded-md skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 w-full bg-muted/70 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-4/5 bg-muted/60 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-white/10 rounded-2xl p-4">
              <Compass className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              <p className="text-sm font-semibold text-foreground">No recent activity yet</p>
              <Link href="/feed" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">
                Be the first to share an update →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.id}
                  href={`/feed#post-${post.id}`}
                  className="block p-4 rounded-2xl border border-white/10 surface-glass hover:border-primary/40 tap-press transition-all space-y-2 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: getAvatarColor(post.author?.id ?? 'x') }}
                    >
                      {getInitials(displayName(post.author ?? undefined))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {displayName(post.author ?? undefined)}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-10">
                    {post.content}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
