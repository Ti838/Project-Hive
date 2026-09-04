'use client';
// ─── Team Workspace Component (/teams/[id]) ─────────────────────────────────
// Discord/GitHub/LinkedIn Grade Collaborative Workspace

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Video, ArrowLeft, MessageSquare, Settings, ShieldCheck, UserMinus,
  CheckCircle2, Clock, Send, Image as ImageIcon, Trash2, Globe, Lock,
  Plus, Check, X, AlertTriangle, Sparkles, RefreshCw, Smile, Crown,
  ExternalLink, ChevronRight, UserCheck, ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useCallStore } from '@/lib/callStore';
import { useSocket } from '@/hooks/useSocket';
import { displayName, timeAgo, getInitials, getAvatarColor, cn, sanitizeAndDecodeText, parseDescription } from '@/lib/utils';
import type { Team, TeamMember, Message } from '@/types';

type WorkspaceTab = 'overview' | 'chat' | 'settings';

const QUICK_EMOJIS = ['😀', '😂', '🔥', '🚀', '👍', '👏', '❤️', '🎉', '💡', '💯', '🤝', '⚡'];

export default function TeamWorkspacePage() {
  const params = useParams();
  const teamId = params?.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const { startCall: triggerLiveKitCall } = useCallStore();

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Join Requests Drawer State
  const [showRequestsDrawer, setShowRequestsDrawer] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Transfer Leadership Modal State
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Group Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [editDescription, setEditDescription] = useState('');
  const [isOpenHiring, setIsOpenHiring] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const isLeader = team?.leader_id === user?.id || team?.leader?.id === user?.id;
  const isMember = isLeader || team?.team_members?.some((m: any) => m.user_id === user?.id || m.user?.id === user?.id);

  // Socket
  const socket = useSocket({
    onMessage: (msg: any) => {
      if (msg.roomId === teamId || msg.roomId === `team:${teamId}` || msg.room_id === teamId) {
        setMessages((prev) => [...prev, {
          id: msg.id,
          room_id: teamId,
          sender_id: msg.sender?.id || msg.sender_id,
          content: msg.content,
          type: msg.type || 'text',
          created_at: msg.createdAt || msg.created_at || new Date().toISOString(),
          sender: msg.sender,
        }]);
      }
    },
  });

  // ── Load Team Details ───────────────────────────────────────────────────────
  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = await api.teams.getById(teamId);
      if (data && !('error' in data)) {
        setTeam(data);
        setEditDescription((data as any).description || '');
        setIsOpenHiring((data as any).is_open !== false);
        setTags((data as any).tags || []);
      }
    } catch (err) {
      console.error('Failed to load team workspace:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // ── Load Requests for Leader ────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    if (!teamId || !isLeader) return;
    setLoadingRequests(true);
    try {
      const res: any = await api.teams.getRequests(teamId);
      const list = Array.isArray(res) ? res : res?.requests || [];
      setJoinRequests(list);
    } catch (e) {
      console.warn('Could not fetch requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  }, [teamId, isLeader]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (isLeader) loadRequests();
  }, [isLeader, loadRequests]);

  // ── Join Socket.IO Room for Group Chat ──────────────────────────────────────
  useEffect(() => {
    if (!socket.socket || !teamId || !isMember) return;

    socket.socket.emit('join:room', { roomId: teamId });
    socket.socket.emit('join:room', { roomId: `team:${teamId}` });

    return () => {
      socket.socket?.emit('leave:room', { roomId: teamId });
    };
  }, [socket.socket, teamId, isMember]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStartCall = () => {
    if (!team) return;
    triggerLiveKitCall({
      scope: 'team',
      targetId: team.id,
      callType: 'video',
      targetTeam: team,
      socketEmit: (ev, data) => socket.socket?.emit(ev, data),
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !imageAttachment) || sendingMessage) return;

    setSendingMessage(true);
    let content = inputMessage.trim();
    let type: 'text' | 'image' = 'text';

    if (imageAttachment) {
      type = 'image';
      content = JSON.stringify({ type: 'image', url: imageAttachment, caption: content });
    }

    const payload = {
      teamId,
      roomId: teamId,
      content,
      type,
    };

    socket.socket?.emit('message:send', payload);

    setInputMessage('');
    setImageAttachment(null);
    setShowEmojiPicker(false);
    setSendingMessage(false);
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
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            if (uploadEvent.target?.result) {
              setImageAttachment(uploadEvent.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    await api.teams.respondToRequest(teamId, requestId, action);
    setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    loadTeam(); // refresh member roster
  };

  const handleKickMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the squad?')) return;
    await api.teams.kickMember(teamId, memberId);
    loadTeam();
  };

  const handleTransferLeadership = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      const res = await api.teams.transferLeadership(teamId, transferTarget.id || transferTarget.user_id);
      if (res && res.ok) {
        setTransferTarget(null);
        loadTeam();
      } else {
        alert(res?.message || 'Failed to transfer leadership');
      }
    } catch (err: any) {
      alert(err.message || 'Error transferring leadership');
    } finally {
      setTransferring(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this squad?')) return;
    await api.teams.leave(teamId);
    router.push('/teams');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await api.teams.update(teamId, {
      description: editDescription,
      is_open: isOpenHiring,
      tags,
    } as any);
    setSavingSettings(false);
    loadTeam();
    alert('Squad settings updated successfully!');
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to permanently delete this squad? This action cannot be undone.')) return;
    await api.teams.delete(teamId);
    router.push('/teams');
  };

  const addTag = () => {
    const val = tagInput.trim().replace(/^#/, '');
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Opening squad workspace…</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">Squad Not Found</h2>
        <p className="text-xs text-muted-foreground">This squad may have been disbanded or removed.</p>
        <Link href="/teams" className="inline-block px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl">
          Back to Teams
        </Link>
      </div>
    );
  }

  const memberCount = team.team_members?.length || 1;
  const maxSize = team.max_size || team.max_members || 5;
  const isFull = memberCount >= maxSize;
  const isActivelyRecruiting = team.is_open !== false && !isFull;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/teams"
              className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">Squad Workspace</span>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <span className="text-xs font-bold text-foreground truncate">{team.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLeader && (
              <button
                onClick={() => setShowRequestsDrawer(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-accent text-xs font-semibold border border-border transition-colors tap-press"
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Join Requests</span>
                {joinRequests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            )}

            {!isLeader && isMember && (
              <button
                onClick={handleLeaveTeam}
                className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
              >
                Leave Squad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── HERO HEADER (LinkedIn Org / Discord Style) ────────────────── */}
      <div className="relative border-b border-border bg-card overflow-hidden">
        {/* Cover Banner with cyber gradient & mesh styling */}
        <div
          className="h-36 sm:h-48 w-full relative bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)), radial-gradient(circle at 20% 50%, ${team.avatar_color || '#3b82f6'}44, transparent 70%)`
          }}
        >
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:24px_24px]" />
          <div className="absolute bottom-3 right-4 sm:right-8 flex items-center gap-2">
            <span className="text-[11px] font-mono text-white/60 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              Capacity: {memberCount}/{maxSize}
            </span>
          </div>
        </div>

        {/* Hero Identity Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Squad Avatar Badge */}
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-white font-extrabold text-3xl shadow-xl border-4 border-background shrink-0 relative overflow-hidden"
                style={{ backgroundColor: team.avatar_color || getAvatarColor(team.id) }}
              >
                {getInitials(team.name)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </div>

              {/* Identity & Status Pill */}
              <div className="space-y-1 sm:mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{team.name}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    {team.category || 'Tech Squad'}
                  </span>
                  {/* Hiring status indicator */}
                  {isActivelyRecruiting ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Actively Recruiting
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {isFull ? 'Squad Full' : 'Roster Closed'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Led by</span>
                  <Link
                    href={`/profile/${team.leader_id || team.leader?.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span>{team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : 'Squad Leader'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  </Link>
                  <span>·</span>
                  <span>{memberCount} Active Members</span>
                </p>
              </div>
            </div>

            {/* Hero Action Hub */}
            <div className="flex items-center gap-2 sm:mb-1">
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 tap-press transition-all shadow-md shadow-primary/20"
              >
                <Video className="w-4 h-4" />
                <span>Start Squad Call</span>
              </button>

              {isLeader && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-2.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border transition-colors tap-press"
                  title="Squad Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Navigation Bar ────────────────────────────────────────── */}
        <div className="border-t border-border bg-card/40 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
            {[
              { id: 'overview', label: 'Roster & Overview', icon: Users },
              { id: 'chat', label: 'Squad Chat', icon: MessageSquare, badge: messages.length > 0 ? messages.length : undefined },
              ...(isLeader ? [{ id: 'settings', label: 'Recruitment & Settings', icon: Settings }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tap-press',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Workspace Body ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* ── TAB 1: OVERVIEW & ROSTER ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Squad Mission & Required Skills */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Squad Mission & Objective
                  </h2>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {parseDescription(team.description) || 'This squad has not published a detailed mission statement yet.'}
                </p>

                {team.tags && team.tags.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Required Tech Stack & Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {team.tags.map((tag: string) => (
                        <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Leader Spotlight Card */}
              {team.leader && (
                <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Squad Leader
                      </span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: team.leader.avatar_color || getAvatarColor(team.leader.id) }}
                      >
                        {getInitials(`${team.leader.first_name || ''} ${team.leader.last_name || ''}`)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {team.leader.first_name} {team.leader.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{team.leader.university || 'Student'}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/profile/${team.leader.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-muted hover:bg-accent text-xs font-semibold rounded-xl text-foreground transition-colors"
                  >
                    <span>View Leader Profile</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Link>
                </div>
              )}
            </div>

            {/* Squad Roster Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Active Squad Roster
                  </h2>
                  <p className="text-xs text-muted-foreground">Collaborators currently building in this squad</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                  {memberCount} / {maxSize} Filled
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* All Members List */}
                {team.team_members?.map((member: any) => {
                  const u = member.users || member.user;
                  const memberId = member.user_id || u?.id;
                  const memberIsLeader = member.role === 'leader' || memberId === team.leader_id;

                  return (
                    <div
                      key={memberId}
                      className={cn(
                        'bg-card border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs transition-all',
                        memberIsLeader ? 'border-primary/40 bg-primary/[0.02]' : 'border-border'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: u?.avatar_color || getAvatarColor(memberId) }}
                        >
                          {getInitials(`${u?.first_name || ''} ${u?.last_name || ''}`)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm truncate">
                              {u?.first_name ? `${u.first_name} ${u.last_name || ''}` : 'Squad Member'}
                            </p>
                            {memberIsLeader && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u?.university || 'Collaborator'}</p>
                          <span className={cn(
                            'inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
                            memberIsLeader ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
                          )}>
                            {memberIsLeader ? 'Squad Lead' : 'Member'}
                          </span>
                        </div>
                      </div>

                      {/* Leader Controls for non-leader members */}
                      {isLeader && !memberIsLeader && (
                        <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                          <button
                            onClick={() => setTransferTarget({ id: memberId, name: `${u?.first_name} ${u?.last_name}` })}
                            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <Crown className="w-3 h-3" /> Make Leader
                          </button>
                          <button
                            onClick={() => handleKickMember(memberId)}
                            className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1"
                          >
                            <UserMinus className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SQUAD GROUP CHAT (Discord style) ────────────────── */}
        {activeTab === 'chat' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs flex flex-col h-[650px]">
            {/* Discord-style Channel Header */}
            <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-muted-foreground text-sm">#</span>
                <span className="font-bold text-xs text-foreground">
                  {team.name.toLowerCase().replace(/\s+/g, '-')}-general
                </span>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Squad Real-Time Chat & Whiteboard Session
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono text-muted-foreground">
                  {memberCount} members connected
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                    <MessageSquare className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Welcome to the #{team.name} Channel!</p>
                  <p className="text-xs max-w-sm">This is the start of your team's collaborative workspace. Share ideas, brainstorm, or drop meeting notes.</p>
                </div>
              ) : (
                messages.map((msg: any, idx) => {
                  const isMe = msg.sender?.id === user?.id || msg.sender_id === user?.id;
                  let parsedMedia: any = null;
                  if (msg.content?.startsWith('{') && msg.content?.includes('"url"')) {
                    try { parsedMedia = JSON.parse(msg.content); } catch (_) {}
                  }

                  return (
                    <div key={msg.id || idx} className={cn('flex items-start gap-3 group', isMe && 'flex-row-reverse')}>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{ backgroundColor: msg.sender?.avatar_color || getAvatarColor(msg.sender?.id || 'x') }}
                      >
                        {getInitials(`${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`)}
                      </div>
                      <div className={cn('max-w-md space-y-1', isMe && 'items-end')}>
                        <div className={cn('flex items-center gap-2 text-[10px] text-muted-foreground', isMe && 'justify-end')}>
                          <span className="font-semibold text-foreground">
                            {isMe ? 'You' : `${msg.sender?.first_name || 'Member'}`}
                          </span>
                          <span>{timeAgo(msg.createdAt || msg.created_at)}</span>
                        </div>

                        <div className={cn(
                          'p-3 rounded-2xl text-xs leading-relaxed shadow-2xs break-words',
                          isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'
                        )}>
                          {parsedMedia ? (
                            <div className="space-y-2">
                              <img src={parsedMedia.url} alt="Attachment" className="rounded-xl max-h-64 object-contain bg-black/10" />
                              {parsedMedia.caption && <p>{parsedMedia.caption}</p>}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{sanitizeAndDecodeText(msg.content)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Attachment Preview */}
            {imageAttachment && (
              <div className="p-3 bg-muted/70 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={imageAttachment} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-border shadow-xs" />
                  <span className="text-xs text-muted-foreground font-medium">Image ready to send</span>
                </div>
                <button onClick={() => setImageAttachment(null)} className="p-1 hover:bg-muted rounded-md text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Collapsible Quick Emoji Drawer */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-2 border-t border-border bg-card/90 flex flex-wrap gap-1.5"
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setInputMessage((prev) => prev + emoji)}
                      className="text-lg p-1.5 hover:bg-muted rounded-lg transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImageAttachment(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Attach Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  'p-2.5 rounded-xl hover:bg-muted transition-colors',
                  showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                )}
                title="Emoji Picker"
              >
                <Smile className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onPaste={handlePaste}
                placeholder="Message squad (supports Ctrl+V screenshot paste)…"
                className="flex-1 bg-muted/60 text-xs px-4 py-2.5 rounded-xl border border-transparent focus:border-primary focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() && !imageAttachment}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: SQUAD SETTINGS (Leader only) ──────────────────────── */}
        {activeTab === 'settings' && isLeader && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 max-w-2xl shadow-xs">
            <div>
              <h2 className="text-base font-bold">Squad Recruitment & Mission Settings</h2>
              <p className="text-xs text-muted-foreground">Manage hiring availability, mission tags, and lifecycle</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-bold text-foreground">Recruitment Status</p>
                  <p className="text-[11px] text-muted-foreground">When open, other students can discover your squad and apply.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenHiring(!isOpenHiring)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                    isOpenHiring ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {isOpenHiring ? '🟢 Actively Recruiting' : '🔴 Closed'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mission Statement</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs bg-muted/50 rounded-xl p-3 border border-border focus:border-primary focus:outline-none"
                  placeholder="What is your squad building?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Skill Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="e.g. React, Next.js, Python"
                    className="flex-1 text-xs bg-muted/50 rounded-xl px-3 py-2 border border-border focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span key={t} className="text-xs bg-muted px-2.5 py-1 rounded-lg flex items-center gap-1">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                {savingSettings ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-border pt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase text-destructive tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-muted-foreground">Permanently disband this squad and remove all membership records.</p>
              <button
                type="button"
                onClick={handleDeleteTeam}
                className="px-4 py-2 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl hover:bg-destructive/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Squad
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── LEADER JOIN REQUESTS DRAWER (LinkedIn Job Manager Style) ──── */}
      <AnimatePresence>
        {showRequestsDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Applicant Queue ({joinRequests.length})</h3>
                </div>
                <button
                  onClick={() => setShowRequestsDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {loadingRequests ? (
                  <p className="text-center text-xs text-muted-foreground py-8">Loading applicant profiles…</p>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <UserCheck className="w-8 h-8 mx-auto opacity-40 text-primary" />
                    <p className="text-xs font-semibold">No pending requests</p>
                    <p className="text-[11px]">When students apply to your squad, their pitch will appear here.</p>
                  </div>
                ) : (
                  joinRequests.map((req) => {
                    const applicant = req.users;
                    return (
                      <div key={req.id} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: applicant?.avatar_color || getAvatarColor(applicant?.id || 'x') }}
                            >
                              {getInitials(`${applicant?.first_name || ''} ${applicant?.last_name || ''}`)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs">
                                {applicant?.first_name} {applicant?.last_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {applicant?.university || applicant?.email}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(req.created_at)}</span>
                        </div>

                        {req.message && (
                          <p className="text-xs text-foreground bg-card border border-border/60 p-2.5 rounded-xl italic">
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                          <button
                            onClick={() => handleRespondRequest(req.id, 'reject')}
                            className="px-3 py-1.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondRequest(req.id, 'accept')}
                            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-xs"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TRANSFER LEADERSHIP CONFIRMATION MODAL ─────────────────────── */}
      <AnimatePresence>
        {transferTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-2.5 text-amber-500">
                <Crown className="w-5 h-5" />
                <h3 className="font-bold text-sm text-foreground">Transfer Leadership?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to transfer squad leadership to <strong className="text-foreground">{transferTarget.name}</strong>? You will become a regular squad member and surrender administrative powers.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferLeadership}
                  disabled={transferring}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  {transferring ? 'Transferring…' : 'Confirm Transfer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
