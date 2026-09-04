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
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
      autoConnect: false,
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
  onIncomingCall?: (event: CallEvent) => void;
  onTyping?: (data: { userId: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
  onNotification?: (data: unknown) => void;
  onWhiteboardDraw?: (data: WhiteboardDrawPayload) => void;
  onWhiteboardClear?: () => void;
  onReaction?: (data: { messageId: string; roomId: string; emoji: string; userId: string; action: 'added' | 'removed' }) => void;
  onReadReceipt?: (data: { roomId: string; readBy: string; messageIds: string[]; timestamp: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { isAuthenticated } = useAuthStore();
  const { setConnected, addOnlineUser, removeOnlineUser } = useSocketStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Update auth token on every connect (handles token refresh)
    socket.auth = { token: getAccessToken() };

    if (!socket.connected) socket.connect();

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      socket.emit('heartbeat');
    };
    const onDisconnect = () => setConnected(false);

    // ── Status ─────────────────────────────────────────────────────────────────
    const onStatusUpdate = (data: StatusUpdate) => {
      if (data.status === 'online') addOnlineUser(data.userId);
      else removeOnlineUser(data.userId);
      options.onStatusUpdate?.(data);
    };

    // ── Register listeners ─────────────────────────────────────────────────────
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('status:update', onStatusUpdate);

    if (options.onMessage) socket.on('message:received', options.onMessage);
    if (options.onIncomingCall) socket.on('call:incoming', options.onIncomingCall);
    if (options.onTyping) socket.on('user:typing', options.onTyping);
    if (options.onStopTyping) socket.on('user:stop-typing', options.onStopTyping);
    if (options.onNotification) socket.on('notification:new', options.onNotification);
    if (options.onWhiteboardDraw) socket.on('whiteboard:draw', options.onWhiteboardDraw);
    if (options.onWhiteboardClear) socket.on('whiteboard:clear', options.onWhiteboardClear);
    if (options.onReaction) socket.on('message:reaction', options.onReaction);
    if (options.onReadReceipt) socket.on('message:read_receipt', options.onReadReceipt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('status:update', onStatusUpdate);
      if (options.onMessage) socket.off('message:received', options.onMessage);
      if (options.onIncomingCall) socket.off('call:incoming', options.onIncomingCall);
      if (options.onTyping) socket.off('user:typing', options.onTyping);
      if (options.onStopTyping) socket.off('user:stop-typing', options.onStopTyping);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
      if (options.onWhiteboardDraw) socket.off('whiteboard:draw', options.onWhiteboardDraw);
      if (options.onWhiteboardClear) socket.off('whiteboard:clear', options.onWhiteboardClear);
      if (options.onReaction) socket.off('message:reaction', options.onReaction);
      if (options.onReadReceipt) socket.off('message:read_receipt', options.onReadReceipt);
    };
  }, [isAuthenticated]);

  return {
    socket: socketRef.current,
    joinRoom: (roomId: string) => socketRef.current?.emit('join:room', { roomId }),
    leaveRoom: () => socketRef.current?.emit('leave:room'),
    sendMessage: (roomId: string, content: string, extra?: Record<string, unknown>) =>
      socketRef.current?.emit('message:send', { roomId, content, ...extra }),
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
