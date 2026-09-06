'use client';
// ─── ProjectHive — Reusable Hive AI Icon & Avatar ────────────────────────────
// Minimal, professional, recognizable, ProjectHive-branded AI marks

import React from 'react';
import { cn } from '@/lib/utils';

interface HiveAIIconProps {
  className?: string;
  size?: number | string;
}

export function HiveAIIcon({ className, size = 18 }: HiveAIIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <img
      src="/logo.png"
      alt="ProjectHive AI"
      style={{ width: pixelSize, height: pixelSize }}
      className={cn('shrink-0 object-contain', className)}
    />
  );
}

interface HiveAIAvatarProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function HiveAIAvatar({ className, size = 'sm' }: HiveAIAvatarProps) {
  const sizeClasses = {
    xs: 'w-5 h-5 rounded-md p-0.5',
    sm: 'w-7 h-7 rounded-lg p-1',
    md: 'w-9 h-9 rounded-xl p-1.5',
    lg: 'w-12 h-12 rounded-2xl p-2',
  }[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 select-none overflow-hidden',
        'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 shadow-2xs',
        sizeClasses,
        className
      )}
    >
      <img
        src="/logo.png"
        alt="ProjectHive AI"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

