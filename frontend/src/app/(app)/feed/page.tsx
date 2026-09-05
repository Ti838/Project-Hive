'use client';
// ─── ProjectHive Social Feed (Facebook & LinkedIn Grade Experience) ───────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Share2, MoreHorizontal, ImagePlus, Send,
  ThumbsUp, Star, Trophy, Rss, RefreshCw, AlertCircle,
  Bookmark, Copy, Trash2, Check, X, Sparkles, Filter, Plus, Camera,
  Code2, BarChart2, CheckCircle2, Users2, ChevronDown, ArrowUpRight
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
import type { Post, ReactionType } from '@/types';

// ─── Post Card Component ───────────────────────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  onReact,
  onDelete,
  onVotePoll,
  onCommentCountChange,
}: {
  post: Post;
  currentUserId: string;
  onReact: (id: string, type: ReactionType) => void;
  onDelete: (id: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}) {
  const [expandedComments, setExpandedComments] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyPostLink = () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowSheet(false); }, 1400);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ProjectHive update by ${displayName(post.author ?? undefined)}`,
          text: post.content.slice(0, 100),
          url: `${window.location.origin}/feed#post-${post.id}`,
        });
        setShowSheet(false);
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    copyPostLink();
  };

  const mediaList = post.media_urls || post.images || (post.image_url ? [post.image_url] : []);

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        id={`post-${post.id}`}
        className="surface-glass rounded-3xl border border-white/10 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-primary/40 transition-all duration-300 overflow-hidden space-y-4 p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <UserProfileHoverCard user={post.author}>
            <UserAvatar user={post.author} size="md" interactive />
          </UserProfileHoverCard>
          <div className="flex-1 min-w-0">
            <UserProfileHoverCard user={post.author}>
              <p className="font-bold text-sm leading-tight text-foreground truncate cursor-pointer hover:underline">
                {displayName(post.author ?? undefined)}
              </p>
            </UserProfileHoverCard>
            <p className="text-xs text-muted-foreground mt-0.5">
              {post.author?.university ?? 'Student'} · {timeAgo(post.created_at)}
            </p>
          </div>
          <button
            onClick={() => setShowSheet(true)}
            className="p-2 -mr-1 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
            aria-label="Post actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3">
          {/* Post Type Badges */}
          {post.type === 'achievement' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" /> Achievement Unlocked
            </div>
          )}
          {post.type === 'looking_for_team' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Users2 className="w-3.5 h-3.5" /> Looking for Teammates
            </div>
          )}

          {/* Text Content */}
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-foreground/95 tracking-tight">
            {sanitizeAndDecodeText(post.content)}
          </p>

          {/* 1 to 5+ Smart Media Mosaic */}
          {mediaList.length > 0 && (
            <MediaMosaic mediaUrls={mediaList} />
          )}

          {/* Syntax-Highlighted Code Block */}
          {post.code_snippet && post.code_snippet.code && (
            <div className="mt-3.5 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-foreground/90">
                    {post.code_snippet.title || 'Code Snippet'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
                    {post.code_snippet.language || 'code'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(post.code_snippet?.code || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed no-scrollbar max-h-64">
                <code>{post.code_snippet.code}</code>
              </pre>
            </div>
          )}

          {/* Interactive Poll Component */}
          {post.poll_data && post.poll_data.options && post.poll_data.options.length > 0 && (
            <div className="mt-3.5 space-y-2 p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-muted/20">
              {post.poll_data.question && post.poll_data.question !== post.content && (
                <p className="font-bold text-xs sm:text-sm text-foreground mb-2">
                  {post.poll_data.question}
                </p>
              )}
              {post.poll_data.options.map((opt) => {
                const votes = Array.isArray(opt.votes) ? opt.votes : [];
                const totalVotes =
                  post.poll_data?.options.reduce(
                    (acc, o) => acc + (Array.isArray(o.votes) ? o.votes.length : 0),
                    0
                  ) || 1;
                const hasVotedThis = votes.includes(currentUserId);
                const percent = Math.round((votes.length / totalVotes) * 100);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onVotePoll(post.id, opt.id)}
                    className={cn(
                      'w-full relative p-3 rounded-xl border text-left overflow-hidden transition-all tap-press cursor-pointer group',
                      hasVotedThis
                        ? 'border-primary/50 bg-primary/10 shadow-xs'
                        : 'border-white/10 bg-muted/40 hover:border-white/20'
                    )}
                  >
                    {/* Animated vote fill bar */}
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 transition-all duration-700 rounded-l-xl',
                        hasVotedThis ? 'bg-primary/25' : 'bg-white/10'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-2 truncate pr-2">
                        {hasVotedThis && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {opt.text}
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                        {percent}% ({votes.length})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats & Reactions Summary Row */}
        {((post.reaction_count ?? 0) > 0 || (post.comment_count ?? 0) > 0 || (post.comments_count ?? 0) > 0) && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-white/5">
            <StackedReactionBadge
              reactionCounts={post.reaction_counts}
              total={post.reaction_count}
            />

            {(post.comment_count ?? post.comments_count ?? 0) > 0 && (
              <button
                onClick={() => setExpandedComments(!expandedComments)}
                className="hover:text-foreground font-medium transition-colors ml-auto cursor-pointer"
              >
                {(post.comment_count ?? post.comments_count ?? 0)} comment{(post.comment_count ?? post.comments_count ?? 0) === 1 ? '' : 's'}
              </button>
            )}
          </div>
        )}

        {/* Actions Bar with Spring-Physics Reaction Dock */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 relative">
          <ReactionDock
            currentReaction={post.user_reaction}
            onReact={(type) => onReact(post.id, type)}
          />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpandedComments(!expandedComments)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tap-press transition-all cursor-pointer',
                expandedComments
                  ? 'bg-white/15 text-foreground'
                  : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
              title="Share post"
              aria-label="Share post"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── 2-Tier Threaded Discussion Tree ────────────────────────────── */}
        <AnimatePresence>
          {expandedComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <ThreadedComments
                postId={post.id}
                postAuthorId={post.author_id}
                onCommentCountChange={(delta) => onCommentCountChange(post.id, delta)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* ─── Native Mobile Bottom Sheet / Centered Desktop Modal ────────────── */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-card border-t md:border border-border/60 rounded-t-3xl md:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,16px))] shadow-2xl space-y-4"
            >
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-1 md:hidden" />

              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="font-bold text-base">Post Options</h3>
                <button
                  onClick={() => setShowSheet(false)}
                  className="p-1 rounded-xl text-muted-foreground hover:bg-accent tap-press transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Share Post</p>
                    <p className="text-xs text-muted-foreground">Send to study groups or social apps</p>
                  </div>
                </button>

                {/* Copy Link */}
                <button
                  onClick={copyPostLink}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{copied ? 'Link Copied!' : 'Copy Link'}</p>
                    <p className="text-xs text-muted-foreground">Copy direct URL to clipboard</p>
                  </div>
                </button>

                {/* Bookmark Toggle */}
                <button
                  onClick={async () => {
                    const next = !saved;
                    setSaved(next);
                    try {
                      const res = await api.posts.save(post.id);
                      if (res.ok) setSaved(res.saved);
                    } catch {
                      setSaved(!next);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left cursor-pointer"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    saved ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-foreground'
                  )}>
                    <Bookmark className={cn('w-4 h-4', saved && 'fill-amber-500 text-amber-500')} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{saved ? 'Saved in Bookmarks' : 'Bookmark Post'}</p>
                    <p className="text-xs text-muted-foreground">{saved ? 'Click to remove bookmark' : 'Save for quick access in /saved'}</p>
                  </div>
                </button>

                {/* Author Delete */}
                {post.author_id === currentUserId && (
                  <button
                    onClick={() => { onDelete(post.id); setShowSheet(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive tap-press transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Delete Post</p>
                      <p className="text-xs text-destructive/80">Permanently remove this update</p>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Studio Post Composer Trigger Bar ──────────────────────────────────────────
function PostComposerTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { user } = useAuthStore();
  const firstName = user?.first_name || user?.firstName || 'Student';

  return (
    <div className="surface-glass border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 h-11 px-4 text-left text-xs sm:text-sm bg-muted/60 hover:bg-muted/90 rounded-2xl border border-white/5 text-muted-foreground hover:text-foreground transition-all flex items-center cursor-pointer shadow-inner truncate"
        >
          What's on your mind, {firstName}? Share a project, code, or poll…
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <ImagePlus className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold hidden sm:inline">Photo/Media</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <Code2 className="w-4 h-4 text-primary" />
          <span className="font-semibold hidden sm:inline">Code Snippet</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold hidden sm:inline">Campus Poll</span>
        </button>
      </div>
    </div>
  );
}

// ─── Post Skeleton Loader ──────────────────────────────────────────────────────
function PostCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-xs animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted/70 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-32 bg-muted/80 rounded-md" />
          <div className="h-3 w-20 bg-muted/60 rounded-md" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-full bg-muted/70 rounded-md" />
        <div className="h-4 w-5/6 bg-muted/70 rounded-md" />
        <div className="h-28 w-full bg-muted/50 rounded-2xl" />
      </div>
      <div className="pt-2 border-t border-border/40 flex items-center gap-4">
        <div className="h-7 w-20 bg-muted/60 rounded-lg" />
        <div className="h-7 w-20 bg-muted/60 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Feed Page ────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'achievements' | 'updates' | 'code' | 'polls'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loader = useRef<HTMLDivElement>(null);

  // Modal Composer State
  const [composerOpen, setComposerOpen] = useState(false);

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
      <div className="surface-glass border border-white/10 rounded-3xl p-4 shadow-xl">
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

      {/* ─── Sticky Glassmorphic Filter Bar ─────────────────────────────────── */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/85 dark:bg-card/85 backdrop-blur-md border-b border-border/40 flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors">
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
              'tap-press px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              filter === item.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground'
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

      {/* ─── Rich Modal Post Composer ────────────────────────────────────────── */}
      <PostComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
      />

      {/* ─── Full-Screen Campus Story Viewer ────────────────────────────────── */}
      <AnimatePresence>
        {activeStoryGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none"
          >
            <div className="relative w-full max-w-md h-full max-h-[100dvh] flex flex-col bg-neutral-900 overflow-hidden">
              {/* Progress Bar Segments */}
              <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
                {activeStoryGroup.stories.map((s: any, idx: number) => (
                  <div key={s.id || idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
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
                    <p className="text-[10px] text-white/70">{timeAgo(activeStoryGroup.stories[activeStoryIdx]?.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryGroup(null)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
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
                <div className="absolute bottom-6 inset-x-4 z-30 p-3 bg-black/60 backdrop-blur-md rounded-xl text-white text-xs text-center">
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
