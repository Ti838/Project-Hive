'use client';
// ─── Hive AI Composer Component ─────────────────────────────────────────────
// Central prompt composer with voice dictation, screenshot paste & file attachment

import { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, MicOff, Paperclip, Image as ImageIcon,
  X, Loader2, Sparkles, ArrowUp
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
}

export function HiveAIComposer({
  onSend,
  isProcessing = false,
  activeCapability,
  placeholder,
  className,
}: HiveAIComposerProps) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Clipboard Paste Support (Ctrl+V image screenshot)
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
    : 'Ask Hive AI or paste code / screenshots (Ctrl+V)…';

  return (
    <div className={cn('p-3 sm:p-4 border-t border-border/80 bg-card/70 backdrop-blur-md space-y-2', className)}>
      {/* Attached Image Preview */}
      {imagePreview && (
        <div className="relative inline-block rounded-xl overflow-hidden border border-primary/40 max-h-24 max-w-xs shadow-xs">
          <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="relative flex items-end gap-2 bg-muted/60 border border-border/70 focus-within:border-primary/50 focus-within:bg-card rounded-2xl p-2 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 bg-transparent text-xs sm:text-sm px-2.5 py-1.5 focus:outline-none resize-none max-h-40 scrollbar-none leading-relaxed"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 pb-0.5">
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
            title="Attach screenshot or diagram"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop recording voice' : 'Dictate with voice'}
            className={cn(
              'p-2 rounded-xl transition-colors',
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || (!input.trim() && !imagePreview)}
            className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shadow-xs active:scale-95 shrink-0"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
