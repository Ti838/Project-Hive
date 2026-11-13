'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { type UseFormRegister, type FieldErrors, type SubmitHandler, type UseFormHandleSubmit } from 'react-hook-form';
import { Edit2, X, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillEditor } from './ProfileHelpers';

export interface ProfileFormValues {
  first_name: string;
  last_name: string;
  bio?: string;
  university?: string;
  department?: string;
  year_of_study?: number;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

interface ProfileEditFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  handleSubmit: UseFormHandleSubmit<any>;
  onSubmit: SubmitHandler<any>;
  skills: string[];
  setSkills: (skills: string[]) => void;
  saving: boolean;
  onCancel: () => void;
}

export function ProfileEditForm({
  register,
  errors,
  handleSubmit,
  onSubmit,
  skills,
  setSkills,
  saving,
  onCancel,
}: ProfileEditFormProps) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="surface-glass border border-foreground/10 rounded-3xl p-6 space-y-5 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h2 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-primary" /> Edit Profile Details
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            First Name
          </label>
          <input
            {...register('first_name')}
            autoCapitalize="words"
            className={cn(
              'w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
              errors.first_name ? 'border-destructive' : 'border-foreground/10'
            )}
          />
          {errors.first_name?.message && <p className="text-xs text-destructive">{String(errors.first_name.message)}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Last Name
          </label>
          <input
            {...register('last_name')}
            autoCapitalize="words"
            className={cn(
              'w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
              errors.last_name ? 'border-destructive' : 'border-foreground/10'
            )}
          />
          {errors.last_name?.message && <p className="text-xs text-destructive">{String(errors.last_name.message)}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bio
        </label>
        <textarea
          {...register('bio')}
          rows={3}
          className="w-full min-h-[96px] text-sm bg-muted/50 rounded-xl p-4 border border-foreground/10 focus:border-primary focus:outline-none resize-none transition-colors"
          placeholder="Tell other students and project recruiters about yourself…"
        />
        {errors.bio?.message && <p className="text-xs text-destructive">{String(errors.bio.message)}</p>}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            University
          </label>
          <input
            {...register('university')}
            autoCapitalize="words"
            className="w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Academic Year
          </label>
          <input
            {...register('year_of_study')}
            type="number"
            min={1}
            max={10}
            className="w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Skills & Stacks
        </label>
        <SkillEditor skills={skills} onChange={setSkills} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">GitHub URL</label>
          <input
            {...register('github_url')}
            placeholder="https://github.com/..."
            className="w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">LinkedIn URL</label>
          <input
            {...register('linkedin_url')}
            placeholder="https://linkedin.com/in/..."
            className="w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Portfolio URL</label>
          <input
            {...register('portfolio_url')}
            placeholder="https://yoursite.com"
            className="w-full h-11 text-sm bg-muted/50 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-11 flex items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm tap-press cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving…' : 'Save Changes'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-5 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors tap-press cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}

