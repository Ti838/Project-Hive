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
    default: 'bg-[#0d1117] border border-white/[0.08] shadow-sm',
    subtle: 'bg-white/[0.02] border border-white/[0.05]',
    elevated: 'bg-[#111620] border border-white/[0.1] shadow-xl shadow-black/40',
    glass: 'bg-[#0d1117]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200 text-slate-100',
        variants[variant],
        isInteractive &&
          'hover:border-amber-400/40 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5 cursor-pointer',
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
    <div className={cn('p-5 border-b border-white/[0.06] flex items-center justify-between', className)} {...props}>
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
    <h3 className={cn('text-base font-bold tracking-tight text-white', className)} {...props}>
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
    <p className={cn('text-xs text-slate-400 mt-1', className)} {...props}>
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
    <div className={cn('p-5 border-t border-white/[0.06] flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

