'use client';
// ─── Hive AI Message Component ──────────────────────────────────────────────
// High-density markdown message with code fences, copy buttons, and TTS audio

import { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, Sparkles, User as UserIcon } from 'lucide-react';
import { voiceEngine } from '@/lib/voiceEngine';
import { cn } from '@/lib/utils';
import type { HiveAIMessageItem } from '@/types';

interface HiveAIMessageProps {
  message: HiveAIMessageItem;
  className?: string;
}

export function HiveAIMessage({ message, className }: HiveAIMessageProps) {
  const isAssistant = message.role === 'assistant';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const copySnippet = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      voiceEngine.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    voiceEngine.speak(message.content, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Split content by code fences ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCount = 0;

  while ((match = codeBlockRegex.exec(message.content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: message.content.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2].trim(),
      index: blockCount++,
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < message.content.length) {
    parts.push({ type: 'text', content: message.content.substring(lastIndex) });
  }

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 rounded-2xl transition-colors',
        isAssistant
          ? 'bg-card border border-border/70 shadow-xs'
          : 'bg-muted/40 border border-border/40 ml-4 sm:ml-12',
        className
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner select-none',
          isAssistant
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
            : 'bg-primary/10 text-primary border border-primary/20'
        )}
      >
        {isAssistant ? <Sparkles className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-foreground">
              {isAssistant ? 'Hive AI' : 'You'}
            </span>
            {message.model && isAssistant && (
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted/60">
                {message.model}
              </span>
            )}
          </div>

          {/* Action Tools */}
          {isAssistant && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={toggleSpeech}
                title={isSpeaking ? 'Mute speech' : 'Read aloud'}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Attachment Thumbnail if present */}
        {message.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border/80 max-w-sm max-h-56 bg-neutral-950 my-1">
            <img src={message.imageUrl} alt="Context Attachment" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Formatted Content */}
        <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-foreground/90">
          {parts.map((part, idx) => {
            if (part.type === 'code') {
              return (
                <div key={idx} className="rounded-xl overflow-hidden border border-border/80 bg-neutral-950 my-2.5 shadow-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                    <span className="uppercase font-semibold tracking-wider text-[10px]">{part.lang}</span>
                    <button
                      type="button"
                      onClick={() => copySnippet(part.content, part.index ?? idx)}
                      className="flex items-center gap-1 hover:text-white transition-colors p-1"
                    >
                      {copiedCodeIndex === part.index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre leading-normal">
                    <code>{part.content}</code>
                  </pre>
                </div>
              );
            }

            return (
              <div key={idx} className="whitespace-pre-wrap break-words">
                {part.content
                  .split('\n')
                  .map((line, lIdx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={lIdx} className="font-bold text-sm text-foreground mt-3 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={lIdx} className="font-bold text-base text-foreground mt-3 mb-1">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-1.5 ml-2 my-0.5">
                          <span className="text-primary font-bold text-xs shrink-0">•</span>
                          <span>{line.replace(/^[-*]\s+/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={lIdx} className={line.trim() ? 'my-1' : 'h-1.5'}>{line}</p>;
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
