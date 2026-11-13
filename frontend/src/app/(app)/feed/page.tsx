'use client';
// ─── ProjectHive Social Feed (Facebook & LinkedIn Grade Experience) ───────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Share2, MoreHorizontal, ImagePlus, Send,
  ThumbsUp, Star, Trophy, Rss, RefreshCw, AlertCircle,
  Bookmark, Copy, Trash2, Check, X, Sparkles, Filter, Plus, Camera,
  Code2, BarChart2, CheckCircle2, Users2, ChevronDown, ArrowUpRight, Globe, Pencil
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { displayName, timeAgo, getInitials, getAvatarColor, cn, sanitizeAndDecodeText } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import { MediaMosaic } from '@/components/feed/MediaMosaic';
import { ReactionDock, StackedReactionBadge } from '@/components/feed/ReactionDock';
import { ThreadedComments } from '@/components/feed/ThreadedComments';
import { PostComposerModal } from '@/components/feed/PostComposerModal';
import { RichPostContent } from '@/components/feed/RichPostContent';
import { ReactionListModal } from '@/components/feed/ReactionListModal';
import type { Post, ReactionType } from '@/types';

// ─── Post Card Component ───────────────────────────────────────────────────────
import { PostCard } from '@/components/feed/PostCard';
import { PostComposerTrigger, PostCardSkeleton } from '@/components/feed/PostComposerTrigger';

// ─── Main Feed Page ────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'achievements' | 'updates' | 'code' | 'polls'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loader = useRef<HTMLDivElement>(null);

  // Modal Composer & Edit State
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // ── Stories Reel State ──────────────────────────────────────────────────────
  const [storyGroups, setStoryGroups] = useState<Array<{
    author: any;
    stories: Array<{ id: string; mediaUrl: string; mediaType: string; caption?: string; createdAt: string; hasViewed: boolean }>;
    hasUnviewed: boolean;
  }>>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<any | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [uploadingStory, setUploadingStory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await api.stories.list();
      if (res.ok && res.groups) setStoryGroups(res.groups);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Story auto-progress timer (5s per story)
  useEffect(() => {
    if (!activeStoryGroup) {
      setStoryProgress(0);
      return;
    }
    const currentStory = activeStoryGroup.stories[activeStoryIdx];
    if (currentStory) {
      api.stories.view(currentStory.id);
    }

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx + 1 < activeStoryGroup.stories.length) {
            setActiveStoryIdx((i) => i + 1);
            return 0;
          } else {
            setActiveStoryGroup(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryGroup, activeStoryIdx]);

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStory(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.stories.create({
          mediaUrl: base64,
          mediaType: file.type.startsWith('video') ? 'video' : 'image',
          caption: 'Campus Story',
        });
        if (res.ok) await fetchStories();
      } catch (err) {
        console.error('Failed to upload story', err);
      } finally {
        setUploadingStory(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchPosts = useCallback(async (p: number) => {
    setError(null);
    try {
      const res = await api.posts.list(p, 10);
      if (res.ok && res.posts) {
        setPosts((prev) => (p === 1 ? res.posts! : [...prev, ...res.posts!]));
        setHasMore(res.posts.length === 10);
      } else if (!res.ok) {
        setError(res.error || 'Failed to load feed posts.');
      }
    } catch {
      setError('Unable to load feed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // ── Real-Time Socket.IO Synchronization ─────────────────────────────────────
  useSocket({
    onPostNew: (data) => {
      if (data.post) {
        setPosts((prev) => {
          if (prev.some((p) => p.id === data.postId)) return prev;
          return [data.post!, ...prev];
        });
      }
    },

    onPostReacted: (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== data.postId) return p;
          const isMe = data.userId === user?.id;
          return {
            ...p,
            reaction_counts: data.reactionCounts,
            reaction_count: data.reactionCounts?.total ?? p.reaction_count,
            user_reaction: isMe ? data.type : p.user_reaction,
          };
        })
      );
    },

    onPostComment: (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== data.postId) return p;
          const newCount = (p.comment_count ?? p.comments_count ?? 0) + 1;
          return {
            ...p,
            comment_count: newCount,
            comments_count: newCount,
          };
        })
      );
    },

    onPostCommentDeleted: (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== data.postId) return p;
          const newCount = Math.max(0, (p.comment_count ?? p.comments_count ?? 1) - 1);
          return {
            ...p,
            comment_count: newCount,
            comments_count: newCount,
          };
        })
      );
    },

    onPostDeleted: (data) => {
      setPosts((prev) => prev.filter((p) => p.id !== data.postId));
    },

    onPostPollVoted: (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== data.postId) return p;
          return {
            ...p,
            poll_data: data.pollData,
          };
        })
      );
    },
  });

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !error) {
          const next = page + 1;
          setPage(next);
          fetchPosts(next);
        }
      },
      { threshold: 0.5 }
    );
    if (loader.current) obs.observe(loader.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page, error, fetchPosts]);

  const handleReact = async (postId: string, type: ReactionType) => {
    // Optimistic state update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadySame = p.user_reaction === type;
        const currentCounts = { ...(p.reaction_counts || {}) };

        if (alreadySame) {
          currentCounts[type] = Math.max(0, (currentCounts[type] || 1) - 1);
          return {
            ...p,
            user_reaction: null,
            reaction_counts: currentCounts,
            reaction_count: Math.max(0, (p.reaction_count ?? 1) - 1),
          };
        } else {
          if (p.user_reaction && currentCounts[p.user_reaction]) {
            currentCounts[p.user_reaction] = Math.max(0, currentCounts[p.user_reaction] - 1);
          }
          currentCounts[type] = (currentCounts[type] || 0) + 1;
          return {
            ...p,
            user_reaction: type,
            reaction_counts: currentCounts,
            reaction_count: (p.reaction_count ?? 0) + (p.user_reaction ? 0 : 1),
          };
        }
      })
    );

    try {
      const res = await api.posts.react(postId, type);
      if (res.ok && res.reactionCounts) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              user_reaction: res.type,
              reaction_counts: res.reactionCounts,
              reaction_count: res.reactionCounts?.total,
            };
          })
        );
      }
    } catch {
      // Revert upon failure
      fetchPosts(1);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const res = await api.posts.votePoll(postId, optionId);
      if (res.ok && res.pollData) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              poll_data: res.pollData,
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to vote in poll:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    const res = await api.posts.delete(postId);
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleCommentCountChange = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = Math.max(0, (p.comment_count ?? p.comments_count ?? 0) + delta);
        return {
          ...p,
          comment_count: updated,
          comments_count: updated,
        };
      })
    );
  };

  const displayedPosts = posts.filter((p) => {
    if (filter === 'achievements') return p.type === 'achievement';
    if (filter === 'updates') return p.type === 'general' || p.type === 'update';
    if (filter === 'code') return Boolean(p.code_snippet?.code);
    if (filter === 'polls') return Boolean(p.poll_data?.options?.length);
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      {/* ─── Campus Stories Reel ────────────────────────────────────────────── */}
      <div className="surface-glass border border-foreground/10 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add Story Button for Current User */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingStory}
              className="relative w-14 h-14 rounded-full border-2 border-dashed border-primary/60 flex items-center justify-center bg-primary/10 text-primary tap-press hover:bg-primary/20 transition-all cursor-pointer"
              title="Add 24h Campus Story"
            >
              {uploadingStory ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-6 h-6 text-primary" />
              )}
            </button>
            <span className="text-[11px] font-semibold text-foreground max-w-[60px] truncate text-center">
              Your Story
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUploadStory}
            />
          </div>

          {/* Active Story Rings */}
          {storyGroups.map((group) => {
            const author = group.author;
            const authorName = displayName(author);
            return (
              <button
                key={author?.id}
                onClick={() => {
                  setActiveStoryGroup(group);
                  setActiveStoryIdx(0);
                  setStoryProgress(0);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 tap-press text-center cursor-pointer"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-full p-0.5 transition-transform duration-200',
                    group.hasUnviewed
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-primary p-[2.5px] animate-pulse'
                      : 'border-2 border-border/80'
                  )}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {author?.avatar ? (
                      <img src={author.avatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getAvatarColor(author?.id ?? 's') }}
                      >
                        {authorName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-foreground max-w-[64px] truncate">
                  {authorName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Studio Post Composer Trigger ───────────────────────────────────── */}
      <PostComposerTrigger onOpen={() => setComposerOpen(true)} />

      {/* ─── Feed Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { id: 'all', label: 'All Posts' },
          { id: 'achievements', label: '🏆 Achievements' },
          { id: 'updates', label: '📢 Updates' },
          { id: 'code', label: '💻 Code Snippets' },
          { id: 'polls', label: '📊 Campus Polls' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={cn(
              'tap-press px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              filter === item.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                : 'bg-card/80 dark:bg-muted/60 border border-border/60 dark:border-foreground/10 text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-destructive">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchPosts(1); }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 tap-press transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {/* Posts List */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card/70 border border-dashed border-border/60 rounded-3xl text-muted-foreground space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Rss className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {filter === 'all' ? 'The feed is quiet' : `No ${filter} found`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {filter === 'all'
                ? 'Be the first to post a project update, code snippet, or poll!'
                : 'Switch filters or share a new post using the composer above.'}
            </p>
          </div>
        </div>
      ) : (
        displayedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id ?? ''}
            onReact={handleReact}
            onEdit={(p) => setEditingPost(p)}
            onDelete={handleDelete}
            onVotePoll={handleVotePoll}
            onCommentCountChange={handleCommentCountChange}
          />
        ))
      )}

      {/* Infinite scroll trigger */}
      <div ref={loader} className="h-8 flex items-center justify-center">
        {loading && page > 1 && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* ─── Rich Modal Post Composer & Post Editor ───────────────────────────── */}
      <PostComposerModal
        isOpen={composerOpen || Boolean(editingPost)}
        editPost={editingPost}
        onClose={() => {
          setComposerOpen(false);
          setEditingPost(null);
        }}
        onCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
        onUpdated={(updatedPost) =>
          setPosts((prev) =>
            prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
          )
        }
      />

      {/* ─── Full-Screen Campus Story Viewer ────────────────────────────────── */}
      <AnimatePresence>
        {activeStoryGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center select-none"
          >
            <div className="relative w-full max-w-md h-full max-h-[100dvh] flex flex-col bg-neutral-900 overflow-hidden">
              {/* Progress Bar Segments */}
              <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
                {activeStoryGroup.stories.map((s: any, idx: number) => (
                  <div key={s.id || idx} className="flex-1 h-1 bg-foreground/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{
                        width:
                          idx < activeStoryIdx
                            ? '100%'
                            : idx === activeStoryIdx
                            ? `${storyProgress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between text-white drop-shadow-md">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/60 shrink-0"
                    style={{ backgroundColor: getAvatarColor(activeStoryGroup.author?.id ?? 's') }}
                  >
                    {displayName(activeStoryGroup.author).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight truncate">{displayName(activeStoryGroup.author)}</p>
                    <p className="text-[10px] text-foreground/70">{timeAgo(activeStoryGroup.stories[activeStoryIdx]?.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryGroup(null)}
                  className="p-2 rounded-full bg-background/40 hover:bg-background/60 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Display */}
              <div className="flex-1 w-full h-full flex items-center justify-center relative">
                {activeStoryGroup.stories[activeStoryIdx]?.mediaType === 'video' ? (
                  <video
                    src={activeStoryGroup.stories[activeStoryIdx]?.mediaUrl}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={activeStoryGroup.stories[activeStoryIdx]?.mediaUrl}
                    alt="Campus Story"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Nav Touch Zones */}
                <div
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx > 0) {
                      setActiveStoryIdx((i) => i - 1);
                      setStoryProgress(0);
                    }
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx + 1 < activeStoryGroup.stories.length) {
                      setActiveStoryIdx((i) => i + 1);
                      setStoryProgress(0);
                    } else {
                      setActiveStoryGroup(null);
                    }
                  }}
                />
              </div>

              {/* Caption */}
              {activeStoryGroup.stories[activeStoryIdx]?.caption && (
                <div className="absolute bottom-6 inset-x-4 z-30 p-3 bg-background/60 backdrop-blur-md rounded-xl text-white text-xs text-center">
                  {activeStoryGroup.stories[activeStoryIdx].caption}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

