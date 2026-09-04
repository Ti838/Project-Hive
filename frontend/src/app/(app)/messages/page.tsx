'use client';
// ─── Messages Page (WhatsApp / Messenger Grade) ───────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Video, Search, Mic, MicOff, VideoOff, X, Reply, ChevronLeft,
  WifiOff, Image as ImageIcon, Paperclip, Presentation, Maximize2, Minimize2,
  PhoneOff, PhoneCall, Check, CheckCheck, Play, Pause, Trash2, Smile
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore, useSocketStore } from '@/lib/store';
import { useCallStore } from '@/lib/callStore';
import { useSocket, type WhiteboardDrawPayload } from '@/hooks/useSocket';
import { displayName, timeAgo, getInitials, getAvatarColor, cn, sanitizeAndDecodeText } from '@/lib/utils';
import type { Message, User } from '@/types';

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

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, online, size = 'md' }: {
  user?: { first_name: string; last_name: string; avatar?: string; id: string } | null;
  online?: boolean; size?: 'sm' | 'md' | 'lg';
}) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  const name = displayName(user ?? undefined);
  return (
    <div className="relative shrink-0">
      {user?.avatar
        ? <img src={user.avatar} alt={name} className={cn(sz, 'rounded-full object-cover')} />
        : <div className={cn(sz, 'rounded-full flex items-center justify-center text-white font-semibold')}
            style={{ backgroundColor: getAvatarColor(user?.id ?? '') }}>{getInitials(name)}</div>
      }
      {online !== undefined && (
        <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background', online ? 'bg-green-500' : 'bg-gray-400')} />
      )}
    </div>
  );
}

// ─── Voice Message Player (WhatsApp-Style Waveform) ───────────────────────────
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

// ─── Message Bubble (WhatsApp Ticks + Messenger Reactions) ────────────────────
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
  let mediaImgUrl: string | null = null;
  let voiceAudioUrl: string | null = null;
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
  const messageSeen = isSeen || (Boolean(peerId && msg.read_by?.includes(peerId)));
  const messageDelivered = messageSeen || peerIsOnline || Boolean(msg.id);

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
      {!isMine && <Avatar user={msg.sender} size="sm" />}

      <div className={cn('flex flex-col max-w-[75%] sm:max-w-[70%]', isMine && 'items-end')}>
        {/* Floating Messenger Emoji Reaction Bar (Revealed on Hover) */}
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
                  className="hover:scale-130 transition-transform p-1 text-sm active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply preview */}
        {msg.reply_to_content && (
          <div className={cn(
            'text-xs px-2.5 py-1.5 rounded-t-xl bg-muted/80 border border-border/80 mb-0.5 max-w-xs flex items-center gap-2',
            isMine && 'text-right flex-row-reverse'
          )}>
            <span className="text-primary font-bold text-xs shrink-0">↩</span>
            {replySnippet.isMedia && replySnippet.mediaUrl && (
              <img
                src={replySnippet.mediaUrl}
                alt="reply thumbnail"
                className="w-7 h-7 rounded-md object-cover shrink-0 border border-border/60"
              />
            )}
            <span className="truncate text-foreground/80 font-medium">{replySnippet.label}</span>
          </div>
        )}

        {/* Bubble Core */}
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-sm relative break-words shadow-2xs',
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border/70 rounded-bl-sm'
        )}>
          {msg.content?.startsWith('📞 Join my') ? (
            <div className="flex flex-col gap-2 p-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Active Call in Session</span>
              </div>
              <p className="text-xs text-foreground/90 font-medium">
                {msg.content.includes('video') ? '📹 Video Call with Whiteboard' : '📞 Voice Call in Session'}
              </p>
              <button
                onClick={onJoinCall || onReply}
                className="mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-xl tap-press transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Join Call Room</span>
              </button>
            </div>
          ) : voiceAudioUrl ? (
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
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {sanitizeAndDecodeText(textContent)}
            </p>
          )}
        </div>

        {/* Reactions Counter Badges (Optimistic + Live Sync) */}
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

        {/* Timestamp & WhatsApp Delivery Status Ticks */}
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          <span className="text-[10px] text-muted-foreground">{timeAgo(msg.created_at)}</span>

          {isMine && (
            <span
              className="inline-flex items-center shrink-0"
              title={messageSeen ? 'Read' : messageDelivered ? 'Delivered' : 'Sent'}
            >
              {messageSeen ? (
                <span className="text-sky-500 font-black flex items-center">
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              ) : messageDelivered ? (
                <span className="text-muted-foreground/80 flex items-center">
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
                </span>
              ) : (
                <span className="text-muted-foreground/70 flex items-center">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </span>
              )}
            </span>
          )}

          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
            title="Reply"
          >
            <Reply className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Messages Main Page ───────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuthStore();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [conversations, setConversations] = useState<Array<{ user: User; last_message: Message; unread_count: number }>>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
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
  const roomId = selectedUser ? [user?.id, selectedUser.id].sort().join('_dm_') : null;

  const { startCall: triggerLiveKitCall } = useCallStore();

  // Socket setup with reaction and read sync
  const socket = useSocket({
    onMessage: (msg) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, {
          id: msg.id,
          content: msg.content,
          type: msg.type as Message['type'],
          sender: msg.sender,
          sender_id: msg.sender?.id || '',
          room_id: msg.roomId,
          created_at: msg.createdAt || new Date().toISOString(),
          reply_to_content: msg.reply_to_content,
          reactions: [],
        }]);

        // Acknowledge read receipt if we are currently looking at this conversation
        if (selectedUser) {
          socket.readMessage({ roomId: msg.roomId, friendId: selectedUser.id, messageIds: [msg.id] });
          api.messages.markAsRead(selectedUser.id).catch(() => {});
        }
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
              if (!currentReadBy.includes(selectedUser.id)) {
                return { ...m, read_by: [...currentReadBy, selectedUser.id] };
              }
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    api.messages.getDMs().then((res) => {
      if (res.ok && res.conversations) setConversations(res.conversations);
      setLoading(false);
    });

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    return () => { socket.leaveRoom(); };
  }, [selectedUser]);

  // Scroll to bottom without bouncing page
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

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

  // Clipboard Paste Support (Ctrl+V screenshot/image)
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

  // ─── Voice Recording Handlers ────────────────────────────────────────────────
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
        socket.sendMessage(roomId, base64Audio, { type: 'voice' });
      };
      reader.readAsDataURL(audioBlob);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // ─── Reaction Handler ────────────────────────────────────────────────────────
  const handleReact = async (messageId: string, emoji: string) => {
    if (!roomId) return;
    // 1. Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const current = m.reactions || [];
        const exists = current.some((r) => r.user_id === user?.id && r.emoji === emoji);
        if (exists) {
          return { ...m, reactions: current.filter((r) => !(r.user_id === user?.id && r.emoji === emoji)) };
        }
        return { ...m, reactions: [...current, { emoji, user_id: user?.id || '' }] };
      })
    );

    // 2. Real-time socket sync
    socket.reactMessage({ messageId, roomId, emoji });

    // 3. REST persistence fallback
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

  const filtered = conversations.filter((c) =>
    displayName(c.user).toLowerCase().includes(search.toLowerCase())
  );

  const showList = !selectedUser || !isMobile;
  const showChat = !!selectedUser;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] md:h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Conversation List */}
      {showList && (
        <div className={cn('flex flex-col border-r border-border bg-card', isMobile ? 'w-full' : 'w-80 shrink-0')}>
          <div className="p-4 border-b border-border">
            <h1 className="font-bold text-lg mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-base sm:text-sm bg-muted rounded-xl border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">No conversations yet.</p>
                <p className="text-xs mt-1">Add friends and start chatting!</p>
              </div>
            ) : (
              filtered.map(({ user: peer, last_message, unread_count }) => (
                <button
                  key={peer.id}
                  onClick={() => setSelectedUser(peer)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 border-b border-border hover:bg-accent/50 transition-colors text-left',
                    selectedUser?.id === peer.id && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <Avatar user={peer} online={peer.online_status === 'online'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{displayName(peer)}</p>
                      {last_message && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(last_message.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{last_message?.content?.startsWith('data:audio') ? '🎤 Voice note' : (last_message?.content ?? 'No messages yet')}</p>
                      {unread_count > 0 && (
                        <span className="min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 ml-1">
                          {unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
            {isMobile && (
              <button onClick={() => setSelectedUser(null)} className="p-2 -ml-1 rounded-lg hover:bg-accent text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Avatar user={selectedUser} online={selectedUser?.online_status === 'online'} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{displayName(selectedUser ?? undefined)}</p>
              <p className="text-xs text-muted-foreground">
                {peerTyping ? <span className="text-primary animate-pulse">typing…</span> : (selectedUser?.online_status === 'online' ? 'Online' : `Last seen ${timeAgo(selectedUser?.last_seen ?? '')}`)}
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.sender_id === user?.id}
                currentUserId={user?.id}
                peerIsOnline={selectedUser?.online_status === 'online'}
                peerId={selectedUser?.id}
                isSeen={Boolean(readReceipts[msg.id])}
                onReply={() => setReplyTo(msg)}
                onJoinCall={() => handleInitiateCall(msg.content.includes('video') ? 'video' : 'voice')}
                onReact={handleReact}
              />
            ))}
            {peerTyping && (
              <div className="flex gap-2 items-center">
                <Avatar user={selectedUser} size="sm" />
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

          {/* Input Area Docked with Safe Area */}
          <div className="flex items-center gap-2 p-3 sm:p-4 border-t border-border bg-card sticky bottom-0 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))]">
            {isRecording ? (
              // Live Voice Recorder Dock
              <div className="flex-1 flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-xl px-4 h-12">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="w-3 h-3 rounded-full bg-destructive animate-ping" />
                  <span className="text-xs font-bold font-mono">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                  <span className="text-xs font-medium text-destructive/80 hidden sm:inline">
                    Recording Audio Note…
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="p-1.5 hover:bg-destructive/20 rounded-lg text-destructive text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Cancel recording"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Discard</span>
                  </button>
                  <button
                    type="button"
                    onClick={finishVoiceRecording}
                    className="p-2 bg-destructive text-white rounded-xl shadow-xs hover:bg-destructive/90 transition-colors"
                    title="Send Voice Note"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // Normal Composer
              <>
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted tap-press transition-colors shrink-0"
                  title="Attach photo or file (or paste with Ctrl+V)"
                >
                  <Paperclip className="w-5 h-5" />
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
                  className="flex-1 h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none transition-colors"
                />

                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted tap-press transition-colors shrink-0"
                  title="Record voice note"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={(!content.trim() && !imageAttachment) || sending}
                  className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no convo selected (desktop) */}
      {!selectedUser && !isMobile && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm">Choose a friend to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
