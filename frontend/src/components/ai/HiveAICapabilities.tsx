'use client';
// ─── Hive AI Capabilities Selector ──────────────────────────────────────────
// Clean, minimal segmented switcher for all 11 intelligence modes

import {
  FolderKanban, Lightbulb, ShieldAlert, BookOpen, FileText,
  Code2, Layers, Activity, Users, Award, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

interface HiveAICapabilitiesProps {
  activeCapability: HiveAICapabilityType;
  onSelectCapability: (cap: HiveAICapabilityType) => void;
  variant?: 'pills' | 'sidebar' | 'grid';
  className?: string;
}

export const CAPABILITY_ITEMS: Array<{
  id: HiveAICapabilityType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  category: 'Build' | 'Analyze' | 'Docs & Code' | 'Growth';
}> = [
  {
    id: 'project_generator',
    label: 'Project Generator',
    shortLabel: 'Generator',
    icon: FolderKanban,
    description: 'Synthesize complete MVP blueprints, tech stacks & roadmap',
    category: 'Build',
  },
  {
    id: 'idea_analyzer',
    label: 'Idea Analyzer',
    shortLabel: 'Analyzer',
    icon: Lightbulb,
    description: 'Score innovation, technical feasibility & market fit',
    category: 'Analyze',
  },
  {
    id: 'project_critic',
    label: 'Project Critic',
    shortLabel: 'Critic',
    icon: ShieldAlert,
    description: 'Rigorous architectural, security & scalability review',
    category: 'Analyze',
  },
  {
    id: 'research_assistant',
    label: 'Research Assistant',
    shortLabel: 'Research',
    icon: BookOpen,
    description: 'Technical investigations & trade-off comparisons',
    category: 'Analyze',
  },
  {
    id: 'documentation_ai',
    label: 'Documentation AI',
    shortLabel: 'Docs Gen',
    icon: FileText,
    description: 'Generate production GitHub READMEs, API specs & guides',
    category: 'Docs & Code',
  },
  {
    id: 'code_assistant',
    label: 'Code Assistant',
    shortLabel: 'Code & Debug',
    icon: Code2,
    description: 'Bug diagnosis, schema generation & unit tests',
    category: 'Docs & Code',
  },
  {
    id: 'architecture_design',
    label: 'System Architecture',
    shortLabel: 'Architecture',
    icon: Layers,
    description: 'System topology, ER models, caching & event loops',
    category: 'Build',
  },
  {
    id: 'project_health',
    label: 'Project Health',
    shortLabel: 'Health Score',
    icon: Activity,
    description: 'Sprint blocker detection & delivery risk alerts',
    category: 'Growth',
  },
  {
    id: 'team_ai',
    label: 'Team Matcher',
    shortLabel: 'Team Gaps',
    icon: Users,
    description: 'Skill matrix analysis & missing role discovery',
    category: 'Growth',
  },
  {
    id: 'career_ai',
    label: 'Career Advisor',
    shortLabel: 'Career Pitch',
    icon: Award,
    description: 'YC elevator pitch & resume impact bullet points',
    category: 'Growth',
  },
  {
    id: 'copilot_chat',
    label: 'Engineering Copilot',
    shortLabel: 'Copilot Chat',
    icon: MessageSquare,
    description: 'Multimodal pair programming with screenshot vision',
    category: 'Docs & Code',
  },
];

export function HiveAICapabilities({
  activeCapability,
  onSelectCapability,
  variant = 'pills',
  className,
}: HiveAICapabilitiesProps) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-4 text-xs select-none', className)}>
        {['Build', 'Analyze', 'Docs & Code', 'Growth'].map((cat) => {
          const items = CAPABILITY_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {cat}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = activeCapability === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectCapability(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-all tap-press',
                        active
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default: Horizontal Scrollable Pills
  return (
    <div className={cn('overflow-x-auto scrollbar-none py-1.5 select-none touch-momentum', className)}>
      <div className="flex items-center gap-1.5 min-w-max px-1">
        {CAPABILITY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeCapability === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCapability(item.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tap-press',
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

