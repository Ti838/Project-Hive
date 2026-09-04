'use client';
// ─── Hive AI Thinking & Reasoning Indicator ─────────────────────────────────
// Sleek, restrained thinking animation

import { Sparkles, Loader2, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HiveAIThinkingProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export function HiveAIThinking({
  label = 'Synthesizing with Groq & Gemini AI…',
  sublabel = 'Analyzing engineering context & generating structured artifact',
  className,
}: HiveAIThinkingProps) {
  return (
    <div className={cn('p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xs flex items-center gap-3.5 shadow-xs', className)}>
      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 animate-spin" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold text-xs text-foreground flex items-center gap-2">
          <span>{label}</span>
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {sublabel}
        </p>
      </div>
    </div>
  );
}
