'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Reply, Trash2, CornerDownRight, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { displayName, timeAgo, sanitizeAndDecodeText, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import type { PostComment } from '@/types';

interface ThreadedCommentsProps {
  postId: string;
  postAuthorId: string;
  className?: string;
  onCommentCountChange?: (delta: number) => void;
}

export function ThreadedComments({
  postId,
  postAuthorId,
  className,
  onCommentCountChange,
}: ThreadedCommentsProps) {
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mainInput, setMainInput] = useState('');

  // Active reply box targeting a parent comment ID
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.posts.getComments(postId);
      if (res.ok && res.comments) {
        setComments(res.comments);
      }
    } catch (err) {
      console.error('Failed to load comments for post:', postId, err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Real-Time Socket Listener ───────────────────────────────────────────────
  useSocket({
    onPostComment: (data) => {
      if (data.postId !== postId) return;
      const newComment = data.comment;

      setComments((prev) => {
        // Prevent duplicate append
        const exists = (list: PostComment[]): boolean => {
          for (const item of list) {
            if (item.id === newComment.id) return true;
            if (item.replies && exists(item.replies)) return true;
          }
          return false;
        };
        if (exists(prev)) return prev;

        // If it's a reply to an existing comment
        if (newComment.parent_comment_id) {
          return prev.map((top) => {
            if (top.id === newComment.parent_comment_id) {
              return {
                ...top,
                replies: [...(top.replies || []), newComment],
              };
            }
            return top;
          });
        }
        // Top-level comment
        return [...prev, newComment];
      });

      onCommentCountChange?.(1);
    },

    onPostCommentDeleted: (data) => {
      if (data.postId !== postId) return;
      setComments((prev) => {
        return prev
          .filter((top) => top.id !== data.commentId)
          .map((top) => ({
            ...top,
            replies: (top.replies || []).filter((rep) => rep.id !== data.commentId),
          }));
      });
      onCommentCountChange?.(-1);
    },
  });

  const handleAddComment = async (parentId?: string) => {
    const text = parentId ? replyText.trim() : mainInput.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.posts.addComment(postId, text, parentId);
      if (res.ok && res.comment) {
        const comment = res.comment;
        setComments((prev) => {
          if (parentId) {
            return prev.map((top) => {
              if (top.id === parentId) {
                const already = (top.replies || []).some((r) => r.id === comment.id);
                if (already) return top;
                return { ...top, replies: [...(top.replies || []), comment] };
              }
              return top;
            });
          }
          const already = prev.some((c) => c.id === comment.id);
          if (already) return prev;
          return [...prev, comment];
        });

        if (parentId) {
          setReplyText('');
          setReplyingToId(null);
        } else {
          setMainInput('');
        }
        onCommentCountChange?.(1);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.posts.deleteComment(postId, commentId);
      if (res.ok) {
        setComments((prev) =>
          prev
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== commentId),
            }))
        );
        onCommentCountChange?.(-1);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const renderCommentNode = (c: PostComment, isReply = false) => {
    const isAuthor = c.author?.id === postAuthorId;
    const isOwner = c.author?.id === currentUser?.id || currentUser?.role === 'admin';

    return (
      <div key={c.id} className={cn('group/comment flex gap-2.5', isReply && 'mt-2.5')}>
        <UserProfileHoverCard user={c.author}>
          <UserAvatar user={c.author} size={isReply ? 'xs' : 'sm'} interactive />
        </UserProfileHoverCard>

        <div className="flex-1 min-w-0">
          <div className="bg-muted/70 dark:bg-white/5 rounded-2xl px-3.5 py-2 text-sm border border-white/5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <UserProfileHoverCard user={c.author}>
                  <span className="font-bold text-xs text-foreground cursor-pointer hover:underline truncate">
                    {displayName(c.author ?? undefined)}
                  </span>
                </UserProfileHoverCard>
                {isAuthor && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/25">
                    <ShieldCheck className="w-2.5 h-2.5" /> Author
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {timeAgo(c.created_at)}
              </span>
            </div>
            <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {sanitizeAndDecodeText(c.content)}
            </p>
          </div>

          {/* Actions below bubble */}
          <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-muted-foreground">
            {!isReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId((prev) => (prev === c.id ? null : c.id));
                  setReplyText('');
                }}
                className="font-semibold hover:text-foreground inline-flex items-center gap-1 tap-press transition-colors cursor-pointer"
              >
                <Reply className="w-3 h-3" /> Reply
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => handleDeleteComment(c.id)}
                className="hover:text-destructive inline-flex items-center gap-1 tap-press transition-colors cursor-pointer opacity-0 group-hover/comment:opacity-100"
                title="Delete comment"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>

          {/* ── Nested Replies ────────────────────────────────────────────── */}
          {c.replies && c.replies.length > 0 && (
            <div className="mt-1 ml-2 sm:ml-4 pl-3 border-l-2 border-primary/20 dark:border-white/10 space-y-2">
              {c.replies.map((reply) => renderCommentNode(reply, true))}
            </div>
          )}

          {/* ── Inline Reply Input Box ────────────────────────────────────── */}
          {replyingToId === c.id && (
            <div className="mt-2.5 ml-2 sm:ml-4 pl-3 border-l-2 border-primary/40 flex gap-2 items-center">
              <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(c.id)}
                placeholder={`Reply to ${displayName(c.author ?? undefined)}…`}
                className="flex-1 h-9 text-xs bg-muted/80 rounded-xl px-3 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleAddComment(c.id)}
                disabled={!replyText.trim() || submitting}
                className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 tap-press transition-colors cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('border-t border-border/50 bg-muted/10 rounded-b-3xl overflow-hidden', className)}>
      <div className="p-4 space-y-3.5 max-h-96 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading conversation…
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No comments yet. Start the discussion!
          </p>
        ) : (
          comments.map((c) => renderCommentNode(c, false))
        )}
      </div>

      {/* Main Comment Input */}
      <div className="flex gap-2 p-3 sm:px-4 sm:pb-4 border-t border-white/5">
        <UserAvatar user={currentUser} size="sm" />
        <input
          type="text"
          value={mainInput}
          onChange={(e) => setMainInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          placeholder="Write a thoughtful comment…"
          className="flex-1 h-10 text-xs sm:text-sm bg-muted/80 rounded-xl px-4 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => handleAddComment()}
          disabled={!mainInput.trim() || submitting}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 tap-press transition-colors shadow-xs cursor-pointer flex items-center justify-center"
          aria-label="Send comment"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
