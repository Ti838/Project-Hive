'use client';

import React from 'react';
import { ShieldCheck, Activity, GitPullRequest, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import type { ProjectHealthMetrics } from '@/types';

interface Props {
  health: ProjectHealthMetrics | null;
  loading?: boolean;
}

export function ProjectHealthScore({ health, loading }: Props) {
  if (loading || !health) {
    return (
      <div className="bg-card border border-border/70 rounded-xl p-5 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
    );
  }

  const { overallScore, status, breakdown, stats } = health;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-card border border-border/70 rounded-xl p-5 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Project Health & CI/CD Analytics</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time developer velocity, CI stability, issue turnaround & repository quality.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-2 ${getScoreColor(overallScore)}`}>
            <ShieldCheck className="w-4 h-4" />
            <span>Score: {overallScore}/100</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground/80 border border-border/60">
            {status}
          </span>
        </div>
      </div>

      {/* Metric Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(breakdown).map(([key, item]) => (
          <div key={key} className="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/80 font-medium">{item.label}</span>
              <span className="font-semibold text-foreground">{item.score}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.score)}`}
                style={{ width: `${Math.min(100, Math.max(5, item.score))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Snapshot Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
          <div className="text-lg font-bold text-foreground">{stats.stars}</div>
          <div className="text-[11px] text-muted-foreground">GitHub Stars</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
          <div className="text-lg font-bold text-foreground">{stats.forks}</div>
          <div className="text-[11px] text-muted-foreground">Forks</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
          <div className="text-lg font-bold text-foreground">{stats.openIssues}</div>
          <div className="text-[11px] text-muted-foreground">Open Issues</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
          <div className="text-lg font-bold text-foreground">{stats.recentCommitsCount}</div>
          <div className="text-[11px] text-muted-foreground">Recent Commits</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
          <div className="text-lg font-bold text-foreground">{stats.ciRunsCount}</div>
          <div className="text-[11px] text-muted-foreground">CI Workflows</div>
        </div>
      </div>
    </div>
  );
}

