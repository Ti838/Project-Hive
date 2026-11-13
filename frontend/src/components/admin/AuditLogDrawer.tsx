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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#0e131b] border border-foreground/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Audit Entry: {log.action}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="px-2.5 py-1 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy JSON Payload"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-foreground/5 cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 p-4 border border-foreground/5 font-mono text-xs text-amber-300">
          <pre>{JSON.stringify(log, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

