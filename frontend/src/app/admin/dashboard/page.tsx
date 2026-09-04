'use client';
// ─── ProjectHive Enterprise Admin Control Center ───────────────────────────────

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, FolderKanban, GraduationCap, ArrowLeft, LogOut,
  CheckCircle2, AlertTriangle, Search, Ban, UserX, ShieldAlert, Sparkles,
  ToggleLeft, ToggleRight, Trash2, Star, RefreshCw, Activity, Terminal,
  Sliders, MessageSquare, Radio, Check, X, Newspaper, LifeBuoy, Server,
  Cpu, HardDrive, Clock, ExternalLink, Smartphone, Globe,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';

type AdminTab = 'overview' | 'users' | 'teams' | 'projects' | 'moderation' | 'tickets' | 'system' | 'audit';

interface AdminStats {
  users: number;
  teams: number;
  projects: number;
  messages: number;
  onlineUsers: number;
  newUsersToday: number;
  bannedUsers: number;
  posts: number;
  flags: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerification: boolean;
  };
}

interface ServiceHealth {
  name: string;
  status: string;
  ping: string;
  ok: boolean;
  activeCalls?: number;
  url?: string;
}

export default function AdminDashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Health Telemetry state
  const [healthServices, setHealthServices] = useState<ServiceHealth[]>([]);
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [memoryInfo, setMemoryInfo] = useState<{ rssMb: number; heapUsedMb: number } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Users tab state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'banned' | 'admin'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Teams tab state
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Projects tab state
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Moderation tab state
  const [postsList, setPostsList] = useState<any[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Tickets tab state
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Audit Logs state
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // System Flags state
  const [flags, setFlags] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: false,
  });
  const [flagUpdating, setFlagUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Auth Guard: Block unauthenticated users and non-admin roles
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/admin/login');
      return;
    }

    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    loadOverview();
    loadHealth();
  }, [user, isAuthenticated, isLoading, router]);

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const loadOverview = async () => {
    setLoadingStats(true);
    const res = await api.admin.getStats();
    if (res.ok) {
      setStats(res as unknown as AdminStats);
      if (res.flags) setFlags(res.flags);
    }
    setLoadingStats(false);
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    const res = await api.admin.getHealth();
    if (res.ok && res.services) {
      setHealthServices(res.services);
      if (res.uptimeSeconds) setSystemUptime(res.uptimeSeconds);
      if (res.memory) setMemoryInfo(res.memory);
    }
    setLoadingHealth(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await api.admin.getUsers(userSearch);
    if (res.ok && res.users) {
      setUsersList(res.users);
    }
    setLoadingUsers(false);
  };

  const loadTeams = async () => {
    setLoadingTeams(true);
    const res = await api.admin.getTeams();
    if (res.ok && res.teams) {
      setTeamsList(res.teams);
    }
    setLoadingTeams(false);
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    const res = await api.admin.getProjects();
    if (res.ok && res.projects) {
      setProjectsList(res.projects);
    }
    setLoadingProjects(false);
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    const res = await api.admin.getPosts(postSearch);
    if (res.ok && res.posts) {
      setPostsList(res.posts);
    }
    setLoadingPosts(false);
  };

  const loadTickets = async () => {
    setLoadingTickets(true);
    const res = await api.admin.getTickets();
    if (res.ok && res.tickets) {
      setTicketsList(res.tickets);
    }
    setLoadingTickets(false);
  };

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    const res = await api.admin.getAuditLogs();
    if (res.ok && res.logs) {
      setAuditLogsList(res.logs);
    }
    setLoadingAuditLogs(false);
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
      loadHealth();
    }
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'teams') loadTeams();
    if (activeTab === 'projects') loadProjects();
    if (activeTab === 'moderation') loadPosts();
    if (activeTab === 'tickets') loadTickets();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const handleBanToggle = async (userId: string, currentBanned: boolean) => {
    const res = await api.admin.banUser(userId, !currentBanned);
    if (res.ok) {
      showToast(currentBanned ? 'User unbanned successfully' : 'User banned successfully');
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId || u._id === userId ? { ...u, isBanned: !currentBanned } : u))
      );
      setAuditLogsList((prev: any[]) => [
        {
          id: String(Date.now()),
          created_at: new Date().toISOString(),
          action: currentBanned ? 'UNBAN_USER' : 'BAN_USER',
          details: `User ID: ${userId}`,
          admin_email: user?.email || 'admin',
        },
        ...prev,
      ]);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    const res = await api.admin.changeRole(userId, nextRole);
    if (res.ok) {
      showToast(`User role elevated to ${nextRole}`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId || u._id === userId ? { ...u, role: nextRole } : u))
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    const res = await api.admin.deleteUser(userId);
    if (res.ok) {
      showToast('User account permanently deleted');
      setUsersList((prev) => prev.filter((u) => u.id !== userId && u._id !== userId));
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Permanently delete this team?')) return;
    const res = await api.admin.deleteTeam(teamId);
    if (res.ok) {
      showToast('Team removed from platform');
      setTeamsList((prev) => prev.filter((t) => t.id !== teamId));
    }
  };

  const handleFeatureProject = async (projectId: string, currentFeatured: boolean) => {
    const res = await api.admin.featureProject(projectId, !currentFeatured);
    if (res.ok) {
      showToast(currentFeatured ? 'Project unfeatured' : 'Project featured on homepage showcase!');
      setProjectsList((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, is_featured: !currentFeatured } : p))
      );
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    const res = await api.admin.deleteProject(projectId);
    if (res.ok) {
      showToast('Project deleted successfully');
      setProjectsList((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post for violating community standards?')) return;
    const res = await api.admin.deletePost(postId);
    if (res.ok) {
      showToast('Post removed from community feed');
      setPostsList((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleResolveTicket = async (ticketId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    const res = await api.admin.resolveTicket(ticketId, nextStatus);
    if (res.ok) {
      showToast(`Support ticket marked as ${nextStatus.toUpperCase()}`);
      setTicketsList((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
      );
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Permanently delete this support ticket?')) return;
    const res = await api.admin.deleteTicket(ticketId);
    if (res.ok) {
      showToast('Support ticket deleted');
      setTicketsList((prev) => prev.filter((t) => t.id !== ticketId));
    }
  };

  const handleFlagToggle = async (key: 'maintenanceMode' | 'registrationEnabled' | 'emailVerification') => {
    setFlagUpdating(true);
    const nextVal = !flags[key];
    const updated = { ...flags, [key]: nextVal };
    const res = await api.admin.updateFlags({ [key]: nextVal });
    if (res.ok) {
      setFlags(updated);
      showToast(`System Flag [${key}] set to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
      setAuditLogsList((prev: any[]) => [
        {
          id: String(Date.now()),
          created_at: new Date().toISOString(),
          action: 'UPDATE_FLAGS',
          details: `${key}: ${nextVal}`,
          admin_email: user?.email || 'admin',
        },
        ...prev,
      ]);
    }
    setFlagUpdating(false);
  };

  const handleAdminLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/admin/login');
  };

  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'banned') return u.isBanned;
    if (userFilter === 'admin') return u.role === 'admin';
    return true;
  });

  if (isLoading || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Verifying admin credentials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500/20">
      {/* ─── Top Enterprise Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight">ProjectHive Enterprise Console</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Root Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Industrial governance, real-time telemetry & moderation suite</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Student View
          </Link>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ─── Success Toast Feedback ──────────────────────────────────────── */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Navigation Tabs ────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/40 px-4 sm:px-8 sticky top-14 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 max-w-7xl mx-auto scrollbar-none touch-momentum">
          {[
            { id: 'overview', label: 'Telemetry & Health', icon: Activity },
            { id: 'users', label: `Users & Moderation (${stats?.users ?? 0})`, icon: Users },
            { id: 'teams', label: `Teams (${stats?.teams ?? 0})`, icon: ShieldAlert },
            { id: 'projects', label: `Projects (${stats?.projects ?? 0})`, icon: FolderKanban },
            { id: 'moderation', label: `Content Moderation (${stats?.posts ?? 0})`, icon: Newspaper },
            { id: 'tickets', label: `Support Tickets (${ticketsList.length || 0})`, icon: LifeBuoy },
            { id: 'system', label: 'System Flags & Kill Switches', icon: Sliders },
            { id: 'audit', label: 'Live Audit Log', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap tap-press transition-all',
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

      {/* ─── Main Content Body ─────────────────────────────────────────── */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* ─── TAB 1: OVERVIEW & TELEMETRY ──────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Students', value: stats?.users ?? 0, icon: Users, color: 'text-violet-500 bg-violet-500/10' },
                { label: 'Live Online Now', value: stats?.onlineUsers ?? 1, icon: Radio, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Formed Teams', value: stats?.teams ?? 0, icon: ShieldAlert, color: 'text-blue-500 bg-blue-500/10' },
                { label: 'Showcase Projects', value: stats?.projects ?? 0, icon: FolderKanban, color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Chat Messages', value: stats?.messages ?? 0, icon: MessageSquare, color: 'text-pink-500 bg-pink-500/10' },
                { label: 'Banned Accounts', value: stats?.bannedUsers ?? 0, icon: Ban, color: 'text-rose-500 bg-rose-500/10' },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 card-hover shadow-xs">
                  <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center shrink-0 shadow-inner`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-6 w-14 rounded-md bg-muted/80 skeleton-shimmer my-0.5" />
                    ) : (
                      <p className="text-xl font-bold tracking-tight">{s.value}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>


            {/* Infrastructure Real-Time Health Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-bold text-sm">Live Infrastructure Health & Telemetry</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemUptime > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        Up: {Math.floor(systemUptime / 3600)}h {Math.floor((systemUptime % 3600) / 60)}m
                      </span>
                    )}
                    {memoryInfo && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        Heap: {memoryInfo.heapUsedMb}MB
                      </span>
                    )}
                    <button onClick={loadHealth} disabled={loadingHealth} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                      <RefreshCw className={cn("w-3.5 h-3.5", loadingHealth && "animate-spin")} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  {loadingHealth && healthServices.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                      Probing infrastructure nodes and LiveKit SFU…
                    </div>
                  ) : (
                    healthServices.map((node) => (
                      <div key={node.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("w-2 h-2 rounded-full", node.ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                          <span className="font-medium text-foreground">{node.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground font-mono">
                          <span className={cn("font-semibold", node.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                            {node.status}
                          </span>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md">{node.ping}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance & Security Mode */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Platform Security & Kill-Switches
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instant toggles to protect the platform during high-load hackathons, database maintenance, or spam attacks.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                    <div>
                      <p className="text-xs font-bold text-foreground">Maintenance Mode</p>
                      <p className="text-[11px] text-muted-foreground">Locks regular user logins during migrations</p>
                    </div>
                    <button
                      onClick={() => handleFlagToggle('maintenanceMode')}
                      disabled={flagUpdating}
                      className="p-1 text-primary hover:opacity-80 transition-opacity"
                    >
                      {flags.maintenanceMode ? (
                        <ToggleRight className="w-7 h-7 text-amber-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                    <div>
                      <p className="text-xs font-bold text-foreground">User Registration Gateway</p>
                      <p className="text-[11px] text-muted-foreground">Allow new student sign-ups across universities</p>
                    </div>
                    <button
                      onClick={() => handleFlagToggle('registrationEnabled')}
                      disabled={flagUpdating}
                      className="p-1 text-primary hover:opacity-80 transition-opacity"
                    >
                      {flags.registrationEnabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>OWASP Top 10 sanitization & JWT token rotators are actively enforced.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: USERS & MODERATION ────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">User Directory & Account Governance</h2>
                <p className="text-xs text-muted-foreground">Manage roles, ban bad actors, and view university affiliations</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    placeholder="Search name, email, uni…"
                    className="text-xs bg-muted rounded-xl pl-9 pr-3.5 py-2 border border-transparent focus:border-primary focus:outline-none w-56"
                  />
                </div>

                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="text-xs bg-muted rounded-xl px-3 py-2 border border-transparent focus:border-primary focus:outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins Only</option>
                  <option value="banned">Banned Users</option>
                </select>

                <button
                  onClick={loadUsers}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Desktop Users Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Device & Network</th>
                    <th className="p-3.5">University</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingUsers ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-muted/80 skeleton-shimmer shrink-0" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-24 bg-muted/80 skeleton-shimmer rounded" />
                              <div className="h-2.5 w-32 bg-muted/60 skeleton-shimmer rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-muted/70 skeleton-shimmer rounded" />
                            <div className="h-2.5 w-20 bg-muted/50 skeleton-shimmer rounded" />
                          </div>
                        </td>
                        <td className="p-3.5"><div className="h-3 w-20 bg-muted/70 skeleton-shimmer rounded" /></td>
                        <td className="p-3.5"><div className="h-4 w-14 bg-muted/70 skeleton-shimmer rounded-full" /></td>
                        <td className="p-3.5"><div className="h-4 w-14 bg-muted/70 skeleton-shimmer rounded-full" /></td>
                        <td className="p-3.5"><div className="h-3 w-16 bg-muted/60 skeleton-shimmer rounded" /></td>
                        <td className="p-3.5 text-right"><div className="h-7 w-20 bg-muted/70 skeleton-shimmer rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No users found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id || u._id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: u.avatarColor || getAvatarColor(u.id || 'x') }}
                            >
                              {getInitials(`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                              <Smartphone className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate max-w-[170px]" title={u.lastLoginDeviceModel || 'Standard Web'}>
                                {u.lastLoginDeviceModel || 'Web Browser'}
                              </span>
                              {u.lastLoginBrowser && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({u.lastLoginBrowser})
                                </span>
                              )}
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                              <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{u.lastLoginIp || '127.0.0.1'}</span>
                              {(u.lastLoginCity || u.lastLoginCountry) && (
                                <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded">
                                  {[u.lastLoginCity, u.lastLoginCountry].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{u.university || '—'}</td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              u.role === 'admin'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {u.role || 'student'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {u.isBanned ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-destructive/10 text-destructive">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground">{timeAgo(u.createdAt)}</td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleRoleToggle(u.id || u._id, u.role)}
                              title="Toggle Admin Role"
                              className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleBanToggle(u.id || u._id, u.isBanned)}
                              title={u.isBanned ? 'Unban User' : 'Ban User'}
                              className={cn(
                                'p-1.5 rounded-lg border text-xs',
                                u.isBanned
                                  ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                                  : 'border-destructive/30 text-destructive hover:bg-destructive/10'
                              )}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id || u._id)}
                              title="Delete Account"
                              className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Zero Horizontal Scroll) */}
            <div className="md:hidden space-y-3">
              {loadingUsers ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted skeleton-shimmer" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-28 bg-muted rounded skeleton-shimmer" />
                        <div className="h-2.5 w-40 bg-muted rounded skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="h-4 w-24 bg-muted rounded skeleton-shimmer" />
                  </div>
                ))
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
                  No users found matching query.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u.id || u._id} className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner"
                          style={{ backgroundColor: u.avatarColor || getAvatarColor(u.id || 'x') }}
                        >
                          {getInitials(`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          <p className="text-[10px] text-muted-foreground">{u.university || 'No university'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
                            u.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {u.role || 'student'}
                        </span>
                        {u.isBanned ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-destructive/10 text-destructive">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hardware / IP Info */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Smartphone className="w-3 h-3 text-primary shrink-0" />
                        {u.lastLoginDeviceModel || 'Web Browser'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {u.lastLoginIp || '127.0.0.1'}
                      </span>
                      {(u.lastLoginCity || u.lastLoginCountry) && (
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">
                          {[u.lastLoginCity, u.lastLoginCountry].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Mobile Touch Action Bar (min 44px targets) */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleRoleToggle(u.id || u._id, u.role)}
                        className="min-h-[44px] flex items-center justify-center gap-1 rounded-xl border border-border bg-muted/40 hover:bg-accent text-xs font-semibold text-foreground tap-press transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>Role</span>
                      </button>

                      <button
                        onClick={() => handleBanToggle(u.id || u._id, u.isBanned)}
                        className={cn(
                          'min-h-[44px] flex items-center justify-center gap-1 rounded-xl border text-xs font-semibold tap-press transition-colors',
                          u.isBanned
                            ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                            : 'border-destructive/30 text-destructive bg-destructive/5'
                        )}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id || u._id)}
                        className="min-h-[44px] flex items-center justify-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold tap-press transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* ─── TAB 3: TEAMS ─────────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Team Squads & Collaboration Groups</h2>
                <p className="text-xs text-muted-foreground">Monitor formed squads, member limits and delete spam teams</p>
              </div>
              <button onClick={loadTeams} className="p-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingTeams ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
                ))
              ) : teamsList.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-3 text-center py-12">No active teams created yet.</p>
              ) : (
                teamsList.map((team) => (
                  <div key={team.id} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between gap-3 card-hover">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {team.category || 'General'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {team.member_count ?? 1}/{team.max_size || 5} members
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-foreground truncate">{team.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{team.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                      <span>Created {timeAgo(team.created_at)}</span>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-destructive hover:underline font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: PROJECTS ──────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Showcase Projects Curation</h2>
                <p className="text-xs text-muted-foreground">Feature top student projects and maintain showcase quality</p>
              </div>
              <button onClick={loadProjects} className="p-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingProjects ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
                ))
              ) : projectsList.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-3 text-center py-12">No showcase projects submitted yet.</p>
              ) : (
                projectsList.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between gap-3 card-hover">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {proj.category || 'General'}
                        </span>
                        {proj.is_featured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-white" /> Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-foreground truncate">{proj.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{proj.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-[11px]">
                      <button
                        onClick={() => handleFeatureProject(proj.id, proj.is_featured)}
                        className="text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> {proj.is_featured ? 'Unfeature' : 'Feature on Showcase'}
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-destructive hover:underline font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: CONTENT MODERATION (FEED POSTS) ───────────────────── */}
        {activeTab === 'moderation' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">Community Feed & Content Moderation</h2>
                <p className="text-xs text-muted-foreground">Scan public posts, audit uploaded media attachments, and enforce guidelines</p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                    placeholder="Search post content…"
                    className="text-xs bg-muted rounded-xl pl-9 pr-3.5 py-2 border border-transparent focus:border-primary focus:outline-none w-56"
                  />
                </div>
                <button
                  onClick={loadPosts}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingPosts && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Desktop Posts Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Post Content</th>
                    <th className="p-3.5">Attachment</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Posted</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingPosts ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-28 bg-muted/80 skeleton-shimmer rounded" />
                            <div className="h-2.5 w-36 bg-muted/60 skeleton-shimmer rounded" />
                          </div>
                        </td>
                        <td className="p-3.5"><div className="h-3.5 w-48 bg-muted/70 skeleton-shimmer rounded" /></td>
                        <td className="p-3.5"><div className="h-9 w-9 bg-muted/70 skeleton-shimmer rounded-lg" /></td>
                        <td className="p-3.5"><div className="h-4 w-14 bg-muted/70 skeleton-shimmer rounded-full" /></td>
                        <td className="p-3.5"><div className="h-3 w-16 bg-muted/60 skeleton-shimmer rounded" /></td>
                        <td className="p-3.5 text-right"><div className="h-7 w-20 bg-muted/70 skeleton-shimmer rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : postsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No community posts found matching query.
                      </td>
                    </tr>
                  ) : (
                    postsList.map((post) => (
                      <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <div>
                            <p className="font-semibold text-foreground">
                              {post.author?.firstName ? `${post.author.firstName} ${post.author.lastName || ''}` : post.author?.email || 'Unknown User'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{post.author?.university || post.author?.email}</p>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="line-clamp-2 text-muted-foreground">{post.content || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          {post.imageUrl ? (
                            <a href={post.imageUrl} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-border hover:opacity-80">
                              <img src={post.imageUrl} alt="Attachment" className="w-full h-full object-cover" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">None</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                            {post.postType || 'general'}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{timeAgo(post.createdAt)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete violating post"
                            className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Moderation Stacked Cards (Zero Horizontal Scroll) */}
            <div className="md:hidden space-y-3">
              {loadingPosts ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-32 bg-muted rounded skeleton-shimmer" />
                    <div className="h-3 w-full bg-muted rounded skeleton-shimmer" />
                    <div className="h-3 w-3/4 bg-muted rounded skeleton-shimmer" />
                  </div>
                ))
              ) : postsList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
                  No community posts found matching query.
                </div>
              ) : (
                postsList.map((post) => (
                  <div key={post.id} className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-foreground">
                          {post.author?.firstName ? `${post.author.firstName} ${post.author.lastName || ''}` : post.author?.email || 'Unknown User'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{post.author?.university || post.author?.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-muted text-muted-foreground">
                        {post.postType || 'general'}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3">{post.content || 'No text content'}</p>

                    {post.imageUrl && (
                      <a href={post.imageUrl} target="_blank" rel="noreferrer" className="block w-full max-h-48 rounded-xl overflow-hidden border border-border">
                        <img src={post.imageUrl} alt="Post Attachment" className="w-full h-full object-cover" />
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold tap-press"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Post</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 6: SUPPORT TICKETS ───────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Student Support & Helpdesk Tickets</h2>
                <p className="text-xs text-muted-foreground">Resolve platform inquiries, bug reports, and user feedback</p>
              </div>
              <button onClick={loadTickets} className="p-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold">
                <RefreshCw className={cn("w-3.5 h-3.5", loadingTickets && "animate-spin")} />
              </button>
            </div>

            {/* Desktop Tickets Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Subject & Message</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Submitted</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingTickets ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-24 bg-muted/80 skeleton-shimmer rounded" />
                            <div className="h-2.5 w-32 bg-muted/60 skeleton-shimmer rounded" />
                          </div>
                        </td>
                        <td className="p-3.5"><div className="h-4 w-16 bg-muted/70 skeleton-shimmer rounded-full" /></td>
                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-muted/80 skeleton-shimmer rounded" />
                            <div className="h-2.5 w-48 bg-muted/60 skeleton-shimmer rounded" />
                          </div>
                        </td>
                        <td className="p-3.5"><div className="h-4 w-14 bg-muted/70 skeleton-shimmer rounded-full" /></td>
                        <td className="p-3.5"><div className="h-3 w-16 bg-muted/60 skeleton-shimmer rounded" /></td>
                        <td className="p-3.5 text-right"><div className="h-7 w-24 bg-muted/70 skeleton-shimmer rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : ticketsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No support tickets opened. System operating cleanly!
                      </td>
                    </tr>
                  ) : (
                    ticketsList.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <p className="font-semibold text-foreground">
                            {ticket.author?.firstName ? `${ticket.author.firstName} ${ticket.author.lastName || ''}` : 'Student'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{ticket.author?.email || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
                            {ticket.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <p className="font-semibold text-foreground">{ticket.subject}</p>
                          <p className="line-clamp-2 text-muted-foreground mt-0.5">{ticket.message}</p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              ticket.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            )}
                          >
                            {ticket.status || 'open'}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{timeAgo(ticket.createdAt)}</td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleResolveTicket(ticket.id, ticket.status)}
                              className={cn(
                                'px-2.5 py-1 rounded-lg text-xs font-semibold border',
                                ticket.status === 'resolved'
                                ? 'border-muted text-muted-foreground hover:bg-muted'
                                : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                              )}
                            >
                              {ticket.status === 'resolved' ? 'Reopen' : 'Resolve'}
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Tickets Stacked Cards (Zero Horizontal Scroll) */}
            <div className="md:hidden space-y-3">
              {loadingTickets ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-28 bg-muted rounded skeleton-shimmer" />
                    <div className="h-3.5 w-44 bg-muted rounded skeleton-shimmer" />
                    <div className="h-3 w-full bg-muted rounded skeleton-shimmer" />
                  </div>
                ))
              ) : ticketsList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
                  No support tickets opened. System operating cleanly!
                </div>
              ) : (
                ticketsList.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-foreground">
                          {ticket.author?.firstName ? `${ticket.author.firstName} ${ticket.author.lastName || ''}` : 'Student'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{ticket.author?.email || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-primary/10 text-primary">
                          {ticket.category || 'General'}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
                            ticket.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {ticket.status || 'open'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.message}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-[11px] text-muted-foreground">{timeAgo(ticket.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveTicket(ticket.id, ticket.status)}
                          className={cn(
                            'min-h-[44px] px-3.5 rounded-xl text-xs font-semibold border tap-press transition-colors',
                            ticket.status === 'resolved'
                              ? 'border-muted text-muted-foreground bg-muted/30'
                              : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          )}
                        >
                          {ticket.status === 'resolved' ? 'Reopen' : 'Resolve'}
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="min-h-[44px] w-11 flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive tap-press"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 7: SYSTEM FLAGS ──────────────────────────────────────── */}
        {activeTab === 'system' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs max-w-3xl">
            <div>
              <h2 className="text-base font-bold">Platform Operational Flags & Controls</h2>
              <p className="text-xs text-muted-foreground">Changes take effect across all servers and client sessions instantly</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'maintenanceMode' as const,
                  label: 'Maintenance Mode',
                  desc: 'When enabled, only administrators can log in. Regular students will see a maintenance screen.',
                },
                {
                  key: 'registrationEnabled' as const,
                  label: 'Student Registration Allowed',
                  desc: 'Controls whether new sign-ups are open. Turn off during private hackathon events or invitations.',
                },
                {
                  key: 'emailVerification' as const,
                  label: 'Mandatory Email Verification',
                  desc: 'Requires users to verify their institutional email before accessing team creation and chat.',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="max-w-md">
                    <h3 className="font-bold text-sm text-foreground">{item.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleFlagToggle(item.key)}
                    disabled={flagUpdating}
                    className="p-1 text-primary hover:opacity-80 transition-opacity shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {flags[item.key] ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 8: AUDIT LOG ─────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-sm font-sans">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Persistent Administrative Audit Trail ({auditLogsList.length})</span>
              </div>
              <div className="flex items-center gap-3 font-sans">
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live DB Sync
                </span>
                <button
                  onClick={loadAuditLogs}
                  className="p-1.5 rounded-lg bg-muted hover:bg-accent text-muted-foreground"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingAuditLogs && "animate-spin")} />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingAuditLogs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60 animate-pulse flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-3 w-16 bg-muted skeleton-shimmer rounded" />
                      <div className="h-4 w-20 bg-muted skeleton-shimmer rounded" />
                      <div className="h-3 w-48 bg-muted skeleton-shimmer rounded" />
                    </div>
                    <div className="h-3 w-24 bg-muted skeleton-shimmer rounded shrink-0" />
                  </div>
                ))
              ) : auditLogsList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-sans text-xs">
                  No administrative events recorded yet.
                </div>
              ) : (
                auditLogsList.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        [{timeAgo(log.created_at || log.createdAt)}]
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[9px] uppercase font-bold shrink-0',
                          (log.action.includes('BAN') || log.action.includes('DELETE'))
                            ? 'bg-destructive/20 text-destructive'
                            : log.action.includes('UPDATE') || log.action.includes('CHANGE')
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {log.action}
                      </span>
                      <span className="text-foreground text-xs font-sans truncate max-w-md">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans shrink-0">
                      <span>{log.admin_email || log.adminEmail || 'System'}</span>
                      {log.device_model && (
                        <span className="text-[10px] text-primary/80 flex items-center gap-1 font-mono">
                          <Smartphone className="w-2.5 h-2.5" />
                          {log.device_model}
                        </span>
                      )}
                      {log.ip_address && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                          {log.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
