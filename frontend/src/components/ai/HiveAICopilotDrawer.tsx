'use client';
// ─── Hive AI Contextual Intelligence Drawer (Global Copilot) ─────────────────
// Activated via contextual triggers or Ctrl+J. Frosted slide-over drawer with quick shortcuts.

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Sparkles, MessageSquare, Wrench, Activity, Layers } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/lib/store';
import { HiveAIAvatar } from './HiveAIIcon';
import { HiveAIContextRail } from './HiveAIContextRail';
import { HiveAIMessage } from './HiveAIMessage';
import { HiveAIThinking } from './HiveAIThinking';
import { HiveAIEmptyState, HiveAIError } from './HiveAIEmptyState';
import { HiveAIComposer } from './HiveAIComposer';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType, HiveAIMessageItem } from '@/types';

const QUICK_SHORTCUTS: Array<{ label: string; cap: HiveAICapabilityType; icon: any }> = [
  { label: 'Explain', cap: 'copilot_chat', icon: MessageSquare },
  { label: 'Refactor', cap: 'code_assistant', icon: Wrench },
  { label: 'Health Check', cap: 'project_health', icon: Activity },
  { label: 'Architecture', cap: 'architecture_design', icon: Layers },
];

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
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCopilotOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg h-full surface-floating backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-muted/20 shrink-0">
              <div className="flex items-center gap-2.5">
                <HiveAIAvatar size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm tracking-tight text-foreground">Hive Copilot</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
                      v2.4
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">Contextual Engineering Intelligence</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href="/generator"
                  onClick={() => setCopilotOpen(false)}
                  title="Open Full AI Studio"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground tap-press transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setCopilotOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground tap-press transition-colors cursor-pointer"
                  aria-label="Close copilot drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Capability Shortcuts Header Row */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 overflow-x-auto no-scrollbar bg-muted/10 shrink-0">
              {QUICK_SHORTCUTS.map(({ label, cap, icon: Icon }) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCapability(cap)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-press cursor-pointer',
                    capability === cap
                      ? 'bg-primary text-primary-foreground shadow-xs glow-primary'
                      : 'surface-glass text-muted-foreground hover:text-foreground border border-white/10'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
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

            {/* Floating Composer at Bottom */}
            <div className="p-2 border-t border-white/10 bg-transparent shrink-0">
              <HiveAIComposer
                onSend={handleSend}
                isProcessing={loading}
                activeCapability={capability}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
