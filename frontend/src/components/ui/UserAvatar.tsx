'use client';
// ─── Studio-Grade UserAvatar Component ─────────────────────────────────────────

import { useState } from 'react';
import { cn, displayName, getInitials, getAvatarColor } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type UserPresenceStatus = 'online' | 'busy' | 'away' | 'offline';

export interface UserAvatarUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
  avatar_color?: string;
  avatarColor?: string;
  online_status?: string;
  onlineStatus?: string;
  status?: string;
  [key: string]: any;
}

export interface UserAvatarProps {
  user?: UserAvatarUser | null;
  size?: AvatarSize;
  showStatus?: boolean;
  status?: UserPresenceStatus;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_STYLES: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2.5 h-2.5 bottom-0 right-0' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-3 h-3 bottom-0 right-0' },
  lg: { container: 'w-12 h-12', text: 'text-base', dot: 'w-3.5 h-3.5 bottom-0 right-0' },
  xl: { container: 'w-14 h-14', text: 'text-lg', dot: 'w-4 h-4 bottom-0.5 right-0.5' },
  '2xl': { container: 'w-16 h-16', text: 'text-xl', dot: 'w-4.5 h-4.5 bottom-0.5 right-0.5' },
};

const STATUS_COLORS: Record<UserPresenceStatus, string> = {
  online: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
  busy: 'bg-rose-500 shadow-xs shadow-rose-500/50',
  away: 'bg-amber-500 shadow-xs shadow-amber-500/50',
  offline: 'bg-zinc-400 dark:bg-zinc-600',
};

export function UserAvatar({
  user,
  size = 'md',
  showStatus = false,
  status: explicitStatus,
  interactive = false,
  className,
  onClick,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const name = displayName(user);
  const initials = getInitials(name);
  const avatarUrl = user?.avatar;
  const avatarColor =
    user?.avatarColor ||
    user?.avatar_color ||
    getAvatarColor(user?.id || name || 'default');

  // Determine presence status
  const resolvedStatus: UserPresenceStatus = explicitStatus || (() => {
    const rawOnline = user?.onlineStatus || user?.online_status;
    const rawStatus = user?.status;
    if (rawOnline === 'online') {
      if (rawStatus === 'busy') return 'busy';
      return 'online';
    }
    if (rawOnline === 'away') return 'away';
    if (rawStatus === 'busy') return 'busy';
    return 'offline';
  })();

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-full',
        sizeStyle.container,
        interactive && 'tap-press cursor-pointer hover:scale-105 transition-transform duration-150',
        className
      )}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover shadow-2xs ring-1 ring-white/10"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full font-bold text-white shadow-inner',
            sizeStyle.text
          )}
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-background transition-colors duration-200',
            sizeStyle.dot,
            STATUS_COLORS[resolvedStatus]
          )}
          title={`Status: ${resolvedStatus}`}
        />
      )}
    </div>
  );
}

export default UserAvatar;
