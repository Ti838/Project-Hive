'use client';
// ─── HiveMind AI — Multimodal Senior Engineering Copilot ───────────────────────
// Powered by Groq Llama-3.3-70b / Qwen + Gemini 2.0 Flash Vision + Web Speech API

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon,
  Copy, Check, RefreshCw, Terminal, Database, Lightbulb, Bug, ChevronDown,
  Paperclip, Loader2, Code2, Play, Pause, ExternalLink, FileText, ZoomIn
} from 'lucide-react';
import { api } from '@/lib/api';
import { voiceEngine } from '@/lib/voiceEngine';
import { cn } from '@/lib/utils';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  provider?: 'groq' | 'gemini' | 'openrouter' | string;
  model?: string;
  timestamp: string;
}

const QUICK_ACTIONS = [
  {
    icon: Lightbulb,
    label: 'Polish Pitch',
    prompt: 'Polish and rewrite my project description into a high-impact, professional LinkedIn and portfolio showcase pitch.',
  },
  {
    icon: Bug,
    label: 'Debug Code',
    prompt: 'Debug this code snippet. Identify root causes, potential edge cases, and provide complete corrected code: ',
  },
  {
    icon: Database,
    label: 'SQL Schema',
    prompt: 'Design a clean, production-grade PostgreSQL/Supabase schema with primary keys, UUIDs, foreign keys, timestamps, indexes, and Row Level Security (RLS) policies for: ',
  },
  {
    icon: FileText,
    label: 'Readme Gen',
    prompt: 'Generate a comprehensive, production-standard GitHub README markdown for a modern full-stack web project with badges, architecture overview, installation guide, and API documentation.',
  },
];


// ── Markdown & Code Block Formatter Component ──────────────────────────────────
function FormattedMessage({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code fences ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCount = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2].trim(),
      index: blockCount++,
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <div key={idx} className="rounded-xl overflow-hidden border border-border/80 bg-neutral-950 my-2 shadow-xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <span className="uppercase font-semibold tracking-wider text-[10px]">{part.lang}</span>
                <button
                  type="button"
                  onClick={() => copyCode(part.content, part.index ?? idx)}
                  className="flex items-center gap-1 hover:text-white transition-colors p-1"
                  title="Copy code snippet"
                >
                  {copiedIndex === part.index ? (
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

        // Standard text rendering with bold and bullet recognition
        return (
          <div key={idx} className="whitespace-pre-wrap break-words">
            {part.content
              .split('\n')
              .map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return <h4 key={lIdx} className="font-bold text-sm text-foreground mt-2 mb-1">{line.replace('### ', '')}</h4>;
                }
                if (line.startsWith('## ')) {
                  return <h3 key={lIdx} className="font-bold text-base text-foreground mt-2 mb-1">{line.replace('## ', '')}</h3>;
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
  );
}

// ─── Main HiveMind Copilot Floating Workstation ────────────────────────────────
export function HiveMindCopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<'groq' | 'gemini' | 'openrouter'>('groq');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); // message id currently reading
  const [autoSpeech, setAutoSpeech] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
              setActiveModel('gemini'); // Vision default
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
        setActiveModel('gemini');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice Dictation (STT)
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
      onError: (err) => {
        console.warn('Voice STT error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (started) setIsListening(true);
  };

  // Text-To-Speech (TTS)
  const toggleSpeakMessage = (msgId: string, text: string) => {
    if (isSpeaking === msgId) {
      voiceEngine.stopSpeaking();
      setIsSpeaking(null);
      return;
    }

    voiceEngine.speak(text, {
      onStart: () => setIsSpeaking(msgId),
      onEnd: () => setIsSpeaking(null),
      onError: () => setIsSpeaking(null),
    });
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if ((!textToSend && !imagePreview) || loading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      imageUrl: imagePreview || undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = imagePreview;
    setImagePreview(null);
    setLoading(true);

    try {
      const res = await api.ai.chat(textToSend, currentImage || undefined, {
        currentRoute: pathname,
      });

      if (res.ok && res.reply) {
        const assistantMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          provider: res.provider || (currentImage ? 'gemini' : 'groq'),
          model: res.model,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (res.provider === 'openrouter') {
          setActiveModel('openrouter');
        } else if (res.provider === 'gemini') {
          setActiveModel('gemini');
        } else {
          setActiveModel('groq');
        }

        // Auto read aloud if enabled
        if (autoSpeech) {
          toggleSpeakMessage(assistantMsg.id, res.reply);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: '⚠️ HiveMind was unable to complete your request. Please ensure `GROQ_API_KEY`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY` is configured in the server environment.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error communicating with AI: ${err?.message || 'Network error'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Launcher Trigger Button with Gradient Glow Ring ─────── */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative group flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md transition-all border min-h-[44px]',
            isOpen
              ? 'bg-primary text-primary-foreground border-primary/40 shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
              : 'bg-card/90 text-foreground border-border/80 hover:border-primary/50 shadow-black/20 hover:shadow-primary/20 ring-1 ring-primary/20'
          )}
          title="Open HiveMind Engineering Copilot"
        >
          {/* Subtle gradient glow ring */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs -z-10" />
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-bold text-xs tracking-wide">HiveMind AI</span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground hidden sm:inline">
            Copilot
          </span>
        </motion.button>
      </div>

      {/* ── Expandable Workstation Window ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 w-full h-[88dvh] max-h-[88dvh] rounded-t-3xl rounded-b-none border-t border-x border-border/80 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[440px] sm:h-[600px] sm:max-h-[calc(100dvh-6rem)] sm:rounded-3xl sm:border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Mobile Drag/Grab Handle Indicator */}
            <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0 bg-muted/40">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-border/70 bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-white shadow-xs shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-foreground truncate">HiveMind Copilot</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium truncate">
                      {activeModel === 'gemini'
                        ? '👁️ Gemini Vision'
                        : activeModel === 'openrouter'
                        ? '🌐 OpenRouter Free'
                        : '⚡ Groq Ultra Fast'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoSpeech(!autoSpeech)}
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    autoSpeech ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground'
                  )}
                  title={autoSpeech ? 'Auto-speak enabled (Audio On)' : 'Auto-speak disabled'}
                >
                  {autoSpeech ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => handleSend(qa.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/80 border border-border/70 hover:border-primary/40 text-[11px] font-semibold text-foreground/90 hover:text-primary whitespace-nowrap transition-colors tap-press"
                  >
                    <Icon className="w-3 h-3 text-primary" />
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Stream Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">Welcome to HiveMind</p>
                    <p className="text-xs max-w-xs leading-relaxed">
                      Your multimodal engineering pair programmer. Paste code bugs, drag screenshots (Ctrl+V), or tap the mic to brainstorm architectures.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                      Page Context: {pathname}
                    </span>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.role === 'user';
                  return (
                    <div key={msg.id} className={cn('flex flex-col space-y-1', isMe ? 'items-end' : 'items-start')}>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                        <span>{isMe ? 'You' : 'HiveMind'}</span>
                        {msg.provider && (
                          <span className="font-mono text-[9px] uppercase px-1 rounded bg-muted">
                            {msg.provider}
                          </span>
                        )}
                      </div>

                      {/* Image Attachment Thumbnail with Zoom */}
                      {msg.imageUrl && (
                        <div
                          onClick={() => setZoomedImage(msg.imageUrl || null)}
                          className="group relative mb-1 rounded-xl overflow-hidden border border-border max-w-[240px] cursor-pointer"
                        >
                          <img src={msg.imageUrl} alt="Uploaded attachment" className="object-cover max-h-48 transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      <div
                        className={cn(
                          'p-3.5 rounded-2xl max-w-[85%] shadow-xs break-words',
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border border-border/80 text-foreground rounded-bl-none'
                        )}
                      >
                        {isMe ? (
                          <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormattedMessage text={msg.content} />
                        )}
                      </div>

                      {/* Assistant Audio Readout Controls */}
                      {!isMe && (
                        <div className="flex items-center gap-1 px-1">
                          <button
                            type="button"
                            onClick={() => toggleSpeakMessage(msg.id, msg.content)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-0.5 transition-colors"
                          >
                            {isSpeaking === msg.id ? (
                              <>
                                <Pause className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-primary font-semibold">Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Read Aloud</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-card border border-border max-w-[70%] text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Synthesizing engineering solution…</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Staged Image Attachment Preview with Zoom */}
            {imagePreview && (
              <div className="px-4 py-2 bg-muted/80 border-t border-border flex items-center justify-between shrink-0">
                <div
                  onClick={() => setZoomedImage(imagePreview)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="relative">
                    <img src={imagePreview} alt="Screenshot" className="w-10 h-10 rounded-lg object-cover border border-border" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity text-white">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                    Image staged for Vision Analysis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Multimodal Composer Dock */}
            <div className="p-3 border-t border-border/80 bg-card shrink-0">
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectImage}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Upload Diagram / Screenshot (or Ctrl+V paste)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    'p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all shrink-0',
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  title={isListening ? 'Listening (Click to stop)' : 'Voice Dictation'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening to speech…'
                      : imagePreview
                      ? 'Ask about this diagram/image…'
                      : 'Ask HiveMind or paste screenshot (Ctrl+V)…'
                  }
                  className="flex-1 bg-muted/60 text-base sm:text-sm rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none resize-none max-h-24 leading-normal transition-colors"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !imagePreview) || loading}
                  className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-all shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Zoom Modal for Diagrams & Screenshots ───────────────────────── */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-card border border-border rounded-3xl overflow-hidden shadow-2xl p-2"
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white z-10 transition-colors shadow-md"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={zoomedImage}
                alt="Enlarged Diagram / Screenshot"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
