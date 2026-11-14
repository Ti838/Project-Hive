'use client';

import React from 'react';
import { Code, CheckCircle2, Copy, X } from 'lucide-react';
import type { AdminAuditLog } from '@/types';

interface AuditLogDrawerProps {
  log: AdminAuditLog | null;
  onClose: () => void;
  copied: boolean;
  onCopy: () => void;
}

export function AuditLogDrawer({
  log,
  onClose,
  copied,
  onCopy,
}: AuditLogDrawerProps) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-foreground animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground font-mono">
              Audit Entry: {log.action}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="px-2.5 py-1 rounded-lg border border-input bg-card hover:bg-muted text-xs font-mono text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy JSON Payload"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl bg-muted/40 p-4 border border-border font-mono text-xs text-foreground">
          <pre className="overflow-x-auto">{JSON.stringify(log, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
