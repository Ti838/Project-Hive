'use client';
// ─── Hive AI Context Rail ───────────────────────────────────────────────────
// Visible context indicator ensuring transparent, trustworthy AI reasoning

import { Globe, FolderKanban, Users, Code, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAIContext } from '@/types';

interface HiveAIContextRailProps {
  context: HiveAIContext;
  hasAttachment?: boolean;
  attachmentName?: string;
  onRemoveAttachment?: () => void;
  className?: string;
}

export function HiveAIContextRail({
  context,
  hasAttachment,
  attachmentName,
  onRemoveAttachment,
  className,
}: HiveAIContextRailProps) {
  const hasAnyContext = Boolean(
    context.currentRoute ||
    context.projectName ||
    context.teamName ||
    (context.techStack && context.techStack.length > 0) ||
    hasAttachment
  );

  if (!hasAnyContext) return null;

  return (
    <div className={cn(
      'px-4 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] select-none',
      className
    )}>
      <span className="text-muted-foreground/70 font-semibold uppercase tracking-wider text-[10px] shrink-0">
        Context:
      </span>

      {context.currentRoute && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card border border-border/60 text-foreground font-mono shrink-0">
          <Globe className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate max-w-[120px]">{context.currentRoute}</span>
        </span>
      )}

      {context.projectName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card border border-border/60 text-foreground font-medium shrink-0">
          <FolderKanban className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate max-w-[140px]">{context.projectName}</span>
        </span>
      )}

      {context.teamName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card border border-border/60 text-foreground font-medium shrink-0">
          <Users className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="truncate max-w-[140px]">{context.teamName}</span>
        </span>
      )}

      {context.techStack && context.techStack.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card border border-border/60 text-muted-foreground font-medium shrink-0">
          <Code className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate max-w-[180px]">{context.techStack.slice(0, 3).join(', ')}</span>
        </span>
      )}

      {hasAttachment && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-medium shrink-0">
          <ImageIcon className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">{attachmentName || 'Image Attached'}</span>
          {onRemoveAttachment && (
            <button
              type="button"
              onClick={onRemoveAttachment}
              className="p-0.5 hover:bg-primary/20 rounded-full transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
