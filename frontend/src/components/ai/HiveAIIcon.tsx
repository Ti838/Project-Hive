'use client';
// ─── ProjectHive — Reusable Hive AI Icon & Avatar ────────────────────────────
// Minimal, professional, recognizable, ProjectHive-branded AI marks

import React from 'react';
import { cn } from '@/lib/utils';

interface HiveAIIconProps {
  className?: string;
  size?: number | string;
}

export function HiveAIIcon({ className, size = 16 }: HiveAIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 text-amber-500', className)}
    >
      {/* Hexagonal hive core with subtle neural spark */}
      <path
        d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-75"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path
        d="M12 6V8.5M12 15.5V18M6.8 9L8.9 10.2M15.1 13.8L17.2 15M6.8 15L8.9 13.8M15.1 10.2L17.2 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface HiveAIAvatarProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function HiveAIAvatar({ className, size = 'sm' }: HiveAIAvatarProps) {
  const sizeClasses = {
    xs: 'w-5 h-5 rounded-md text-[10px]',
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-9 h-9 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  }[size];

  const iconSizes = {
    xs: 12,
    sm: 15,
    md: 18,
    lg: 24,
  }[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 select-none font-bold',
        'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-500 shadow-2xs',
        sizeClasses,
        className
      )}
    >
      <HiveAIIcon size={iconSizes} />
    </div>
  );
}

