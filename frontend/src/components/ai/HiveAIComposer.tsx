'use client';
// ─── Hive AI Composer Component (Google Gemini & Raycast Floating Studio) ───────
// Central prompt composer with voice waveform dictation, screenshot paste & frosted badges

import { useState, useRef, useEffect } from 'react';
import {
  ArrowUp, Mic, MicOff, Image as ImageIcon,
  X, Loader2, Sparkles, Layers
} from 'lucide-react';
import { voiceEngine } from '@/lib/voiceEngine';
import { cn } from '@/lib/utils';
import type { HiveAICapabilityType } from '@/types';

interface HiveAIComposerProps {
  onSend: (prompt: string, imageBase64?: string) => void;
  isProcessing?: boolean;
  activeCapability: HiveAICapabilityType;
  placeholder?: string;
  className?: string;
  selectedProvider?: string;
  onSelectProvider?: (provider: string) => void;
}

export function HiveAIComposer({
  onSend,
  isProcessing = false,
  activeCapability,
  placeholder,
  className,
  selectedProvider = 'Groq Cloud',
  onSelectProvider,
}: HiveAIComposerProps) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeTier, setActiveTier] = useState<'Groq' | 'Gemini' | 'OpenRouter'>('Groq');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea smoothly without scrollbars
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

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

    onSend(input.trim(), imagePreview || undefined);
    setInput('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const cycleTier = () => {
    const tiers: Array<'Groq' | 'Gemini' | 'OpenRouter'> = ['Groq', 'Gemini', 'OpenRouter'];
    const nextIdx = (tiers.indexOf(activeTier) + 1) % tiers.length;
    const next = tiers[nextIdx];
    setActiveTier(next);
    onSelectProvider?.(next);
  };

  const defaultPlaceholder = activeCapability === 'project_generator'
    ? 'Describe your project idea, target audience, or requirements…'
    : activeCapability === 'idea_analyzer'
    ? 'Paste your project concept to analyze market fit & feasibility…'
    : activeCapability === 'project_critic'
    ? 'Paste your architecture or code to receive rigorous review…'
    : activeCapability === 'documentation_ai'
    ? 'Describe project components to generate README & API docs…'
    : activeCapability === 'code_assistant'
    ? 'Paste code or describe error to debug & write tests…'
    : activeCapability === 'architecture_design'
    ? 'Describe system architecture, database schema, or cache requirements…'
    : 'Ask Hive AI or paste code & screenshots (Ctrl+V)…';

  return (
    <div className={cn('p-2.5 sm:p-4 bg-transparent', className)}>
      {/* Floating Frosted Pill Container */}
      <div className="surface-floating rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl p-2.5 sm:p-3.5 space-y-2 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 backdrop-blur-2xl">
        {/* Attached Image Preview Pill */}
        {imagePreview && (
          <div className="surface-glass relative inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-white/15 shadow-xl max-w-xs group animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
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
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          {/* Left: Attachments, Voice Dictation, and Provider Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 tap-press transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Voice Dictation Button & Dynamic Waveform Badge */}
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
                <span className="text-[10px] font-bold">Listening…</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleListening}
                title="Dictate with voice"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 tap-press transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Frosted Model / Provider Chip */}
            <button
              type="button"
              onClick={cycleTier}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium surface-glass border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/40 tap-press transition-all cursor-pointer"
              title="Click to toggle AI inference tier"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tier:</span>
              <span className="text-foreground font-semibold">{activeTier}</span>
            </button>
          </div>

          {/* Right: Circular Tactile Send Button with Gradient Glow */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden md:inline select-none">
              Shift + ↵ for new line
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || (!input.trim() && !imagePreview)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none transition-all glow-primary tap-press shadow-lg shadow-primary/30 shrink-0 cursor-pointer"
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
