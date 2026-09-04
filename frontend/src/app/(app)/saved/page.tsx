'use client';
// ─── Saved Bookmarks Page ──────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Bookmark, FolderKanban, Rss, ExternalLink, GitBranch, Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { displayName, timeAgo, getAvatarColor, cn } from '@/lib/utils';
import type { Post, Project } from '@/types';

export default function SavedPage() {
  const [tab, setTab] = useState<'posts' | 'projects'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const [postsRes, projectsRes] = await Promise.all([
        api.posts.getSaved(),
        api.projects.list(), // Featured or liked projects
      ]);
      if (postsRes.ok && postsRes.posts) {
        setPosts(postsRes.posts);
      }
      if (projectsRes.ok && projectsRes.projects) {
        setProjects(projectsRes.projects.filter(p => p.is_liked));
      }
    } catch (err) {
      console.error('Failed to load saved items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsavePost = async (id: string) => {
    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      await api.posts.save(id);
    } catch {
      fetchSaved();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Items</h1>
        <p className="text-sm text-muted-foreground">
          Quickly access the posts, achievements, and showcase projects you have bookmarked
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setTab('posts')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold tap-press transition-all',
            tab === 'posts'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Rss className="w-4 h-4" /> Saved Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab('projects')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold tap-press transition-all',
            tab === 'projects'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <FolderKanban className="w-4 h-4" /> Liked Projects ({projects.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/60 skeleton-shimmer" />
          ))}
        </div>
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-card/50">
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold text-foreground">No saved posts yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Tap the options button on any feed card and select "Bookmark Post" to save it here.
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold tap-press hover:bg-primary/90 transition-colors shadow-xs"
            >
              Explore Feed Posts →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(post.author?.id ?? 'a') }}
                    >
                      {displayName(post.author ?? undefined).charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{displayName(post.author ?? undefined)}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnsavePost(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 tap-press transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              </div>
            ))}
          </div>
        )
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-card/50">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground">No liked projects yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Heart projects in the Showcase gallery to bookmark them for easy access.
          </p>
          <Link
            href="/showcase"
            className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold tap-press hover:bg-primary/90 transition-colors shadow-xs"
          >
            Explore Showcase Gallery →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-card/90 dark:bg-card/60 backdrop-blur-xs border border-border/50 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base truncate">{proj.title}</h3>
                  <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" /> {proj.likes_count ?? 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{proj.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">by {displayName(proj.creator ?? undefined)}</span>
                <div className="flex items-center gap-2">
                  {proj.repo_url && (
                    <a
                      href={proj.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <GitBranch className="w-4 h-4" />
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
