'use client';
// ─── Project Showcase with ProductHunt-Grade Upvotes ──────────────────────────

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, ExternalLink, GitBranch, Search, Plus,
  X, Check, AlertCircle, Sparkles, Globe, Layers, Code2,
  TrendingUp, Star, ChevronUp, Users, Bookmark, Share2, Filter
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, getAvatarColor, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import type { Project } from '@/types';

const CATEGORY_PILLS = [
  { id: 'all', label: 'All Projects' },
  { id: 'trending', label: '🔥 Trending on Campus' },
  { id: 'Web & Mobile', label: 'Web & Mobile' },
  { id: 'AI & Machine Learning', label: 'AI & Machine Learning' },
  { id: 'Hardware/Robotics', label: 'Hardware & IoT' },
  { id: 'Open Source', label: 'Open Source Tools' },
];

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  // Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web & Mobile',
    techStack: [] as string[],
    demoURL: '',
    githubURL: '',
    thumbnail: '',
  });

  const fetchProjects = async (cat = selectedCategory) => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (cat === 'trending') {
        filters.sortBy = 'trending';
      } else if (cat !== 'all') {
        filters.category = cat;
      }
      const res = await api.projects.list(filters);
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
    fetchProjects(selectedCategory);
  }, [selectedCategory]);

  // ProductHunt-Style Upvote Handler
  const handleUpvote = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (upvotingIds.has(projectId)) return;
    setUpvotingIds((prev) => new Set(prev).add(projectId));

    // Optimistic Update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentUpvoted = p.isUpvoted ?? p.is_upvoted ?? p.is_liked ?? p.isLiked ?? false;
        const nextUpvoted = !currentUpvoted;
        const currentCount = p.upvotes ?? p.upvote_count ?? p.likes_count ?? p.likes ?? 0;
        const nextCount = nextUpvoted ? currentCount + 1 : Math.max(0, currentCount - 1);

        return {
          ...p,
          isUpvoted: nextUpvoted,
          is_upvoted: nextUpvoted,
          isLiked: nextUpvoted,
          is_liked: nextUpvoted,
          upvotes: nextCount,
          upvote_count: nextCount,
          likes: nextCount,
          likes_count: nextCount,
        };
      })
    );

    try {
      await api.projects.upvote(projectId);
    } catch (err) {
      console.error('Upvote failed:', err);
      // Revert if network error
      await fetchProjects(selectedCategory);
    } finally {
      setUpvotingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.techStack.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, techStack: [...prev.techStack, trimmed] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tagToRemove),
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
          category: 'Web & Mobile',
          techStack: [],
          demoURL: '',
          githubURL: '',
          thumbnail: '',
        });
        await fetchProjects(selectedCategory);
      } else {
        setSubmitError(res.error || 'Failed to submit project. Please try again.');
      }
    } catch {
      setSubmitError('Network error while submitting project.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return projects.filter(
      (p) =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        (p.tech_stack || p.techStack)?.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        p.owner?.first_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-3xl border border-primary/20">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Campus Innovation Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Project Showcase & Upvotes
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Discover cutting-edge student projects, collaborate with squads, and upvote the top campus builds.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-2xl tap-press shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Project</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, tech stack (React, PyTorch...), or creator…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm bg-card border border-border/80 rounded-2xl focus:border-primary focus:outline-none transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedCategory(pill.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                selectedCategory === pill.id
                  ? 'bg-foreground text-background shadow-xs scale-102 font-bold'
                  : 'bg-card border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Showcase Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-3xl bg-muted/60 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border/80 rounded-3xl bg-card/30">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <h2 className="font-bold text-base text-foreground">No projects found</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search query or filters.' : 'Be the first student to publish a showcase project!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => {
            const upvotesCount = proj.upvotes ?? proj.upvote_count ?? proj.likes_count ?? proj.likes ?? 0;
            const isUpvoted = Boolean(proj.isUpvoted ?? proj.is_upvoted ?? proj.is_liked ?? proj.isLiked);
            const creator = proj.owner || proj.creator;
            const techList = proj.tech_stack || proj.techStack || [];
            const demoLink = proj.demo_url || proj.demoURL;
            const repoLink = proj.repo_url || proj.github_url || proj.githubURL;

            return (
              <motion.div
                key={proj.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/70 border border-border/70 hover:border-primary/40 rounded-3xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Row: Category + ProductHunt Upvote Dock */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                      {proj.category || 'Engineering'}
                    </span>

                    {/* Dedicated ProductHunt-Grade Upvote Button */}
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(e, proj.id)}
                      className={cn(
                        'flex flex-col items-center justify-center min-w-14 px-3 py-2 rounded-2xl border transition-all tap-press cursor-pointer shadow-xs',
                        isUpvoted
                          ? 'bg-primary text-primary-foreground border-primary glow-primary font-black'
                          : 'bg-muted/70 hover:bg-primary/15 hover:border-primary/40 text-foreground border-border/80 font-bold'
                      )}
                      title={isUpvoted ? 'Remove upvote' : 'Upvote this project'}
                    >
                      <ChevronUp className={cn('w-4 h-4 stroke-[3]', isUpvoted ? 'text-primary-foreground' : 'text-primary')} />
                      <span className="text-xs font-bold leading-tight mt-0.5">{upvotesCount}</span>
                    </button>
                  </div>

                  {/* Thumbnail Banner (Optional) */}
                  {(proj.thumbnail || proj.image_url) && (
                    <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-muted/40 border border-border/50">
                      <img
                        src={proj.thumbnail || proj.image_url}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Title & Description */}
                  <div>
                    <h2 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {proj.title}
                    </h2>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  {/* Tech Stack Pills */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techList.slice(0, 4).map((tech, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-muted/80 text-muted-foreground border border-border/40"
                        >
                          {tech}
                        </span>
                      ))}
                      {techList.length > 4 && (
                        <span className="text-[10px] text-muted-foreground font-semibold px-1 py-0.5">
                          +{techList.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Collaborators Stack & Action Tray */}
                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  {/* Creator / Collaborator Avatar Stack */}
                  <div className="flex items-center gap-2 min-w-0">
                    {creator && (
                      <UserProfileHoverCard user={creator}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          <UserAvatar user={creator} size="sm" interactive />
                          <div className="min-w-0 hidden sm:block">
                            <p className="text-xs font-semibold truncate leading-tight">{displayName(creator)}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{creator.university || 'Creator'}</p>
                          </div>
                        </div>
                      </UserProfileHoverCard>
                    )}
                  </div>

                  {/* 1-Click Action Tray */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {repoLink && (
                      <a
                        href={repoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors tap-press"
                        title="GitHub Repository"
                      >
                        <GitBranch className="w-4 h-4" />
                      </a>
                    )}
                    {demoLink && (
                      <a
                        href={demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors tap-press"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Project Submission Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Launch a Project</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Showcase your squad's work to the campus community</p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HiveSync — Peer Collaborative IDE"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-11 px-4 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Short Pitch / Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain what problem this solves and what technologies make it stand out…"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-11 px-3.5 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                    >
                      <option value="Web & Mobile">Web & Mobile</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Hardware/Robotics">Hardware & IoT</option>
                      <option value="Open Source">Open Source Tools</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cover Image URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="w-full h-11 px-4 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Live Demo Link</label>
                    <input
                      type="url"
                      placeholder="https://myproject.vercel.app"
                      value={formData.demoURL}
                      onChange={(e) => setFormData({ ...formData, demoURL: e.target.value })}
                      className="w-full h-11 px-4 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">GitHub Repo Link</label>
                    <input
                      type="url"
                      placeholder="https://github.com/org/repo"
                      value={formData.githubURL}
                      onChange={(e) => setFormData({ ...formData, githubURL: e.target.value })}
                      className="w-full h-11 px-4 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tech Stack Tags Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tech Stack Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Next.js, FastAPI, OpenCV) and hit Add"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 h-11 px-4 text-sm bg-muted/60 border border-border/80 rounded-xl focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {formData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {formData.techStack.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-medium rounded-lg flex items-center gap-1.5"
                        >
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 tap-press shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Publishing…' : 'Publish Showcase'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
