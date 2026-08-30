'use client';
// ─── Feed Page ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, ImagePlus, Send, ThumbsUp, Star, HandHeart, Trophy, Rss } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Post, PostComment } from '@/types';

// ─── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }: { user?: { first_name: string; last_name: string; avatar?: string; id: string } | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  const name = displayName(user ?? undefined);
  if (user?.avatar) return <img src={user.avatar} alt={name} className={cn(sz, 'rounded-full object-cover shrink-0')} />;
  return (
    <div className={cn(sz, 'rounded-full flex items-center justify-center text-white font-semibold shrink-0')}
      style={{ backgroundColor: getAvatarColor(user?.id ?? 'x') }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Reaction Button ───────────────────────────────────────────────────────────
const REACTIONS = [
  { type: 'like' as const, icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  { type: 'celebrate' as const, icon: Trophy, label: 'Celebrate', color: 'text-yellow-500' },
  { type: 'support' as const, icon: HandHeart, label: 'Support', color: 'text-rose-500' },
];

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onReact, onDelete }: {
  post: Post;
  currentUserId: string;
  onReact: (id: string, type: 'like' | 'celebrate' | 'support') => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const currentReaction = post.user_reaction;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <Avatar user={post.author} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{displayName(post.author ?? undefined)}</p>
          <p className="text-xs text-muted-foreground">{post.author?.university ?? ''} · {timeAgo(post.created_at)}</p>
        </div>
        {post.author_id === currentUserId && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-md hover:bg-accent transition-colors">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-10 bg-popover border border-border rounded-lg shadow-lg py-1 w-36"
                >
                  <button
                    onClick={() => { onDelete(post.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-accent"
                  >
                    Delete post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.type === 'achievement' && (
          <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" /> Achievement Unlocked
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.images && post.images.length > 0 && (
          <div className="mt-3 grid gap-2 grid-cols-2">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-lg object-cover w-full h-40" />
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
                  className="relative p-2.5 rounded-xl border border-border bg-muted/40 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500 rounded-l-xl"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative flex items-center justify-between text-xs font-medium">
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
            <button onClick={loadComments} className="hover:text-foreground transition-colors">
              {post.comment_count} comments
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
        {REACTIONS.map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => onReact(post.id, type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              currentReaction === type
                ? cn('bg-primary/10', color)
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all ml-auto"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Comment</span>
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar user={c.author} size="sm" />
                  <div className="bg-muted rounded-xl px-3 py-2 text-sm flex-1">
                    <span className="font-medium text-xs mr-2">{displayName(c.author ?? undefined)}</span>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
            {/* Comment input */}
            <div className="flex gap-2 px-4 pb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Write a comment…"
                className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 border border-transparent focus:border-primary focus:outline-none"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim() || submitting}
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
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
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar user={user} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update, achievement, or ask for teammates…"
          rows={2}
          className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 border border-transparent focus:border-primary focus:outline-none resize-none"
        />
      </div>
      <div className="flex items-center gap-2 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setType('update')}
            className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors', type === 'update' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}
          >Update</button>
          <button
            onClick={() => setType('achievement')}
            className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors', type === 'achievement' ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent')}
          >🏆 Achievement</button>
        </div>
        <button
          onClick={submit}
          disabled={!content.trim() || loading}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </div>
  );
}

// ─── Feed Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const loader = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (p: number) => {
    const res = await api.posts.list(p, 10);
    if (res.ok && res.posts) {
      setPosts((prev) => p === 1 ? res.posts! : [...prev, ...res.posts!]);
      setHasMore(res.posts.length === 10);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(1); }, []);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = page + 1;
        setPage(next);
        fetchPosts(next);
      }
    }, { threshold: 0.5 });
    if (loader.current) obs.observe(loader.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page]);

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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <CreatePost onCreated={(post) => setPosts((prev) => [post, ...prev])} />

      {loading && page === 1 ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Rss className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">The feed is quiet.</p>
          <p className="text-sm">Be the first to post something!</p>
        </div>
      ) : (
        posts.map((post) => (
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
    </div>
  );
}
