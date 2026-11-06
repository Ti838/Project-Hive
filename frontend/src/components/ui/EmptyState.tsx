'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl',
        'border border-dashed border-border/80 bg-card/40 backdrop-blur-xs',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md flex items-center gap-2"
        >
          {action.icon && <action.icon className="w-3.5 h-3.5" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}

