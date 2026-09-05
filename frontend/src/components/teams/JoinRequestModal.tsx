'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { Team } from '@/types';

interface JoinRequestModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<boolean | void>;
}

export function JoinRequestModal({
  team,
  isOpen,
  onClose,
  onSubmit,
}: JoinRequestModalProps) {
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !team) return null;

  const isCommunity = team.type === 'community' || team.category?.startsWith('community:');
  const entityLabel = isCommunity ? 'Community' : 'Squad';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit(pitch.trim());
      if (result !== false) {
        setPitch('');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-card/95 border border-white/15 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 backdrop-blur-xl"
        >
          {/* Header Cover / Gradient */}
          <div className="h-28 relative overflow-hidden bg-linear-to-r from-primary/30 via-accent/20 to-primary/10 flex items-end p-5">
            {team.banner_url && (
              <img
                src={team.banner_url}
                alt={team.name}
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Team Identity badge */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-white/20 flex items-center justify-center text-primary font-bold text-xl shadow-lg backdrop-blur-md overflow-hidden shrink-0">
                {team.avatar_url || team.avatar ? (
                  <img
                    src={team.avatar_url || team.avatar}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{team.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {entityLabel}
                  </span>
                  {team.category && (
                    <span className="text-[10px] font-medium text-muted-foreground truncate">
                      {team.category.replace('community:', '')}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-foreground text-lg truncate">
                  {team.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Community/Squad Rules Snippet if available */}
            {team.rules && (
              <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground/90">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>{entityLabel} Guidelines</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-3">
                  {team.rules}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="join-pitch-message"
                className="flex items-center justify-between text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Your Introduction & Pitch
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {pitch.length}/300
                </span>
              </label>
              <textarea
                id="join-pitch-message"
                value={pitch}
                onChange={(e) => setPitch(e.target.value.slice(0, 300))}
                placeholder={`Introduce yourself, share your primary skills (e.g. React, Node.js, UI Design), and explain why you're excited to collaborate with ${team.name}...`}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-muted/40 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs text-foreground placeholder:text-muted-foreground/60 transition-all resize-none outline-hidden"
              />
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                The {isCommunity ? 'community moderators' : 'squad leader'} will review your request and profile.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 tap-press transition-all cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
