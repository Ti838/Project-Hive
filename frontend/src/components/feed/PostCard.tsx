'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  Star,
  Trophy,
  Bookmark,
  Copy,
  Trash2,
  Check,
  X,
  Code2,
  CheckCircle2,
  Users2,
  ArrowUpRight,
  Globe,
  Pencil,
} from 'lucide-react';
import { api } from '@/lib/api';
import { displayName, timeAgo, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import { MediaMosaic } from './MediaMosaic';
import { ReactionDock, StackedReactionBadge } from './ReactionDock';
import { ThreadedComments } from './ThreadedComments';
import { RichPostContent } from './RichPostContent';
import { ReactionListModal } from './ReactionListModal';
import type { Post, ReactionType } from '@/types';

export function PostCard({
  post,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  onVotePoll,
  onCommentCountChange,
}: {
  post: Post;
  currentUserId: string;
  onReact: (id: string, type: ReactionType) => void;
  onEdit?: (post: Post) => void;
  onDelete: (id: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}) {
  const [expandedComments, setExpandedComments] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyPostLink = () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowSheet(false);
    }, 1400);
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        id={`post-${post.id}`}
        className="surface-glass rounded-3xl border border-foreground/10 dark:border-foreground/5 shadow-xl hover:shadow-2xl hover:border-primary/40 transition-all duration-300 overflow-hidden space-y-4 p-5 sm:p-6"
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
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span>{post.author?.university ?? 'Student'}</span>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 text-muted-foreground/70" title="Public post">
                <Globe className="w-3 h-3" />
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowSheet(true)}
            className="p-2 -mr-1 rounded-xl text-muted-foreground hover:bg-foreground/10 hover:text-foreground tap-press transition-colors cursor-pointer"
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

          {/* Rich Formatted Text Content */}
          <RichPostContent content={post.content} />

          {/* 1 to 5+ Smart Media Mosaic */}
          {mediaList.length > 0 && <MediaMosaic mediaUrls={mediaList} />}

          {/* Syntax-Highlighted Code Block */}
          {post.code_snippet && post.code_snippet.code && (
            <div className="mt-3.5 rounded-2xl overflow-hidden border border-foreground/10 bg-background/60 shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-foreground/5 text-xs">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-foreground/90">{post.code_snippet.title || 'Code Snippet'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md">
                    {post.code_snippet.language || 'code'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(post.code_snippet?.code || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer"
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
            <div className="mt-3.5 space-y-2 p-3.5 sm:p-4 rounded-2xl border border-foreground/10 bg-muted/20">
              {post.poll_data.question && post.poll_data.question !== post.content && (
                <p className="font-bold text-xs sm:text-sm text-foreground mb-2">{post.poll_data.question}</p>
              )}
              {post.poll_data.options.map((opt) => {
                const votes = Array.isArray(opt.votes) ? opt.votes : [];
                const totalVotes =
                  post.poll_data?.options.reduce((acc, o) => acc + (Array.isArray(o.votes) ? o.votes.length : 0), 0) || 1;
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
                        : 'border-foreground/10 bg-muted/40 hover:border-foreground/20'
                    )}
                  >
                    {/* Animated vote fill bar */}
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 transition-all duration-700 rounded-l-xl',
                        hasVotedThis ? 'bg-primary/25' : 'bg-foreground/10'
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

        {/* Reaction & Engagement Summary Row */}
        {((post.reaction_count ?? 0) > 0 || (post.comment_count ?? post.comments_count ?? 0) > 0) && (
          <div className="flex items-center justify-between pt-2 pb-0.5 text-xs text-muted-foreground border-t border-border/40 dark:border-foreground/5">
            <StackedReactionBadge
              reactionCounts={post.reaction_counts}
              total={post.reaction_count}
              onClick={() => setShowReactionModal(true)}
            />

            <div className="flex items-center gap-3 text-xs ml-auto">
              {(post.comment_count ?? post.comments_count ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedComments(!expandedComments)}
                  className="hover:underline hover:text-foreground transition-colors cursor-pointer"
                >
                  {post.comment_count ?? post.comments_count ?? 0} comment
                  {(post.comment_count ?? post.comments_count ?? 0) === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3-Button Full Action Bar */}
        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-border/50 dark:border-foreground/10 relative select-none">
          <div className="w-full flex items-center justify-center">
            <ReactionDock
              currentReaction={post.user_reaction}
              onReact={(type) => onReact(post.id, type)}
              className="w-full flex justify-center"
            />
          </div>

          <button
            type="button"
            onClick={() => setExpandedComments(!expandedComments)}
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold tap-press transition-all cursor-pointer group',
              expandedComments
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Comment</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground tap-press transition-all cursor-pointer group"
          >
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Share</span>
          </button>
        </div>

        {/* 2-Tier Threaded Discussion Tree */}
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

      {/* Native Mobile Bottom Sheet / Centered Desktop Modal */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-xs z-50 transition-opacity"
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
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      saved ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-foreground'
                    )}
                  >
                    <Bookmark className={cn('w-4 h-4', saved && 'fill-amber-500 text-amber-500')} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{saved ? 'Saved in Bookmarks' : 'Bookmark Post'}</p>
                    <p className="text-xs text-muted-foreground">
                      {saved ? 'Click to remove bookmark' : 'Save for quick access in /saved'}
                    </p>
                  </div>
                </button>

                {/* Author Edit */}
                {post.author_id === currentUserId && onEdit && (
                  <button
                    onClick={() => {
                      onEdit(post);
                      setShowSheet(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent tap-press transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Edit Post</p>
                      <p className="text-xs text-muted-foreground">Modify text or snippet</p>
                    </div>
                  </button>
                )}

                {/* Author Delete */}
                {post.author_id === currentUserId && (
                  <button
                    onClick={() => {
                      onDelete(post.id);
                      setShowSheet(false);
                    }}
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

      {/* Reaction Details Modal */}
      <ReactionListModal
        isOpen={showReactionModal}
        onClose={() => setShowReactionModal(false)}
        postId={post.id}
        reactionCounts={post.reaction_counts}
        totalCount={post.reaction_count}
      />
    </>
  );
}

