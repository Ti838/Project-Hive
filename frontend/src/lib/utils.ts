import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string into relative time (e.g. "2 minutes ago") */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/** Get user display name */
export function displayName(
  user:
    | {
        first_name?: string;
        last_name?: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        username?: string;
        email?: string;
      }
    | null
    | undefined
): string {
  if (!user) return 'Unknown';
  const first = (user.firstName ?? user.first_name ?? '').trim();
  const last = (user.lastName ?? user.last_name ?? '').trim();
  const full = `${first} ${last}`.trim();
  if (full && full !== 'undefined undefined' && full !== 'undefined') return full;
  if (user.name && user.name !== 'undefined undefined') return user.name;
  if (user.username) return user.username;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

/** Get initials for avatar fallback */
export function getInitials(name: string): string {
  if (!name || name === 'undefined undefined' || name === 'undefined') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Generate a consistent color from a user ID or string */
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6',
];
export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Truncate text to a max length */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** Format number with K/M suffix */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Cleanly decode numeric HTML entities (&#...;), hex entities (&#x...;),
 * and escaped Unicode sequences (\u00xx / \u{...}) so native symbols and emojis
 * render correctly without mojibake or raw escape sequences.
 */
export function sanitizeAndDecodeText(input: string | null | undefined): string {
  if (!input) return '';
  let text = String(input);

  // Decode numeric decimal entities: &#1234;
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCodePoint(parseInt(dec, 10));
    } catch {
      return _;
    }
  });

  // Decode numeric hex entities: &#x1f600;
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  // Decode escaped Unicode sequences like \u00e9 or \uD83D\uDE00
  text = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  return text;
}

/**
 * Extract clean readable text from description strings.
 * If a description was stored as a JSON string (e.g. {"text":"...", "github":"..."}),
 * this safely parses and returns the human-readable text.
 */
export function parseDescription(input: string | null | undefined): string {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);
  const trimmed = input.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed.text || parsed.description || parsed.content || parsed.bio || trimmed;
      }
    } catch {
      // Not valid JSON, return as is
    }
  }
  return sanitizeAndDecodeText(input);
}

