'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  unreadNotifications: number;
  recentNotifs: Notification[];
  soundEnabled: boolean;
  soundPack: string;
  onToggleSound: () => void;
  onTestSound: () => void;
}

export function NotificationsPopover({
  isOpen,
  onClose,
  unreadNotifications,
  recentNotifs,
  soundEnabled,
  soundPack,
  onToggleSound,
  onTestSound,
}: NotificationsPopoverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 surface-floating rounded-2xl border border-border/70 shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between p-3.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                  {unreadNotifications} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Live Audio Chime Quick Control */}
              <div className="flex items-center bg-muted/60 hover:bg-muted rounded-lg p-0.5 border border-border/50 text-[11px]">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={cn(
                    'p-1 rounded-md transition-colors cursor-pointer',
                    soundEnabled ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted'
                  )}
                  title={soundEnabled ? `Live Chimes Active (${soundPack}) • Click to Mute` : 'Live Chimes Muted • Click to Unmute'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onTestSound}
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground text-[10px] font-medium transition-colors cursor-pointer"
                  title="Preview notification chime"
                >
                  Test 🔔
                </button>
              </div>

              <Link
                href="/notifications"
                onClick={onClose}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
            {recentNotifs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCheck className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/60" />
                No new notifications
              </div>
            ) : (
              recentNotifs.map((n) => (
                <Link
                  key={n.id}
                  href="/notifications"
                  onClick={onClose}
                  className={cn(
                    'block p-3 hover:bg-muted/60 transition-colors text-left tap-press',
                    !n.is_read && 'bg-primary/5'
                  )}
                >
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {n.title ? `${n.title}: ${n.message}` : n.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border/60 bg-muted/30 text-center">
            <Link
              href="/notifications"
              onClick={onClose}
              className="text-xs font-semibold text-primary hover:underline block py-1"
            >
              Go to Notification Center →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

