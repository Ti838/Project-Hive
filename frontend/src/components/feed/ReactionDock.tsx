'use client';

// ─── Facebook & LinkedIn-Grade Jitter-Free Reaction Dock ──────────────────────

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import type { ReactionType } from '@/types';
import { cn } from '@/lib/utils';

export interface ReactionConfigItem {
  type: ReactionType;
  label: string;
  emoji: string;
  color: string;
  activeTextColor: string;
  activeBg: string;
}

export const REACTION_CONFIG: ReactionConfigItem[] = [
  {
    type: 'like',
    label: 'Like',
    emoji: '👍',
    color: '#1877F2',
    activeTextColor: 'text-[#1877F2]',
    activeBg: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30',
  },
  {
    type: 'love',
    label: 'Love',
    emoji: '❤️',
    color: '#E41E3F',
    activeTextColor: 'text-[#E41E3F]',
    activeBg: 'bg-[#E41E3F]/10 text-[#E41E3F] border-[#E41E3F]/30',
  },
  {
    type: 'care',
    label: 'Care',
    emoji: '🥰',
    color: '#F7B125',
    activeTextColor: 'text-[#F7B125]',
    activeBg: 'bg-[#F7B125]/10 text-[#F7B125] border-[#F7B125]/30',
  },
  {
    type: 'haha',
    label: 'Haha',
    emoji: '😆',
    color: '#F7B125',
    activeTextColor: 'text-[#F7B125]',
    activeBg: 'bg-[#F7B125]/10 text-[#F7B125] border-[#F7B125]/30',
  },
  {
    type: 'wow',
    label: 'Wow',
    emoji: '😮',
    color: '#F7B125',
    activeTextColor: 'text-[#F7B125]',
    activeBg: 'bg-[#F7B125]/10 text-[#F7B125] border-[#F7B125]/30',
  },
  {
    type: 'sad',
    label: 'Sad',
    emoji: '😢',
    color: '#F7B125',
    activeTextColor: 'text-[#F7B125]',
    activeBg: 'bg-[#F7B125]/10 text-[#F7B125] border-[#F7B125]/30',
  },
  {
    type: 'angry',
    label: 'Angry',
    emoji: '😡',
    color: '#E9710F',
    activeTextColor: 'text-[#E9710F]',
    activeBg: 'bg-[#E9710F]/10 text-[#E9710F] border-[#E9710F]/30',
  },
  // Backward compatibility
  {
    type: 'celebrate',
    label: 'Celebrate',
    emoji: '🎉',
    color: '#F59E0B',
    activeTextColor: 'text-amber-500',
    activeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  },
  {
    type: 'insightful',
    label: 'Insightful',
    emoji: '💡',
    color: '#10B981',
    activeTextColor: 'text-emerald-500',
    activeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  },
  {
    type: 'fire',
    label: 'Fire',
    emoji: '🔥',
    color: '#F97316',
    activeTextColor: 'text-orange-500',
    activeBg: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  },
  {
    type: 'support',
    label: 'Support',
    emoji: '🤝',
    color: '#6366F1',
    activeTextColor: 'text-indigo-500',
    activeBg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  },
];

// Displayed primary reaction dock items (like Facebook 7-pack)
const PRIMARY_DOCK_TYPES: ReactionType[] = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];

interface ReactionDockProps {
  currentReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
  className?: string;
}

export function ReactionDock({ currentReaction, onReact, className }: ReactionDockProps) {
  const [showFlyout, setShowFlyout] = useState(false);
  const flyoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    setShowFlyout(true);
  };

  const closeFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => setShowFlyout(false), 300);
  };

  // Mobile long-press handlers
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      openFlyout();
    }, 350);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  useEffect(() => {
    return () => {
      if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  const activeItem = REACTION_CONFIG.find((r) => r.type === currentReaction);

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyout}
    >
      {/* ── Facebook Floating Reaction Dock (Seamless Hover Bridge) ──────── */}
      <AnimatePresence>
        {showFlyout && (
          <div className="absolute left-0 bottom-full pb-2.5 z-50 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ type: 'spring', damping: 24, stiffness: 450 }}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-full',
                'bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl',
                'border border-border/80 dark:border-white/10 shadow-2xl'
              )}
            >
              {PRIMARY_DOCK_TYPES.map((type) => {
                const item = REACTION_CONFIG.find((r) => r.type === type);
                if (!item) return null;
                const isSelected = currentReaction === item.type;

                return (
                  <div key={item.type} className="relative group/emoji flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(item.type);
                        setShowFlyout(false);
                      }}
                      className={cn(
                        'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center select-none cursor-pointer tap-press transition-all',
                        isSelected && 'bg-primary/15 ring-2 ring-primary ring-offset-1 ring-offset-card'
                      )}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <span className="text-xl sm:text-2xl transform-gpu transition-all duration-150 ease-out group-hover/emoji:scale-135 group-hover/emoji:-translate-y-2 pointer-events-none">
                        {item.emoji}
                      </span>
                    </button>

                    {/* Floating pill tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/emoji:opacity-100 transition-all duration-150 z-20">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/90 text-white shadow-xl whitespace-nowrap block">
                        {item.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Trigger Button (Facebook Like / Reaction Button) ──────────────── */}
      <button
        type="button"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          e.stopPropagation();
          onReact(currentReaction || 'like');
        }}
        className={cn(
          'flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold tap-press transition-all cursor-pointer select-none group',
          activeItem
            ? cn(activeItem.activeBg, 'hover:opacity-90')
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
        )}
      >
        {activeItem ? (
          <>
            <span className="text-base sm:text-lg animate-scale-in shrink-0">{activeItem.emoji}</span>
            <span className={cn('font-bold truncate', activeItem.activeTextColor)}>{activeItem.label}</span>
          </>
        ) : (
          <>
            <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-foreground shrink-0" />
            <span className="truncate">Like</span>
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
        'inline-flex items-center gap-1.5 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors group',
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
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-card border border-white/20 text-[11px] shadow-xs group-hover:scale-110 transition-transform"
              title={`${cfg.label}: ${reactionCounts[type]}`}
            >
              {cfg.emoji}
            </span>
          );
        })}
      </div>

      <span className="font-semibold text-foreground/80 group-hover:text-primary transition-colors text-[11px] sm:text-xs">
        {totalCount > 0 ? totalCount : sorted.reduce((a, b) => a + b[1], 0)}
      </span>
    </div>
  );
}
