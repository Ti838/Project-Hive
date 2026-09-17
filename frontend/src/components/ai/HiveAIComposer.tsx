'use client';
// â”€â”€â”€ Hive AI Composer Component (Google Gemini & Raycast Floating Studio) â”€â”€â”€â”€â”€â”€â”€
// Central prompt composer with voice waveform dictation & screenshot paste

import { useState, useRef, useEffect } from 'react';
import {
  ArrowUp, Mic, MicOff, Image as ImageIcon,
  X, Loader2, Sparkles
} from 'lucide-react';
import { voiceEngine } from '@/lib/voiceEngine';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

interface HiveAIComposerProps {
  onSend: (prompt: string, imageBase64?: string, tier?: 'Turbo' | 'Pro' | 'Ultra') => void;
  isProcessing?: boolean;
  activeCapability: HiveAICapabilityType;
  onSelectCapability?: (cap: HiveAICapabilityType) => void;
  placeholder?: string;
  className?: string;
}

export function HiveAIComposer({
  onSend,
  isProcessing = false,
  activeCapability,
  onSelectCapability,
  placeholder,
  className,
}: HiveAIComposerProps) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeTier, setActiveTier] = useState<'Turbo' | 'Pro' | 'Ultra'>('Pro');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea smoothly without scrollbars
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Clean up any active voice listening session on unmount
  useEffect(() => {
    return () => {
      voiceEngine.stopListening();
    };
  }, []);

  // Clipboard Paste Support (Ctrl+V screenshot / diagram)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setImagePreview(ev.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImagePreview(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleListening = () => {
    if (isListening) {
      voiceEngine.stopListening();
      setIsListening(false);
      return;
    }

    const started = voiceEngine.startListening({
      onTranscript: (transcript) => {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false),
    });

    if (started) setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isProcessing) return;
    if (!input.trim() && !imagePreview) return;

    onSend(input.trim(), imagePreview || undefined, activeTier);
    setInput('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const cycleTier = () => {
    const tiers: Array<'Turbo' | 'Pro' | 'Ultra'> = ['Turbo', 'Pro', 'Ultra'];
    const nextIdx = (tiers.indexOf(activeTier) + 1) % tiers.length;
    setActiveTier(tiers[nextIdx]);
  };

  const defaultPlaceholder = activeCapability === 'project_generator'
    ? 'Describe your project idea, domain or MVP goalsâ€¦'
    : activeCapability === 'idea_analyzer'
    ? 'Paste your project concept to analyze novelty, market fit & feasibilityâ€¦'
    : activeCapability === 'copilot_chat'
    ? 'Ask Hive AI or paste code & screenshots (Ctrl+V)â€¦'
    : activeCapability === 'project_critic'
    ? 'Paste your architecture or code to receive rigorous reviewâ€¦'
    : activeCapability === 'documentation_ai'
    ? 'Describe project components to generate README & API docsâ€¦'
    : activeCapability === 'code_assistant'
    ? 'Paste code or debug challengeâ€¦'
    : activeCapability === 'architecture_design'
    ? 'Describe system architecture, database schema, or cache requirementsâ€¦'
    : 'Ask Hive AI or paste code & screenshots (Ctrl+V)â€¦';

  return (
    <div className={cn('p-3 sm:p-4 bg-transparent shrink-0 max-w-3xl mx-auto w-full', className)}>
      {/* Floating Frosted Pill Container */}
      <div className="surface-floating rounded-2xl sm:rounded-3xl border border-foreground/10 shadow-2xl p-2.5 sm:p-3.5 space-y-2 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 backdrop-blur-2xl">
        {/* Attached Image Preview Pill */}
        {imagePreview && (
          <div className="surface-glass relative inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-foreground/15 shadow-xl max-w-xs group animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-background/60 shrink-0 border border-foreground/10">
              <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">Screenshot Attached</p>
              <p className="text-[10px] text-muted-foreground">Ready for multimodal analysis</p>
            </div>
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="p-1 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors tap-press"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative flex items-start">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            placeholder={placeholder || defaultPlaceholder}
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-none max-h-44 scrollbar-none leading-relaxed tracking-tight px-1 py-1"
          />
        </div>

        {/* Bottom Tooling Bar & Actions */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-foreground/5">
          {/* Left: 1-Click Engine Cycle Badge, Attachments & Voice */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Single 1-Click Engine Toggle */}
            <button
              type="button"
              onClick={cycleTier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/40 text-foreground transition-all tap-press cursor-pointer shrink-0 group select-none shadow-xs"
              title="Click to toggle engine: Turbo âž” Pro âž” Ultra"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">Engine:</span>
              <span className="font-extrabold text-primary">Hive {activeTier}</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground">â–¾</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelectImage}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach screenshot or diagram (Ctrl+V)"
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/10 tap-press transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Voice Dictation Button */}
            {isListening ? (
              <button
                type="button"
                onClick={toggleListening}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-medium animate-pulse tap-press cursor-pointer"
                title="Stop recording voice"
              >
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-bold">Listeningâ€¦</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleListening}
                title="Dictate with voice"
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/10 tap-press transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Circular Tactile Send Button */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden md:inline select-none">
              Shift + â†µ for newline
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || (!input.trim() && !imagePreview)}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none transition-all glow-primary tap-press shadow-md shadow-primary/20 shrink-0 cursor-pointer"
              aria-label="Send prompt"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

