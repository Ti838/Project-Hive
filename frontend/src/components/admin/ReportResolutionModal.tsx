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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0e131b] border border-foreground/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Resolve Content Violation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Violating Entity: <strong className="text-white uppercase">{report.target_type}</strong> (ID: {report.target_id})
          </p>
          <p>
            Report Reason: <strong className="text-amber-400">{report.reason}</strong>
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Resolution Notes (Recorded in Audit Ledger)
            </label>
            <textarea
              rows={3}
              placeholder="Describe disciplinary action or reason for resolution..."
              value={resolutionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-foreground/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-foreground/10">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(report, 'resolved', 'delete_content', resolutionNotes)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Content &amp; Resolve</span>
          </button>

          <button
            onClick={() => onSubmit(report, 'resolved', 'resolve_only', resolutionNotes)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolve Without Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
