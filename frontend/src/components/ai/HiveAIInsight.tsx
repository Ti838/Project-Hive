'use client';
// ─── Hive AI Insight Component ──────────────────────────────────────────────
// Scorecards, risk ratings & priority chips for Idea Analyzer & Critic

import { Star, ShieldAlert, Zap, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HiveAIInsightProps {
  score?: number; // 1-10
  scoreLabel?: string;
  feasibility?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  riskLevel?: 'Low' | 'Medium' | 'High' | string;
  strengths?: string[];
  recommendations?: string[];
  className?: string;
}

export function HiveAIInsight({
  score,
  scoreLabel = 'Innovation Score',
  feasibility,
  riskLevel,
  strengths = [],
  recommendations = [],
  className,
}: HiveAIInsightProps) {
  return (
    <div className={cn('p-4 sm:p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs', className)}>
      {/* Top Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {score !== undefined && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {scoreLabel}
              </p>
              <p className="text-xl font-black text-foreground mt-0.5">{score} / 10</p>
            </div>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500/30" />
          </div>
        )}

        {feasibility && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Feasibility
              </p>
              <p className="text-base font-bold text-foreground mt-0.5">{feasibility}</p>
            </div>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
        )}

        {riskLevel && (
          <div className={cn(
            'p-3 rounded-xl border flex items-center justify-between',
            riskLevel.toLowerCase().includes('high')
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : riskLevel.toLowerCase().includes('med')
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          )}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Risk Profile
              </p>
              <p className="text-base font-bold text-foreground mt-0.5">{riskLevel}</p>
            </div>
            <ShieldAlert className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Strengths List */}
      {strengths.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Key Strengths
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {strengths.map((st, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{st}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Actionable Recommendations
          </p>
          <div className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-snug">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
