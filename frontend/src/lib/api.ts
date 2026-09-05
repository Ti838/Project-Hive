import type {
  User, Team, TeamMember, Project, Message, Conversation, Notification, Post, PostComment, FriendRequest, Stats,
  GitHubRepo, GitHubCommit, GitHubBranch, GitHubIssue, GitHubPullRequest, GitHubWorkflowRun, GitHubRelease,
  ProjectHealthMetrics, GitHubUserProfile,
  ContentReport, UserStrike, AdminAuditLog, SystemFlags, AdminStats, AdminHealth
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

// ─── Token refresh with Mutex / Lock ──────────────────────────────────────────
let activeRefreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // If a refresh is already in progress, reuse the existing promise (MUTEX)
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
        credentials: 'include',
      });

      if (!res.ok) {
        clearTokens();
        try {
          const { useAuthStore } = await import('@/lib/store');
          useAuthStore.getState().logout();
        } catch (_) {}
        throw new Error('Refresh failed');
      }

      const data = await res.json();
      const newAccess = data.accessToken;
      const newRefresh = data.refreshToken || refresh;

      if (!newAccess) {
        clearTokens();
        try {
          const { useAuthStore } = await import('@/lib/store');
          useAuthStore.getState().logout();
        } catch (_) {}
        throw new Error('No access token received');
      }

      setTokens(newAccess, newRefresh);

      // Seamlessly sync with Zustand store without reloading or tearing down state
      try {
        const { useAuthStore } = await import('@/lib/store');
        useAuthStore.getState().setSessionTokens(newAccess, newRefresh);
      } catch (_) {}

      return newAccess;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

import { getCachedDeviceTelemetry } from '@/lib/deviceTelemetry';

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

  // Inject hardware device telemetry headers for admin routes
  if (endpoint.includes('/admin')) {
    try {
      const telemetry = getCachedDeviceTelemetry();
      if (telemetry) {
        if (telemetry.deviceModel) headers['x-device-model'] = telemetry.deviceModel;
        if (telemetry.gpuRenderer) headers['x-device-gpu'] = telemetry.gpuRenderer;
      }
    } catch (_) {}
  }

  // 35-second client-side circuit-breaker timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    let res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
      credentials: 'include',
    });

    // Handle 401 token expiration (prevent loop on auth endpoints)
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/register');
    if (res.status === 401 && !isAuthEndpoint) {
      try {
        token = await refreshAccessToken();
        headers['Authorization'] = `Bearer ${token}`;
        res = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          signal: options.signal || controller.signal,
          headers,
          credentials: 'include',
        });
      } catch {
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return { ok: false, status: 401, error: 'Session expired' } as ApiResult<T>;
      }
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { ok: res.ok, status: res.status } as ApiResult<T>;
    }

    const data = await res.json().catch(() => ({}));
    return { ...data, ok: res.ok, status: res.status };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        error: 'The request timed out. Please try again.',
      } as ApiResult<T>;
    }
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network request failed. Please check your connection.',
    } as ApiResult<T>;
  } finally {
    clearTimeout(timeoutId);
  }
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

    googleInitiate: () =>
      request<{ url: string }>('/auth/google'),

    googleCodeExchange: (code: string) =>
      request<{ message: string; accessToken: string; refreshToken: string; user: User }>('/auth/google/code', {
        method: 'POST', body: JSON.stringify({ code }),
      }),

    googleCallback: (userData: { email: string; googleId: string; firstName?: string; lastName?: string; avatar?: string | null; supabaseAccessToken?: string }) =>
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
    getPeople: (
      params?: {
        page?: number;
        limit?: number;
        search?: string;
        university?: string;
        major?: string;
        skill?: string;
        status?: string;
      } | number,
      limitArg?: number
    ) => {
      let page = 1;
      let limit = 20;
      let search: string | undefined;
      let university: string | undefined;
      let major: string | undefined;
      let skill: string | undefined;
      let status: string | undefined;

      if (typeof params === 'number') {
        page = params;
        if (typeof limitArg === 'number') limit = limitArg;
      } else if (params && typeof params === 'object') {
        if (params.page !== undefined) page = params.page;
        if (params.limit !== undefined) limit = params.limit;
        search = params.search;
        university = params.university;
        major = params.major;
        skill = params.skill;
        status = params.status;
      }

      const q = new URLSearchParams();
      q.set('page', String(page));
      q.set('limit', String(limit));
      if (search) q.set('search', search);
      if (university) q.set('university', university);
      if (major) q.set('major', major);
      if (skill) q.set('skill', skill);
      if (status) q.set('status', status);

      return request<{ users: User[]; total: number; page: number; pages: number }>(`/users?${q.toString()}`);
    },
    getRecommended: () =>
      request<{ users: Array<User & { reason?: string }> }>('/users/recommended'),
    endorseSkill: (userId: string, skillId: string) =>
      request<{ endorsed: boolean; endorsements: number }>(`/users/${userId}/skills/${skillId}/endorse`, { method: 'POST' }),
    changePassword: (data: { currentPassword?: string; newPassword?: string }) =>
      request<{ message: string }>('/users/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
    updateSettings: (settings: Partial<import('@/types').UserSettings>) =>
      request<{ message: string; settings: import('@/types').UserSettings; user: User }>('/users/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    getUserFriends: (id: string) =>
      request<{ friends: User[] }>(`/users/${id}/friends`),
  },

  teams: {
    getAll: (params?: { type?: 'team' | 'community'; search?: string; category?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.search) q.set('search', params.search);
      if (params?.category) q.set('category', params.category);
      if (params?.page !== undefined) q.set('page', String(params.page));
      if (params?.limit !== undefined) q.set('limit', String(params.limit));
      const qs = q.toString();
      return request<Team[]>(`/teams${qs ? `?${qs}` : ''}`);
    },
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
    join: (id: string, data?: { message?: string } | string) => {
      const message = typeof data === 'string' ? data : data?.message || '';
      return request<{ message: string; joined?: boolean; joinRequest?: any }>(`/teams/${id}/join`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
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
      request<{ liked: boolean; isLiked?: boolean; isUpvoted?: boolean; upvotes?: number; upvote_count?: number }>(`/projects/${id}/like`, { method: 'POST' }),
    upvote: (id: string) =>
      request<{ liked: boolean; isLiked?: boolean; isUpvoted?: boolean; upvotes?: number; upvote_count?: number }>(`/projects/${id}/upvote`, { method: 'POST' }),
    save: (id: string) =>
      request<{ saved: boolean; message: string }>(`/projects/${id}/save`, { method: 'POST' }),
    getSaved: (skip = 0, limit = 20) =>
      request<{ projects: Project[]; pagination?: any }>(`/projects/saved?skip=${skip}&limit=${limit}`),
  },

  messages: {
    getRoom: (roomIdOrFriendId: string, limit = 50, skip = 0) =>
      request<{ messages: Message[]; roomId?: string; room_id?: string }>(`/messages/${roomIdOrFriendId}?limit=${limit}&skip=${skip}`),
    getDMs: () =>
      request<{ conversations: Conversation[] }>('/messages/conversations'),
    getConversations: () =>
      request<{ conversations: Conversation[] }>('/messages/conversations'),
    togglePin: (roomId: string) =>
      request<{ ok: boolean; pinned: boolean; roomId: string }>(`/messages/conversations/${roomId}/pin`, {
        method: 'POST',
      }),
    react: (id: string, emoji: string) =>
      request<{ ok: boolean; action: 'added' | 'removed' }>(`/messages/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    markAsRead: (friendIdOrRoomId: string) =>
      request<{ ok: boolean }>('/messages/read', {
        method: 'POST',
        body: JSON.stringify({
          friendId: friendIdOrRoomId.includes('_') ? undefined : friendIdOrRoomId,
          roomId: friendIdOrRoomId.includes('_') ? friendIdOrRoomId : undefined,
        }),
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
    list: (page = 1, limit = 20, sortBy?: 'recent' | 'popular') =>
      request<{ posts: Post[]; total: number; page: number; limit: number }>(`/posts?page=${page}&limit=${limit}${sortBy ? `&sortBy=${sortBy}` : ''}`),
    create: (data: {
      content: string;
      type?: string;
      postType?: string;
      post_type?: string;
      images?: string[];
      mediaUrls?: string[];
      media_urls?: string[];
      codeSnippet?: { code: string; language: string; title?: string };
      code_snippet?: { code: string; language: string; title?: string };
      pollData?: { question: string; options: Array<{ id: string; text: string; votes?: string[] }>; expiresAt?: string };
      poll_data?: { question: string; options: Array<{ id: string; text: string; votes?: string[] }>; expiresAt?: string };
      poll_options?: string[] | Array<{ text: string }>;
    }) =>
      request<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id: string) =>
      request<{ post: Post }>(`/posts/${id}`),
    edit: (id: string, data: { content: string; codeSnippet?: any; code_snippet?: any }) =>
      request<{ post: Post }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),
    react: (id: string, type: import('@/types').ReactionType) =>
      request<{
        action: 'added' | 'removed' | 'switched';
        type: import('@/types').ReactionType | null;
        reaction: import('@/types').ReactionType | null;
        reactionCounts: Record<string, number>;
      }>(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ type }) }),
    getComments: (id: string) =>
      request<{ comments: PostComment[]; total?: number }>(`/posts/${id}/comments`),
    comment: (id: string, content: string, parentCommentId?: string) =>
      request<{ comment: PostComment }>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, parentCommentId }) }),
    addComment: (id: string, content: string, parentCommentId?: string) =>
      request<{ comment: PostComment }>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, parentCommentId }) }),
    editComment: (postId: string, commentId: string, content: string) =>
      request<{ comment: PostComment }>(`/posts/${postId}/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    deleteComment: (postId: string, commentId: string) =>
      request<{ message: string }>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
    votePoll: (id: string, optionIdOrText: string) =>
      request<{ post: Post; pollData: any }>(`/posts/${id}/poll/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId: optionIdOrText, optionText: optionIdOrText }),
      }),
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
      incoming: () => request<{ requests: FriendRequest[] }>('/friends/requests'),
      outgoing: () => request<{ requests: FriendRequest[] }>('/friends/requests/sent'),
      send: (userId: string) =>
        request<{ message: string; request?: FriendRequest }>(`/friends/request/${userId}`, { method: 'POST' }),
      cancel: (userId: string) =>
        request<{ message: string; ok?: boolean }>(`/friends/request/${userId}/cancel`, { method: 'DELETE' }),
      accept: (requestId: string) =>
        request<{ message: string }>(`/friends/accept/${requestId}`, { method: 'POST' }),
      reject: (requestId: string) =>
        request<{ message: string }>(`/friends/reject/${requestId}`, { method: 'POST' }),
    },
    sendRequest: (userId: string) =>
      request<{ message: string; request?: FriendRequest }>(`/friends/request/${userId}`, { method: 'POST' }),
    cancelRequest: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/request/${userId}/cancel`, { method: 'DELETE' }),
    acceptRequest: (requestId: string) =>
      request<{ message: string }>(`/friends/accept/${requestId}`, { method: 'POST' }),
    rejectRequest: (requestId: string) =>
      request<{ message: string }>(`/friends/reject/${requestId}`, { method: 'POST' }),
    remove: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/${userId}`, { method: 'DELETE' }),
    unfriend: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/${userId}`, { method: 'DELETE' }),
    getMutual: (userId: string) =>
      request<{ mutualCount: number; mutualFriends: User[] }>(`/friends/mutual/${userId}`),
    getRelationship: (userId: string) =>
      request<{ relationship: import('@/types').RelationshipState }>(`/friends/relationship/${userId}`),
    follow: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/follow/${userId}`, { method: 'POST' }),
    unfollow: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/follow/${userId}`, { method: 'DELETE' }),
    block: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/block/${userId}`, { method: 'POST' }),
    unblock: (userId: string) =>
      request<{ message: string; ok?: boolean }>(`/friends/block/${userId}`, { method: 'DELETE' }),
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
  reports: {
    create: (body: { target_type: string; target_id: string; reason: string; details?: string }) =>
      request<{ success: boolean; report: ContentReport }>('/reports', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  admin: {
    getStats: () =>
      request<AdminStats>('/admin/stats'),
    getHealth: () =>
      request<AdminHealth>('/admin/health'),
    getClientTelemetry: () =>
      request<{
        ip: string;
        isPrivate: boolean;
        deviceModel: string | null;
        gpu: string | null;
        userAgent: string;
        timestamp: string;
      }>('/admin/client-telemetry'),
    getUsers: (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.role) q.set('role', params.role);
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return request<{ users: User[]; total: number; page: number; limit: number }>(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    banUser: (id: string, is_banned: boolean, reason?: string) =>
      request<{ message: string; user: User }>(`/admin/users/${id}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ is_banned, reason }),
      }),
    changeRole: (id: string, role: string) =>
      request<{ message: string; user: User }>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    deleteUser: (id: string) =>
      request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
    getUserStrikes: (id: string) =>
      request<{ strikes: UserStrike[]; strikeCount: number }>(`/admin/users/${id}/strikes`),
    issueStrike: (id: string, body: { reason: string; severity?: string }) =>
      request<{ message: string; strike: UserStrike; totalStrikes: number; isBanned: boolean }>(`/admin/users/${id}/strikes`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getReports: (params?: { status?: string; target_type?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.target_type) q.set('target_type', params.target_type);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString();
      return request<{ reports: ContentReport[]; total: number }>(`/admin/reports${qs ? `?${qs}` : ''}`);
    },
    resolveReport: (id: string, body: { status: 'resolved' | 'dismissed'; resolution_notes?: string; action_taken?: string }) =>
      request<{ message: string; report: ContentReport }>(`/admin/reports/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getPosts: (params?: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString();
      return request<{ posts: Post[]; total: number }>(`/admin/posts${qs ? `?${qs}` : ''}`);
    },
    deletePost: (id: string) =>
      request<{ message: string }>(`/admin/posts/${id}`, { method: 'DELETE' }),
    getTeams: (params?: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString();
      return request<{ teams: Team[]; total: number }>(`/admin/teams${qs ? `?${qs}` : ''}`);
    },
    deleteTeam: (id: string) =>
      request<{ message: string }>(`/admin/teams/${id}`, { method: 'DELETE' }),
    getProjects: (params?: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString();
      return request<{ projects: Project[]; total: number }>(`/admin/projects${qs ? `?${qs}` : ''}`);
    },
    deleteProject: (id: string) =>
      request<{ message: string }>(`/admin/projects/${id}`, { method: 'DELETE' }),
    featureProject: (id: string, is_featured: boolean) =>
      request<{ message: string; project: Project }>(`/admin/projects/${id}/feature`, {
        method: 'PATCH',
        body: JSON.stringify({ is_featured }),
      }),
    getSystemFlags: () =>
      request<{ flags: SystemFlags }>('/admin/flags'),
    updateFlags: (flags: Partial<SystemFlags>) =>
      request<{ message: string; flags: SystemFlags }>('/admin/flags', {
        method: 'PATCH',
        body: JSON.stringify({ flags }),
      }),
    getAuditLogs: (params?: { page?: number; limit?: number; action?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.action) q.set('action', params.action);
      if (params?.search) q.set('search', params.search);
      const qs = q.toString();
      return request<{ logs: AdminAuditLog[]; total: number; page: number; limit: number }>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
    },
    getFlags: () =>
      request<{ flags: SystemFlags }>('/admin/flags'),
    getTickets: (skip = 0, limit = 100) =>
      request<{ tickets: any[]; total: number }>(`/admin/tickets?skip=${skip}&limit=${limit}`),
    resolveTicket: (id: string, status = 'resolved') =>
      request<{ message: string; ticket: any }>(`/admin/tickets/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteTicket: (id: string) =>
      request<{ message: string }>(`/admin/tickets/${id}`, { method: 'DELETE' }),
    superAdminLogin: (email: string, password: string) =>
      request<{ ok?: boolean; success?: boolean; token?: string; accessToken?: string; user?: any; admin?: any; message?: string; error?: string }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    promoteMe: () =>
      request<{ message: string; role: string }>('/admin/promote-me', { method: 'POST' }),
  },
};
