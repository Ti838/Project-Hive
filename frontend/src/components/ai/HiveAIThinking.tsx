'use client';
// ─── Hive AI Thinking & Reasoning Indicator ─────────────────────────────────
// Sleek, restrained thinking animation

import { Sparkles, Loader2, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HiveAIAvatar } from './HiveAIIcon';

interface HiveAIThinkingProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export function HiveAIThinking({
  label = 'Hive AI is thinking…',
  sublabel = 'Analyzing engineering context & generating response',
  className,
}: HiveAIThinkingProps) {
  return (
    <div className={cn('p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xs flex items-center gap-3.5 shadow-xs', className)}>
      <HiveAIAvatar size="md" className="animate-pulse" />
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

