'use client';
// ─── Hive AI Header Component ────────────────────────────────────────────────
// Minimal, premium intelligence status bar with 1-click mode switcher

import { useState } from 'react';
import { Sparkles, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';
import { CAPABILITY_ITEMS, HiveAICapabilitiesModal } from './HiveAICapabilities';

interface HiveAIHeaderProps {
  activeCapability: HiveAICapabilityType;
  onSelectCapability?: (cap: HiveAICapabilityType) => void;
  modelName?: string;
  providerName?: string;
  isProcessing?: boolean;
  onClearSession?: () => void;
  className?: string;
}

export function HiveAIHeader({
  activeCapability,
  onSelectCapability,
  isProcessing = false,
  onClearSession,
  className,
}: HiveAIHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const current = CAPABILITY_ITEMS.find((c) => c.id === activeCapability) || CAPABILITY_ITEMS[0];
  const Icon = current.icon;

  return (
    <>
      <header className={cn(
        'px-4 sm:px-6 py-3 border-b border-border/80 bg-card/60 backdrop-blur-md flex items-center justify-between gap-4 select-none',
        className
      )}>
        {/* Left: Hive AI Brand & 3 Primary Modes Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-inner p-1.5 overflow-hidden">
            <img
              src="/logo.png"
              alt="Hive AI"
              className={cn("w-full h-full object-contain", isProcessing && "animate-pulse")}
            />
          </div>

          {/* 3 Primary Modes + More Dropdown */}
          {onSelectCapability ? (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border/60">
              {/* Mode 1: Project Generator */}
              <button
                type="button"
                onClick={() => onSelectCapability('project_generator')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all tap-press cursor-pointer',
                  activeCapability === 'project_generator'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>Generator</span>
              </button>

              {/* Mode 2: Idea Analyzer */}
              <button
                type="button"
                onClick={() => onSelectCapability('idea_analyzer')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all tap-press cursor-pointer',
                  activeCapability === 'idea_analyzer'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>Idea Analyzer</span>
              </button>

              {/* Mode 3: Engineering Copilot */}
              <button
                type="button"
                onClick={() => onSelectCapability('copilot_chat')}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all tap-press cursor-pointer',
                  activeCapability === 'copilot_chat'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>Copilot</span>
              </button>

              {/* More Modes Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={cn(
                  'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all tap-press cursor-pointer border border-transparent',
                  !['project_generator', 'idea_analyzer', 'copilot_chat'].includes(activeCapability)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title="View all 11 AI Modes"
              >
                <span>
                  {!['project_generator', 'idea_analyzer', 'copilot_chat'].includes(activeCapability)
                    ? current.shortLabel
                    : 'More'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm tracking-tight text-foreground truncate">
                {current.label}
              </h2>
            </div>
          )}
        </div>

        {/* Right: Hive AI Status & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 border border-border/60 text-[11px] font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground font-semibold">Hive AI</span>
            <span className="text-border">·</span>
            <span className="text-emerald-500 font-medium">Online</span>
          </div>



          {onClearSession && (
            <button
              type="button"
              onClick={onClearSession}
              title="Reset conversation"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent tap-press transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Mode Picker Modal */}
      {onSelectCapability && (
        <HiveAICapabilitiesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          activeCapability={activeCapability}
          onSelectCapability={onSelectCapability}
        />
      )}
    </>
  );
}


