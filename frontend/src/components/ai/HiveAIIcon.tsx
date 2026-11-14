'use client';
// ─── ProjectHive — Reusable Hive AI Icon & Avatar ────────────────────────────
// Minimal, professional, recognizable, ProjectHive-branded AI marks

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brandConfig';

interface HiveAIIconProps {
  className?: string;
  size?: number | string;
}

export function HiveAIIcon({ className, size = 18 }: HiveAIIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: pixelSize, height: pixelSize }}
        className={cn('shrink-0 text-primary', className)}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  }

  return (
    <img
      src={BRAND_CONFIG.assets.logoIcon}
      alt={`${BRAND_CONFIG.name} AI`}
      style={{ width: pixelSize, height: pixelSize }}
      className={cn('shrink-0 object-contain', className)}
      onError={() => setHasError(true)}
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

  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 select-none overflow-hidden',
        'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 shadow-2xs',
        sizeClasses,
        className
      )}
    >
      {!hasError ? (
        <img
          src={BRAND_CONFIG.assets.logoIcon}
          alt={`${BRAND_CONFIG.name} AI`}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-primary"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )}
    </div>
  );
}

