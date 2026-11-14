import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'glass';
  isInteractive?: boolean;
}

export function Card({
  className,
  variant = 'default',
  isInteractive = false,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-card border border-border shadow-sm',
    subtle: 'bg-muted/40 border border-border/50',
    elevated: 'surface-floating border border-border shadow-xl shadow-black/10 dark:shadow-black/40',
    glass: 'surface-glass backdrop-blur-xl border border-border/70 shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200 text-foreground',
        variants[variant],
        isInteractive &&
          'hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-b border-border/70 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-bold tracking-tight text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-t border-border/70 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

