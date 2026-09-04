'use client';
// ─── Feed Page ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, MoreHorizontal, ImagePlus, Send,
  ThumbsUp, Star, HandHeart, Trophy, Rss, RefreshCw, AlertCircle,
  Bookmark, Copy, Trash2, Check, X, Sparkles, Filter, Plus, Camera
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, timeAgo, getInitials, getAvatarColor, cn, sanitizeAndDecodeText } from '@/lib/utils';
import type { Post, PostComment } from '@/types';

// ─── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }: { user?: { first_name: string; last_name: string; avatar?: string; id: string } | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  const name = displayName(user ?? undefined);
  if (user?.avatar) return <img src={user.avatar} alt={name} className={cn(sz, 'rounded-full object-cover shrink-0 ring-1 ring-border/50')} />;
  return (
    <div className={cn(sz, 'rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-xs')}
      style={{ backgroundColor: getAvatarColor(user?.id ?? 'x') }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Reaction Button Config ───────────────────────────────────────────────────
const REACTIONS = [
  { type: 'like' as const, icon: ThumbsUp, label: 'Like', color: 'text-blue-500 fill-blue-500/20' },
  { type: 'celebrate' as const, icon: Trophy, label: 'Celebrate', color: 'text-yellow-500 fill-yellow-500/20' },
  { type: 'support' as const, icon: HandHeart, label: 'Support', color: 'text-rose-500 fill-rose-500/20' },
];

// ─── Post Card with Bottom Sheet Options ───────────────────────────────────────
function PostCard({ post, currentUserId, onReact, onDelete }: {
  post: Post;
  currentUserId: string;
  onReact: (id: string, type: 'like' | 'celebrate' | 'support') => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadComments = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    const res = await api.posts.getComments(post.id);
    if (res.ok && res.comments) setComments(res.comments);
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const res = await api.posts.comment(post.id, commentText.trim());
    if (res.ok && res.comment) {
      setComments((prev) => [...prev, res.comment as PostComment]);
      setCommentText('');
    }
    setSubmitting(false);
  };

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

  const currentReaction = post.user_reaction;

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        id={`post-${post.id}`}
        className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <Avatar user={post.author} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight text-foreground truncate">{displayName(post.author ?? undefined)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{post.author?.university ?? 'Student'} · {timeAgo(post.created_at)}</p>
          </div>
          <button
            onClick={() => setShowSheet(true)}
            className="p-1.5 -mr-1 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
            aria-label="Post actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {post.type === 'achievement' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold tracking-wide uppercase mb-2.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Achievement Unlocked
            </div>
          )}
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
            {sanitizeAndDecodeText(post.content)}
          </p>
          {post.images && post.images.length > 0 && (
            <div className="mt-3 grid gap-2 grid-cols-2">
              {post.images.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl object-cover w-full h-40 border border-border/40" />
              ))}
            </div>
          )}
          {/* Polls */}
          {post.poll_options && post.poll_options.length > 0 && (
            <div className="mt-3 space-y-2">
              {post.poll_options.map((opt) => {
                const totalVotes = post.poll_options?.reduce((acc, o) => acc + (o.votes || 0), 0) || 1;
                const percent = Math.round(((opt.votes || 0) / totalVotes) * 100);
                return (
                  <div
                    key={opt.id || opt.text}
                    className="relative p-3 rounded-xl border border-border/60 bg-muted/30 overflow-hidden cursor-pointer hover:bg-muted/60 tap-press transition-colors"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500 rounded-l-xl"
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative flex items-center justify-between text-xs font-semibold">
                      <span>{opt.text}</span>
                      <span className="text-muted-foreground">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {((post.reaction_count ?? 0) > 0 || (post.comment_count ?? 0) > 0) && (
          <div className="flex items-center gap-3 px-4 pb-2 text-xs text-muted-foreground">
            {(post.reaction_count ?? 0) > 0 && <span>{post.reaction_count} reactions</span>}
            {(post.comment_count ?? 0) > 0 && (
              <button onClick={loadComments} className="hover:text-foreground transition-colors ml-auto">
                {post.comment_count} comments
              </button>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 border-t border-border/50 bg-muted/15">
          <div className="flex items-center gap-1">
            {REACTIONS.map(({ type, icon: Icon, label, color }) => {
              const isActive = currentReaction === type;
              return (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onReact(post.id, type)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold tap-press transition-all',
                    isActive
                      ? cn('bg-primary/10 animate-bounce-subtle', color)
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4 transition-transform', isActive && 'scale-110')} />
                  <span className="hidden sm:inline">{label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadComments}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
              title="Share post"
              aria-label="Share post"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border/50 bg-muted/10"
            >
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar user={c.author} size="sm" />
                    <div className="bg-muted/70 rounded-2xl px-3.5 py-2 text-sm flex-1">
                      <span className="font-semibold text-xs mr-2 text-foreground">{displayName(c.author ?? undefined)}</span>
                      <span className="text-foreground/90">{sanitizeAndDecodeText(c.content)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Comment input */}
              <div className="flex gap-2 p-3 sm:px-4 sm:pb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="Write a comment…"
                  className="flex-1 h-11 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 tap-press transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* ─── Native Mobile Bottom Sheet / Centered Desktop Modal ────────────── */}
      <AnimatePresence>
        {showSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Sheet / Dialog */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-card border-t md:border border-border/60 rounded-t-3xl md:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,16px))] shadow-2xl space-y-4"
            >
              {/* Mobile Grab Handle */}
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-1 md:hidden" />

              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="font-bold text-base">Post Options</h3>
                <button
                  onClick={() => setShowSheet(false)}
                  className="p-1 rounded-xl text-muted-foreground hover:bg-accent tap-press transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    saved ? 'bg-amber-500/15 text-amber-600 animate-bounce-subtle' : 'bg-muted text-foreground'
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive tap-press transition-colors text-left"
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

// ─── Create Post ───────────────────────────────────────────────────────────────
function CreatePost({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'update' | 'achievement'>('update');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    const res = await api.posts.create({ content: content.trim(), type });
    if (res.ok && res.post) {
      onCreated(res.post);
      setContent('');
    }
    setLoading(false);
  };

  return (
    <div className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex gap-3">
        <Avatar user={user} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update, achievement, or ask for teammates…"
          rows={2}
          className="flex-1 text-base sm:text-sm bg-muted/60 rounded-xl p-3 border border-transparent focus:border-primary focus:bg-background focus:outline-none resize-none transition-all"
        />
      </div>
      <div className="flex items-center gap-2 justify-between pt-1 border-t border-border/40">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('update')}
            className={cn(
              'text-xs px-3.5 py-1.5 rounded-xl font-semibold tap-press transition-colors',
              type === 'update' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => setType('achievement')}
            className={cn(
              'text-xs px-3.5 py-1.5 rounded-xl font-semibold tap-press transition-colors flex items-center gap-1.5',
              type === 'achievement' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            <Trophy className="w-3.5 h-3.5" /> Achievement
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!content.trim() || loading}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 tap-press transition-all shadow-xs"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted/70 skeleton-shimmer shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-32 bg-muted/80 rounded-md skeleton-shimmer" />
          <div className="h-3 w-20 bg-muted/60 rounded-md skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-3.5 w-full bg-muted/70 rounded-md skeleton-shimmer" />
        <div className="h-3.5 w-5/6 bg-muted/70 rounded-md skeleton-shimmer" />
        <div className="h-3.5 w-2/3 bg-muted/60 rounded-md skeleton-shimmer" />
      </div>
      <div className="pt-2 border-t border-border/40 flex items-center gap-4">
        <div className="h-7 w-20 bg-muted/60 rounded-lg skeleton-shimmer" />
        <div className="h-7 w-20 bg-muted/60 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  );
}

// ─── Feed Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'achievements' | 'updates'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loader = useRef<HTMLDivElement>(null);

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
        return prev + 2; // 50 ticks * 100ms = 5000ms
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
        setPosts((prev) => p === 1 ? res.posts! : [...prev, ...res.posts!]);
        setHasMore(res.posts.length === 10);
      } else if (!res.ok) {
        setError(res.error || 'Failed to load feed posts.');
      }
    } catch (err: any) {
      setError('Unable to load feed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !error) {
        const next = page + 1;
        setPage(next);
        fetchPosts(next);
      }
    }, { threshold: 0.5 });
    if (loader.current) obs.observe(loader.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page, error, fetchPosts]);

  const handleReact = async (postId: string, type: 'like' | 'celebrate' | 'support') => {
    const res = await api.posts.react(postId, type);
    if (res.ok) {
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadySame = p.user_reaction === type;
        return {
          ...p,
          user_reaction: alreadySame ? undefined : type,
          reaction_count: alreadySame ? (p.reaction_count ?? 1) - 1 : (p.reaction_count ?? 0) + 1,
        };
      }));
    }
  };

  const handleDelete = async (postId: string) => {
    const res = await api.posts.delete(postId);
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const displayedPosts = posts.filter((p) => {
    if (filter === 'achievements') return p.type === 'achievement';
    if (filter === 'updates') return p.type !== 'achievement';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      {/* ─── Campus Stories Reel ────────────────────────────────────────────── */}
      <div className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/60 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add Story Button for Current User */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingStory}
              className="relative w-14 h-14 rounded-full border-2 border-dashed border-primary/60 flex items-center justify-center bg-primary/10 text-primary tap-press hover:bg-primary/20 transition-all"
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
                className="flex flex-col items-center gap-1.5 shrink-0 tap-press text-center"
              >
                <div className={cn(
                  'w-14 h-14 rounded-full p-0.5 transition-transform duration-200',
                  group.hasUnviewed
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-primary p-[2.5px] animate-pulse'
                    : 'border-2 border-border/80'
                )}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {author?.avatar ? (
                      <img src={author.avatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getAvatarColor(author?.id ?? 'a') }}
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

      {/* Compose Card */}
      <CreatePost onCreated={(post) => setPosts((prev) => [post, ...prev])} />

      {/* Sticky Glassmorphic Filter Bar */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/85 dark:bg-card/85 backdrop-blur-md border-b border-border/40 flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors">
        {[
          { id: 'all', label: 'All Posts' },
          { id: 'achievements', label: '🏆 Achievements' },
          { id: 'updates', label: '📢 Updates' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={cn(
              'tap-press px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              filter === item.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-destructive">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchPosts(1); }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 tap-press transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card/70 border border-dashed border-border/60 rounded-2xl text-muted-foreground space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Rss className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {filter === 'all' ? 'The feed is quiet' : `No ${filter} found`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {filter === 'all'
                ? 'Be the first to post an update, hackathon project, or ask for teammates!'
                : 'Switch filters or share a new post above.'}
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
          />
        ))
      )}

      {/* Infinite scroll trigger */}
      <div ref={loader} className="h-8 flex items-center justify-center">
        {loading && page > 1 && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* ─── Full-Screen Campus Story Viewer ──────────────────────────────── */}
      <AnimatePresence>
        {activeStoryGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none"
          >
            {/* Story Container */}
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
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
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

                {/* Tap Left / Right Nav Touch Zones */}
                <div
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx > 0) {
                      setActiveStoryIdx(i => i - 1);
                      setStoryProgress(0);
                    }
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx + 1 < activeStoryGroup.stories.length) {
                      setActiveStoryIdx(i => i + 1);
                      setStoryProgress(0);
                    } else {
                      setActiveStoryGroup(null);
                    }
                  }}
                />
              </div>

              {/* Caption if available */}
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
