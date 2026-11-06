'use client';
// ─── Team Docs & Wiki View (Notion Grade Knowledge Base) ─────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Edit3, Save, Check, FileText, Sparkles,
  Layers, Code2, Users, Calendar, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface TeamDocsViewProps {
  teamId: string;
  team: any;
  isLeader: boolean;
  isMember: boolean;
  onUpdate: () => void;
}

const DEFAULT_DOC_TEMPLATE = `# Project Blueprint & Engineering Specification

## 1. Executive Summary & Problem Statement
Our university squad is building a verified, high-impact software system addressing campus collaboration barriers.

## 2. System Architecture & Tech Stack
- **Frontend:** Next.js App Router, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.IO Realtime Engine
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Calling SFU:** LiveKit Cloud WebRTC Media Server

## 3. Weekly Meeting Schedule & Team Norms
- **Sync Cadence:** Tuesday & Friday at 7:00 PM (LiveKit Call)
- **Repository Guidelines:** Conventional commits required (e.g. \`feat:\`, \`fix:\`, \`docs:\`)
- **Code Review:** All Pull Requests require at least 1 peer approval before merging to \`main\`

## 4. Milestone Log & Action Items
- [x] Sprint 1: Architecture RFC and Database Schema validation
- [ ] Sprint 2: Core REST API & WebSocket Realtime signaling
- [ ] Sprint 3: UI Design System integration and mobile responsiveness
`;

export function TeamDocsView({ teamId, team, isLeader, isMember, onUpdate }: TeamDocsViewProps) {
  const getInitialDoc = (): string => {
    if (team?.rules) {
      try {
        const parsed = typeof team.rules === 'string' ? JSON.parse(team.rules) : team.rules;
        if (parsed?.wikiDoc) return parsed.wikiDoc;
      } catch {}
    }
    return DEFAULT_DOC_TEMPLATE;
  };

  const [content, setContent] = useState<string>(getInitialDoc);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let existingRules: any = {};
      if (team?.rules) {
        try {
          existingRules = typeof team.rules === 'string' ? JSON.parse(team.rules) : team.rules;
        } catch {}
      }
      const updatedRules = {
        ...existingRules,
        wikiDoc: content,
      };

      await api.teams.update(teamId, {
        rules: JSON.stringify(updatedRules) as any,
      });

      setSaving(false);
      setIsEditing(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
      onUpdate();
    } catch (err) {
      console.error('Failed to save team wiki:', err);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 surface-glass rounded-2xl p-4 sm:p-5 border border-foreground/10 bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-foreground">Project Wiki & Engineering Spec</h3>
            <p className="text-[11px] text-muted-foreground">Notion-grade collaborative team workspace & meeting minutes</p>
          </div>
        </div>

        {isMember && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-accent transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Wiki</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Saved Toast */}
      {savedToast && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>Wiki specifications updated and persisted to team vault.</span>
        </div>
      )}

      {/* Content Area */}
      <div className="surface-glass rounded-3xl p-6 sm:p-8 border border-foreground/10 shadow-xl bg-card/60 backdrop-blur-xl">
        {isEditing ? (
          <textarea
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-mono text-xs leading-relaxed bg-background/80 rounded-2xl p-4 border border-border focus:border-primary focus:outline-none"
            placeholder="Write team documentation in Markdown…"
          />
        ) : (
          <article className="prose prose-invert prose-xs sm:prose-sm max-w-none text-foreground/90 font-sans space-y-4">
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-foreground/90 bg-transparent p-0 border-0">
              {content}
            </pre>
          </article>
        )}
      </div>
    </div>
  );
}

