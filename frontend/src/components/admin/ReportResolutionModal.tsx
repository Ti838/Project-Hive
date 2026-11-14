'use client';

import React from 'react';
import { ShieldAlert, Trash2, CheckCircle2, X } from 'lucide-react';
import type { ContentReport } from '@/types';

interface ReportResolutionModalProps {
  report: ContentReport | null;
  onClose: () => void;
  resolutionNotes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: (
    report: ContentReport,
    status: 'resolved' | 'dismissed',
    actionTaken?: string,
    notes?: string
  ) => void;
  submitting: boolean;
}

export function ReportResolutionModal({
  report,
  onClose,
  resolutionNotes,
  onNotesChange,
  onSubmit,
  submitting,
}: ReportResolutionModalProps) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Resolve Content Violation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground">
          <p>
            Violating Entity: <strong className="text-foreground uppercase">{report.target_type}</strong> (ID: {report.target_id})
          </p>
          <p>
            Report Reason: <strong className="text-primary">{report.reason}</strong>
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Resolution Notes (Recorded in Audit Ledger)
            </label>
            <textarea
              rows={3}
              placeholder="Describe disciplinary action or reason for resolution..."
              value={resolutionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSubmit(report, 'resolved', 'delete_content', resolutionNotes)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete &amp; Resolve</span>
          </button>

          <button
            type="button"
            onClick={() => onSubmit(report, 'resolved', 'resolve_only', resolutionNotes)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolve Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
