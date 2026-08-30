'use client';
// ─── Saved Bookmarks Page ──────────────────────────────────────────────────────

import { useState } from 'react';
import { Bookmark, FolderKanban, Rss } from 'lucide-react';
import Link from 'next/link';

export default function SavedPage() {
  const [tab, setTab] = useState<'projects' | 'posts'>('projects');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="text-sm text-muted-foreground">Quickly access projects, posts, and team bookmarks you've saved for later</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'projects' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Saved Projects
        </button>
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'posts' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <Rss className="w-4 h-4" /> Saved Posts
        </button>
      </div>

      <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
        <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No saved {tab} yet</p>
        <p className="text-xs mt-1">Bookmark items across ProjectHive to view them here anytime.</p>
        <Link
          href={tab === 'projects' ? '/showcase' : '/feed'}
          className="inline-block mt-4 text-xs font-semibold text-primary hover:underline"
        >
          Explore {tab === 'projects' ? 'Showcase Projects' : 'Feed Posts'} →
        </Link>
      </div>
    </div>
  );
}

