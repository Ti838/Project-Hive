'use client';
// ─── ProjectHive — Centralized Theme Management Context ──────────────────────────

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const applyThemeToDOM = useCallback((activeTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const resolved: ResolvedTheme =
      activeTheme === 'system' ? getSystemTheme() : activeTheme;

    setResolvedTheme(resolved);
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [getSystemTheme]);

  // Initialise theme from localStorage or user settings on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('ph-theme') as Theme | null;
    let initialTheme: Theme = 'system';

    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      initialTheme = saved;
    } else if (user?.settings?.theme) {
      initialTheme = user.settings.theme as Theme;
    }

    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);
  }, []);

  // Sync if user settings load/change from cloud
  useEffect(() => {
    if (!mounted || !user?.settings?.theme) return;
    const cloudTheme = user.settings.theme as Theme;
    if (cloudTheme && cloudTheme !== theme) {
      const saved = localStorage.getItem('ph-theme');
      // If no explicit local override or matching cloud, apply cloud preference
      if (!saved || saved === cloudTheme) {
        setThemeState(cloudTheme);
        applyThemeToDOM(cloudTheme);
      }
    }
  }, [user?.settings?.theme, mounted]);

  // Listen to OS system preference changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        applyThemeToDOM('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ph-theme', nextTheme);
    }
    applyThemeToDOM(nextTheme);

    // Sync to cloud if user is authenticated
    if (user) {
      api.users.updateSettings({ theme: nextTheme }).catch((err) => {
        console.warn('[ProjectHive Theme] Failed to sync theme to cloud:', err);
      });
    }
  }, [applyThemeToDOM, user]);

  const toggleTheme = useCallback(() => {
    // If currently in system or dark, switch to light; if light, switch to dark
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

