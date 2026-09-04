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
          className="bg-[#111216] border border-border/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card-bg/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-accent/15 border border-accent/30 text-accent">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Connect GitHub Repository</h3>
                <p className="text-xs text-text-muted">Link project workspace to GitHub</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Repository (URL or owner/repo)</label>
              <input
                type="text"
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                placeholder="e.g. Ti838/Project-Hive or https://github.com/..."
                className="w-full px-3.5 py-2.5 bg-secondary/30 border border-border/50 focus:border-accent rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
              />
              <p className="text-[11px] text-text-muted">
                Public repositories connect instantly. Private repositories require authorized access.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-secondary/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-xl transition-colors disabled:opacity-50"
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
