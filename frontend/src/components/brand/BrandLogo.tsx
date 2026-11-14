'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  variant?: 'mark' | 'full' | 'org' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  withText?: boolean;
  subtext?: string;
  linkTo?: string;
  onClick?: () => void;
  showOrgTag?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { container: string; img: string; text: string; subtext: string }> = {
  xs: { container: 'w-6 h-6 rounded-md', img: 'w-4 h-4', text: 'text-xs font-bold', subtext: 'text-[9px]' },
  sm: { container: 'w-8 h-8 rounded-lg', img: 'w-5 h-5', text: 'text-sm font-bold', subtext: 'text-[10px]' },
  md: { container: 'w-9 h-9 rounded-xl', img: 'w-6 h-6', text: 'text-base font-bold', subtext: 'text-[11px]' },
  lg: { container: 'w-11 h-11 rounded-2xl', img: 'w-7 h-7', text: 'text-lg font-extrabold', subtext: 'text-xs' },
  xl: { container: 'w-14 h-14 rounded-2xl', img: 'w-9 h-9', text: 'text-2xl font-black', subtext: 'text-xs' },
};

export function BrandLogo({
  variant = 'full',
  size = 'md',
  className,
  imageClassName,
  textClassName,
  withText = variant === 'full' || variant === 'badge',
  subtext,
  linkTo,
  onClick,
  showOrgTag = false,
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = typeof size === 'string' ? SIZE_MAP[size] : SIZE_MAP.md;

  const isOrg = variant === 'org';
  const logoSrc = isOrg ? BRAND_CONFIG.organization.logo : BRAND_CONFIG.assets.logo;
  const brandAlt = isOrg ? BRAND_CONFIG.organization.name : BRAND_CONFIG.name;

  const content = (
    <div
      onClick={onClick}
      className={cn('inline-flex items-center gap-2.5 select-none', className)}
    >
      {/* Logo Mark Container */}
      <div
        className={cn(
          'flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0 overflow-hidden shadow-xs backdrop-blur-xs transition-transform',
          sizeConfig.container,
          imageClassName
        )}
      >
        {!imageError ? (
          <img
            src={logoSrc}
            alt={brandAlt}
            className={cn('object-contain', sizeConfig.img)}
            onError={() => setImageError(true)}
          />
        ) : (
          /* Graceful Fallback SVG Hive Hexagon */
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('text-primary', sizeConfig.img)}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Brand Text Block */}
      {withText && (
        <div className="flex flex-col min-w-0">
          <div className={cn('tracking-tight text-foreground flex items-center gap-1 leading-none', sizeConfig.text, textClassName)}>
            {isOrg ? (
              <span>{BRAND_CONFIG.organization.name}</span>
            ) : (
              <>
                <span>Project</span>
                <span className="text-primary">{BRAND_CONFIG.nameHighlight}</span>
              </>
            )}
            {showOrgTag && !isOrg && (
              <span className="text-[10px] font-mono text-muted-foreground/70 font-normal ml-1">
                by {BRAND_CONFIG.organization.name}
              </span>
            )}
          </div>
          {subtext && (
            <span className={cn('text-muted-foreground font-mono tracking-wider uppercase mt-0.5 leading-none', sizeConfig.subtext)}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex items-center group transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
