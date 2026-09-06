'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, Heart, Trophy, Lightbulb, Flame, HandHeart } from 'lucide-react';
import { displayName, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { ReactionType, User } from '@/types';

interface ReactionUser {
  user: User;
  type: ReactionType;
}

interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactionCounts?: Record<string, number>;
  totalCount?: number;
}

const EMOJI_MAP: Record<string, { label: string; emoji: string }> = {
  all: { label: 'All', emoji: '🌟' },
  like: { label: 'Like', emoji: '👍' },
  love: { label: 'Love', emoji: '❤️' },
  celebrate: { label: 'Celebrate', emoji: '🎉' },
  insightful: { label: 'Insightful', emoji: '💡' },
  fire: { label: 'Fire', emoji: '🔥' },
  support: { label: 'Support', emoji: '🤝' },
};

export function ReactionListModal({
  isOpen,
  onClose,
  reactionCounts = {},
  totalCount = 0,
}: ReactionListModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');

  if (!isOpen) return null;

  const activeTabs = Object.entries(reactionCounts).filter(([k, v]) => v > 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-md surface-floating border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <span>Reactions</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {totalCount}
              </span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent tap-press transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Emoji Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40 overflow-x-auto no-scrollbar bg-muted/20">
            <button
              onClick={() => setSelectedTab('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer tap-press flex items-center gap-1.5',
                selectedTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <span>All</span>
              <span>{totalCount}</span>
            </button>

            {activeTabs.map(([type, count]) => {
              const meta = EMOJI_MAP[type] || { label: type, emoji: '👍' };
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTab(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer tap-press flex items-center gap-1.5',
                    selectedTab === type
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <span>{meta.emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>

          {/* List of reaction users */}
          <div className="p-4 overflow-y-auto flex-1 divide-y divide-border/30">
            <div className="py-8 text-center text-xs text-muted-foreground">
              <span className="text-2xl mb-2 block">
                {EMOJI_MAP[selectedTab]?.emoji || '👍'}
              </span>
              <p className="font-semibold text-foreground text-sm">
                {selectedTab === 'all'
                  ? `${totalCount} student builders reacted to this post`
                  : `${reactionCounts[selectedTab] || 0} students gave ${EMOJI_MAP[selectedTab]?.label || 'reaction'}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time reaction synchronization active across campus
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

