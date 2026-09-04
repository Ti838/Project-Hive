'use client';

import React, { useState } from 'react';
import { GitPullRequest, CheckCircle2, GitMerge, ExternalLink, Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { GitHubPullRequest } from '@/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  pulls: GitHubPullRequest[];
  loading?: boolean;
  onReviewPr: (pr: GitHubPullRequest) => void;
}

export function PullRequestsView({ pulls, loading, onReviewPr }: Props) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');

  const filteredPulls = pulls.filter(p => {
    if (filter === 'all') return true;
    return p.state === filter;
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="bg-[#111216] border border-border/40 rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#111216] border border-border/50 rounded-lg text-xs w-fit">
        <button
          onClick={() => setFilter('open')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filter === 'open' ? 'bg-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Open ({pulls.filter(p => p.state === 'open').length})
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filter === 'closed' ? 'bg-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Merged / Closed ({pulls.filter(p => p.state === 'closed').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filter === 'all' ? 'bg-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          All ({pulls.length})
        </button>
      </div>

      {/* Pull Requests List */}
      {filteredPulls.length === 0 ? (
        <div className="bg-[#111216] border border-border/60 rounded-xl p-12 text-center text-text-muted">
          <GitPullRequest className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
          <p className="text-sm">No pull requests found.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPulls.map(pr => {
            const isMerged = !!pr.mergedAt;
            const isOpen = pr.state === 'open';

            return (
              <div
                key={pr.id}
                className="bg-[#111216] hover:bg-card-bg/60 border border-border/50 hover:border-border rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {isMerged ? (
                    <GitMerge className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  ) : isOpen ? (
                    <GitPullRequest className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <GitPullRequest className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
                        {pr.title}
                      </span>
                      <span className="text-xs text-text-muted font-mono">#{pr.number}</span>
                      {pr.isDraft && (
                        <span className="px-2 py-0.5 text-[10px] rounded-md bg-secondary text-text-muted border border-border/40 font-medium">
                          Draft
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1.5 flex-wrap">
                      <span>opened {timeAgo(pr.createdAt)} by</span>
                      <span className="font-medium text-text-secondary">{pr.user.username}</span>
                      {pr.headBranch && pr.baseBranch && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] bg-secondary/40 px-2 py-0.5 rounded text-text-secondary">
                            <span>{pr.headBranch}</span>
                            <ArrowRight className="w-3 h-3 text-text-muted" />
                            <span>{pr.baseBranch}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onReviewPr(pr)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hive AI Review</span>
                  </button>

                  <a
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-secondary/40 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
