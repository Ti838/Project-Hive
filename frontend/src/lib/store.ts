'use client';
// ─── ProjectHive — Zustand Global Store ───────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';
import { clearTokens, setTokens, setStoredUser } from '@/lib/api';

// ─── Auth Store ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        setStoredUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...partial };
        setStoredUser(updated);
        set({ user: updated });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ph-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => { state?.setLoading(false); },
    }
  )
);

// ─── Socket Store ─────────────────────────────────────────────────────────────

interface SocketState {
  isConnected: boolean;
  activeRoom: string | null;
  onlineUsers: string[];
  setConnected: (connected: boolean) => void;
  setActiveRoom: (roomId: string | null) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useSocketStore = create<SocketState>()((set) => ({
  isConnected: false,
  activeRoom: null,
  onlineUsers: [],
  setConnected: (isConnected) => set({ isConnected }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  addOnlineUser: (userId) =>
    set((s) => ({ onlineUsers: s.onlineUsers.includes(userId) ? s.onlineUsers : [...s.onlineUsers, userId] })),
  removeOnlineUser: (userId) =>
    set((s) => ({ onlineUsers: s.onlineUsers.filter((id) => id !== userId) })),
}));

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mobileMenuOpen: boolean;
  unreadNotifications: number;
  hiveAiEnabled: boolean;
  copilotOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarWidth: (w: number) => void;
  setMobileMenuOpen: (v: boolean) => void;
  toggleMobileMenu: () => void;
  setUnreadNotifications: (n: number) => void;
  decrementUnread: () => void;
  setHiveAiEnabled: (v: boolean) => void;
  setCopilotOpen: (v: boolean) => void;
  toggleCopilot: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      sidebarWidth: 260,
      mobileMenuOpen: false,
      unreadNotifications: 0,
      hiveAiEnabled: true,
      copilotOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth: Math.min(380, Math.max(200, sidebarWidth)) }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
      decrementUnread: () => set((s) => ({ unreadNotifications: Math.max(0, s.unreadNotifications - 1) })),
      setHiveAiEnabled: (hiveAiEnabled) => set({ hiveAiEnabled }),
      setCopilotOpen: (copilotOpen) => set({ copilotOpen }),
      toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
    }),
    {
      name: 'ph-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        hiveAiEnabled: state.hiveAiEnabled,
      }),
    }
  )
);
