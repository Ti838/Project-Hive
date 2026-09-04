'use client';
// ─── Hive AI Workspace Component ────────────────────────────────────────────
// The centralized, full-scale intelligence studio for ProjectHive

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderKanban, Layers, Bot, Download,
  Bookmark, Check, Copy, RefreshCw, Star, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { HiveAIHeader } from './HiveAIHeader';
import { HiveAICapabilities } from './HiveAICapabilities';
import { HiveAIContextRail } from './HiveAIContextRail';
import { HiveAIMessage } from './HiveAIMessage';
import { HiveAIArtifact } from './HiveAIArtifact';
import { HiveAIThinking } from './HiveAIThinking';
import { HiveAIEmptyState, HiveAIError } from './HiveAIEmptyState';
import { HiveAIComposer } from './HiveAIComposer';
import { cn } from '@/lib/utils';
import type {
  HiveAICapabilityType,
  HiveAIMessageItem,
  HiveAIArtifactData,
  HiveAIContext
} from '@/types';

interface HiveAIWorkspaceProps {
  initialCapability?: HiveAICapabilityType;
  context?: HiveAIContext;
  className?: string;
}

export function HiveAIWorkspace({
  initialCapability = 'project_generator',
  context = {},
  className,
}: HiveAIWorkspaceProps) {
  const { user } = useAuthStore();
  const [capability, setCapability] = useState<HiveAICapabilityType>(initialCapability);
  const [messages, setMessages] = useState<HiveAIMessageItem[]>([]);
  const [artifacts, setArtifacts] = useState<HiveAIArtifactData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Llama-3.3-70B');
  const [activeProvider, setActiveProvider] = useState('Groq Cloud');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (promptText: string, imageBase64?: string) => {
    if (!promptText && !imageBase64) return;
    setError(null);
    setLoading(true);

    const userMessage: HiveAIMessageItem = {
      id: `usr-${Date.now()}`,
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
          ...context,
          userId: user?.id,
        },
        imageBase64,
      });

      if (res.ok && res.output) {
        if (res.model) setActiveModel(res.model);
        if (res.provider) setActiveProvider(res.provider);

        const assistantMessage: HiveAIMessageItem = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.output,
          capability,
          provider: res.provider,
          model: res.model,
          timestamp: res.timestamp || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Auto-extract structured artifact if output is a blueprint, doc, or schema
        if (
          capability === 'project_generator' ||
          capability === 'documentation_ai' ||
          capability === 'architecture_design'
        ) {
          const newArtifact: HiveAIArtifactData = {
            id: `art-${Date.now()}`,
            title: `${capability.replace(/_/g, ' ').toUpperCase()} Blueprint`,
            type: capability === 'documentation_ai' ? 'docs' : 'blueprint',
            content: res.output,
            capability,
            tags: ['AI-Generated', capability],
            createdAt: new Date().toISOString(),
          };
          setArtifacts((prev) => [newArtifact, ...prev]);
        }
      } else {
        setError(res.error || 'Hive AI service could not complete the request.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error communicating with Hive AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setArtifacts([]);
    setError(null);
  };

  return (
    <div className={cn(
      'flex flex-col h-full min-h-[680px] rounded-3xl border border-border/80 bg-card overflow-hidden shadow-md',
      className
    )}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <HiveAIHeader
        activeCapability={capability}
        modelName={activeModel}
        providerName={activeProvider}
        isProcessing={loading}
        onClearSession={messages.length > 0 ? handleClear : undefined}
      />

      {/* ── Mode Switcher & Context Rail ─────────────────────── */}
      <div className="border-b border-border/70 bg-card/40 px-3 sm:px-6">
        <HiveAICapabilities
          activeCapability={capability}
          onSelectCapability={(cap) => {
            setCapability(cap);
            setError(null);
          }}
        />
      </div>

      <HiveAIContextRail context={context} />

      {/* ── Main Workspace Body ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <HiveAIEmptyState
            capability={capability}
            onSelectPrompt={(p) => handleSend(p)}
          />
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((msg) => (
              <HiveAIMessage key={msg.id} message={msg} />
            ))}

            {loading && <HiveAIThinking />}

            {error && (
              <HiveAIError
                message={error}
                onRetry={() => {
                  const lastUser = messages.filter((m) => m.role === 'user').pop();
                  if (lastUser) handleSend(lastUser.content, lastUser.imageUrl);
                }}
              />
            )}

            {/* Generated Artifacts Shelf */}
            {artifacts.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Generated AI Artifacts ({artifacts.length})</span>
                </div>
                <div className="grid gap-3">
                  {artifacts.map((art) => (
                    <HiveAIArtifact key={art.id} artifact={art} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Bottom Composer ─────────────────────────────────── */}
      <HiveAIComposer
        onSend={handleSend}
        isProcessing={loading}
        activeCapability={capability}
      />
    </div>
  );
}

