import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 focus-visible:ring-amber-500 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-400/30',
      secondary:
        'bg-white/[0.08] hover:bg-white/[0.12] text-slate-100 border border-white/[0.1] hover:border-white/[0.2] shadow-sm focus-visible:ring-slate-400',
      outline:
        'bg-transparent hover:bg-white/[0.06] text-slate-200 border border-white/[0.15] hover:border-white/[0.3] focus-visible:ring-amber-400',
      ghost:
        'bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white border border-transparent focus-visible:ring-slate-400',
      destructive:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/40 focus-visible:ring-rose-500',
      glow:
        'relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30 border border-amber-300/40 focus-visible:ring-amber-400',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2.5 h-10 gap-2',
      lg: 'text-base px-6 py-3.5 h-12 gap-2.5',
      icon: 'h-10 w-10 p-0 items-center justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

