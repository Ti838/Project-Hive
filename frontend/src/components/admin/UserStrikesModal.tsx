'use client';

import React from 'react';
import { ShieldAlert, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, UserStrike } from '@/types';

interface UserStrikesModalProps {
  user: User;
  onClose: () => void;
  userStrikes: UserStrike[];
  loadingStrikes: boolean;
  handleIssueStrike: (e: React.FormEvent) => void;
  strikeReason: string;
  setStrikeReason: (reason: string) => void;
  strikeSeverity: 'warning' | 'temporary_suspension' | 'permanent_ban';
  setStrikeSeverity: (severity: 'warning' | 'temporary_suspension' | 'permanent_ban') => void;
  submittingStrike: boolean;
  actionFeedback: { type: 'success' | 'error'; message: string } | null;
}

export function UserStrikesModal({
  user,
  onClose,
  userStrikes,
  loadingStrikes,
  handleIssueStrike,
  strikeReason,
  setStrikeReason,
  strikeSeverity,
  setStrikeSeverity,
  submittingStrike,
  actionFeedback,
}: UserStrikesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0e131b] border border-foreground/10 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Strike Ledger: {user.first_name} {user.last_name}
              </h2>
              <p className="text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threshold Notice Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Campus Disciplinary Rule (3-Strike Threshold)</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">
              Accumulating 3 or more strikes triggers an immediate automated platform-wide permanent ban.
            </p>
          </div>
        </div>

        {/* Existing Strikes History */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
            Infraction History ({userStrikes.length} strikes recorded)
          </h3>

          {loadingStrikes ? (
            <div className="py-6 text-center text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-amber-400" />
              <span className="text-[11px]">Loading ledger records...</span>
            </div>
          ) : userStrikes.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-foreground/5 text-center text-slate-400 text-xs">
              Clean disciplinary record. No infractions recorded.
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {userStrikes.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-foreground/5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase">
                        {s.severity}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Issued by {s.issuer?.first_name || 'Admin'}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs">{s.reason}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issue New Strike Form */}
        <form onSubmit={handleIssueStrike} className="space-y-4 pt-4 border-t border-foreground/10">
          <h3 className="text-xs font-bold text-white">Issue Disciplinary Strike</h3>

          {actionFeedback && (
            <div
              className={cn(
                'p-3 rounded-xl text-xs font-medium flex items-center gap-2',
                actionFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              )}
            >
              <span>{actionFeedback.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Infraction Reason / Evidence
            </label>
            <textarea
              rows={3}
              required
              placeholder="State the violation (e.g., Code of Conduct breach, plagiarism, harassment in squad chat)..."
              value={strikeReason}
              onChange={(e) => setStrikeReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-foreground/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Sanction Severity
            </label>
            <select
              value={strikeSeverity}
              onChange={(e) => setStrikeSeverity(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-foreground/10 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="warning">Formal Warning (1 Strike)</option>
              <option value="temporary_suspension">Temporary Suspension (2 Strikes)</option>
              <option value="permanent_ban">Permanent Ban (Immediate 3 Strikes)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStrike || !strikeReason.trim()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {submittingStrike ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Infraction...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Issue Disciplinary Sanction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

