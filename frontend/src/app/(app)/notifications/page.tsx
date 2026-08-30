'use client';
// ─── Notifications Page ────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, MessageSquare, UserPlus, Users, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { timeAgo, cn } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadNotifications, decrementUnread } = useUIStore();

  useEffect(() => {
    api.notifications.list().then((res) => {
      if (res.ok && res.notifications) {
        setNotifications(res.notifications);
        setUnreadNotifications(res.notifications.filter((n) => !n.is_read).length);
      }
      setLoading(false);
    });
  }, []);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadNotifications(0);
  };

  const markSingleRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    decrementUnread();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on team invites, messages, and mentions</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-18 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">You're all caught up!</p>
          <p className="text-xs">No unread notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => !n.is_read && markSingleRead(n.id)}
              className={cn(
                'flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer',
                n.is_read
                  ? 'bg-card border-border'
                  : 'bg-primary/5 border-primary/20 shadow-xs'
              )}
            >
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                {n.type === 'team' ? (
                  <Users className="w-4 h-4" />
                ) : n.type === 'friend' ? (
                  <UserPlus className="w-4 h-4" />
                ) : n.type === 'achievement' ? (
                  <Trophy className="w-4 h-4 text-amber-500" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {n.title && <p className="text-sm font-semibold truncate">{n.title}</p>}
                <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/80 mt-1">{timeAgo(n.created_at)}</p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 self-center" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
