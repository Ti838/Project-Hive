'use client';
// ─── Profile Page ──────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GitBranch, ExternalLink, Globe, Edit2, Save, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { displayName, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { User } from '@/types';

// ─── Validation schema ─────────────────────────────────────────────────────────
const profileSchema = z.object({
  first_name:    z.string().min(1, 'First name required'),
  last_name:     z.string().min(1, 'Last name required'),
  bio:           z.string().max(300, 'Bio max 300 chars').optional().or(z.literal('')),
  university:    z.string().optional().or(z.literal('')),
  department:    z.string().optional().or(z.literal('')),
  year_of_study: z.coerce.number().min(1).max(10).optional(),
  github_url:    z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin_url:  z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});
type ProfileForm = z.infer<typeof profileSchema>;


// ─── Skill tag editor ──────────────────────────────────────────────────────────
function SkillEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !skills.includes(val)) onChange([...skills, val]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
            {skill}
            <button onClick={() => onChange(skills.filter((s) => s !== skill))}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add a skill (press Enter)"
          className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 border border-transparent focus:border-primary focus:outline-none"
        />
        <button onClick={add} className="px-3 py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-accent transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio ?? '',
        university: user.university ?? '',
        department: user.department ?? '',
        year_of_study: user.year_of_study ?? undefined,
        github_url: user.github_url ?? '',
        linkedin_url: user.linkedin_url ?? '',
        portfolio_url: user.portfolio_url ?? '',
      });
      setSkills(user.skills ?? []);
    }
  }, [user]);

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    setSaving(true);
    const updateData: Partial<User> = {
      first_name: data.first_name,
      last_name: data.last_name,
      bio: data.bio ?? undefined,
      university: data.university ?? undefined,
      department: data.department ?? undefined,
      year_of_study: data.year_of_study ?? undefined,
      github_url: data.github_url ?? undefined,
      linkedin_url: data.linkedin_url ?? undefined,
      portfolio_url: data.portfolio_url ?? undefined,
      skills,
    };
    const res = await api.users.update(updateData);
    if (res.ok && res.user) {
      updateUser(res.user);
      setSavedMsg('Profile saved!');
      setEditing(false);
      setTimeout(() => setSavedMsg(''), 3000);
    }
    setSaving(false);
  };


  const name = displayName(user ?? undefined);
  const avatarColor = user?.avatar_color || getAvatarColor(user?.id ?? '');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Banner + Avatar */}
      <div className="relative">
        <div
          className="h-40 rounded-2xl"
          style={{
            background: user?.banner
              ? `url(${user.banner}) center/cover`
              : `linear-gradient(135deg, ${avatarColor}44 0%, ${avatarColor}22 100%)`,
            backgroundColor: avatarColor + '33',
          }}
        />
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={name} className="w-20 h-20 rounded-2xl border-4 border-background object-cover" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl border-4 border-background flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(name)}
              </div>
            )}
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setEditing(!editing)}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors"
        >
          {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Identity */}
      <div className="pt-10">
        <h1 className="text-2xl font-bold">{name}</h1>
        {user?.university && <p className="text-muted-foreground text-sm">{user.university}{user.department ? ` · ${user.department}` : ''}</p>}
        {user?.bio && <p className="mt-2 text-sm leading-relaxed">{user.bio}</p>}

        {/* Social links */}
        <div className="flex gap-3 mt-3">
          {user?.github_url && (
            <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <GitBranch className="w-4 h-4" /> GitHub
            </a>
          )}
          {user?.linkedin_url && (
            <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-4 h-4" /> LinkedIn
            </a>
          )}
          {user?.portfolio_url && (
            <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" /> Portfolio
            </a>
          )}

        </div>

        {/* Skills */}
        {!editing && (user?.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user?.skills?.map((skill) => (
              <span key={skill} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Edit Profile</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">First Name</label>
              <input {...register('first_name')} className={cn('w-full text-sm bg-muted rounded-lg px-3 py-2 border focus:outline-none focus:border-primary', errors.first_name ? 'border-destructive' : 'border-transparent')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            {/* Last Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Last Name</label>
              <input {...register('last_name')} className={cn('w-full text-sm bg-muted rounded-lg px-3 py-2 border focus:outline-none focus:border-primary', errors.last_name ? 'border-destructive' : 'border-transparent')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Bio</label>
            <textarea {...register('bio')} rows={3} className="w-full text-sm bg-muted rounded-lg px-3 py-2 border border-transparent focus:border-primary focus:outline-none resize-none" placeholder="Tell others about yourself…" />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">University</label>
              <input {...register('university')} className="w-full text-sm bg-muted rounded-lg px-3 py-2 border border-transparent focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Department</label>
              <input {...register('department')} className="w-full text-sm bg-muted rounded-lg px-3 py-2 border border-transparent focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Skills</label>
            <SkillEditor skills={skills} onChange={setSkills} />
          </div>

          {/* Links */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Links</label>
            {[
              { name: 'github_url' as const, placeholder: 'https://github.com/username', label: 'GitHub' },
              { name: 'linkedin_url' as const, placeholder: 'https://linkedin.com/in/username', label: 'LinkedIn' },
              { name: 'portfolio_url' as const, placeholder: 'https://yoursite.com', label: 'Portfolio' },
            ].map(({ name, placeholder, label }) => (
              <div key={name} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input {...register(name)} placeholder={placeholder} className={cn('w-full text-sm bg-muted rounded-lg px-3 py-2 border focus:outline-none focus:border-primary', errors[name] ? 'border-destructive' : 'border-transparent')} />
                {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors">
              Cancel
            </button>
            {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
          </div>
        </motion.form>
      )}

      {/* Profile completion */}
      {(user?.profile_completion ?? 0) < 100 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Profile Completion</p>
            <span className="text-sm font-bold text-primary">{user?.profile_completion ?? 0}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${user?.profile_completion ?? 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Complete your profile to attract better teammates.</p>
        </div>
      )}
    </div>
  );
}
