'use client';
// ─── Projects Showcase Page with Project Submission ────────────────────────────

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Heart, ExternalLink, GitBranch, Search, Plus,
  X, Check, AlertCircle, Sparkles, Globe, Layers, Code2
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { displayName, getAvatarColor, cn } from '@/lib/utils';
import type { Project } from '@/types';

export default function ShowcasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Application',
    techStack: [] as string[],
    demoURL: '',
    githubURL: '',
    thumbnail: '',
  });

  const fetchProjects = async () => {
    try {
      const res = await api.projects.list();
      if (res.ok && res.projects) {
        setProjects(res.projects);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLike = async (projectId: string) => {
    const res = await api.projects.like(projectId);
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                is_liked: res.liked,
                likes_count: res.liked ? (p.likes_count ?? 0) + 1 : Math.max(0, (p.likes_count ?? 1) - 1),
              }
            : p
        )
      );
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.techStack.includes(trimmed)) {
      setFormData(prev => ({ ...prev, techStack: [...prev.techStack, trimmed] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tagToRemove),
    }));
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('Project title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setSubmitError('Project description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.projects.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tech_stack: formData.techStack,
        demo_url: formData.demoURL.trim() || undefined,
        repo_url: formData.githubURL.trim() || undefined,
        image_url: formData.thumbnail.trim() || undefined,
      } as any);

      if (res.ok) {
        setShowSubmitModal(false);
        setFormData({
          title: '',
          description: '',
          category: 'Web Application',
          techStack: [],
          demoURL: '',
          githubURL: '',
          thumbnail: '',
        });
        await fetchProjects();
      } else {
        setSubmitError(res.error || 'Failed to submit project. Please try again.');
      }
    } catch {
      setSubmitError('Network error while submitting project.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.tech_stack?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Submit CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Showcase</h1>
          <p className="text-sm text-muted-foreground">Discover and get inspired by what fellow students are building</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl tap-press shadow-xs hover:bg-primary/90 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Project</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects by title, description or technology…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted skeleton-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl bg-card/40">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground">{search ? 'No projects matched your query.' : 'No showcase projects yet.'}</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first student to publish a showcase project!</p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl tap-press hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Submit First Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/95 dark:bg-card/70 border border-border/50 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 shadow-xs hover:shadow-lg transition-all duration-200"
            >
              {proj.image_url ? (
                <img src={proj.image_url} alt={proj.title} className="w-full h-44 object-cover" />
              ) : (
                <div
                  className="w-full h-40 flex items-center justify-center text-white/40"
                  style={{ background: `linear-gradient(135deg, ${getAvatarColor(proj.id)}88, ${getAvatarColor(proj.title)}44)` }}
                >
                  <FolderKanban className="w-12 h-12" />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground truncate">{proj.title}</h3>
                  <button
                    onClick={() => handleLike(proj.id)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border tap-press transition-all',
                      proj.is_liked
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-bounce-subtle'
                        : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Heart className={cn('w-3.5 h-3.5 transition-transform', proj.is_liked && 'fill-rose-500 scale-110')} />
                    <span>{proj.likes_count ?? 0}</span>
                  </button>
                </div>

                {proj.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tech_stack.map((tech) => (
                      <span key={tech} className="text-[10px] uppercase tracking-wider bg-secondary/80 text-secondary-foreground px-2.5 py-0.5 rounded-full font-semibold">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    by {displayName(proj.creator ?? undefined)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/projects/${proj.id}/development`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-accent bg-accent/10 hover:bg-accent/20 rounded-xl border border-accent/20 tap-press transition-colors"
                      title="Open Developer Workspace"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Workspace</span>
                    </Link>
                    {proj.repo_url && (
                      <a
                        href={proj.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl tap-press transition-colors"
                        title="GitHub Repository"
                      >
                        <GitBranch className="w-4 h-4" />
                      </a>
                    )}
                    {proj.demo_url && (
                      <a
                        href={proj.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary hover:bg-primary/10 rounded-xl tap-press transition-colors"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Submit Project Modal / Bottom Sheet ──────────────────────────────── */}
      <AnimatePresence>
        {showSubmitModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowSubmitModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Modal / Sheet Container */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-xl md:w-full bg-card border-t md:border border-border/70 rounded-t-3xl md:rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,16px))] shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
            >
              {/* Mobile grab bar */}
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-1 md:hidden" />

              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Submit Project Showcase</h2>
                    <p className="text-xs text-muted-foreground">Share your project with student builders & recruiters</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent tap-press transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProject} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CampusPulse AI, EcoTrack"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:bg-background focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly explain what problem this solves and how it works…"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:bg-background focus:outline-none resize-none transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-all"
                    >
                      <option>Web Application</option>
                      <option>Mobile App</option>
                      <option>AI / Machine Learning</option>
                      <option>Blockchain / Web3</option>
                      <option>Hardware / IoT</option>
                      <option>Open Source Library</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Cover Image URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.thumbnail}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Tech Stack Chips */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Technologies Used</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Next.js, FastAPI, PostgreSQL"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl tap-press hover:bg-secondary/80"
                    >
                      Add
                    </button>
                  </div>
                  {formData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.techStack.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">GitHub Repo URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={formData.githubURL}
                      onChange={(e) => setFormData(prev => ({ ...prev, githubURL: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Live Demo URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.demoURL}
                      onChange={(e) => setFormData(prev => ({ ...prev, demoURL: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted/60 border border-border/60 rounded-xl focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent tap-press transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl tap-press hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Publish Project</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
