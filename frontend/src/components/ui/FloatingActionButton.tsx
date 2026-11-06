'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label?: string;
  onClick: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-center';
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  className,
  position = 'bottom-right',
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'md:hidden fixed z-40 flex items-center justify-center gap-2',
        'bg-primary text-primary-foreground font-semibold text-xs rounded-full shadow-2xl',
        'active:scale-95 transition-all duration-200 tap-press border border-white/20',
        position === 'bottom-right' && 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,16px))] right-5 p-3.5',
        position === 'bottom-center' && 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,16px))] left-1/2 -translate-x-1/2 px-5 py-3',
        className
      )}
      aria-label={label || 'Action'}
    >
      <Icon className="w-5 h-5" />
      {label && <span>{label}</span>}
    </button>
  );
}

