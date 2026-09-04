'use client';
// ─── Profile Page ──────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GitBranch, ExternalLink, Globe, Edit2, Save, X, Loader2, UserX, MessageSquare, UserPlus, Check, ArrowLeft, Camera, ImagePlus } from 'lucide-react';
import Link from 'next/link';
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
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
              {skill}
              <button
                type="button"
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
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
          placeholder="Add a skill (press Enter)"
          autoCapitalize="words"
          className="flex-1 h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="h-12 px-5 bg-secondary rounded-xl text-sm font-medium hover:bg-accent transition-colors shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="absolute -bottom-8 left-6">
          <div className="w-20 h-20 rounded-2xl border-4 border-background bg-muted-foreground/20" />
        </div>
        <div className="absolute top-4 right-4 h-9 w-28 rounded-lg bg-background/60" />
      </div>

      {/* Identity */}
      <div className="pt-10 space-y-3">
        <div className="h-7 bg-muted rounded-lg w-52" />
        <div className="h-4 bg-muted rounded w-40" />
        <div className="h-16 bg-muted rounded-xl w-full" />

        {/* Social links */}
        <div className="flex gap-3 pt-1">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
        </div>

        {/* Skills */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-20 bg-muted rounded-full" />
          <div className="h-6 w-14 bg-muted rounded-full" />
          <div className="h-6 w-24 bg-muted rounded-full" />
        </div>
      </div>

      {/* Completion card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-2 bg-muted rounded-full w-full" />
      </div>
    </div>
  );
}

export default function ProfilePage({ paramsId }: { paramsId?: string }) {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('uid') || paramsId;

  const { user: currentUser, updateUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [friendRequested, setFriendRequested] = useState(false);
  const [endorsedSkills, setEndorsedSkills] = useState<Record<string, number>>({});
  const [userEndorsedSet, setUserEndorsedSet] = useState<Set<string>>(new Set());

  // Image Upload States & Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP)');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be under 5MB');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    setUploadingAvatar(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.users.update({ avatar: base64 });
        if (res.ok && res.user) {
          updateUser(res.user);
          setProfileUser((prev) => (prev ? { ...prev, avatar: res.user.avatar } : res.user));
          setSavedMsg('Profile photo updated!');
          setTimeout(() => setSavedMsg(''), 3000);
        } else {
          setUploadError('Failed to save profile picture');
          setTimeout(() => setUploadError(null), 3500);
        }
      } catch (err: any) {
        setUploadError(err?.message || 'Error uploading profile photo');
        setTimeout(() => setUploadError(null), 3500);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP)');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Banner image size must be under 5MB');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    setUploadingBanner(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.users.update({ banner_image: base64 } as any);
        if (res.ok && res.user) {
          updateUser(res.user);
          setProfileUser((prev) => (prev ? { ...prev, banner: res.user.banner, banner_image: res.user.banner_image } : res.user));
          setSavedMsg('Cover photo updated!');
          setTimeout(() => setSavedMsg(''), 3000);
        } else {
          setUploadError('Failed to save cover photo');
          setTimeout(() => setUploadError(null), 3500);
        }
      } catch (err: any) {
        setUploadError(err?.message || 'Error uploading banner photo');
        setTimeout(() => setUploadError(null), 3500);
      } finally {
        setUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEndorseSkill = async (skillName: string) => {
    if (!profileUser?.id || isOwnProfile) return;
    const currentCount = endorsedSkills[skillName] ?? 0;
    const isEndorsed = userEndorsedSet.has(skillName);

    // Optimistic toggle
    setUserEndorsedSet(prev => {
      const next = new Set(prev);
      if (isEndorsed) next.delete(skillName);
      else next.add(skillName);
      return next;
    });
    setEndorsedSkills(prev => ({
      ...prev,
      [skillName]: isEndorsed ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));

    try {
      await api.users.endorseSkill(profileUser.id, skillName);
    } catch {
      // Revert on failure
      setUserEndorsedSet(prev => {
        const next = new Set(prev);
        if (isEndorsed) next.add(skillName);
        else next.delete(skillName);
        return next;
      });
      setEndorsedSkills(prev => ({
        ...prev,
        [skillName]: currentCount,
      }));
    }
  };

  const isOwnProfile = !queryId || queryId === currentUser?.id;
  const activeUser = isOwnProfile ? currentUser : profileUser;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
  });

  const loadProfile = () => {
    if (isOwnProfile) {
      if (currentUser) {
        setProfileUser(currentUser);
        reset({
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          bio: currentUser.bio ?? '',
          university: currentUser.university ?? '',
          department: currentUser.department ?? '',
          year_of_study: currentUser.year_of_study ?? undefined,
          github_url: currentUser.github_url ?? '',
          linkedin_url: currentUser.linkedin_url ?? '',
          portfolio_url: currentUser.portfolio_url ?? '',
        });
        setSkills(currentUser.skills ?? []);
        setNotFound(false);
      }
      setLoading(false);
    } else if (queryId) {
      setLoading(true);
      setFetchError(null);
      api.users.getById(queryId).then((res) => {
        if (res.ok && res.id) {
          setProfileUser(res);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }).catch((e: any) => {
        setFetchError(e?.message || 'Failed to load user profile');
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    loadProfile();
  }, [queryId, isOwnProfile, currentUser]);

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

  const handleConnect = async () => {
    if (!profileUser?.id) return;
    setFriendRequested(true);
    await api.friends.requests.send(profileUser.id);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <UserX className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Failed to Load Profile</h1>
        <p className="text-sm text-muted-foreground mb-6">{fetchError}</p>
        <button
          onClick={loadProfile}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (notFound || !activeUser) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <UserX className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Student Profile Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The profile you are looking for does not exist, was removed, or the link is invalid.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/people" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
            Discover Teammates
          </Link>
          <Link href="/dashboard" className="px-4 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const name = displayName(activeUser ?? undefined);
  const avatarColor = activeUser?.avatar_color || getAvatarColor(activeUser?.id ?? '');

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Hidden File Inputs for Profile Photo & Banner */}
      {isOwnProfile && (
        <>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            aria-label="Upload profile photo"
          />
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            aria-label="Upload cover banner photo"
          />
        </>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="p-1 hover:bg-destructive/20 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner + Avatar */}
      <div className="relative">
        <div
          className="h-40 sm:h-48 rounded-2xl relative overflow-hidden group shadow-inner transition-all"
          style={{
            background: activeUser?.banner || activeUser?.banner_image
              ? `url(${activeUser?.banner || activeUser?.banner_image}) center/cover no-repeat`
              : `linear-gradient(135deg, ${avatarColor}44 0%, ${avatarColor}22 100%)`,
            backgroundColor: avatarColor + '33',
          }}
        >
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-3 left-3 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Change Cover Banner"
            >
              {uploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              <span>{uploadingBanner ? 'Uploading…' : 'Edit Cover'}</span>
            </button>
          )}
        </div>

        {/* Avatar Area */}
        <div className="absolute -bottom-8 left-6">
          <div className="relative group">
            {activeUser?.avatar ? (
              <img
                src={activeUser.avatar}
                alt={name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background object-cover shadow-md bg-card"
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(name)}
              </div>
            )}

            {/* Avatar Upload Trigger Overlay */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity border-4 border-transparent backdrop-blur-xs cursor-pointer active:scale-95"
                title="Upload Profile Picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-[9px] font-semibold mt-0.5">Change</span>
                  </>
                )}
              </button>
            )}

            {/* Online status indicator */}
            {activeUser?.online_status === 'online' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-xs z-10" />
            )}
          </div>
        </div>

        {/* Action Button: Edit or Connect */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwnProfile ? (
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-3.5 py-2 bg-background/90 backdrop-blur-md border border-border/80 rounded-xl text-sm font-semibold hover:bg-background transition-all shadow-xs active:scale-95"
            >
              {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConnect}
                disabled={friendRequested}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm',
                  friendRequested
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {friendRequested ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {friendRequested ? 'Request Sent' : 'Connect'}
              </button>
              <Link
                href={`/messages`}
                className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                title="Send message"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="pt-10">
        <h1 className="text-2xl font-bold">{name}</h1>
        {activeUser?.university && <p className="text-muted-foreground text-sm">{activeUser.university}{activeUser.department ? ` · ${activeUser.department}` : ''}</p>}
        {activeUser?.bio && <p className="mt-2 text-sm leading-relaxed">{activeUser.bio}</p>}

        {/* Social links */}
        <div className="flex gap-3 mt-3">
          {activeUser?.github_url && (
            <a href={activeUser.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <GitBranch className="w-4 h-4" /> GitHub
            </a>
          )}
          {activeUser?.linkedin_url && (
            <a href={activeUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-4 h-4" /> LinkedIn
            </a>
          )}
          {activeUser?.portfolio_url && (
            <a href={activeUser.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" /> Portfolio
            </a>
          )}

        </div>

        {/* Skills & Endorsements */}
        {!editing && (activeUser?.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeUser?.skills?.map((skill: string) => {
              const count = endorsedSkills[skill] ?? 0;
              const isEndorsed = userEndorsedSet.has(skill);
              return (
                <div
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs bg-card border border-border/70 rounded-full pl-3 pr-2 py-1 shadow-2xs"
                >
                  <span className="font-medium text-foreground">{skill}</span>
                  {count > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  )}
                  {!isOwnProfile && (
                    <button
                      onClick={() => handleEndorseSkill(skill)}
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full tap-press transition-colors ml-1',
                        isEndorsed
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground'
                      )}
                      title="Endorse this student's skill"
                    >
                      {isEndorsed ? '✓ Endorsed' : '+ Endorse'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Edit Profile</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</label>
              <input
                {...register('first_name')}
                autoCapitalize="words"
                autoComplete="given-name"
                className={cn(
                  'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
                  errors.first_name ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</label>
              <input
                {...register('last_name')}
                autoCapitalize="words"
                autoComplete="family-name"
                className={cn(
                  'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
                  errors.last_name ? 'border-destructive' : 'border-transparent'
                )}
              />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full min-h-[96px] text-base sm:text-sm bg-muted rounded-xl p-4 border border-transparent focus:border-primary focus:outline-none resize-none transition-colors"
              placeholder="Tell others about yourself…"
            />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">University</label>
              <input
                {...register('university')}
                autoCapitalize="words"
                className="w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
              <input
                {...register('department')}
                autoCapitalize="words"
                className="w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills</label>
            <SkillEditor skills={skills} onChange={setSkills} />
          </div>

          {/* Links */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social & Portfolio Links</label>
            {[
              { name: 'github_url' as const, placeholder: 'https://github.com/username', label: 'GitHub' },
              { name: 'linkedin_url' as const, placeholder: 'https://linkedin.com/in/username', label: 'LinkedIn' },
              { name: 'portfolio_url' as const, placeholder: 'https://yoursite.com', label: 'Portfolio' },
            ].map(({ name, placeholder, label }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  {...register(name)}
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={placeholder}
                  className={cn(
                    'w-full h-12 text-base sm:text-sm bg-muted rounded-xl px-4 border focus:outline-none focus:border-primary transition-colors',
                    errors[name] ? 'border-destructive' : 'border-transparent'
                  )}
                />
                {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-12 flex items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none hover:bg-primary/90 transition-all shadow-sm active:scale-[0.99]"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-12 px-5 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            {savedMsg && <span className="text-sm text-green-600 font-semibold">{savedMsg}</span>}
          </div>
        </motion.form>
      )}

      {/* Profile completion (own profile only) */}
      {isOwnProfile && (currentUser?.profile_completion ?? 0) < 100 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Profile Completion</p>
            <span className="text-sm font-bold text-primary">{currentUser?.profile_completion ?? 0}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentUser?.profile_completion ?? 0}%` }}
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

