'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ImagePlus, Code2, BarChart2, Sparkles, Send,
  Trophy, Users2, Trash2, Plus, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Post } from '@/types';

interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (post: Post) => void;
}

type TabType = 'update' | 'media' | 'code' | 'poll';

const CODE_LANGUAGES = [
  'typescript', 'javascript', 'python', 'cpp', 'c', 'go', 'rust', 'java', 'sql', 'bash', 'json', 'html', 'css'
];

export function PostComposerModal({ isOpen, onClose, onCreated }: PostComposerModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('update');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'general' | 'achievement' | 'looking_for_team'>('general');

  // Media Tab State
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Code Tab State
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeTitle, setCodeTitle] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');

  // Poll Tab State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [pollDays, setPollDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
    }
  };

  const handleUpdatePollOption = (index: number, val: string) => {
    setPollOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && activeTab === 'update') {
      setError('Please write something to share.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        content: trimmed || (activeTab === 'code' ? 'Shared a code snippet' : activeTab === 'poll' ? (pollQuestion.trim() || 'Participate in this poll') : 'Shared attachments'),
        postType: activeTab === 'poll' ? 'poll' : postType,
        mediaUrls: images,
      };

      if (codeSnippet.trim()) {
        payload.codeSnippet = {
          code: codeSnippet.trim(),
          language: codeLanguage,
          title: codeTitle.trim() || undefined,
        };
      }

      if (activeTab === 'poll') {
        payload.pollData = {
          question: pollQuestion.trim() || trimmed,
          options: pollOptions.map((text, idx) => ({
            id: `opt_${idx + 1}`,
            text: text.trim() || `Option ${idx + 1}`,
            votes: [],
          })),
          expiresAt: new Date(Date.now() + pollDays * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const res = await api.posts.create(payload);
      if (res.ok && res.post) {
        onCreated(res.post);
        onClose();
        // Reset state
        setContent('');
        setImages([]);
        setCodeSnippet('');
        setCodeTitle('');
        setPollQuestion('');
        setPollOptions(['Option 1', 'Option 2']);
        setActiveTab('update');
        setPostType('general');
      } else {
        setError(res.error || 'Failed to create post. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while creating post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-xl bg-card border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="md" />
            <div>
              <p className="font-bold text-sm sm:text-base leading-tight text-foreground">
                {displayName(user)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => setPostType('general')}
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer',
                    postType === 'general' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'
                  )}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('achievement')}
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer',
                    postType === 'achievement' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Trophy className="w-3 h-3" /> Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('looking_for_team')}
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer',
                    postType === 'looking_for_team' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Users2 className="w-3 h-3" /> Teammates
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/5 px-4 bg-muted/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'update' as TabType, label: 'Post', icon: Sparkles },
            { id: 'media' as TabType, label: `Photos (${images.length})`, icon: ImagePlus },
            { id: 'code' as TabType, label: 'Code', icon: Code2 },
            { id: 'poll' as TabType, label: 'Poll', icon: BarChart2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer',
                activeTab === id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {error && (
            <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeTab === 'code'
                ? 'Describe what this code does or what problem it solves…'
                : activeTab === 'poll'
                ? 'Introduce your poll or ask a question to campus…'
                : 'What are you working on? Share project updates, wins, or ideas…'
            }
            rows={4}
            className="w-full text-sm sm:text-base bg-transparent border-none focus:outline-none resize-none placeholder:text-muted-foreground/60 leading-relaxed"
            autoFocus
          />

          {/* Tab 2: Media Grid & Uploader */}
          {activeTab === 'media' && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Upload images (PNG, JPG, WebP)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 tap-press transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Images
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-white/10">
                      <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-white hover:bg-destructive tap-press transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Code Snippet Form */}
          {activeTab === 'code' && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  placeholder="Snippet Title (e.g. Auth Middleware, QuickSort)"
                  className="flex-1 h-9 text-xs bg-muted/80 rounded-xl px-3 border border-white/10 focus:border-primary/50 focus:outline-none"
                />
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="h-9 text-xs bg-muted/80 rounded-xl px-3 border border-white/10 focus:border-primary/50 focus:outline-none cursor-pointer"
                >
                  {CODE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Paste or write your code snippet here…"
                rows={5}
                className="w-full font-mono text-xs bg-black/40 text-emerald-400 rounded-xl p-3 border border-white/10 focus:border-primary/50 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Tab 4: Poll Form */}
          {activeTab === 'poll' && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll Question (e.g. Preferred tech stack for hackathon?)"
                className="w-full h-10 text-xs bg-muted/80 rounded-xl px-3.5 border border-white/10 focus:border-primary/50 focus:outline-none font-semibold"
              />

              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdatePollOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 h-9 text-xs bg-muted/60 rounded-xl px-3 border border-white/5 focus:border-primary/50 focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(i)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {pollOptions.length < 4 ? (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Maximum 4 options</span>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Duration:</span>
                  <select
                    value={pollDays}
                    onChange={(e) => setPollDays(Number(e.target.value))}
                    className="bg-muted/80 text-foreground text-xs rounded-lg px-2 py-1 border border-white/10 cursor-pointer"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>1 Week</option>
                    <option value={14}>2 Weeks</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={cn(
                'p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer',
                images.length > 0 && 'text-primary bg-primary/10'
              )}
              title="Add Photos"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={cn(
                'p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer',
                codeSnippet.trim() && 'text-primary bg-primary/10'
              )}
              title="Add Code Snippet"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('poll')}
              className={cn(
                'p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer',
                pollQuestion.trim() && 'text-primary bg-primary/10'
              )}
              title="Create Poll"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground tap-press transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !images.length && !codeSnippet.trim() && !pollQuestion.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold disabled:opacity-40 hover:bg-primary/90 tap-press transition-all shadow-md cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Publish</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
