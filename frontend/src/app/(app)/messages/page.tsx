'use client';
// ─── Messages Page ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Search, Mic, X, Reply, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { displayName, timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Message, User } from '@/types';

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

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, onReply }: { msg: Message; isMine: boolean; onReply: () => void }) {
  return (
    <div className={cn('flex gap-2 items-end group', isMine && 'flex-row-reverse')}>
      {!isMine && <Avatar user={msg.sender} size="sm" />}
      <div className={cn('flex flex-col max-w-[70%]', isMine && 'items-end')}>
        {/* Reply preview */}
        {msg.reply_to_content && (
          <div className={cn('text-xs px-2 py-1 rounded-t-lg bg-muted border border-border mb-0.5 truncate max-w-xs', isMine && 'text-right')}>
            <span className="text-primary font-medium mr-1">↩</span>{msg.reply_to_content}
          </div>
        )}
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm relative',
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border rounded-bl-sm'
        )}>
          {msg.type === 'voice' ? (
            <div className="flex items-center gap-2">
              <div className="w-28 h-1 bg-current/30 rounded-full" />
              <Mic className="w-3.5 h-3.5" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <Reply className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const roomId = selectedUser ? [user?.id, selectedUser.id].sort().join('_dm_') : null;


  // Socket
  const socket = useSocket({
    onMessage: (msg) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, {
          id: msg.id, content: msg.content, type: msg.type as Message['type'],
          sender: msg.sender, sender_id: msg.sender.id, room_id: msg.roomId,
          created_at: msg.createdAt, reply_to_content: msg.reply_to_content,
        }]);
      }
    },
    onTyping: (data) => { if (data.userId === selectedUser?.id) setPeerTyping(true); },
    onStopTyping: (data) => { if (data.userId === selectedUser?.id) setPeerTyping(false); },
  });

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

  // Load messages when user selected
  useEffect(() => {
    if (!selectedUser || !roomId) return;
    setMessages([]);
    socket.joinRoom(roomId);
    api.messages.getRoom(roomId, 50, 0).then((res) => {
      if (res.ok && res.messages) setMessages(res.messages);
    });
    return () => { socket.leaveRoom(); };
  }, [selectedUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!content.trim() || !roomId || sending) return;
    setSending(true);
    const extra: Record<string, unknown> = {};
    if (replyTo) {
      extra.reply_to = replyTo.id;
      extra.reply_to_content = replyTo.content;
      extra.reply_to_sender = displayName(replyTo.sender ?? undefined);
    }
    socket.sendMessage(roomId, content.trim(), extra);
    setContent('');
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

  const filtered = conversations.filter((c) =>
    displayName(c.user).toLowerCase().includes(search.toLowerCase())
  );

  const showList = !selectedUser || !isMobile;
  const showChat = !!selectedUser;

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Conversation List */}
      {showList && (
        <div className={cn('flex flex-col border-r border-border bg-card', isMobile ? 'w-full' : 'w-80 shrink-0')}>
          <div className="p-4 border-b border-border">
            <h1 className="font-bold text-lg mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none"
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
                      <p className="text-xs text-muted-foreground truncate">{last_message?.content ?? 'No messages yet'}</p>
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
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-accent">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Avatar user={selectedUser} online={selectedUser?.online_status === 'online'} />
            <div className="flex-1">
              <p className="font-semibold text-sm">{displayName(selectedUser ?? undefined)}</p>
              <p className="text-xs text-muted-foreground">
                {peerTyping ? <span className="text-primary animate-pulse">typing…</span> : (selectedUser?.online_status === 'online' ? 'Online' : `Last seen ${timeAgo(selectedUser?.last_seen ?? '')}`)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => roomId && socket.initiateCall({ roomId, targetId: selectedUser!.id, callerName: displayName(user ?? undefined), isVoiceOnly: true })}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => roomId && socket.initiateCall({ roomId, targetId: selectedUser!.id, callerName: displayName(user ?? undefined), isWebRTC: true })}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.sender_id === user?.id}
                onReply={() => setReplyTo(msg)}
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
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-muted border-t border-border"
              >
                <Reply className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground flex-1 truncate">
                  <span className="font-medium text-foreground mr-1">{displayName(replyTo.sender ?? undefined)}</span>
                  {replyTo.content}
                </p>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="flex items-center gap-2 p-4 border-t border-border bg-card">
            <input
              type="text"
              value={content}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type a message…"
              className="flex-1 text-sm bg-muted rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!content.trim() || sending}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
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
