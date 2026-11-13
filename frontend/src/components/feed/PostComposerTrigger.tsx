'use client';

import React from 'react';
import { ImagePlus, Code2, BarChart2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function PostComposerTrigger({ onOpen }: { onOpen: () => void }) {
  const { user } = useAuthStore();
  const firstName = user?.first_name || user?.firstName || 'Student';

  return (
    <div className="surface-glass border border-foreground/10 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 h-11 px-4 text-left text-xs sm:text-sm bg-muted/60 hover:bg-muted/90 rounded-2xl border border-foreground/5 text-muted-foreground hover:text-foreground transition-all flex items-center cursor-pointer shadow-inner truncate"
        >
          What&apos;s on your mind, {firstName}? Share a project, code, or poll…
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-foreground/5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-foreground/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <ImagePlus className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold hidden sm:inline">Photo/Media</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-foreground/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <Code2 className="w-4 h-4 text-primary" />
          <span className="font-semibold hidden sm:inline">Code Snippet</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-foreground/10 hover:text-foreground tap-press transition-colors cursor-pointer"
        >
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold hidden sm:inline">Campus Poll</span>
        </button>
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 dark:border-foreground/10 rounded-3xl p-5 space-y-4 shadow-xs animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted/70 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-32 bg-muted/80 rounded-md" />
          <div className="h-3 w-20 bg-muted/60 rounded-md" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-full bg-muted/70 rounded-md" />
        <div className="h-4 w-5/6 bg-muted/70 rounded-md" />
        <div className="h-28 w-full bg-muted/50 rounded-2xl" />
      </div>
      <div className="pt-2 border-t border-border/40 flex items-center gap-4">
        <div className="h-7 w-20 bg-muted/60 rounded-lg" />
        <div className="h-7 w-20 bg-muted/60 rounded-lg" />
      </div>
    </div>
  );
}

