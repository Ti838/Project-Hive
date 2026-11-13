'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export function SkillEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !skills.includes(val)) onChange([...skills, val]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/20"
            >
              {skill}
              <button
                type="button"
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add technical or domain skill (press Enter)…"
          autoCapitalize="words"
          className="flex-1 h-11 text-sm bg-muted/60 rounded-xl px-4 border border-foreground/10 focus:border-primary/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="h-11 px-5 bg-secondary hover:bg-accent rounded-xl text-sm font-semibold transition-colors shrink-0 tap-press cursor-pointer"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="relative">
        <div className="h-44 sm:h-56 rounded-3xl bg-muted/60" />
        <div className="absolute -bottom-10 left-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-background bg-muted" />
        </div>
      </div>
      <div className="pt-12 space-y-4">
        <div className="h-8 bg-muted rounded-xl w-60" />
        <div className="h-4 bg-muted rounded-md w-48" />
        <div className="h-16 bg-muted/60 rounded-2xl w-full" />
      </div>
    </div>
  );
}

