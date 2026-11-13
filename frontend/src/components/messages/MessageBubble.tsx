'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Phone, Check, CheckCheck } from 'lucide-react';
import { cn, timeAgo, sanitizeAndDecodeText } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { REACTION_EMOJIS, renderReplySnippet } from './messageUtils';
import type { Message } from '@/types';

export function MessageBubble({
  msg,
  isMine,
  currentUserId,
  peerIsOnline,
  peerId,
  isSeen,
  onReply,
  onJoinCall,
  onReact,
}: {
  msg: Message;
  isMine: boolean;
  currentUserId?: string;
  peerIsOnline?: boolean;
  peerId?: string;
  isSeen?: boolean;
  onReply: () => void;
  onJoinCall?: () => void;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const replySnippet = renderReplySnippet(msg.reply_to_content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Parse media or voice
  let mediaImgUrl: string | null = msg.media_url || null;
  let voiceAudioUrl: string | null = msg.voice_url || null;
  let textContent = msg.content;

  if (msg.content?.trim().startsWith('{') && msg.content?.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(msg.content.trim());
      if (parsed.type === 'image' && parsed.url) {
        mediaImgUrl = parsed.url;
        textContent = parsed.caption || '';
      } else if (parsed.type === 'voice' && parsed.url) {
        voiceAudioUrl = parsed.url;
        textContent = '';
      }
    } catch {}
  } else if (msg.content?.trim().startsWith('data:image')) {
    mediaImgUrl = msg.content.trim();
    textContent = '';
  } else if (msg.content?.trim().startsWith('data:audio') || msg.type === 'voice') {
    voiceAudioUrl = msg.content.trim();
    textContent = '';
  }

  // Delivery status evaluation
  const messageSeen = msg.status === 'seen' || isSeen || Boolean(peerId && msg.read_by?.includes(peerId));
  const messageDelivered = msg.status === 'delivered' || messageSeen || peerIsOnline;

  // Group reactions
  const reactionsMap: Record<string, { count: number; reactedByMe: boolean }> = {};
  (msg.reactions || []).forEach((r) => {
    if (!reactionsMap[r.emoji]) {
      reactionsMap[r.emoji] = { count: 0, reactedByMe: false };
    }
    reactionsMap[r.emoji].count += 1;
    if (r.user_id === currentUserId) {
      reactionsMap[r.emoji].reactedByMe = true;
    }
  });
  const reactionList = Object.entries(reactionsMap).map(([emoji, data]) => ({ emoji, ...data }));

  return (
    <div
      className={cn('flex gap-2 items-end group relative', isMine && 'flex-row-reverse')}
      onMouseEnter={() => setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
    >
      {!isMine && (
        <UserProfileHoverCard user={msg.sender}>
          <UserAvatar user={msg.sender} size="sm" interactive />
        </UserProfileHoverCard>
      )}

      <div className={cn('flex flex-col max-w-[75%] sm:max-w-[70%]', isMine && 'items-end')}>
        {/* Floating Messenger Emoji Reaction Bar */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute -top-9 z-20 flex items-center gap-1 bg-card/95 backdrop-blur-md px-2 py-1 rounded-full border border-border shadow-md',
                isMine ? 'right-0' : 'left-8'
              )}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(msg.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="hover:scale-125 active:scale-95 transition-transform p-0.5 text-base cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onReply();
                  setShowReactionPicker(false);
                }}
                className="hover:scale-110 active:scale-95 transition-transform p-1 text-muted-foreground hover:text-foreground text-xs ml-1 border-l border-border pl-1.5 cursor-pointer"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl text-sm transition-all shadow-xs',
            voiceAudioUrl ? 'p-1.5 sm:p-2' : 'px-3.5 py-2.5',
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-xs'
              : 'bg-muted/90 dark:bg-muted/70 text-foreground rounded-bl-xs border border-border/50'
          )}
        >
          {/* Reply context quote if present */}
          {replySnippet.label && (
            <div
              className={cn(
                'flex items-center gap-2 mb-2 p-1.5 rounded-lg border-l-2 text-xs',
                isMine
                  ? 'bg-primary-foreground/15 border-primary-foreground text-primary-foreground/90'
                  : 'bg-card/70 border-primary text-foreground/80'
              )}
            >
              <Reply className="w-3 h-3 shrink-0 opacity-80" />
              {replySnippet.isMedia && replySnippet.mediaUrl && (
                <img
                  src={replySnippet.mediaUrl}
                  alt="preview"
                  className="w-5 h-5 rounded object-cover shrink-0"
                />
              )}
              <span className="truncate">{replySnippet.label}</span>
            </div>
          )}

          {/* Voice note vs Media Image vs Text */}
          {voiceAudioUrl ? (
            <VoiceMessagePlayer audioUrl={voiceAudioUrl} isMine={isMine} />
          ) : mediaImgUrl ? (
            <div className="space-y-1.5">
              <img
                src={mediaImgUrl}
                alt="Message attachment"
                className="max-h-64 rounded-xl object-contain bg-background/10"
              />
              {textContent && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {sanitizeAndDecodeText(textContent)}
                </p>
              )}
            </div>
          ) : textContent?.startsWith('📞 Join my') ? (
            <div className="space-y-2 p-1">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" /> Live Call Invite
              </p>
              <button
                type="button"
                onClick={onJoinCall}
                className="w-full py-1.5 px-3 bg-emerald-600 text-white font-medium rounded-xl text-xs hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                Join Call Now
              </button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {sanitizeAndDecodeText(textContent)}
            </p>
          )}
        </div>

        {/* Reactions Counter Badges */}
        {reactionList.length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1 px-1', isMine && 'justify-end')}>
            {reactionList.map(({ emoji, count, reactedByMe }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(msg.id, emoji)}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer',
                  reactedByMe
                    ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                    : 'bg-card border-border text-foreground/80 font-medium'
                )}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px]">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp & Telegram Delivery Status Ticks */}
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          <span className="text-[10px] text-muted-foreground">{timeAgo(msg.created_at)}</span>

          {isMine && (
            <span
              className="inline-flex items-center shrink-0"
              title={messageSeen ? 'Read' : messageDelivered ? 'Delivered' : 'Sent'}
            >
              {messageSeen ? (
                <span className="text-sky-500 font-black flex items-center" title="Seen">
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              ) : messageDelivered ? (
                <span className="text-muted-foreground/80 flex items-center" title="Delivered">
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
                </span>
              ) : (
                <span className="text-muted-foreground/70 flex items-center" title="Sent">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

