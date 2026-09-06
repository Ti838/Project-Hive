'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock, PlayCircle, ExternalLink, GitBranch, Terminal } from 'lucide-react';
import type { GitHubWorkflowRun } from '@/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  actions: GitHubWorkflowRun[];
  loading?: boolean;
}

export function CiCdPipelineView({ actions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="bg-card border border-border/50 rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-card border border-border/70 rounded-xl p-12 text-center text-muted-foreground">
        <Terminal className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-sm">No GitHub Actions workflow runs found.</p>
        <p className="text-xs text-muted-foreground mt-1">Add a .github/workflows YAML to enable CI/CD pipelines.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {actions.map(run => {
        const isSuccess = run.conclusion === 'success';
        const isFailed = run.conclusion === 'failure';
        const isRunning = run.status === 'in_progress';

        return (
          <div
            key={run.id}
            className="bg-card hover:bg-muted/40 border border-border/60 hover:border-border rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : isFailed ? (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : isRunning ? (
                <PlayCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{run.name}</span>
                  <span className={`px-2 py-0.5 text-[11px] rounded-full border font-medium ${
                    isSuccess
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : isFailed
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    {run.conclusion || run.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="truncate max-w-sm text-foreground/80">{run.commitMessage || 'Automated build'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <GitBranch className="w-3 h-3" />
                    {run.branch}
                  </span>
                  <span>•</span>
                  <span>{timeAgo(run.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              {run.durationMs > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round(run.durationMs / 1000)}s
                </span>
              )}

              <a
                href={run.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg border border-border/60 transition-colors"
              >
                <span>Logs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

