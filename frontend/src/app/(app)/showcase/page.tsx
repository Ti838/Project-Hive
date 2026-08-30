'use client';
// ─── Projects Showcase Page ───────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Heart, ExternalLink, GitBranch, Search, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { displayName, getAvatarColor, cn } from '@/lib/utils';
import type { Project } from '@/types';

export default function ShowcasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects.list().then((res) => {
      if (res.ok && res.projects) setProjects(res.projects);
      setLoading(false);
    });
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

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.tech_stack?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Showcase</h1>
          <p className="text-sm text-muted-foreground">Discover and get inspired by what fellow students are building</p>
        </div>
      </div>

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

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? 'No projects matched your query.' : 'No showcase projects yet.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-lg transition-all"
            >
              {proj.image_url ? (
                <img src={proj.image_url} alt={proj.title} className="w-full h-40 object-cover" />
              ) : (
                <div
                  className="w-full h-36 flex items-center justify-center text-white/40"
                  style={{ background: `linear-gradient(135deg, ${getAvatarColor(proj.id)}88, ${getAvatarColor(proj.title)}44)` }}
                >
                  <FolderKanban className="w-12 h-12" />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base truncate">{proj.title}</h3>
                  <button
                    onClick={() => handleLike(proj.id)}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors',
                      proj.is_liked
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Heart className={cn('w-3.5 h-3.5', proj.is_liked && 'fill-rose-500')} />
                    <span>{proj.likes_count ?? 0}</span>
                  </button>
                </div>

                {proj.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tech_stack.map((tech) => (
                      <span key={tech} className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    by {displayName(proj.creator ?? undefined)}
                  </span>
                  <div className="flex items-center gap-2">
                    {proj.repo_url && (
                      <a
                        href={proj.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
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
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
    </div>
  );
}

