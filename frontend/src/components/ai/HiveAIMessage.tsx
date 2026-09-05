'use client';
// ─── Hive AI Message Component (Obsidian Code Blocks & Refined Typography) ───────

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
        'group flex gap-3.5 transition-all',
        isAssistant
          ? 'surface-glass p-5 rounded-3xl border border-white/10 shadow-sm leading-relaxed tracking-tight'
          : 'bg-primary/10 border border-primary/20 p-4 rounded-2xl ml-auto max-w-[85%] sm:max-w-[78%]',
        className
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner select-none mt-0.5',
          isAssistant
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25 glow-primary'
            : 'bg-primary text-primary-foreground shadow-xs'
        )}
      >
        {isAssistant ? <Sparkles className="w-4 h-4 text-amber-400" /> : <UserIcon className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-foreground tracking-tight">
              {isAssistant ? 'Hive AI' : 'You'}
            </span>
            {message.model && isAssistant && (
              <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
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
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground tap-press transition-colors cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Attachment Thumbnail if present */}
        {message.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/15 max-w-sm max-h-56 bg-zinc-950 my-1 shadow-lg">
            <img src={message.imageUrl} alt="Context Attachment" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Formatted Content */}
        <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-foreground/95 tracking-tight">
          {parts.map((part, idx) => {
            if (part.type === 'code') {
              const lineCount = part.content.split('\n').length;
              const approxTokens = Math.round(part.content.length / 4);

              return (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 my-3.5 shadow-2xl"
                >
                  {/* Obsidian Code Header Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 select-none">
                    <div className="flex items-center gap-2">
                      <span className="uppercase font-bold tracking-wider text-[10px] text-primary">
                        {part.lang || 'code'}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-500 font-sans">
                        {lineCount} {lineCount === 1 ? 'line' : 'lines'} (~{approxTokens} tokens)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copySnippet(part.content, part.index ?? idx)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors px-2 py-0.5 rounded-md hover:bg-zinc-800 text-zinc-400 tap-press cursor-pointer"
                    >
                      {copiedCodeIndex === part.index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Preformatted Block */}
                  <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
                    <code>{part.content}</code>
                  </pre>
                </div>
              );
            }

            return (
              <div key={idx} className="whitespace-pre-wrap break-words space-y-1">
                {part.content
                  .split('\n')
                  .map((line, lIdx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={lIdx} className="font-bold text-sm text-foreground mt-3 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={lIdx} className="font-bold text-base text-foreground mt-3.5 mb-1.5">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-2 ml-2 my-0.5">
                          <span className="text-primary font-bold text-xs shrink-0 mt-0.5">•</span>
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
