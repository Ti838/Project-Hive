// ─── ProjectHive — Typed API Client ───────────────────────────────────────────

import type { User, Team, TeamMember, Project, Message, Notification, Post, PostComment, FriendRequest, Stats } from '@/types';

const RENDER_URL = 'https://projecthive-backend.onrender.com';

function getBaseUrl(): string {
  if (typeof window === 'undefined') return `${RENDER_URL}/api`;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : `${RENDER_URL}/api`;
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

    login: (email: string, password: string) =>
      request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
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
    getJoinRequests: (id: string) =>
      request<{ requests: Array<{ id: string; user: User; created_at: string }> }>(`/teams/${id}/requests`),
    respondToRequest: (teamId: string, userId: string, action: 'accept' | 'reject') =>
      request<{ message: string }>(`/teams/${teamId}/requests/${userId}/${action}`, { method: 'POST' }),
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
    generateIdeas: (body: { domain: string; skills: string[]; teamSize: number; timelineWeeks: number; constraints?: string }) =>
      request<{ ideas: any }>('/ai/generate-ideas', { method: 'POST', body: JSON.stringify(body) }),
    chat: (message: string, imageBase64?: string) =>
      request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, imageBase64 }) }),
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
  },

  stats: () => request<Stats>('/stats'),
  turnCredentials: () => request<{ iceServers: RTCIceServer[] }>('/turn-credentials'),
};
