'use client';
// ─── Smart Notification Action Center ──────────────────────────────────────────

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, MessageSquare, UserPlus, Users, Trophy,
  Heart, Sparkles, Check, X, ShieldAlert, Layers, Inbox
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { timeAgo, cn } from '@/lib/utils';
import type { Notification } from '@/types';

type NotificationCategory = 'all' | 'requests' | 'interactions' | 'system';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Array<Notification & { actionState?: 'accepted' | 'declined' | 'pending' }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { setUnreadNotifications, decrementUnread, incrementUnread } = useUIStore();

  // Socket listener for real-time notifications
  useSocket({
    onNotification: (rawNotif: any) => {
      if (rawNotif) {
        setNotifications((prev) => [
          {
            id: rawNotif.id || `notif_${Date.now()}`,
            user_id: rawNotif.user_id || '',
            type: rawNotif.type || 'system',
            title: rawNotif.title,
            message: rawNotif.message || '',
            data: rawNotif.data,
            is_read: false,
            created_at: rawNotif.created_at || new Date().toISOString(),
          },
          ...prev,
        ]);
        incrementUnread();
      }
    },
  });

  useEffect(() => {
    api.notifications.list().then((res) => {
      if (res.ok && res.notifications) {
        setNotifications(res.notifications);
        setUnreadNotifications(res.notifications.filter((n) => !n.is_read).length);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setUnreadNotifications]);

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

  const handleFriendAction = async (n: Notification, action: 'accept' | 'decline') => {
    setActionLoadingId(n.id);
    const targetRequestId = (n.data?.requestId || n.data?.senderId || n.data?.userId || n.id) as string;

    try {
      if (action === 'accept') {
        await api.friends.acceptRequest(targetRequestId);
      } else {
        await api.friends.rejectRequest(targetRequestId);
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true, actionState: action === 'accept' ? 'accepted' : 'declined' } : item))
      );
      if (!n.is_read) decrementUnread();
    } catch (err) {
      console.error('Friend action failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSquadAction = async (n: Notification, action: 'accept' | 'decline') => {
    setActionLoadingId(n.id);
    const teamId = (n.data?.teamId || n.data?.squadId) as string;
    const requestId = (n.data?.requestId || n.data?.userId || n.id) as string;

    try {
      if (teamId && requestId) {
        await api.teams.respondToRequest(teamId, requestId, action === 'accept' ? 'accept' : 'reject');
      }
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true, actionState: action === 'accept' ? 'accepted' : 'declined' } : item))
      );
      if (!n.is_read) decrementUnread();
    } catch (err) {
      console.error('Squad action failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter categorization
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'requests') {
        return n.type === 'friend' || n.type === 'team' || n.type === 'squad' || n.type === 'join_request' || n.title?.toLowerCase().includes('request') || n.title?.toLowerCase().includes('invite');
      }
      if (activeCategory === 'interactions') {
        return n.type === 'like' || n.type === 'comment' || n.type === 'reaction' || n.type === 'mention' || n.type === 'message';
      }
      if (activeCategory === 'system') {
        return n.type === 'system' || n.type === 'achievement' || n.type === 'security';
      }
      return true;
    });
  }, [notifications, activeCategory]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-primary" /> Notifications Action Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Respond to collaboration requests, team invites, and social interactions in real-time
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Mark all {unreadCount} read
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'requests', label: 'Requests & Invites', count: notifications.filter((n) => n.type === 'friend' || n.type === 'team' || n.type === 'squad' || n.type === 'join_request' || n.title?.toLowerCase().includes('request') || n.title?.toLowerCase().includes('invite')).length },
          { id: 'interactions', label: 'Interactions', count: notifications.filter((n) => n.type === 'like' || n.type === 'comment' || n.type === 'reaction' || n.type === 'mention' || n.type === 'message').length },
          { id: 'system', label: 'System & Achievements', count: notifications.filter((n) => n.type === 'system' || n.type === 'achievement' || n.type === 'security').length },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as NotificationCategory)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.label}</span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
              activeCategory === cat.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/80 text-muted-foreground'
            )}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border/80 rounded-2xl bg-card/30">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">No notifications in this category</p>
          <p className="text-xs text-muted-foreground/80 mt-1">You're completely up to date.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredNotifications.map((n) => {
              const isFriendRequest = n.type === 'friend' || n.title?.toLowerCase().includes('friend request');
              const isSquadRequest = n.type === 'team' || n.type === 'squad' || n.type === 'join_request' || n.title?.toLowerCase().includes('squad') || n.title?.toLowerCase().includes('invite');
              const hasActions = (isFriendRequest || isSquadRequest) && !n.actionState;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onClick={() => !n.is_read && markSingleRead(n.id)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all relative overflow-hidden',
                    n.is_read
                      ? 'bg-card/70 border-border/70 hover:bg-card'
                      : 'bg-primary/5 border-primary/25 shadow-xs hover:bg-primary/8'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon Badge */}
                    <div className={cn(
                      'p-2.5 rounded-xl shrink-0 mt-0.5',
                      n.type === 'friend' ? 'bg-sky-500/10 text-sky-500' :
                      n.type === 'team' || n.type === 'squad' ? 'bg-indigo-500/10 text-indigo-500' :
                      n.type === 'achievement' ? 'bg-amber-500/10 text-amber-500' :
                      n.type === 'like' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-primary/10 text-primary'
                    )}>
                      {n.type === 'team' || n.type === 'squad' ? (
                        <Users className="w-4 h-4" />
                      ) : n.type === 'friend' ? (
                        <UserPlus className="w-4 h-4" />
                      ) : n.type === 'achievement' ? (
                        <Trophy className="w-4 h-4" />
                      ) : n.type === 'like' ? (
                        <Heart className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        {n.title && <h2 className="text-sm font-bold text-foreground truncate">{n.title}</h2>}
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>

                      {/* Direct Inline Action Buttons */}
                      {hasActions && (
                        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={actionLoadingId === n.id}
                            onClick={() => (isFriendRequest ? handleFriendAction(n, 'accept') : handleSquadAction(n, 'accept'))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs tap-press transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === n.id}
                            onClick={() => (isFriendRequest ? handleFriendAction(n, 'decline') : handleSquadAction(n, 'decline'))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl tap-press transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}

                      {/* Action outcome badge if processed */}
                      {n.actionState && (
                        <div className="mt-2.5">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                            n.actionState === 'accepted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                          )}>
                            {n.actionState === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                          </span>
                        </div>
                      )}
                    </div>

                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
