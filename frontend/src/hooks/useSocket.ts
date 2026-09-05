'use client';
// ─── useSocket — Socket.IO React Hook ─────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore, useSocketStore } from '@/lib/store';
import { getAccessToken } from '@/lib/api';
import type { SocketMessage, StatusUpdate, CallEvent } from '@/types';

const DEFAULT_SOCKET_URL = 'https://projecthive-backend.onrender.com';

// Singleton socket — one connection shared across all components
let socketSingleton: Socket | null = null;

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return DEFAULT_SOCKET_URL;
}

function getSocket(): Socket {
  if (!socketSingleton) {
    const url = getSocketUrl();

    socketSingleton = io(url, {
      auth: (cb) => {
        // Dynamically provide current token for every connection/reconnection attempt
        cb({ token: getAccessToken() });
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Re-evaluate token dynamically on each reconnection attempt
    socketSingleton.io.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnect attempt #${attempt} — syncing fresh access token`);
      if (socketSingleton) {
        socketSingleton.auth = { token: getAccessToken() };
      }
    });

    socketSingleton.io.on('reconnect', (attempt) => {
      console.log(`[Socket] Reconnected successfully after ${attempt} attempts`);
      useSocketStore.getState().setConnected(true);
    });

    socketSingleton.io.on('reconnect_error', (error) => {
      console.warn('[Socket] Reconnection error:', error.message);
    });

    socketSingleton.io.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after maximum attempts');
      useSocketStore.getState().setConnected(false);
    });
  }
  return socketSingleton;
}

export interface WhiteboardDrawPayload {
  roomId: string;
  points?: { x: number; y: number }[];
  color?: string;
  strokeWidth?: number;
  tool?: string;
  text?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

interface UseSocketOptions {
  onMessage?: (msg: SocketMessage) => void;
  onStatusUpdate?: (update: StatusUpdate) => void;
  onUserStatusChanged?: (data: { userId: string; status: string; onlineStatus?: string }) => void;
  onIncomingCall?: (event: CallEvent) => void;
  onTyping?: (data: { userId: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
  onNotification?: (data: unknown) => void;
  onWhiteboardDraw?: (data: WhiteboardDrawPayload) => void;
  onWhiteboardClear?: () => void;
  onReaction?: (data: { messageId: string; roomId: string; emoji: string; userId: string; action: 'added' | 'removed' }) => void;
  onReadReceipt?: (data: { roomId: string; readBy: string; messageIds: string[]; timestamp: string }) => void;
  onRelationshipUpdate?: (data: { senderId: string; receiverId: string; relationship: string; reverseRelationship: string }) => void;
  onConversationNewMessage?: (data: { roomId: string; message: any }) => void;
  onMessageDelivered?: (data: { messageId: string; roomId: string }) => void;
  onPostNew?: (data: { post?: import('@/types').Post; postId: string; authorId: string }) => void;
  onPostReacted?: (data: { postId: string; type: import('@/types').ReactionType | null; action: string; userId: string; reactionCounts: Record<string, number> }) => void;
  onPostComment?: (data: { postId: string; comment: import('@/types').PostComment; parentCommentId?: string | null; authorId: string }) => void;
  onPostCommentDeleted?: (data: { postId: string; commentId: string }) => void;
  onPostDeleted?: (data: { postId: string }) => void;
  onPostPollVoted?: (data: { postId: string; pollData: any }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { isAuthenticated } = useAuthStore();
  const { setConnected, addOnlineUser, removeOnlineUser, updateUserPresence } = useSocketStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketSingleton?.connected) {
        socketSingleton.disconnect();
        setConnected(false);
      }
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Update auth token before connecting (handles refreshed tokens)
    socket.auth = { token: getAccessToken() };

    if (!socket.connected) socket.connect();

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      socket.emit('heartbeat');
    };

    const onDisconnect = (reason: string) => {
      setConnected(false);
      console.log('[Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Disconnected by server, re-authenticate and reconnect
        socket.auth = { token: getAccessToken() };
        socket.connect();
      }
    };

    const onConnectError = (err: Error) => {
      console.warn('[Socket] Connection error:', err.message);
      // Re-evaluate auth token for the next attempt
      socket.auth = { token: getAccessToken() };
      setConnected(false);
    };

    const onError = (err: unknown) => {
      console.warn('[Socket] Centralized socket error:', err);
    };

    // ── Status & Presence ──────────────────────────────────────────────────────
    const onStatusUpdate = (data: StatusUpdate) => {
      if (data.status === 'online') addOnlineUser(data.userId);
      else removeOnlineUser(data.userId);
      options.onStatusUpdate?.(data);
    };

    const onUserStatusChanged = (data: { userId: string; status: string; onlineStatus?: string }) => {
      if (data?.userId) {
        updateUserPresence(data.userId, data.status, data.onlineStatus);
        options.onUserStatusChanged?.(data);
      }
    };

    // ── Register listeners ─────────────────────────────────────────────────────
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('status:update', onStatusUpdate);
    socket.on('user:status_changed', onUserStatusChanged);

    if (options.onMessage) socket.on('message:received', options.onMessage);
    if (options.onIncomingCall) socket.on('call:incoming', options.onIncomingCall);
    if (options.onTyping) socket.on('user:typing', options.onTyping);
    if (options.onStopTyping) socket.on('user:stop-typing', options.onStopTyping);
    if (options.onNotification) socket.on('notification:new', options.onNotification);
    if (options.onWhiteboardDraw) socket.on('whiteboard:draw', options.onWhiteboardDraw);
    if (options.onWhiteboardClear) socket.on('whiteboard:clear', options.onWhiteboardClear);
    if (options.onReaction) socket.on('message:reaction', options.onReaction);
    if (options.onReadReceipt) socket.on('message:read_receipt', options.onReadReceipt);
    if (options.onConversationNewMessage) socket.on('conversation:new_message', options.onConversationNewMessage);
    if (options.onMessageDelivered) socket.on('message:delivered', options.onMessageDelivered);
    if (options.onRelationshipUpdate) socket.on('social:relationship-update', options.onRelationshipUpdate);
    if (options.onPostNew) socket.on('post:new', options.onPostNew);
    if (options.onPostReacted) socket.on('post:reacted', options.onPostReacted);
    if (options.onPostComment) socket.on('post:comment', options.onPostComment);
    if (options.onPostCommentDeleted) socket.on('post:comment-deleted', options.onPostCommentDeleted);
    if (options.onPostDeleted) socket.on('post:deleted', options.onPostDeleted);
    if (options.onPostPollVoted) socket.on('post:poll-voted', options.onPostPollVoted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('status:update', onStatusUpdate);
      socket.off('user:status_changed', onUserStatusChanged);
      if (options.onMessage) socket.off('message:received', options.onMessage);
      if (options.onIncomingCall) socket.off('call:incoming', options.onIncomingCall);
      if (options.onTyping) socket.off('user:typing', options.onTyping);
      if (options.onStopTyping) socket.off('user:stop-typing', options.onStopTyping);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
      if (options.onWhiteboardDraw) socket.off('whiteboard:draw', options.onWhiteboardDraw);
      if (options.onWhiteboardClear) socket.off('whiteboard:clear', options.onWhiteboardClear);
      if (options.onReaction) socket.off('message:reaction', options.onReaction);
      if (options.onReadReceipt) socket.off('message:read_receipt', options.onReadReceipt);
      if (options.onConversationNewMessage) socket.off('conversation:new_message', options.onConversationNewMessage);
      if (options.onMessageDelivered) socket.off('message:delivered', options.onMessageDelivered);
      if (options.onRelationshipUpdate) socket.off('social:relationship-update', options.onRelationshipUpdate);
      if (options.onPostNew) socket.off('post:new', options.onPostNew);
      if (options.onPostReacted) socket.off('post:reacted', options.onPostReacted);
      if (options.onPostComment) socket.off('post:comment', options.onPostComment);
      if (options.onPostCommentDeleted) socket.off('post:comment-deleted', options.onPostCommentDeleted);
      if (options.onPostDeleted) socket.off('post:deleted', options.onPostDeleted);
      if (options.onPostPollVoted) socket.off('post:poll-voted', options.onPostPollVoted);
    };
  }, [isAuthenticated]);

  return {
    socket: socketRef.current,
    joinRoom: (roomId: string) => socketRef.current?.emit('join:room', { roomId }),
    leaveRoom: () => socketRef.current?.emit('leave:room'),
    sendMessage: (roomId: string, content: string, extra?: Record<string, unknown>) =>
      socketRef.current?.emit('message:send', { roomId, content, ...extra }),
    ackDelivered: (data: { messageId: string; roomId: string; senderId?: string }) =>
      socketRef.current?.emit('message:ack_delivered', data),
    startTyping: (roomId: string) => socketRef.current?.emit('typing:start', { roomId }),
    stopTyping: (roomId: string) => socketRef.current?.emit('typing:stop', { roomId }),
    reactMessage: (data: { messageId: string; roomId: string; emoji: string }) =>
      socketRef.current?.emit('message:react', data),
    readMessage: (data: { roomId: string; friendId?: string; messageIds?: string[] }) =>
      socketRef.current?.emit('message:read', data),
    initiateCall: (data: { roomId: string; targetId: string; callerName: string; isWebRTC?: boolean; isVoiceOnly?: boolean }) =>
      socketRef.current?.emit('call:initiate', data),
    acceptCall: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:accept', data),
    declineCall: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:decline', data),
    hangup: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:hangup', data),
    emitWhiteboardDraw: (data: unknown) => socketRef.current?.emit('whiteboard:draw', data),
    emitWhiteboardClear: () => socketRef.current?.emit('whiteboard:clear'),
  };
}
