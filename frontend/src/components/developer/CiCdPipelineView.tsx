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
          <div key={n} className="bg-[#111216] border border-border/40 rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-[#111216] border border-border/60 rounded-xl p-12 text-center text-text-muted">
        <Terminal className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
        <p className="text-sm">No GitHub Actions workflow runs found.</p>
        <p className="text-xs text-text-muted mt-1">Add a .github/workflows YAML to enable CI/CD pipelines.</p>
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
            className="bg-[#111216] hover:bg-card-bg/60 border border-border/50 hover:border-border rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : isFailed ? (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : isRunning ? (
                <PlayCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{run.name}</span>
                  <span className={`px-2 py-0.5 text-[11px] rounded-full border font-medium ${
                    isSuccess
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isFailed
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {run.conclusion || run.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted mt-1 flex-wrap">
                  <span className="truncate max-w-sm text-text-secondary">{run.commitMessage || 'Automated build'}</span>
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
                <span className="text-xs text-text-muted font-mono">
                  {Math.round(run.durationMs / 1000)}s
                </span>
              )}

              <a
                href={run.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-secondary/50 hover:bg-secondary rounded-lg border border-border/40 transition-colors"
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
