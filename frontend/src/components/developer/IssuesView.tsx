'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, ExternalLink, Link2, Sparkles, Plus } from 'lucide-react';
import type { GitHubIssue } from '@/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  issues: GitHubIssue[];
  loading?: boolean;
  onLinkTask?: (issue: GitHubIssue) => void;
  onAskAi?: (issue: GitHubIssue) => void;
}

export function IssuesView({ issues, loading, onLinkTask, onAskAi }: Props) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');

  const filteredIssues = issues.filter(i => {
    if (filter === 'all') return true;
    return i.state === filter;
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="bg-card border border-border/50 rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header / Filter Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/60 rounded-xl text-xs">
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'open' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Open ({issues.filter(i => i.state === 'open').length})
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'closed' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Closed ({issues.filter(i => i.state === 'closed').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({issues.length})
          </button>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-card border border-border/70 rounded-xl p-12 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm">No {filter !== 'all' ? filter : ''} issues found.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredIssues.map(issue => {
            const isOpen = issue.state === 'open';

            return (
              <div
                key={issue.id}
                className="bg-card hover:bg-muted/40 border border-border/60 hover:border-border rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {isOpen ? (
                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        {issue.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">#{issue.number}</span>

                      {issue.labels.map(label => (
                        <span
                          key={label.name}
                          className="px-2 py-0.5 text-[11px] rounded-full border border-border/40 font-medium"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                            borderColor: `#${label.color}40`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                      <span>opened {timeAgo(issue.createdAt)} by</span>
                      <span className="font-medium text-foreground/80">{issue.user.username}</span>
                      {issue.commentsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {issue.commentsCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onAskAi && (
                    <button
                      onClick={() => onAskAi(issue)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </button>
                  )}

                  {onLinkTask && (
                    <button
                      onClick={() => onLinkTask(issue)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-foreground/80 bg-secondary/60 hover:bg-secondary rounded-lg border border-border/60 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link Task</span>
                    </button>
                  )}

                  <a
                    href={issue.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
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

