'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp, Heart, Trophy, Lightbulb, Flame, HandHeart
} from 'lucide-react';
import type { ReactionType } from '@/types';
import { cn } from '@/lib/utils';

export interface ReactionConfigItem {
  type: ReactionType;
  label: string;
  icon: typeof ThumbsUp;
  emoji: string;
  color: string;
  hoverBg: string;
  activeBg: string;
}

export const REACTION_CONFIG: ReactionConfigItem[] = [
  {
    type: 'like',
    label: 'Like',
    icon: ThumbsUp,
    emoji: '👍',
    color: 'text-blue-500 fill-blue-500/20',
    hoverBg: 'hover:bg-blue-500/15',
    activeBg: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  },
  {
    type: 'love',
    label: 'Love',
    icon: Heart,
    emoji: '❤️',
    color: 'text-rose-500 fill-rose-500/20',
    hoverBg: 'hover:bg-rose-500/15',
    activeBg: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  },
  {
    type: 'celebrate',
    label: 'Celebrate',
    icon: Trophy,
    emoji: '🎉',
    color: 'text-amber-500 fill-amber-500/20',
    hoverBg: 'hover:bg-amber-500/15',
    activeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  },
  {
    type: 'insightful',
    label: 'Insightful',
    icon: Lightbulb,
    emoji: '💡',
    color: 'text-emerald-500 fill-emerald-500/20',
    hoverBg: 'hover:bg-emerald-500/15',
    activeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  },
  {
    type: 'fire',
    label: 'Fire',
    icon: Flame,
    emoji: '🔥',
    color: 'text-orange-500 fill-orange-500/20',
    hoverBg: 'hover:bg-orange-500/15',
    activeBg: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  },
  {
    type: 'support',
    label: 'Support',
    icon: HandHeart,
    emoji: '🤝',
    color: 'text-indigo-500 fill-indigo-500/20',
    hoverBg: 'hover:bg-indigo-500/15',
    activeBg: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
  },
];

interface ReactionDockProps {
  currentReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
  className?: string;
}

export function ReactionDock({ currentReaction, onReact, className }: ReactionDockProps) {
  const [showFlyout, setShowFlyout] = useState(false);
  const flyoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    setShowFlyout(true);
  };

  const closeFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => setShowFlyout(false), 400);
  };

  const activeItem = REACTION_CONFIG.find((r) => r.type === currentReaction);

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyout}
    >
      {/* ── Facebook-Grade Floating Reaction Dock ────────────────────────── */}
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 400 }}
            onMouseEnter={openFlyout}
            onMouseLeave={closeFlyout}
            className={cn(
              'absolute left-0 bottom-full mb-2 z-40',
              'flex items-center gap-1.5 px-3 py-2 rounded-full',
              'bg-card/95 dark:bg-zinc-900/95 backdrop-blur-2xl',
              'border border-white/20 dark:border-white/10 shadow-2xl',
              // Invisible hover bridge connecting dock to trigger button so mouse never leaves hitbox
              'after:content-[""] after:absolute after:-bottom-3 after:inset-x-0 after:h-4'
            )}
          >
            {REACTION_CONFIG.map(({ type, emoji, label, hoverBg }) => (
              <motion.button
                key={type}
                type="button"
                whileHover={{ scale: 1.45, y: -6 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(type);
                  setShowFlyout(false);
                }}
                className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-full text-lg select-none tap-press transition-transform cursor-pointer group',
                  hoverBg,
                  currentReaction === type && 'ring-2 ring-primary ring-offset-1 ring-offset-card'
                )}
                title={label}
                aria-label={label}
              >
                <span className="transform-gpu transition-transform pointer-events-none">
                  {emoji}
                </span>
                {/* Tooltip on hover */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/80 text-white shadow-md whitespace-nowrap pointer-events-none">
                  {label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger / Default Like Button ────────────────────────────────── */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReact(currentReaction || 'like');
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tap-press transition-all cursor-pointer border border-transparent select-none',
          activeItem
            ? activeItem.activeBg
            : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
        )}
      >
        {activeItem ? (
          <>
            <span className="text-sm scale-110">{activeItem.emoji}</span>
            <span>{activeItem.label}</span>
          </>
        ) : (
          <>
            <ThumbsUp className="w-4 h-4" />
            <span>React</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Stacked Miniature Reaction Indicator ──────────────────────────────────────
interface StackedReactionBadgeProps {
  reactionCounts?: Record<string, number>;
  total?: number;
  className?: string;
  onClick?: () => void;
}

export function StackedReactionBadge({
  reactionCounts = {},
  total,
  className,
  onClick,
}: StackedReactionBadgeProps) {
  // Extract active reactions sorted by highest count
  const sorted = Object.entries(reactionCounts)
    .filter(([key, count]) => key !== 'total' && typeof count === 'number' && count > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const totalCount =
    typeof total === 'number'
      ? total
      : Object.values(reactionCounts).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);

  if (totalCount === 0 && sorted.length === 0) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      {/* Overlapping Emojis */}
      <div className="flex items-center -space-x-1.5">
        {sorted.slice(0, 3).map(([type]) => {
          const cfg = REACTION_CONFIG.find((r) => r.type === type);
          if (!cfg) return null;
          return (
            <span
              key={type}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-card border border-white/20 text-[11px] shadow-xs"
              title={`${cfg.label}: ${reactionCounts[type]}`}
            >
              {cfg.emoji}
            </span>
          );
        })}
      </div>

      <span className="font-semibold text-foreground/80 text-[11px] sm:text-xs">
        {totalCount > 0 ? totalCount : sorted.reduce((a, b) => a + b[1], 0)}
      </span>
    </div>
  );
}
