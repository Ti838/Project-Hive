'use client';
// ─── Hive AI Header Component ────────────────────────────────────────────────
// Minimal, premium intelligence status bar

import { Sparkles, Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

interface HiveAIHeaderProps {
  activeCapability: HiveAICapabilityType;
  modelName?: string;
  providerName?: string;
  isProcessing?: boolean;
  onClearSession?: () => void;
  className?: string;
}

const CAPABILITY_LABELS: Record<HiveAICapabilityType, { title: string; subtitle: string }> = {
  project_generator: { title: 'Project Generator', subtitle: 'Architecture & MVP Blueprinting' },
  idea_analyzer: { title: 'Idea Analyzer', subtitle: 'Novelty & Technical Feasibility Assessment' },
  project_critic: { title: 'Project Critic', subtitle: 'Code, Security & Scalability Review' },
  research_assistant: { title: 'Research Assistant', subtitle: 'Tech Deep-Dives & Trade-Off Matrices' },
  documentation_ai: { title: 'Documentation AI', subtitle: 'README, API Spec & Setup Guides' },
  code_assistant: { title: 'Code Assistant', subtitle: 'Debugging, Schema & Test Generation' },
  architecture_design: { title: 'System Architecture', subtitle: 'Topology, ER Modeling & Caching' },
  project_health: { title: 'Project Health', subtitle: 'Sprint Blockers & Delivery Trajectory' },
  team_ai: { title: 'Team Matcher', subtitle: 'Skill Matrix & Missing Role Discovery' },
  career_ai: { title: 'Career Advisor', subtitle: 'Portfolio Bullets & Technical Pitches' },
  copilot_chat: { title: 'Engineering Copilot', subtitle: 'Multimodal Pair Programming' },
};

export function HiveAIHeader({
  activeCapability,
  modelName = 'Llama-3.3-70B',
  providerName = 'Groq Cloud',
  isProcessing = false,
  onClearSession,
  className,
}: HiveAIHeaderProps) {
  const current = CAPABILITY_LABELS[activeCapability] || CAPABILITY_LABELS.copilot_chat;

  return (
    <header className={cn(
      'px-4 sm:px-6 py-3.5 border-b border-border/80 bg-card/60 backdrop-blur-md flex items-center justify-between gap-4 select-none',
      className
    )}>
      {/* Left: Hive AI Brand & Active Capability */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
          <Sparkles className={cn("w-4 h-4", isProcessing && "animate-spin")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-sm tracking-tight text-foreground truncate">
              {current.title}
            </h2>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
              Hive AI
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Engine Telemetry & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-[11px] font-mono text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{providerName}</span>
          <span className="text-border">·</span>
          <span className="text-foreground font-semibold">{modelName}</span>
        </div>

        {onClearSession && (
          <button
            type="button"
            onClick={onClearSession}
            className="px-2.5 py-1 rounded-lg border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent tap-press transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </header>
  );
}
