import type {
  User, Team, TeamMember, Project, Message, Notification, Post, PostComment, FriendRequest, Stats,
  GitHubRepo, GitHubCommit, GitHubBranch, GitHubIssue, GitHubPullRequest, GitHubWorkflowRun, GitHubRelease,
  ProjectHealthMetrics, GitHubUserProfile
} from '@/types';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return DEFAULT_API_URL.replace(/\/+$/, '');
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}
export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
}
export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user_data');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}
export function setStoredUser(user: User): void {
  localStorage.setItem('user_data', JSON.stringify(user));
}

// ─── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) { clearTokens(); throw new Error('Refresh failed'); }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken || refresh);
  return data.accessToken;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

type ApiResult<T> = T & { ok: boolean; status: number; error?: string };

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const BASE_URL = getBaseUrl();
  let token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 && token) {
    try {
      token = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    } catch {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return { ok: false, status: 401, error: 'Session expired' } as ApiResult<T>;
    }
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return { ok: res.ok, status: res.status } as ApiResult<T>;
  }

  const data = await res.json();
  return { ...data, ok: res.ok, status: res.status };
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const api = {

  auth: {
    register: (body: { first_name: string; last_name: string; email: string; password: string; university?: string; turnstileToken?: string }) =>
      request<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (email: string, password: string, deviceMeta?: any) =>
      request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password, deviceMeta }),
      }),

    logout: async () => {
      const refresh = getRefreshToken();
      try {
        await request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) });
      } finally { clearTokens(); }
    },

    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

    verifyEmail: (token: string) =>
      request<{ message: string }>(`/auth/verify-email?token=${token}`),

    googleCodeExchange: (code: string) =>
      request<{ message: string; accessToken: string; refreshToken: string; user: User }>('/auth/google/code', {
        method: 'POST', body: JSON.stringify({ code }),
      }),

    googleCallback: (userData: { email: string; googleId: string; firstName?: string; lastName?: string; avatar?: string | null }) =>
      request<{ message: string; accessToken: string; refreshToken: string; user: User }>('/auth/google/callback', {
        method: 'POST', body: JSON.stringify(userData),
      }),
  },

  users: {
    me: () => request<User>('/users/me'),
    getById: (id: string) => request<User>(`/users/${id}`),
    update: (data: Partial<User>) =>
      request<{ user: User }>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    search: (q: string, filters?: Record<string, string>) => {
      const params = new URLSearchParams({ q, ...filters });
      return request<{ users: User[] }>(`/users/search?${params}`);
    },
    getPeople: (page = 1, limit = 20) =>
      request<{ users: User[]; total: number }>(`/users?page=${page}&limit=${limit}`),
    endorseSkill: (userId: string, skillId: string) =>
      request<{ endorsed: boolean; endorsements: number }>(`/users/${userId}/skills/${skillId}/endorse`, { method: 'POST' }),
    changePassword: (data: { currentPassword?: string; newPassword?: string }) =>
      request<{ message: string }>('/users/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  teams: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters);
      return request<{ teams: Team[]; total: number }>(`/teams?${params}`);
    },
    myTeams: () => request<{ teams: Team[] }>('/teams/my-teams'),
    getById: (id: string) => request<Team>(`/teams/${id}`),
    create: (data: Partial<Team>) =>
      request<{ team: Team }>('/teams', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Team>) =>
      request<{ team: Team }>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/teams/${id}`, { method: 'DELETE' }),
    join: (id: string) =>
      request<{ message: string }>(`/teams/${id}/join`, { method: 'POST' }),
    leave: (id: string) =>
      request<{ message: string }>(`/teams/${id}/leave`, { method: 'POST' }),
    getMembers: (id: string) => request<{ members: TeamMember[] }>(`/teams/${id}/members`),
    getRequests: (id: string) =>
      request<{ requests?: any[] } | any[]>(`/teams/${id}/requests`),
    getJoinRequests: (id: string) =>
      request<{ requests: Array<{ id: string; user: User; created_at: string }> }>(`/teams/${id}/requests`),
    respondToRequest: (teamId: string, requestId: string, action: 'accept' | 'reject') =>
      request<{ message: string }>(`/teams/${teamId}/requests/${requestId}/${action}`, { method: 'POST' }),
    kickMember: (teamId: string, memberId: string) =>
      request<{ message: string; ok: boolean }>(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
    transferLeadership: (teamId: string, newLeaderId: string) =>
      request<{ message: string; ok: boolean }>(`/teams/${teamId}/transfer-leadership`, {
        method: 'POST',
        body: JSON.stringify({ newLeaderId }),
      }),
  },

  projects: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters);
      return request<{ projects: Project[]; total: number }>(`/projects?${params}`);
    },
    getById: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: Partial<Project>) =>
      request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Project>) =>
      request<{ project: Project }>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),
    like: (id: string) =>
      request<{ liked: boolean }>(`/projects/${id}/like`, { method: 'POST' }),
  },

  messages: {
    getRoom: (roomId: string, limit = 50, skip = 0) =>
      request<{ messages: Message[] }>(`/messages/${roomId}?limit=${limit}&skip=${skip}`),
    getDMs: () =>
      request<{ conversations: Array<{ user: User; last_message: Message; unread_count: number }> }>('/friends/conversations'),
    react: (id: string, emoji: string) =>
      request<{ ok: boolean; action: 'added' | 'removed' }>(`/messages/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    markAsRead: (friendId: string) =>
      request<{ ok: boolean }>('/messages/read', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),
  },

  notifications: {
    list: () => request<{ notifications: Notification[] }>('/notifications'),
    markRead: (id: string) =>
      request<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      request<{ message: string }>('/notifications/read-all', { method: 'PUT' }),
  },

  posts: {
    list: (page = 1, limit = 20) =>
      request<{ posts: Post[]; total: number }>(`/posts?page=${page}&limit=${limit}`),
    create: (data: { content: string; type?: string; images?: string[]; poll_options?: string[] }) =>
      request<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),
    react: (id: string, type: 'like' | 'celebrate' | 'support') =>
      request<{ reaction: string | null }>(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ type }) }),
    getComments: (id: string) =>
      request<{ comments: PostComment[] }>(`/posts/${id}/comments`),
    comment: (id: string, content: string) =>
      request<{ comment: PostComment }>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    save: (id: string) =>
      request<{ saved: boolean; message: string }>(`/posts/${id}/save`, { method: 'POST' }),
    getSaved: (page = 1, limit = 20) =>
      request<{ posts: Post[]; total: number }>(`/posts/saved?page=${page}&limit=${limit}`),
  },

  stories: {
    list: () =>
      request<{ groups: Array<{ author: User; stories: Array<{ id: string; mediaUrl: string; mediaType: string; caption?: string; createdAt: string; expiresAt: string; viewCount: number; hasViewed: boolean }>; hasUnviewed: boolean }> }>('/stories'),
    create: (data: { mediaUrl: string; mediaType?: 'image' | 'video'; caption?: string }) =>
      request<{ story: any }>('/stories', { method: 'POST', body: JSON.stringify(data) }),
    view: (id: string) =>
      request<{ message: string }>(`/stories/${id}/view`, { method: 'POST' }),
  },

  friends: {
    list: () => request<{ friends: User[] }>('/friends'),
    requests: {
      incoming: () => request<{ requests: FriendRequest[] }>('/friends/requests/incoming'),
      outgoing: () => request<{ requests: FriendRequest[] }>('/friends/requests/outgoing'),
      send: (userId: string) =>
        request<{ message: string }>(`/friends/request/${userId}`, { method: 'POST' }),
      accept: (requestId: string) =>
        request<{ message: string }>(`/friends/requests/${requestId}/accept`, { method: 'PUT' }),
      reject: (requestId: string) =>
        request<{ message: string }>(`/friends/requests/${requestId}/reject`, { method: 'PUT' }),
    },
    remove: (userId: string) =>
      request<{ message: string }>(`/friends/${userId}`, { method: 'DELETE' }),
  },

  ai: {
    execute: (body: {
      capability: import('@/types').HiveAICapabilityType;
      prompt?: string;
      parameters?: Record<string, any>;
      context?: import('@/types').HiveAIContext;
      imageBase64?: string;
      mimeType?: string;
    }) =>
      request<{
        ok: boolean;
        capability: import('@/types').HiveAICapabilityType;
        output: string;
        provider?: string;
        model?: string;
        timestamp: string;
        metadata?: { tokensEstimated?: number; capability?: string };
      }>('/ai/execute', { method: 'POST', body: JSON.stringify(body) }),

    generateIdeas: (body: { domain: string; skills: string[]; teamSize: number; timelineWeeks: number; constraints?: string }) =>
      request<{ ideas: any }>('/ai/generate-ideas', { method: 'POST', body: JSON.stringify(body) }),

    chat: (message: string, imageBase64?: string, context?: Record<string, unknown>) =>
      request<{ ok: boolean; reply: string; provider?: string; model?: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, imageBase64, context }),
      }),
  },

  admin: {
    getStats: () =>
      request<{
        users: number; teams: number; projects: number; messages: number;
        onlineUsers: number; newUsersToday: number; bannedUsers: number; posts: number;
        flags: { maintenanceMode: boolean; registrationEnabled: boolean; emailVerification: boolean };
      }>('/admin/stats'),
    getUsers: (search = '', skip = 0, limit = 100) =>
      request<{ users: any[]; total: number }>(`/admin/users?search=${encodeURIComponent(search)}&skip=${skip}&limit=${limit}`),
    banUser: (id: string, ban?: boolean) =>
      request<{ message: string; isBanned: boolean }>(`/admin/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ ban }) }),
    changeRole: (id: string, role: string) =>
      request<{ message: string; user: any }>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    deleteUser: (id: string) =>
      request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
    getTeams: (skip = 0, limit = 100) =>
      request<{ teams: any[]; total: number }>(`/admin/teams?skip=${skip}&limit=${limit}`),
    deleteTeam: (id: string) =>
      request<{ message: string }>(`/admin/teams/${id}`, { method: 'DELETE' }),
    getProjects: (skip = 0, limit = 100) =>
      request<{ projects: any[]; total: number }>(`/admin/projects?skip=${skip}&limit=${limit}`),
    featureProject: (id: string, featured: boolean) =>
      request<{ message: string; project: any }>(`/admin/projects/${id}/feature`, { method: 'PATCH', body: JSON.stringify({ featured }) }),
    deleteProject: (id: string) =>
      request<{ message: string }>(`/admin/projects/${id}`, { method: 'DELETE' }),
    getFlags: () =>
      request<{ maintenanceMode: boolean; registrationEnabled: boolean; emailVerification: boolean }>('/admin/flags'),
    updateFlags: (flags: Partial<{ maintenanceMode: boolean; registrationEnabled: boolean; emailVerification: boolean }>) =>
      request<{ message: string; flags: any }>('/admin/flags', { method: 'PATCH', body: JSON.stringify(flags) }),
    getPosts: (search = '', skip = 0, limit = 100) =>
      request<{ posts: any[]; total: number }>(`/admin/posts?search=${encodeURIComponent(search)}&skip=${skip}&limit=${limit}`),
    deletePost: (id: string) =>
      request<{ message: string }>(`/admin/posts/${id}`, { method: 'DELETE' }),
    getTickets: (skip = 0, limit = 100) =>
      request<{ tickets: any[]; total: number }>(`/admin/tickets?skip=${skip}&limit=${limit}`),
    resolveTicket: (id: string, status = 'resolved') =>
      request<{ message: string; ticket: any }>(`/admin/tickets/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteTicket: (id: string) =>
      request<{ message: string }>(`/admin/tickets/${id}`, { method: 'DELETE' }),
    getAuditLogs: (skip = 0, limit = 50) =>
      request<{ logs: any[]; total: number }>(`/admin/audit-logs?skip=${skip}&limit=${limit}`),
    getHealth: () =>
      request<{
        timestamp: string;
        uptimeSeconds: number;
        memory: { rssMb: number; heapUsedMb: number };
        services: Array<{ name: string; status: string; ping: string; ok: boolean; activeCalls?: number; url?: string }>;
      }>('/admin/health'),
    superAdminLogin: (email: string, password: string) =>
      request<{ success: boolean; token: string; user: any; message?: string }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  stats: () => request<Stats>('/stats'),
  turnCredentials: () => request<{ iceServers: RTCIceServer[] }>('/turn-credentials'),

  calls: {
    getToken: (body: {
      scope: 'direct' | 'team' | 'project';
      targetId?: string;
      roomName?: string;
      callType?: 'audio' | 'video';
    }) =>
      request<{
        success: boolean;
        token: string;
        roomName: string;
        livekitUrl: string;
        callType: 'audio' | 'video';
        scope: string;
        caller: { id: string; name: string; avatar?: string };
      }>('/calls/token', { method: 'POST', body: JSON.stringify(body) }),

    end: (roomName: string) =>
      request<{ success: boolean }>('/calls/end', { method: 'POST', body: JSON.stringify({ roomName }) }),

    getHistory: () =>
      request<{ success: boolean; calls: any[] }>('/calls/history'),
  },

  github: {
    getStatus: () =>
      request<{ connected: boolean; username: string | null; profile?: GitHubUserProfile }>('/github/status'),
    connect: (body: { username?: string; token?: string }) =>
      request<{ message: string; connected: boolean; username: string; profile: GitHubUserProfile }>('/github/connect', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    disconnect: () =>
      request<{ message: string; connected: boolean }>('/github/disconnect', { method: 'POST' }),
    getUserProfile: (username: string) =>
      request<GitHubUserProfile>(`/github/user/${encodeURIComponent(username)}`),
    getRepoOverview: (owner: string, repo: string) =>
      request<GitHubRepo>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`),
    getRepoReadme: (owner: string, repo: string) =>
      request<{ name: string; path: string; sha: string; content: string; htmlUrl?: string }>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`),
    getRepoTree: (owner: string, repo: string, branch?: string) =>
      request<{ sha: string; truncated: boolean; tree: Array<{ path: string; mode: string; type: 'blob' | 'tree'; size?: number; sha: string }> }>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`),
    getRepoFile: (owner: string, repo: string, path: string, branch?: string) =>
      request<{ type: string; name: string; path: string; content: string; size: number; htmlUrl?: string }>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/file?path=${encodeURIComponent(path)}${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`),
    getRepoCommits: (owner: string, repo: string, branch?: string, limit = 30) =>
      request<GitHubCommit[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?limit=${limit}${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`),
    getRepoBranches: (owner: string, repo: string) =>
      request<GitHubBranch[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`),
    getRepoIssues: (owner: string, repo: string, state = 'all', limit = 30) =>
      request<GitHubIssue[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${state}&limit=${limit}`),
    getRepoPulls: (owner: string, repo: string, state = 'all', limit = 30) =>
      request<GitHubPullRequest[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}&limit=${limit}`),
    getPullDetail: (owner: string, repo: string, pullNumber: number) =>
      request<GitHubPullRequest & { files: Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }> }>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`),
    getRepoActions: (owner: string, repo: string, limit = 15) =>
      request<GitHubWorkflowRun[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions?limit=${limit}`),
    getRepoReleases: (owner: string, repo: string, limit = 10) =>
      request<GitHubRelease[]>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?limit=${limit}`),
    getProjectHealth: (owner: string, repo: string) =>
      request<ProjectHealthMetrics>(`/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/health`),
    performAiReview: (body: { title: string; description?: string; patch: string; filename?: string }) =>
      request<{ review: string; provider?: string; model?: string; timestamp: string }>('/github/ai-review', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
};
