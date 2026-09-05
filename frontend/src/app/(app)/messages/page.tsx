'use client';
// ─── Messages Page (Telegram / Messenger / WhatsApp Studio Grade) ──────────────

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Video, Search, Mic, X, Reply, ChevronLeft,
  Image as ImageIcon, Paperclip, Check, CheckCheck, Play, Pause, Trash2,
  Pin, PinOff, MessageSquare, Users, Sparkles, MessageCircle, Star
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore, useSocketStore } from '@/lib/store';
import { useCallStore } from '@/lib/callStore';
import { useSocket } from '@/hooks/useSocket';
import { displayName, timeAgo, cn, sanitizeAndDecodeText } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import type { Message, User, Conversation } from '@/types';

// Messenger Floating Reactions
const REACTION_EMOJIS = ['❤️', '🔥', '🚀', '👍', '👏', '😂'];

// ─── Safe Reply Snippet Helper ─────────────────────────────────────────────────
function renderReplySnippet(rawContent: string | null | undefined): { isMedia: boolean; mediaUrl?: string; label: string } {
  if (!rawContent) return { isMedia: false, label: '' };

  const trimmed = rawContent.trim();

  // Case 1: Raw JSON payload like {"type":"image","url":"data:image/..."}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'image' || parsed.url?.startsWith('data:image') || parsed.url?.startsWith('http')) {
        return {
          isMedia: true,
          mediaUrl: parsed.url,
          label: parsed.caption ? sanitizeAndDecodeText(parsed.caption) : '📷 Photo',
        };
      }
      if (parsed.type === 'voice') {
        return { isMedia: false, label: '🎤 Voice Note' };
      }
      if (parsed.type === 'file') {
        return {
          isMedia: false,
          label: `📎 ${parsed.name || 'Attachment'}`,
        };
      }
    } catch {
      // Fall through
    }
  }

  if (trimmed.startsWith('data:image') || (trimmed.startsWith('http') && (trimmed.includes('.png') || trimmed.includes('.jpg') || trimmed.includes('.jpeg') || trimmed.includes('.webp')))) {
    return { isMedia: true, mediaUrl: trimmed, label: '📷 Photo' };
  }

  if (trimmed.startsWith('data:audio')) {
    return { isMedia: false, label: '🎤 Voice Note' };
  }

  if (trimmed.startsWith('📞 Join my')) {
    return { isMedia: false, label: '📞 Meeting Invite' };
  }

  const cleaned = sanitizeAndDecodeText(trimmed);
  const truncated = cleaned.length > 60 ? cleaned.slice(0, 57) + '…' : cleaned;
  return { isMedia: false, label: truncated };
}

// ─── Voice Message Player (Waveform Audio Visualizer) ─────────────────────────
function VoiceMessagePlayer({ audioUrl, isMine }: { audioUrl: string; isMine: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Audio play error:', e));
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const bars = [35, 60, 85, 45, 95, 75, 55, 100, 70, 85, 60, 45, 80, 65, 50, 75, 90, 40];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[250px]">
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 shrink-0 shadow-xs',
          isMine ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1 h-6">
          {bars.map((height, i) => {
            const progress = duration > 0 ? (currentTime / duration) : 0;
            const barProgress = i / bars.length;
            const active = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full transition-all duration-150',
                  active
                    ? (isMine ? 'bg-primary-foreground' : 'bg-primary')
                    : (isMine ? 'bg-primary-foreground/35' : 'bg-muted-foreground/30')
                )}
                style={{
                  height: isPlaying ? `${Math.max(25, Math.min(100, height * (0.6 + 0.8 * Math.random())))}%` : `${height}%`,
                }}
              />
            );
          })}
        </div>

        <div className={cn('flex justify-between text-[10px] font-mono', isMine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : 'Voice note'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble (WhatsApp/Telegram Ticks + Reactions) ────────────────────
function MessageBubble({
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
  const messageSeen = msg.status === 'seen' || isSeen || (Boolean(peerId && msg.read_by?.includes(peerId)));
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
                className="hover:scale-110 active:scale-95 transition-transform p-1 text-muted-foreground hover:text-foreground text-xs ml-1 border-l border-border pl-1.5"
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
                className="max-h-64 rounded-xl object-contain bg-black/10"
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
                className="w-full py-1.5 px-3 bg-emerald-600 text-white font-medium rounded-xl text-xs hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
                  'text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all hover:scale-105 active:scale-95 shadow-2xs',
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

// ─── Messages Core Content ───────────────────────────────────────────────────
function MessagesContent() {
  const searchParams = useSearchParams();
  const deepLinkUserId = searchParams.get('user') || searchParams.get('userId');
  const deepLinkRoomId = searchParams.get('roomId') || searchParams.get('room');

  const { user } = useAuthStore();
  const isConnected = useSocketStore((s) => s.isConnected);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);
  const userStatuses = useSocketStore((s) => s.userStatuses);

  const getUserPresence = useCallback((u?: User | null) => {
    if (!u) return { isOnline: false, status: 'offline' as const };
    const tracked = userStatuses[u.id];
    const isOnline = onlineUsers.includes(u.id) || tracked?.onlineStatus === 'online' || u.online_status === 'online';
    const rawStatus = tracked?.status || (isOnline ? 'online' : 'offline');
    const status = (rawStatus === 'busy' ? 'busy' : rawStatus === 'away' ? 'away' : isOnline ? 'online' : 'offline') as 'online' | 'busy' | 'away' | 'offline';
    return { isOnline, status };
  }, [onlineUsers, userStatuses]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'squads' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<{ url: string; name?: string; size?: string } | null>(null);
  const [readReceipts, setReadReceipts] = useState<Record<string, boolean>>({});

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const roomId = selectedUser && user?.id ? [user.id, selectedUser.id].sort().join('_') : null;

  const { startCall: triggerLiveKitCall } = useCallStore();

  // Socket setup with dual-dispatch & delivery pipeline
  const socket = useSocket({
    onMessage: (msg) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, {
          id: msg.id,
          content: msg.content,
          type: msg.type as Message['type'],
          status: 'seen',
          sender: msg.sender,
          sender_id: msg.sender?.id || '',
          room_id: msg.roomId,
          created_at: msg.createdAt || new Date().toISOString(),
          reply_to_content: msg.reply_to_content,
          reactions: [],
        }]);

        // Acknowledge read receipt if we are looking at this room
        if (selectedUser) {
          socket.ackDelivered({ messageId: msg.id, roomId: msg.roomId, senderId: msg.sender?.id });
          socket.readMessage({ roomId: msg.roomId, friendId: selectedUser.id, messageIds: [msg.id] });
          api.messages.markAsRead(selectedUser.id).catch(() => {});
        }
      }
    },
    onConversationNewMessage: ({ roomId: incomingRoomId, message: incomingMsg }) => {
      // Reorder conversations sidebar & bump unread count
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.room_id === incomingRoomId || c.roomId === incomingRoomId || (c.user && [user?.id, c.user.id].sort().join('_') === incomingRoomId));
        const isCurrentActive = roomId === incomingRoomId;

        if (idx !== -1) {
          const existing = prev[idx];
          const updated: Conversation = {
            ...existing,
            last_message: incomingMsg,
            lastMessage: incomingMsg,
            unreadCount: isCurrentActive ? 0 : (existing.unreadCount || existing.unread_count || 0) + 1,
            unread_count: isCurrentActive ? 0 : (existing.unreadCount || existing.unread_count || 0) + 1,
          };
          const rest = prev.filter((_, i) => i !== idx);
          // If pinned, keep on top among pinned; otherwise place after pinned
          return [updated, ...rest];
        }
        return prev;
      });

      // Acknowledge delivery to sender
      if (incomingMsg?.id && incomingMsg?.sender_id !== user?.id) {
        socket.ackDelivered({ messageId: incomingMsg.id, roomId: incomingRoomId, senderId: incomingMsg.sender_id });
      }
    },
    onMessageDelivered: ({ messageId, roomId: deliveredRoomId }) => {
      if (deliveredRoomId === roomId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId && m.status !== 'seen' ? { ...m, status: 'delivered' } : m))
        );
      }
    },
    onReaction: (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== data.messageId) return m;
            const current = m.reactions || [];
            if (data.action === 'removed') {
              return {
                ...m,
                reactions: current.filter((r) => !(r.user_id === data.userId && r.emoji === data.emoji)),
              };
            }
            return {
              ...m,
              reactions: [...current.filter((r) => !(r.user_id === data.userId && r.emoji === data.emoji)), { emoji: data.emoji, user_id: data.userId }],
            };
          })
        );
      }
    },
    onReadReceipt: (data) => {
      if (data.roomId === roomId && data.readBy === selectedUser?.id) {
        setReadReceipts((prev) => {
          const next = { ...prev };
          (data.messageIds || []).forEach((id) => { next[id] = true; });
          return next;
        });
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender_id === user?.id) {
              const currentReadBy = m.read_by || [];
              const updatedReadBy = currentReadBy.includes(selectedUser.id) ? currentReadBy : [...currentReadBy, selectedUser.id];
              return { ...m, read_by: updatedReadBy, status: 'seen' };
            }
            return m;
          })
        );
      }
    },
    onTyping: (data) => { if (data.userId === selectedUser?.id) setPeerTyping(true); },
    onStopTyping: (data) => { if (data.userId === selectedUser?.id) setPeerTyping(false); },
  });

  const handleInitiateCall = (type: 'voice' | 'video') => {
    if (!selectedUser) return;
    triggerLiveKitCall({
      scope: 'direct',
      targetId: selectedUser.id,
      callType: type === 'voice' ? 'audio' : 'video',
      targetUser: selectedUser,
      socketEmit: (ev, data) => socket.socket?.emit(ev, data),
    });

    if (roomId) {
      socket.sendMessage(
        roomId,
        `📞 Join my ${type} call: In-App Collaborative Room`,
        { type: 'call_invite', callType: type }
      );
    }
  };

  // Initial fetch of conversation list
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    api.messages.getConversations().then((res) => {
      if (res.ok && res.conversations) {
        const norm: Conversation[] = res.conversations.map((c: any) => ({
          ...c,
          room_id: c.room_id || c.roomId || (c.user && user?.id ? [user.id, c.user.id].sort().join('_') : ''),
          user: c.user || c.friend,
          last_message: c.last_message || c.lastMessage,
          unread_count: c.unread_count ?? c.unreadCount ?? 0,
          unreadCount: c.unread_count ?? c.unreadCount ?? 0,
          is_pinned: Boolean(c.is_pinned ?? c.isPinned),
          isPinned: Boolean(c.is_pinned ?? c.isPinned),
        })).filter((c: any) => c.user);
        setConversations(norm);

        // Auto-select deep-link user if present
        if (deepLinkUserId) {
          const match = norm.find((c) => c.user?.id === deepLinkUserId);
          if (match) {
            setSelectedUser(match.user);
          } else {
            api.users.getById(deepLinkUserId).then((uRes) => {
              if (uRes.ok && uRes.id) {
                setSelectedUser(uRes);
              }
            });
          }
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => window.removeEventListener('resize', handleResize);
  }, [deepLinkUserId, user?.id]);

  // Load messages & acknowledge read when user selected
  useEffect(() => {
    if (!selectedUser || !roomId) return;
    setMessages([]);
    socket.joinRoom(roomId);

    api.messages.getRoom(roomId, 50, 0).then((res) => {
      if (res.ok && res.messages) {
        setMessages(res.messages);
      }
    });

    // Mark messages as read in DB and trigger socket read receipt
    api.messages.markAsRead(selectedUser.id).catch(() => {});
    socket.readMessage({ roomId, friendId: selectedUser.id });

    // Reset unread count locally in sidebar
    setConversations((prev) =>
      prev.map((c) => (c.user?.id === selectedUser.id ? { ...c, unreadCount: 0, unread_count: 0 } : c))
    );

    return () => { socket.leaveRoom(); };
  }, [selectedUser, roomId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleTogglePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    const targetRoomId = conv.room_id || conv.roomId || (conv.user && user?.id ? [user.id, conv.user.id].sort().join('_') : '');
    if (!targetRoomId) return;

    const nextPinnedState = !(conv.isPinned || conv.is_pinned);
    setConversations((prev) =>
      prev.map((c) => (c.room_id === targetRoomId || c.user?.id === conv.user?.id ? { ...c, isPinned: nextPinnedState, is_pinned: nextPinnedState } : c))
    );

    try {
      await api.messages.togglePin(targetRoomId);
    } catch {
      // Revert if error
      setConversations((prev) =>
        prev.map((c) => (c.room_id === targetRoomId || c.user?.id === conv.user?.id ? { ...c, isPinned: !nextPinnedState, is_pinned: !nextPinnedState } : c))
      );
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setImageAttachment({
        url: reader.result as string,
        name: file.name,
        size: `${sizeMb} MB`,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const sizeKb = (file.size / 1024).toFixed(0);
          setImageAttachment({
            url: reader.result as string,
            name: `Screenshot-${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.png`,
            size: `${sizeKb} KB`,
          });
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  // Voice Recording Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Could not access microphone for voice note.');
      console.error(err);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const finishVoiceRecording = () => {
    if (!mediaRecorderRef.current || !roomId) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        socket.sendMessage(
          roomId,
          JSON.stringify({ type: 'voice', url: base64Audio, duration: recordingSeconds }),
          { type: 'voice', voice_duration: recordingSeconds }
        );
      };
      reader.readAsDataURL(audioBlob);
      cancelVoiceRecording();
    };

    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current.stop();
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!roomId) return;
    socket.reactMessage({ messageId, roomId, emoji });
    api.messages.react(messageId, emoji).catch(() => {});
  };

  const sendMessage = async () => {
    if ((!content.trim() && !imageAttachment) || !roomId || sending) return;
    setSending(true);
    const extra: Record<string, unknown> = {};
    if (replyTo) {
      extra.reply_to = replyTo.id;
      const snippet = renderReplySnippet(replyTo.content);
      extra.reply_to_content = snippet.label;
      extra.reply_to_sender = displayName(replyTo.sender ?? undefined);
    }

    let payload = content.trim();
    if (imageAttachment) {
      payload = JSON.stringify({
        type: 'image',
        url: imageAttachment.url,
        caption: content.trim(),
      });
    }

    socket.sendMessage(roomId, payload, extra);
    setContent('');
    setImageAttachment(null);
    setReplyTo(null);
    setSending(false);
    socket.stopTyping(roomId);
  };

  const handleTyping = (val: string) => {
    setContent(val);
    if (!roomId) return;
    if (!typing) { socket.startTyping(roomId); setTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { socket.stopTyping(roomId); setTyping(false); }, 1500);
  };

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Segment conversations
  const pinnedConversations = conversations.filter((c) => c.isPinned || c.is_pinned);
  const unpinnedConversations = conversations.filter((c) => !(c.isPinned || c.is_pinned));

  const applyFilter = (list: Conversation[]) => {
    return list.filter((c) => {
      const matchSearch = displayName(c.user).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filterTab === 'unread') return (c.unreadCount || c.unread_count || 0) > 0;
      return true;
    });
  };

  const filteredPinned = applyFilter(pinnedConversations);
  const filteredUnpinned = applyFilter(unpinnedConversations);

  const showList = !selectedUser || !isMobile;
  const showChat = !!selectedUser;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col md:flex-row min-h-0 w-full select-none bg-background">
      {/* Conversation List Sidebar */}
      {showList && (
        <div className={cn('flex flex-col border-r border-border/70 bg-card/40 backdrop-blur-xl shrink-0 h-full min-h-0', isMobile ? 'w-full' : 'w-80 lg:w-96')}>
          {/* Header & Search */}
          <div className="p-4 border-b border-border/70 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Messages
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {conversations.reduce((acc, c) => acc + (c.unreadCount || c.unread_count || 0), 0)} unread
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-muted/70 rounded-xl border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
              {(['all', 'direct', 'squads', 'unread'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    'flex-1 py-1 text-xs font-semibold rounded-lg capitalize transition-all',
                    filterTab === tab
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/40">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <div className="w-11 h-11 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground px-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Connect with friends and start collaborating!</p>
              </div>
            ) : (
              <>
                {/* Pinned Shelf */}
                {filteredPinned.length > 0 && (
                  <div className="bg-primary/5 pb-1">
                    <div className="px-4 py-2 text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Star className="w-3 h-3 fill-current" /> Pinned Chats
                    </div>
                    {filteredPinned.map((conv) => {
                      const peer = conv.user;
                      const unread = conv.unreadCount || conv.unread_count || 0;
                      return (
                        <div
                          key={peer.id}
                          onClick={() => setSelectedUser(peer)}
                          className={cn(
                            'group w-full flex items-center gap-3 p-3.5 hover:bg-accent/60 transition-colors text-left cursor-pointer relative',
                            selectedUser?.id === peer.id && 'bg-primary/10 border-l-3 border-l-primary'
                          )}
                        >
                          <UserProfileHoverCard user={peer}>
                            <UserAvatar user={peer} size="md" showStatus status={getUserPresence(peer).status} />
                          </UserProfileHoverCard>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold truncate flex items-center gap-1">
                                {displayName(peer)}
                              </p>
                              {conv.last_message && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {timeAgo(conv.last_message.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.last_message?.content?.startsWith('data:audio') ? '🎤 Voice note' : (conv.last_message?.content ?? 'No messages yet')}
                              </p>
                              <div className="flex items-center gap-1.5 ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePin(e, conv)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-amber-500 transition-all"
                                  title="Unpin conversation"
                                >
                                  <PinOff className="w-3.5 h-3.5" />
                                </button>
                                {unread > 0 && (
                                  <span className="min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5">
                                    {unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular Conversations */}
                {filteredUnpinned.map((conv) => {
                  const peer = conv.user;
                  const unread = conv.unreadCount || conv.unread_count || 0;
                  return (
                    <div
                      key={peer.id}
                      onClick={() => setSelectedUser(peer)}
                      className={cn(
                        'group w-full flex items-center gap-3 p-3.5 hover:bg-accent/50 transition-colors text-left cursor-pointer relative',
                        selectedUser?.id === peer.id && 'bg-primary/5 border-l-3 border-l-primary'
                      )}
                    >
                      <UserProfileHoverCard user={peer}>
                        <UserAvatar user={peer} size="md" showStatus status={getUserPresence(peer).status} />
                      </UserProfileHoverCard>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold truncate">{displayName(peer)}</p>
                          {conv.last_message && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {timeAgo(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message?.content?.startsWith('data:audio') ? '🎤 Voice note' : (conv.last_message?.content ?? 'No messages yet')}
                          </p>
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(e, conv)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-amber-500 transition-all"
                              title="Pin conversation"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            {unread > 0 && (
                              <span className="min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 bg-card/20">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border/70 bg-card shrink-0">
            {isMobile && (
              <button onClick={() => setSelectedUser(null)} className="p-2 -ml-1 rounded-lg hover:bg-accent text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <UserProfileHoverCard user={selectedUser}>
              <UserAvatar user={selectedUser} size="md" showStatus status={getUserPresence(selectedUser).status} />
            </UserProfileHoverCard>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{displayName(selectedUser ?? undefined)}</p>
              <p className="text-xs text-muted-foreground">
                {peerTyping ? (
                  <span className="text-primary animate-pulse font-medium">typing…</span>
                ) : getUserPresence(selectedUser).isOnline ? (
                  <span className="capitalize text-emerald-500 font-medium">{getUserPresence(selectedUser).status}</span>
                ) : (
                  `Last seen ${timeAgo(selectedUser?.last_seen ?? '')}`
                )}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleInitiateCall('voice')}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleInitiateCall('video')}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground tap-press transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Real-time connection status banner */}
          {!isConnected && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium">Connecting to real-time chat service…</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.sender_id === user?.id}
                currentUserId={user?.id}
                peerIsOnline={getUserPresence(selectedUser).isOnline}
                peerId={selectedUser?.id}
                isSeen={readReceipts[msg.id]}
                onReply={() => setReplyTo(msg)}
                onJoinCall={() => handleInitiateCall(msg.content.includes('video') ? 'video' : 'voice')}
                onReact={handleReact}
              />
            ))}
            {peerTyping && (
              <div className="flex gap-2 items-center">
                <UserAvatar user={selectedUser} size="sm" />
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply preview */}
          <AnimatePresence>
            {replyTo && (() => {
              const snippet = renderReplySnippet(replyTo.content);
              return (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center gap-2.5 px-4 py-2 bg-muted/90 border-t border-border"
                >
                  <Reply className="w-4 h-4 text-primary shrink-0" />
                  {snippet.isMedia && snippet.mediaUrl && (
                    <img
                      src={snippet.mediaUrl}
                      alt="reply attachment"
                      className="w-7 h-7 rounded-md object-cover border border-border/70 shrink-0"
                    />
                  )}
                  <div className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                    <span className="font-semibold text-foreground mr-1.5">
                      {displayName(replyTo.sender ?? undefined)}:
                    </span>
                    <span className="text-foreground/80 font-medium">{snippet.label}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1.5 hover:bg-accent rounded-lg tap-press">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Attachment Staging Banner */}
          <AnimatePresence>
            {imageAttachment && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 dark:bg-primary/5 border-t border-border"
              >
                <div className="relative">
                  <img
                    src={imageAttachment.url}
                    alt="Attachment preview"
                    className="w-12 h-12 rounded-xl object-cover border border-primary/30 shadow-xs shrink-0"
                  />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold px-1 rounded-full">
                    IMG
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-bold text-foreground truncate">
                      {imageAttachment.name || 'Pasted Image / Screenshot'}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {imageAttachment.size || 'Image Ready'} · Add caption & hit Enter
                  </p>
                </div>
                <button
                  onClick={() => setImageAttachment(null)}
                  className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive tap-press transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Composer */}
          <div className="p-3 sm:p-4 shrink-0 bg-transparent pb-[max(0.75rem,env(safe-area-inset-bottom,12px))]">
            {isRecording ? (
              <div className="surface-floating border border-rose-500/40 rounded-2xl sm:rounded-3xl px-4 h-14 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center gap-2 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold font-mono">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                  <span className="text-xs font-medium text-rose-400/80 hidden sm:inline">
                    Recording Audio Note…
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="p-2 hover:bg-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-1 tap-press transition-colors cursor-pointer"
                    title="Cancel recording"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Discard</span>
                  </button>
                  <button
                    type="button"
                    onClick={finishVoiceRecording}
                    className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-500 tap-press transition-colors cursor-pointer"
                    title="Send Voice Note"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="surface-floating border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 backdrop-blur-2xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 tap-press transition-colors shrink-0 cursor-pointer"
                  title="Attach photo or file (or paste with Ctrl+V)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectImage}
                />

                <input
                  type="text"
                  value={content}
                  onChange={(e) => handleTyping(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={imageAttachment ? "Add a caption to attachment…" : "Type a message or paste screenshot (Ctrl+V)…"}
                  autoCapitalize="sentences"
                  autoComplete="off"
                  className="flex-1 h-10 text-sm bg-transparent px-2 text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-colors"
                />

                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 tap-press transition-colors shrink-0 cursor-pointer"
                  title="Record voice note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={(!content.trim() && !imageAttachment) || sending}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-all glow-primary tap-press shadow-lg shadow-primary/30 shrink-0 cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no conversation is selected on desktop */}
      {!selectedUser && !isMobile && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Send className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-base text-foreground mb-1">Select a conversation</h2>
            <p className="text-xs leading-relaxed">Choose a friend from the left sidebar or start a new direct collaboration session.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
