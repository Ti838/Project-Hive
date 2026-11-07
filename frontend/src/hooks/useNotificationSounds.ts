'use client';
// ─── useNotificationSounds — Live Real-Time Notification & Audio Chime Hook ───
// Inspired by Discord and Facebook: Synthesizes pleasant acoustic chimes on
// incoming live notifications, messages, and friend actions in real-time.

import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuthStore, useUIStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundEngine';

export function useNotificationSounds() {
  const { user } = useAuthStore();
  const { soundEnabled, soundVolume, soundPack } = useUIStore();
  const originalTitleRef = useRef<string>('');
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep soundEngine in sync with UI store changes
  useEffect(() => {
    if (typeof window !== 'undefined' && soundEngine) {
      soundEngine.setEnabled(soundEnabled);
      soundEngine.setVolume(soundVolume);
      soundEngine.setPack(soundPack);
    }
  }, [soundEnabled, soundVolume, soundPack]);

  // Document title restoration on focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    originalTitleRef.current = document.title;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (titleIntervalRef.current) {
          clearInterval(titleIntervalRef.current);
          titleIntervalRef.current = null;
        }
        if (originalTitleRef.current) {
          document.title = originalTitleRef.current;
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, []);

  // Flash title if in background
  const flashBackgroundTitle = (alertText: string) => {
    if (typeof window === 'undefined' || !document.hidden) return;

    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);

    const baseTitle = originalTitleRef.current || 'ProjectHive';
    let toggle = false;

    document.title = alertText;
    titleIntervalRef.current = setInterval(() => {
      toggle = !toggle;
      document.title = toggle ? alertText : baseTitle;
    }, 1200);
  };

  // Wire real-time socket listeners for live audio feedback
  useSocket({
    onNotification: (notif: any) => {
      if (soundEngine) {
        soundEngine.play('notification');
      }

      // Haptic feedback on mobile devices
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([30, 40, 30]);
        } catch {}
      }

      const title = notif?.title ? `🔔 ${notif.title}` : '🔔 New Notification • ProjectHive';
      flashBackgroundTitle(title);
    },

    onConversationNewMessage: (data: any) => {
      const msg = data?.message;
      // Only play audio if message is from a peer, not ourselves
      if (msg && msg.sender_id && msg.sender_id !== user?.id) {
        if (soundEngine) {
          soundEngine.play('message');
        }

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([20, 30, 20]);
          } catch {}
        }

        const senderName = msg.sender_name || 'Classmate';
        flashBackgroundTitle(`💬 New message from ${senderName}`);
      }
    },

    onIncomingCall: () => {
      if (soundEngine) {
        soundEngine.play('call');
      }
      flashBackgroundTitle('📞 Incoming Call • ProjectHive');
    },

    onReaction: (data: any) => {
      if (data?.userId && data.userId !== user?.id) {
        if (soundEngine) {
          soundEngine.play('reaction');
        }
      }
    },

    onRelationshipUpdate: () => {
      if (soundEngine) {
        soundEngine.play('friend');
      }
      flashBackgroundTitle('🤝 New Connection • ProjectHive');
    },
  });

  return {
    playNotificationSound: (type?: Parameters<typeof soundEngine.play>[0]) => {
      soundEngine?.play(type || 'notification');
    },
    testSound: (type?: Parameters<typeof soundEngine.test>[0]) => {
      soundEngine?.test(type || 'notification');
    },
  };
}

