'use client';
// ─── AI Project Studio & Brainstormer ──────────────────────────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Loader2, Lightbulb, Copy, Check, Star, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ProjectIdea {
  name: string;
  description: string;
  features?: string[];
  techStack?: string[];
  difficulty?: string;
  innovationScore?: number;
  estimatedWeeks?: number;
}

export default function GeneratorPage() {
  const [domain, setDomain] = useState('EdTech & Student Productivity');
  const [skills, setSkills] = useState('React, Next.js, Node.js, AI APIs');
  const [teamSize, setTeamSize] = useState(3);
  const [weeks, setWeeks] = useState(4);
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ProjectIdea[] | string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setIdeas(null);
    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await api.ai.generateIdeas({
      domain,
      skills: skillsArray,
      teamSize,
      timelineWeeks: weeks,
      constraints,
    });

    if (res.ok && res.ideas) {
      setIdeas(res.ideas);
    } else {
      setIdeas('Could not generate ideas. Please check that GROQ_API_KEY or GEMINI_API_KEY is configured.');
    }
    setLoading(false);
  };

  const copyIdeas = () => {
    const textToCopy = typeof ideas === 'string' ? ideas : JSON.stringify(ideas, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Project Idea Studio 🐝</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ultra-fast LLM generation via <strong className="text-foreground">Groq (Llama 3.3 70B)</strong> with automatic <strong className="text-foreground">Gemini 2.5 Flash</strong> fallback.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Domain / Theme</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. HealthTech, FinTech, Smart Campus"
              className="w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Skillset (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Next.js, Python, Supabase, Tailwind"
              className="w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline (Weeks)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special Constraints (Optional)</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. Must support mobile, must have real-time chat"
              className="w-full text-sm bg-muted rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !domain.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Synthesizing Proposals…' : 'Generate Project Proposals'}
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[420px] shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="w-4 h-4 text-primary" />
              <span>Generated Project Proposals</span>
            </div>
            {ideas && (
              <button
                onClick={copyIdeas}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium hover:bg-accent transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy All'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-semibold text-foreground">Querying Groq & Gemini AI…</p>
                <p className="text-xs max-w-sm">Generating innovative student project ideas with tech stacks, feature scopes, and novelty ratings.</p>
              </div>
            ) : Array.isArray(ideas) ? (
              ideas.map((idea, idx) => (
                <motion.div
                  key={idea.name || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3.5 card-hover"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {idea.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {idea.difficulty && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {idea.difficulty}
                        </span>
                      )}
                      {idea.innovationScore && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {idea.innovationScore}/10
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {idea.description}
                  </p>

                  {idea.features && idea.features.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key Features:</p>
                      <div className="grid sm:grid-cols-2 gap-1.5">
                        {idea.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-xs text-foreground/90">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {idea.techStack && idea.techStack.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {idea.techStack.map((tech) => (
                        <span key={tech} className="text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            ) : typeof ideas === 'string' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-xl">
                {ideas}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 text-muted-foreground">
                <Lightbulb className="w-12 h-12 opacity-30" />
                <p className="font-semibold text-sm text-foreground">No proposals generated yet</p>
                <p className="text-xs max-w-xs">Fill out the parameters on the left and tap Generate to receive structured project proposals!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
