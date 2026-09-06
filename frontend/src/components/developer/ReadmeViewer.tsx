'use client';

import React, { useState } from 'react';
import { BookOpen, ExternalLink, Sparkles, Copy, Check, Terminal } from 'lucide-react';

interface Props {
  content: string;
  repoUrl?: string;
  onAskAi?: (prompt: string) => void;
}

export function ReadmeViewer({ content, repoUrl, onAskAi }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">README.md</span>
        </div>

        <div className="flex items-center gap-2">
          {onAskAi && (
            <button
              onClick={() => onAskAi('Summarize this repository architecture and setup guide based on README')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain with Hive AI</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg border border-border/60 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg border border-border/60 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>

      {/* Rendered Content / Raw Clean Markdown View */}
      <div className="p-6 md:p-8 text-foreground/90 text-sm leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap selection:bg-primary/20">
        {content || 'No README available in this repository.'}
      </div>
    </div>
  );
}

