'use client';
// ─── Hive AI Artifact Card ──────────────────────────────────────────────────
// Dedicated container for saveable blueprints, schemas, documentation & pitches

import { useState } from 'react';
import {
  FileCode, Copy, Check, Download, Bookmark, Sparkles,
  ExternalLink, ChevronRight, Share2, Layers, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HiveAIArtifactData } from '@/types';

interface HiveAIArtifactProps {
  artifact: HiveAIArtifactData;
  onSaveToProject?: (artifact: HiveAIArtifactData) => void;
  className?: string;
}

export function HiveAIArtifact({ artifact, onSaveToProject, className }: HiveAIArtifactProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([artifact.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSave = () => {
    if (onSaveToProject) {
      onSaveToProject(artifact);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className={cn(
      'rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all space-y-3',
      className
    )}>
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-foreground truncate">{artifact.title}</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              AI Artifact · {artifact.type}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Markdown"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-foreground hover:bg-accent tap-press transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download Markdown (.md)"
            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-accent tap-press transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onSaveToProject && (
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all tap-press',
                saved
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {saved ? <CheckCircle2 className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Artifact Preview Snippet */}
      <div className="p-4 pt-1 max-h-96 overflow-y-auto font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
        {artifact.content}
      </div>

      {/* Tags Footer */}
      {artifact.tags && artifact.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-2.5">
          {artifact.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
