'use client';
// ─── Create Team Page ──────────────────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().min(10, 'Please write a brief description (at least 10 characters)'),
  category: z.string().optional(),
  max_members: z.coerce.number().min(2).max(20).default(4),
  is_private: z.boolean().default(false),
});
type TeamForm = z.infer<typeof teamSchema>;

export default function CreateTeamPage() {
  const [skills, setSkills] = useState<string[]>(['React', 'Node.js']);
  const [skillInput, setSkillInput] = useState('');
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema) as any,
    defaultValues: { max_members: 4, is_private: false },
  });

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
    }
    setSkillInput('');
  };

  const onSubmit = async (data: TeamForm) => {
    setServerError('');
    const res = await api.teams.create({
      ...data,
      required_skills: skills,
      status: 'recruiting',
    });

    if (!res.ok || res.error) {
      setServerError(res.error ?? 'Could not create team');
      return;
    }

    router.push('/teams');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/teams" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Teams
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create a New Team</h1>
          <p className="text-sm text-muted-foreground">Assemble your dream squad for hackathons, capstones, or open-source projects</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Name</label>
          <input
            {...register('name')}
            placeholder="e.g. AlgoBees, NeuralPulse"
            autoCapitalize="words"
            autoCorrect="off"
            className={cn(
              'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
              errors.name ? 'border-destructive' : 'border-transparent'
            )}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Category</label>
          <input
            {...register('category')}
            placeholder="e.g. AI / Machine Learning, Mobile App, Web3"
            autoCapitalize="words"
            className="w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Mission / Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe what your team is building and what kind of teammates you're looking for…"
            className={cn(
              'w-full min-h-[96px] text-base sm:text-sm bg-muted rounded-xl p-4 border focus:outline-none focus:border-primary transition-colors resize-none',
              errors.description ? 'border-destructive' : 'border-transparent'
            )}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Skillset</label>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter((sk) => sk !== s))} className="p-0.5 hover:bg-primary/20 rounded-full transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add skill (e.g. TypeScript, UI/UX, Python)"
              autoCapitalize="words"
              className="flex-1 h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={addSkill}
              className="h-12 px-5 bg-secondary rounded-xl text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Members</label>
            <input
              {...register('max_members')}
              type="number"
              inputMode="numeric"
              min={2}
              max={20}
              className="w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-3 cursor-pointer text-sm font-medium p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <input
                {...register('is_private')}
                type="checkbox"
                className="w-5 h-5 accent-primary rounded"
              />
              <span>Private Team (Invite Only)</span>
            </label>
          </div>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm active:scale-[0.99]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isSubmitting ? 'Creating Team…' : 'Launch Team'}
        </button>
      </form>
    </div>
  );
}

