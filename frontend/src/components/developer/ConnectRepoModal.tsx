'use client';

import React, { useState } from 'react';
import { GitBranch, X, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentRepoUrl?: string;
  onConnected: (repoUrl: string) => void;
}

export function ConnectRepoModal({ isOpen, onClose, currentRepoUrl, onConnected }: Props) {
  const [repoInput, setRepoInput] = useState(currentRepoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!repoInput.trim()) {
      setError('Please enter a GitHub repository (e.g. facebook/react or full URL)');
      return;
    }

    setLoading(true);
    try {
      // Parse owner and repo
      const cleaned = repoInput.trim().replace(/\.git$/, '');
      const match = cleaned.match(/(?:github\.com\/|^)([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
      if (!match) {
        throw new Error('Invalid format. Use "owner/repo" or "https://github.com/owner/repo"');
      }
      const owner = match[1];
      const repo = match[2];

      // Test validation
      const res = await api.github.getRepoOverview(owner, repo);
      if (res && res.fullName) {
        onConnected(`https://github.com/${res.fullName}`);
        onClose();
      } else {
        throw new Error('Could not find this repository on GitHub');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-card border border-border/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Connect GitHub Repository</h3>
                  <p className="text-xs text-muted-foreground">Link project workspace to GitHub</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Repository (URL or owner/repo)</label>
                <input
                  type="text"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  placeholder="e.g. Ti838/Project-Hive or https://github.com/..."
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Public repositories connect instantly. Private repositories require authorized access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs tap-press"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Connecting...' : 'Connect Repository'}</span>
                </button>
              </div>
            </form>
          </motion.div>
      </div>
    </AnimatePresence>
  );
}

