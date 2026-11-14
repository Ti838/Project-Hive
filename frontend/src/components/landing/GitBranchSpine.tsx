'use client';

import React from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  GitCommit, 
  GitMerge, 
  Sparkles, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal 
} from 'lucide-react';

interface GitBranchNodeProps {
  branchName: string;
  commitSha?: string;
  icon?: 'branch' | 'pr' | 'commit' | 'merge' | 'ai' | 'radio' | 'shield' | 'terminal';
  color?: 'emerald' | 'amber' | 'purple' | 'indigo' | 'cyan';
  statusText?: string;
  className?: string;
}

const colorMap = {
  emerald: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    pulse: 'bg-emerald-400',
    line: 'from-emerald-500/50 to-indigo-500/50'
  },
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    pulse: 'bg-amber-400',
    line: 'from-amber-500/50 to-purple-500/50'
  },
  purple: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    pulse: 'bg-purple-400',
    line: 'from-purple-500/50 to-cyan-500/50'
  },
  indigo: {
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    pulse: 'bg-indigo-400',
    line: 'from-indigo-500/50 to-emerald-500/50'
  },
  cyan: {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]',
    pulse: 'bg-cyan-400',
    line: 'from-cyan-500/50 to-amber-500/50'
  }
};

const iconMap = {
  branch: GitBranch,
  pr: GitPullRequest,
  commit: GitCommit,
  merge: GitMerge,
  ai: Sparkles,
  radio: Radio,
  shield: ShieldCheck,
  terminal: Terminal
};

export function GitBranchNode({
  branchName,
  commitSha = '8f4c2e',
  icon = 'branch',
  color = 'indigo',
  statusText = 'active',
  className = ''
}: GitBranchNodeProps) {
  const c = colorMap[color];
  const Icon = iconMap[icon];

  return (
    <div className={`relative flex flex-col items-center justify-center my-8 ${className}`}>
      {/* ── Top Vertical Continuous Spine Line ── */}
      <div className="w-[2px] h-14 bg-gradient-to-b from-transparent via-border to-primary/40 relative">
        <div className={`absolute -left-[1px] top-1/2 w-1 h-3 rounded-full ${c.pulse} opacity-75 blur-[1px] animate-pulse`} />
      </div>

      {/* ── Central Git Commit & Branch Node ── */}
      <div className="relative flex items-center gap-3 z-10">
        {/* Curved branch incoming SVG connector */}
        <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="text-border/80">
            <path
              d="M 48 12 L 24 12 C 12 12, 12 0, 0 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>

        {/* Illuminated Node Badge */}
        <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border ${c.border} ${c.bg} backdrop-blur-xl ${c.glow} transition-all duration-300 hover:scale-105`}>
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-background/80 border border-border shadow-xs">
            <Icon className={`w-3.5 h-3.5 ${c.text}`} />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${c.pulse} animate-ping opacity-75`} />
          </div>

          <span className="font-mono text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
            <span className="text-muted-foreground">branch:</span>
            <span className={c.text}>{branchName}</span>
          </span>

          <span className="text-muted-foreground/40 text-xs">•</span>

          <span className="font-mono text-[11px] text-muted-foreground/80 bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
            {commitSha}
          </span>

          {statusText && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 pl-1 border-l border-border/50">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {statusText}
            </span>
          )}
        </div>

        {/* Curved branch outgoing SVG connector */}
        <div className="hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="text-border/80">
            <path
              d="M 0 12 L 24 12 C 36 12, 36 24, 48 24"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
      </div>

      {/* ── Bottom Vertical Continuous Spine Line ── */}
      <div className="w-[2px] h-14 bg-gradient-to-b from-primary/40 via-border to-transparent" />
    </div>
  );
}
