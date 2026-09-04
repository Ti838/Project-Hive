'use client';
// ─── Hive AI Copilot Slide-Over Drawer ───────────────────────────────────────
// Accessible across every page in ProjectHive with zero visual pollution

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, ChevronRight, MessageSquare,
  Bot, Maximize2, Minimize2, Trash2, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { HiveAIHeader } from './HiveAIHeader';
import { HiveAICapabilities } from './HiveAICapabilities';
import { HiveAIContextRail } from './HiveAIContextRail';
import { HiveAIMessage } from './HiveAIMessage';
import { HiveAIThinking } from './HiveAIThinking';
import { HiveAIEmptyState, HiveAIError } from './HiveAIEmptyState';
import { HiveAIComposer } from './HiveAIComposer';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType, HiveAIMessageItem } from '@/types';

export function HiveAICopilotDrawer() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [capability, setCapability] = useState<HiveAICapabilityType>('copilot_chat');
  const [messages, setMessages] = useState<HiveAIMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Keyboard shortcut: Cmd/Ctrl + J to toggle Hive AI Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async (promptText: string, imageBase64?: string) => {
    if (!promptText && !imageBase64) return;
    setError(null);
    setLoading(true);

    const userMessage: HiveAIMessageItem = {
      id: `copilot-usr-${Date.now()}`,
      role: 'user',
      content: promptText,
      capability,
      imageUrl: imageBase64,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await api.ai.execute({
        capability,
        prompt: promptText,
        context: {
          currentRoute: pathname,
          userId: user?.id,
        },
        imageBase64,
      });

      if (res.ok && res.output) {
        const assistantMessage: HiveAIMessageItem = {
          id: `copilot-ai-${Date.now()}`,
          role: 'assistant',
          content: res.output,
          capability,
          provider: res.provider,
          model: res.model,
          timestamp: res.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(res.error || 'Hive AI request failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error communicating with Hive AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Global Floating Trigger Button (Minimal, Unobtrusive) ───────────── */}
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl select-none',
          'bg-card/90 dark:bg-card/80 backdrop-blur-md border border-amber-500/30 text-foreground',
          'shadow-xl hover:border-amber-500/60 hover:shadow-amber-500/10 transition-all tap-press'
        )}
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/25">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight hidden sm:inline">Hive AI</span>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden md:inline">
          Ctrl+J
        </span>
      </motion.button>

      {/* ── Slide-Over Intelligence Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg h-full bg-card border-l border-border flex flex-col shadow-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight">Hive AI Copilot</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">Multimodal Intelligence</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/generator"
                    onClick={() => setIsOpen(false)}
                    title="Open Full AI Studio"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="border-b border-border/60 bg-muted/10 px-3">
                <HiveAICapabilities
                  activeCapability={capability}
                  onSelectCapability={setCapability}
                />
              </div>

              {/* Active Context */}
              <HiveAIContextRail context={{ currentRoute: pathname }} />

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <HiveAIEmptyState
                    capability={capability}
                    onSelectPrompt={(p) => handleSend(p)}
                  />
                ) : (
                  <>
                    {messages.map((msg) => (
                      <HiveAIMessage key={msg.id} message={msg} />
                    ))}

                    {loading && <HiveAIThinking />}

                    {error && (
                      <HiveAIError
                        message={error}
                        onRetry={() => {
                          const last = messages.filter((m) => m.role === 'user').pop();
                          if (last) handleSend(last.content, last.imageUrl);
                        }}
                      />
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Composer */}
              <HiveAIComposer
                onSend={handleSend}
                isProcessing={loading}
                activeCapability={capability}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
