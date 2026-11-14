'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Star,
  ExternalLink,
  Trash2,
  RefreshCw,
  GitBranch,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Deletion state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling feature state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const res = await api.admin.getProjects({
        search: debouncedSearch || undefined,
        limit,
        offset,
      });
      if (res && res.projects) {
        setProjects(res.projects);
        setTotal(res.total || res.projects.length);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, debouncedSearch]);

  const handleToggleFeature = async (p: Project) => {
    try {
      setTogglingId(p.id);
      const nextFeatured = !p.is_featured;
      await api.admin.featureProject(p.id, nextFeatured);
      setProjects((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_featured: nextFeatured } : item
        )
      );
    } catch (err) {
      console.error('Failed to toggle feature status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await api.admin.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const featuredCount = projects.filter((p) => p.is_featured).length;
  const totalUpvotes = projects.reduce((acc, p) => acc + (p.upvote_count ?? (p as any).upvotes_count ?? 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & KPI Overview ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Total Projects
            </span>
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground font-mono">
            {total}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across all student squads</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Featured Showcases
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground font-mono">
            {featuredCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Elevated to homepage feed</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Community Upvotes
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground font-mono">
            {totalUpvotes}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Peer endorsement signals</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Git Repos Connected
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground font-mono">
            {projects.filter((p) => p.github_url || (p as any).github_repo_url).length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Verified codebases</p>
        </div>
      </div>

      {/* ─── Search & Controls Bar ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Project Showcase & Artifact Oversight
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit public and private campus builds, feature exceptional innovations, and moderate repositories.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects, stacks, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchProjects}
            className="h-9 px-3 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Projects Data Table ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Project & Blueprint</th>
                <th className="py-3.5 px-4 font-semibold">Category & Tech</th>
                <th className="py-3.5 px-4 font-semibold">Upvotes</th>
                <th className="py-3.5 px-4 font-semibold">Featured</th>
                <th className="py-3.5 px-4 font-semibold">Repository / Demo</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-mono text-xs">Querying Project Catalog...</p>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-xs">No projects found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    {/* Project Identity */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {p.title?.[0] || 'P'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate flex items-center gap-1.5">
                            <span>{p.title}</span>
                            {p.is_featured && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {p.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Tags */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted border border-border text-foreground uppercase">
                          {p.category || 'General'}
                        </span>
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[10px] text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Upvotes */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{p.upvote_count ?? (p as any).upvotes_count ?? 0}</span>
                      </div>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(p)}
                        disabled={togglingId === p.id}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer',
                          p.is_featured
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {togglingId === p.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Star className={cn('w-3 h-3', p.is_featured && 'fill-current')} />
                        )}
                        <span>{p.is_featured ? 'Featured' : 'Promote'}</span>
                      </button>
                    </td>

                    {/* Links */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {(p.github_url || (p as any).github_repo_url) && (
                          <a
                            href={p.github_url || (p as any).github_repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                            title="GitHub Repository"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {(p.demo_url || (p as any).live_demo_url) && (
                          <a
                            href={p.demo_url || (p as any).live_demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                            title="Live Demo"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Link
                          href={`/projects`}
                          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View on Showcase"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(p)}
                        className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {projects.length} of {total} registered projects
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-foreground font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project Showcase"
        description={`Are you sure you want to permanently delete "${projectToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Project"
        variant="danger"
        requiredMatchText="DELETE"
        isLoading={isDeleting}
      />
    </div>
  );
}
