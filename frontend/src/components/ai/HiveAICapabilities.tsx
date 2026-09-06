'use client';
// ─── Hive AI Capabilities Selector & Modal Command Picker ───────────────────
// Minimal, glassmorphism mode selector with categorized matrix & instant switching

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Lightbulb, ShieldAlert, BookOpen, FileText,
  Code2, Layers, Activity, Users, Award, MessageSquare,
  Search, X, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

export const CAPABILITY_ITEMS: Array<{
  id: HiveAICapabilityType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  category: 'Build' | 'Analyze' | 'Docs & Code' | 'Growth';
  badge?: string;
}> = [
  {
    id: 'project_generator',
    label: 'Project Generator',
    shortLabel: 'Generator',
    icon: FolderKanban,
    description: 'Synthesize complete MVP blueprints, tech stacks & roadmap',
    category: 'Build',
    badge: 'Popular',
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
    id: 'idea_analyzer',
    label: 'Idea Analyzer',
    shortLabel: 'Idea Analyzer',
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
    id: 'code_assistant',
    label: 'Code Assistant',
    shortLabel: 'Code & Debug',
    icon: Code2,
    description: 'Bug diagnosis, schema generation & unit tests',
    category: 'Docs & Code',
    badge: 'Fast',
  },
  {
    id: 'copilot_chat',
    label: 'Engineering Copilot',
    shortLabel: 'Copilot',
    icon: MessageSquare,
    description: 'Multimodal pair programming with screenshot vision',
    category: 'Docs & Code',
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
];

const CATEGORIES = ['All', 'Build', 'Analyze', 'Docs & Code', 'Growth'] as const;

interface HiveAICapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCapability: HiveAICapabilityType;
  onSelectCapability: (cap: HiveAICapabilityType) => void;
}

export function HiveAICapabilitiesModal({
  isOpen,
  onClose,
  activeCapability,
  onSelectCapability,
}: HiveAICapabilitiesModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[number]>('All');

  if (!isOpen) return null;

  const filtered = CAPABILITY_ITEMS.filter((item) => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSearch =
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-card/95 border border-border/80 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                  Select Hive AI Mode
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Choose from 11 specialized engineering intelligence engines
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors tap-press"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="p-4 border-b border-border/60 space-y-3 bg-background/50">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modes by name, keyword or skill…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/60 border border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all tap-press',
                    selectedCat === cat
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Grid List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No AI mode found matching &ldquo;{search}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filtered.map((item) => {
                  const Icon = item.icon;
                  const active = activeCapability === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectCapability(item.id);
                        onClose();
                      }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-2xl border text-left transition-all tap-press group cursor-pointer relative overflow-hidden',
                        active
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                          : 'border-border/70 bg-card/60 hover:border-primary/40 hover:bg-accent/40'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-xl shrink-0 transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground tracking-tight truncate">
                            {item.label}
                          </p>
                          {item.badge && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface HiveAICapabilitiesProps {
  activeCapability: HiveAICapabilityType;
  onSelectCapability: (cap: HiveAICapabilityType) => void;
  variant?: 'pills' | 'grid';
  className?: string;
}

export function HiveAICapabilities({
  activeCapability,
  onSelectCapability,
  variant = 'pills',
  className,
}: HiveAICapabilitiesProps) {
  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3', className)}>
        {CAPABILITY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeCapability === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCapability(item.id)}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all tap-press group cursor-pointer relative',
                active
                  ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                  : 'border-border/70 bg-card hover:border-primary/40 hover:bg-accent/40'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl shrink-0 transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-foreground tracking-tight truncate">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Sleek Pills
  return (
    <div className={cn('overflow-x-auto scrollbar-none py-1 select-none touch-momentum', className)}>
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


