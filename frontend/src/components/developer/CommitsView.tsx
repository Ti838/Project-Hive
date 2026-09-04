'use client';

import React, { useState } from 'react';
import { GitCommit, Copy, Check, ExternalLink, Sparkles, User as UserIcon } from 'lucide-react';
import type { GitHubCommit } from '@/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  commits: GitHubCommit[];
  loading?: boolean;
  onAskAi?: (prompt: string) => void;
}

export function CommitsView({ commits, loading, onAskAi }: Props) {
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="bg-[#111216] border border-border/40 rounded-xl p-4 h-16" />
        ))}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="bg-[#111216] border border-border/60 rounded-xl p-12 text-center text-text-muted">
        <GitCommit className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
        <p className="text-sm">No commits found for this branch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {commits.map(c => (
        <div
          key={c.sha}
          className="bg-[#111216] hover:bg-card-bg/60 border border-border/50 hover:border-border rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            {c.author.avatarUrl ? (
              <img
                src={c.author.avatarUrl}
                alt={c.author.name}
                className="w-8 h-8 rounded-full border border-border/60 shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">{c.message}</div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                <span className="font-medium text-text-secondary">{c.author.username || c.author.name}</span>
                <span>•</span>
                <span>{timeAgo(c.author.date)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onAskAi && (
              <button
                onClick={() => onAskAi(`Explain what changed in commit "${c.message}" (SHA: ${c.shortSha}) and its likely impact`)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain</span>
              </button>
            )}

            <button
              onClick={() => handleCopySha(c.sha)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-text-secondary bg-secondary/40 hover:bg-secondary rounded-lg border border-border/40 transition-colors"
            >
              {copiedSha === c.sha ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{c.shortSha}</span>
            </button>

            <a
              href={c.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

