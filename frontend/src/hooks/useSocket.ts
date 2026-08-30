'use client';
// ─── useSocket — Socket.IO React Hook ─────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore, useSocketStore } from '@/lib/store';
import { getAccessToken } from '@/lib/api';
import type { SocketMessage, StatusUpdate, CallEvent } from '@/types';

const BACKEND_URL = 'https://projecthive-backend.onrender.com';

// Singleton socket — one connection shared across all components
let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton) {
    const url = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : BACKEND_URL;

    socketSingleton = io(url, {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socketSingleton;
}

interface UseSocketOptions {
  onMessage?: (msg: SocketMessage) => void;
  onStatusUpdate?: (update: StatusUpdate) => void;
  onIncomingCall?: (event: CallEvent) => void;
  onTyping?: (data: { userId: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
  onNotification?: (data: unknown) => void;
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

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('status:update', onStatusUpdate);
      if (options.onMessage) socket.off('message:received', options.onMessage);
      if (options.onIncomingCall) socket.off('call:incoming', options.onIncomingCall);
      if (options.onTyping) socket.off('user:typing', options.onTyping);
      if (options.onStopTyping) socket.off('user:stop-typing', options.onStopTyping);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
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
    initiateCall: (data: { roomId: string; targetId: string; callerName: string; isWebRTC?: boolean; isVoiceOnly?: boolean }) =>
      socketRef.current?.emit('call:initiate', data),
    acceptCall: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:accept', data),
    declineCall: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:decline', data),
    hangup: (data: { roomId: string; targetId: string }) =>
      socketRef.current?.emit('call:hangup', data),
  };
}
