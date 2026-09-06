'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { displayName, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { ReactionType, User } from '@/types';

interface ReactionItem {
  id: string;
  type: ReactionType;
  createdAt: string;
  user: User;
}

interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
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
  postId,
  reactionCounts = {},
  totalCount = 0,
}: ReactionListModalProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [reactors, setReactors] = useState<ReactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      api.posts.getReactions(postId)
        .then((res) => {
          if (res.ok && res.reactions) {
            setReactors(res.reactions);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const activeTabs = Object.entries(reactionCounts).filter(([k, v]) => k !== 'total' && v > 0);

  const filteredReactors = selectedTab === 'all'
    ? reactors
    : reactors.filter((r) => r.type === selectedTab);

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
          <div className="p-2 overflow-y-auto flex-1 divide-y divide-border/20 max-h-[50vh]">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Loading reactions...</span>
              </div>
            ) : filteredReactors.length > 0 ? (
              filteredReactors.map((item) => {
                const emoji = EMOJI_MAP[item.type]?.emoji || '👍';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <UserProfileHoverCard user={item.user}>
                          <UserAvatar user={item.user} size="md" interactive />
                        </UserProfileHoverCard>
                        <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-card border border-white/20 text-[11px] shadow-xs">
                          {emoji}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <UserProfileHoverCard user={item.user}>
                          <p className="font-bold text-sm text-foreground truncate cursor-pointer hover:underline leading-tight">
                            {displayName(item.user)}
                          </p>
                        </UserProfileHoverCard>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.user?.university || item.user?.department || 'Student Builder'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/messages');
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 tap-press transition-colors cursor-pointer shrink-0"
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                <span className="text-3xl mb-2 block">
                  {EMOJI_MAP[selectedTab]?.emoji || '👍'}
                </span>
                <p className="font-semibold text-foreground text-sm">
                  {selectedTab === 'all'
                    ? `${totalCount} student builders reacted to this post`
                    : `${reactionCounts[selectedTab] || 0} students gave ${EMOJI_MAP[selectedTab]?.label || 'reaction'}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Real-time reaction sync active
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

