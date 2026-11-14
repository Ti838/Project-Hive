'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requiredMatchText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requiredMatchText,
  isLoading = false,
}: ConfirmDialogProps) {
  const [matchInput, setMatchInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatchValid = !requiredMatchText || matchInput.trim().toUpperCase() === requiredMatchText.trim().toUpperCase();

  const handleConfirm = async () => {
    if (!isMatchValid || isLoading) return;
    await onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-500/10 border-rose-500/20',
          btnClass: 'bg-rose-600 hover:bg-rose-500 text-white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          btnClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
        };
      default:
        return {
          icon: CheckCircle2,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10 border-primary/20',
          btnClass: 'bg-primary hover:bg-primary/90 text-primary-foreground font-bold',
        };
    }
  };

  const v = getVariantStyles();
  const Icon = v.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 text-foreground"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', v.iconBg, v.iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {requiredMatchText && (
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-[11px] font-medium text-muted-foreground block">
              Type <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{requiredMatchText}</span> to proceed:
            </label>
            <input
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={requiredMatchText}
              disabled={isLoading}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatchValid || isLoading}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2',
              v.btnClass,
              (!isMatchValid || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
