'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent background body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
          />

          {/* Modal / Bottom Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'relative z-10 w-full max-w-lg bg-card text-foreground',
              'rounded-t-[28px] sm:rounded-3xl border border-border/80 shadow-2xl',
              'max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden',
              className
            )}
          >
            {/* Grab Handle for Touch Ergonomics on Mobile */}
            <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-border/60 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  {title && <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>}
                  {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content Viewport */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,16px))]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

