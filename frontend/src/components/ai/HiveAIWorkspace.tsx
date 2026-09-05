'use client';
// ─── Hive AI Workspace Component (Studio-Grade Intelligence Canvas) ─────────────
// Features responsive artifact split-pane, obsidian code blocks & Gemini-style ergonomics

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Layers, SplitSquareVertical, MessageSquare,
  FileCode, Download, Copy, Check, ChevronRight, X
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
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Llama-3.3-70B');
  const [activeProvider, setActiveProvider] = useState('Groq Cloud');
  const [activeTab, setActiveTab] = useState<'chat' | 'artifacts'>('chat');
  const [splitPaneEnabled, setSplitPaneEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set default selected artifact when new artifact arrives
  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(artifacts[0].id);
    }
  }, [artifacts, selectedArtifactId]);

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
          capability === 'architecture_design' ||
          capability === 'code_assistant'
        ) {
          const newArtifact: HiveAIArtifactData = {
            id: `art-${Date.now()}`,
            title: `${capability.replace(/_/g, ' ').toUpperCase()} Artifact`,
            type: capability === 'documentation_ai' ? 'docs' : 'blueprint',
            content: res.output,
            capability,
            tags: ['AI-Generated', capability],
            createdAt: new Date().toISOString(),
          };
          setArtifacts((prev) => [newArtifact, ...prev]);
          setSelectedArtifactId(newArtifact.id);
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
    setSelectedArtifactId(null);
    setError(null);
  };

  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId) || artifacts[0];

  return (
    <div className={cn(
      'flex flex-col h-full min-h-[680px] rounded-3xl border border-border/80 surface-overlay overflow-hidden shadow-2xl backdrop-blur-2xl',
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

      {/* ── Responsive Viewport Switcher Controls (when artifacts exist) ──── */}
      {artifacts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/60 text-xs">
          {/* Mobile Tab Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-white/10 lg:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all tap-press cursor-pointer',
                activeTab === 'chat'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Conversation ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('artifacts')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all tap-press cursor-pointer flex items-center gap-1',
                activeTab === 'artifacts'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Artifacts ({artifacts.length})</span>
            </button>
          </div>

          {/* Desktop Split-Pane Toggle */}
          <div className="hidden lg:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Workspace Studio · {artifacts.length} live artifact{artifacts.length === 1 ? '' : 's'}</span>
            </div>

            <button
              type="button"
              onClick={() => setSplitPaneEnabled((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg surface-glass text-[11px] font-semibold text-foreground hover:border-primary/40 tap-press transition-all cursor-pointer"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-primary" />
              <span>{splitPaneEnabled ? 'Single Pane' : 'Split Studio Canvas'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Workspace Body (Responsive Split-Pane) ───────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Left Column: Chat Thread & Floating Composer */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden',
            artifacts.length > 0 && activeTab === 'artifacts' && 'hidden lg:flex'
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <HiveAIEmptyState
                capability={capability}
                onSelectPrompt={(p) => handleSend(p)}
              />
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto w-full">
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

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Floating Composer at Bottom */}
          <HiveAIComposer
            onSend={handleSend}
            isProcessing={loading}
            activeCapability={capability}
            selectedProvider={activeProvider}
            onSelectProvider={(p) => setActiveProvider(p)}
          />
        </div>

        {/* Right Column: Live Artifact Canvas (when artifacts exist and split is active) */}
        {artifacts.length > 0 && (
          <div
            className={cn(
              'w-full flex-col min-h-0 surface-glass backdrop-blur-2xl overflow-hidden',
              splitPaneEnabled ? 'lg:w-[48%] lg:border-l lg:border-white/10 lg:flex' : 'hidden',
              activeTab === 'artifacts' ? 'flex' : 'hidden lg:flex'
            )}
          >
            {/* Artifact Toolbar */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 bg-muted/10 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {artifacts.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setSelectedArtifactId(art.id)}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tap-press cursor-pointer flex items-center gap-1.5',
                      selectedArtifact?.id === art.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{art.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Artifact Full Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {selectedArtifact && (
                <HiveAIArtifact
                  key={selectedArtifact.id}
                  artifact={selectedArtifact}
                  className="border-0 shadow-none bg-transparent"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
