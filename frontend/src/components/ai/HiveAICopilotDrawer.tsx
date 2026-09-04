'use client';
// ─── Hive AI Contextual Intelligence Drawer ──────────────────────────────────
// Activated via contextual triggers or Ctrl+J. Zero permanent floating visual pollution.

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/lib/store';
import { HiveAIIcon, HiveAIAvatar } from './HiveAIIcon';
import { HiveAICapabilities } from './HiveAICapabilities';
import { HiveAIContextRail } from './HiveAIContextRail';
import { HiveAIMessage } from './HiveAIMessage';
import { HiveAIThinking } from './HiveAIThinking';
import { HiveAIEmptyState, HiveAIError } from './HiveAIEmptyState';
import { HiveAIComposer } from './HiveAIComposer';
import type { HiveAICapabilityType, HiveAIMessageItem } from '@/types';

export function HiveAICopilotDrawer() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { copilotOpen, setCopilotOpen, hiveAiEnabled } = useUIStore();
  const [capability, setCapability] = useState<HiveAICapabilityType>('copilot_chat');
  const [messages, setMessages] = useState<HiveAIMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (copilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, copilotOpen, loading]);

  // Keyboard shortcut: Cmd/Ctrl + J to toggle Hive AI Drawer (only if Hive AI is enabled)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        if (!hiveAiEnabled) return;
        e.preventDefault();
        setCopilotOpen(!copilotOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copilotOpen, setCopilotOpen, hiveAiEnabled]);

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

  // If user disabled Hive AI in settings, don't render drawer
  if (!hiveAiEnabled) return null;

  return (
    <AnimatePresence>
      {copilotOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCopilotOpen(false)}
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
                <HiveAIAvatar size="sm" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Hive AI</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">Contextual Intelligence</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/generator"
                  onClick={() => setCopilotOpen(false)}
                  title="Open Full AI Studio"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setCopilotOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
  );
}
