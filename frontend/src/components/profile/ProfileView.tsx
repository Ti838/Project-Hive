'use client';
// â”€â”€â”€ ProjectHive Studio Profile Page (Facebook & LinkedIn Grade) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GitBranch, ExternalLink, Globe, Edit2, Save, X, Loader2, UserX,
  MessageSquare, UserPlus, UserCheck, UserMinus, Check, Camera, ImagePlus,
  Sparkles, ShieldCheck, School, BookOpen, Users, FolderGit2, CheckCircle2,
  ChevronDown, Clock, Ban, UserRound, ArrowUpRight, Code2, Terminal, GraduationCap, Award
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { displayName, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import type { User, RelationshipState } from '@/types';

// â”€â”€â”€ Validation schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Skill Tag Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { SkillEditor, ProfileSkeleton } from './ProfileHelpers';
import { ProfileEditForm } from './ProfileEditForm';
import {
  ProfileOverviewTab,
  ProfileSkillsTab,
  ProfileProjectsTab,
  ProfileFriendsTab,
} from './ProfileTabs';

// ─── Profile Master Component ────────────────────────────────────────────────
export function ProfileView({ paramsId }: { paramsId?: string }) {
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tabs: 'overview' | 'skills' | 'projects' | 'friends'
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'projects' | 'friends'>('overview');

  // Friendship / Social Graph State
  const [relState, setRelState] = useState<RelationshipState>('none');
  const [isHoveringSent, setIsHoveringSent] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Secondary Tab Data
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Skills endorsements state
  const [endorsedSkills, setEndorsedSkills] = useState<Record<string, number>>({});
  const [userEndorsedSet, setUserEndorsedSet] = useState<Set<string>>(new Set());

  // Image Upload Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isOwnProfile = !queryId || queryId === currentUser?.id;
  const activeUser = isOwnProfile ? currentUser : profileUser;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // â”€â”€â”€ Real-time Socket Event Listener â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useSocket({
    onRelationshipUpdate: (data) => {
      if (!activeUser || !currentUser) return;
      if (data.senderId === activeUser.id || data.receiverId === activeUser.id) {
        const newRel = (data.senderId === currentUser.id ? data.relationship : data.reverseRelationship) as RelationshipState;
        if (newRel) {
          setRelState(newRel);
          setProfileUser((prev) => (prev ? { ...prev, friendshipStatus: newRel } : prev));
          showToast(`Relationship updated: ${newRel.replace(/_/g, ' ')}`);
        }
      }
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
  });

  // â”€â”€â”€ Load Profile Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadProfile = useCallback(() => {
    if (isOwnProfile) {
      if (currentUser) {
        setProfileUser(currentUser);
        setRelState('SELF');
        reset({
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          bio: currentUser.bio ?? '',
          university: currentUser.university ?? '',
          department: currentUser.department ?? currentUser.major ?? '',
          year_of_study: currentUser.year_of_study ?? currentUser.yearOfStudy ?? undefined,
          github_url: currentUser.github_url ?? currentUser.github ?? '',
          linkedin_url: currentUser.linkedin_url ?? currentUser.linkedin ?? '',
          portfolio_url: currentUser.portfolio_url ?? currentUser.portfolio ?? '',
        });
        setSkills(currentUser.skills ? currentUser.skills.map((s: any) => typeof s === 'string' ? s : s?.name || '') : []);
        setNotFound(false);
      }
      setLoading(false);
    } else if (queryId) {
      setLoading(true);
      setFetchError(null);
      api.users.getById(queryId).then((res) => {
        if (res.ok && res.id) {
          setProfileUser(res);
          setRelState((res.friendshipStatus as RelationshipState) || 'NOT_FRIEND');
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
  }, [queryId, isOwnProfile, currentUser, reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load Tab Specific Data (Lazy on active tab change)
  useEffect(() => {
    if (!activeUser?.id) return;

    if (activeTab === 'friends' && friendsList.length === 0) {
      setLoadingFriends(true);
      const reqPromise = isOwnProfile
        ? api.friends.list()
        : api.users.getUserFriends(activeUser.id);

      reqPromise.then((res) => {
        if (res.ok && res.friends) setFriendsList(res.friends);
      }).finally(() => setLoadingFriends(false));
    }

    if (activeTab === 'projects' && projectsList.length === 0) {
      setLoadingProjects(true);
      api.projects.list({ owner_id: activeUser.id }).then((res) => {
        if (res.ok && res.projects) setProjectsList(res.projects);
      }).finally(() => setLoadingProjects(false));
    }
  }, [activeTab, activeUser?.id, isOwnProfile, friendsList.length, projectsList.length]);

  // â”€â”€â”€ Image Upload Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          showToast('Profile photo updated');
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
          showToast('Cover photo updated');
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

  // â”€â”€â”€ Skill Endorsements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleEndorseSkill = async (skillName: string) => {
    if (!profileUser?.id || isOwnProfile) return;
    const currentCount = endorsedSkills[skillName] ?? 0;
    const isEndorsed = userEndorsedSet.has(skillName);

    setUserEndorsedSet((prev) => {
      const next = new Set(prev);
      if (isEndorsed) next.delete(skillName);
      else next.add(skillName);
      return next;
    });
    setEndorsedSkills((prev) => ({
      ...prev,
      [skillName]: isEndorsed ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));

    try {
      await api.users.endorseSkill(profileUser.id, skillName);
      showToast(isEndorsed ? `Removed endorsement for ${skillName}` : `Endorsed ${skillName}!`);
    } catch {
      setUserEndorsedSet((prev) => {
        const next = new Set(prev);
        if (isEndorsed) next.add(skillName);
        else next.delete(skillName);
        return next;
      });
      setEndorsedSkills((prev) => ({ ...prev, [skillName]: currentCount }));
    }
  };

  // â”€â”€â”€ Friendship Action Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSendFriendRequest = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setRelState('REQUEST_SENT');
    try {
      const res = await api.friends.sendRequest(profileUser.id);
      if (res.ok) {
        showToast('Friend request sent!');
      } else {
        setRelState('NOT_FRIEND');
        showToast(res.error || 'Could not send friend request');
      }
    } catch {
      setRelState('NOT_FRIEND');
      showToast('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setRelState('NOT_FRIEND');
    try {
      const res = await api.friends.cancelRequest(profileUser.id);
      if (res.ok) {
        showToast('Friend request cancelled');
      } else {
        setRelState('REQUEST_SENT');
        showToast(res.error || 'Failed to cancel request');
      }
    } catch {
      setRelState('REQUEST_SENT');
      showToast('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setRelState('FRIEND');
    try {
      const res = await api.friends.acceptRequest(profileUser.id);
      if (res.ok) {
        setProfileUser((p) => p ? { ...p, friendCount: (p.friendCount || 0) + 1 } : p);
        showToast(`You and ${displayName(profileUser)} are now friends!`);
      } else {
        setRelState('REQUEST_RECEIVED');
        showToast(res.error || 'Failed to accept request');
      }
    } catch {
      setRelState('REQUEST_RECEIVED');
      showToast('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setRelState('NOT_FRIEND');
    try {
      const res = await api.friends.rejectRequest(profileUser.id);
      if (res.ok) {
        showToast('Request declined');
      } else {
        setRelState('REQUEST_RECEIVED');
      }
    } catch {
      setRelState('REQUEST_RECEIVED');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setShowFriendMenu(false);
    setRelState('NOT_FRIEND');
    try {
      const res = await api.friends.unfriend(profileUser.id);
      if (res.ok) {
        setProfileUser((p) => p ? { ...p, friendCount: Math.max(0, (p.friendCount || 0) - 1) } : p);
        showToast('Removed from friends');
      } else {
        setRelState('FRIEND');
        showToast(res.error || 'Failed to unfriend');
      }
    } catch {
      setRelState('FRIEND');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!profileUser?.id || actionLoading) return;
    setActionLoading(true);
    setRelState('NOT_FRIEND');
    try {
      await api.friends.unblock(profileUser.id);
      showToast('User unblocked');
    } catch {
      setRelState('BLOCKED');
    } finally {
      setActionLoading(false);
    }
  };

  // â”€â”€â”€ Profile Form Submission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      setEditing(false);
      showToast('Profile updated successfully');
    }
    setSaving(false);
  };

  if (loading) return <ProfileSkeleton />;

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
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm tap-press cursor-pointer"
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
          <Link href="/people" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-xs">
            Discover Teammates
          </Link>
          <Link href="/dashboard" className="px-4 py-2 border border-border text-sm font-medium rounded-xl hover:bg-accent transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const name = displayName(activeUser ?? undefined);
  const avatarColor = activeUser?.avatar_color || activeUser?.avatarColor || getAvatarColor(activeUser?.id ?? '');
  const bannerImage = activeUser?.banner || activeUser?.banner_image || activeUser?.bannerImage;
  const isVerifiedStudent = activeUser?.is_verified ?? activeUser?.isVerified ?? true;
  const mutualCount = activeUser?.mutualCount ?? 0;
  const mutualFriends = activeUser?.mutualFriends ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
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
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-2xl font-medium flex items-center justify-between shadow-sm">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="p-1 hover:bg-destructive/20 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* â”€â”€â”€ Hero Cover & Studio Avatar Dock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative rounded-3xl overflow-hidden border border-foreground/10 dark:border-foreground/5 bg-card shadow-xl">
        {/* Cover Banner */}
        <div
          className="h-44 sm:h-56 relative overflow-hidden group shadow-inner transition-all"
          style={{
            background: bannerImage
              ? `url(${bannerImage}) center/cover no-repeat`
              : `linear-gradient(135deg, ${avatarColor}44 0%, hsl(var(--background)) 100%)`,
            backgroundColor: avatarColor + '22',
          }}
        >
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-3.5 left-3.5 px-3 py-1.5 surface-floating border border-foreground/20 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md tap-press cursor-pointer"
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

        {/* Profile Card Header Info */}
        <div className="px-5 sm:px-7 pb-6 pt-3 relative bg-card/95">
          {/* Avatar Area (Positioned Floating Over Banner) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-3">
            <div className="relative group self-start">
              <div className="ring-4 ring-card rounded-3xl overflow-hidden shadow-2xl bg-card">
                <UserAvatar
                  user={activeUser}
                  size="2xl"
                  showStatus
                  status={activeUser?.online_status === 'online' ? 'online' : 'offline'}
                  interactive
                />
              </div>

              {/* Avatar Upload Button (Hover Overlay for Own Profile) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-3xl bg-background/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-xs cursor-pointer active:scale-95"
                  title="Upload Profile Picture"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-[10px] font-bold mt-1">Change</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* â”€â”€â”€ Context-Aware Dynamic Action Dock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-end pt-2 sm:pt-0">
              {isOwnProfile ? (
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-sm tap-press cursor-pointer"
                >
                  {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              ) : (
                <>
                  {/* NOT_FRIEND State */}
                  {relState === 'NOT_FRIEND' && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-sm tap-press cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      <span>Add Friend</span>
                    </button>
                  )}

                  {/* REQUEST_SENT State (Flips on hover to Cancel Request) */}
                  {relState === 'REQUEST_SENT' && (
                    <button
                      onClick={handleCancelRequest}
                      onMouseEnter={() => setIsHoveringSent(true)}
                      onMouseLeave={() => setIsHoveringSent(false)}
                      disabled={actionLoading}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm tap-press cursor-pointer border',
                        isHoveringSent
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      )}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isHoveringSent ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>{isHoveringSent ? 'Cancel Request' : 'Request Sent'}</span>
                    </button>
                  )}

                  {/* REQUEST_RECEIVED State (Dual Action: Accept / Decline) */}
                  {relState === 'REQUEST_RECEIVED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm tap-press cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={handleRejectRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-2xl text-sm font-semibold transition-all tap-press cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* FRIEND State (Friends Dropdown with Unfriend option) */}
                  {relState === 'FRIEND' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowFriendMenu(!showFriendMenu)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-2xl text-sm font-semibold hover:bg-emerald-500/20 transition-all shadow-xs tap-press cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Friends</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showFriendMenu && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {showFriendMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 surface-floating border border-foreground/10 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1"
                          >
                            <Link
                              href={`/messages?userId=${activeUser.id}`}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted/70 text-foreground transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-primary" />
                              <span>Direct Message</span>
                            </Link>
                            <button
                              onClick={handleUnfriend}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Unfriend</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* BLOCKED State */}
                  {relState === 'BLOCKED' && (
                    <button
                      onClick={handleUnblock}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-2xl text-sm font-semibold transition-all tap-press cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Unblock</span>
                    </button>
                  )}

                  {/* Direct Message Quick Action */}
                  <Link
                    href={`/messages?userId=${activeUser.id}`}
                    className="p-2.5 bg-secondary hover:bg-accent border border-border/80 rounded-2xl text-muted-foreground hover:text-foreground transition-colors tap-press cursor-pointer"
                    title="Send message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Identity & Campus Badges */}
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{name}</h1>
              {isVerifiedStudent && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Verified Campus Student</span>
                </span>
              )}
            </div>

            {/* University & Major */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              {activeUser?.university && (
                <span className="flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5 text-primary/70" />
                  {activeUser.university}
                </span>
              )}
              {(activeUser?.major || activeUser?.department) && (
                <>
                  <span>•</span>
                  <span>{activeUser.major || activeUser.department}</span>
                </>
              )}
              {(activeUser?.year_of_study || activeUser?.yearOfStudy) && (
                <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-semibold">
                  Year {activeUser.year_of_study || activeUser.yearOfStudy}
                </span>
              )}
            </div>

            {/* Bio snippet */}
            {activeUser?.bio && (
              <p className="text-sm text-foreground/90 leading-relaxed pt-1 max-w-2xl whitespace-pre-wrap">
                {activeUser.bio}
              </p>
            )}

            {/* â”€â”€â”€ Social Proof: Mutual Friends Pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {!isOwnProfile && mutualCount > 0 && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full surface-glass border border-foreground/10 text-xs text-muted-foreground shadow-xs">
                  <div className="flex -space-x-2 shrink-0">
                    {mutualFriends.slice(0, 3).map((mf) => (
                      <UserProfileHoverCard key={mf.id} user={mf}>
                        <div className="ring-2 ring-background rounded-full">
                          <UserAvatar user={mf} size="xs" />
                        </div>
                      </UserProfileHoverCard>
                    ))}
                  </div>
                  <span>
                    <strong className="text-foreground font-semibold">
                      {mutualCount} mutual friend{mutualCount === 1 ? '' : 's'}
                    </strong>
                    {mutualFriends.length > 0 && (
                      <span className="hidden sm:inline">
                        {' '}including {mutualFriends.slice(0, 2).map((m) => displayName(m)).join(', ')}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Social & Portfolio Links */}
            <div className="flex gap-4 pt-2 text-xs text-muted-foreground flex-wrap">
              {(activeUser?.github_url || activeUser?.github) && (
                <a
                  href={activeUser.github_url || activeUser.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <GitBranch className="w-4 h-4 text-primary/80" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
              {(activeUser?.linkedin_url || activeUser?.linkedin) && (
                <a
                  href={activeUser.linkedin_url || activeUser.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-blue-500/80" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
              {(activeUser?.portfolio_url || activeUser?.portfolio) && (
                <a
                  href={activeUser.portfolio_url || activeUser.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Globe className="w-4 h-4 text-emerald-500/80" />
                  <span>Portfolio</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* â”€â”€â”€ Profile Navigation Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-2 px-5 sm:px-7 border-t border-foreground/10 dark:border-foreground/5 bg-muted/20 overflow-x-auto py-2">
          {[
            { id: 'overview',  label: 'Overview',              icon: BookOpen },
            { id: 'skills',    label: `Skills (${skills.length || activeUser?.skills?.length || 0})`, icon: Sparkles },
            { id: 'projects',  label: `Projects (${activeUser?.projectCount ?? 0})`, icon: FolderGit2 },
            { id: 'friends',   label: `Friends (${activeUser?.friendCount ?? 0})`, icon: Users },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer tap-press',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* â”€â”€â”€ Edit Profile Form (Expanded on Toggle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editing && isOwnProfile && (
        <ProfileEditForm
          register={register as any}
          errors={errors}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          skills={skills}
          setSkills={setSkills}
          saving={saving}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* â”€â”€â”€ TAB CONTENT PANELS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <ProfileOverviewTab
          activeUser={activeUser}
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* TAB 2: SKILLS & ENDORSEMENTS */}
      {activeTab === 'skills' && (
        <ProfileSkillsTab
          activeUser={activeUser}
          skills={skills}
          endorsedSkills={endorsedSkills}
          userEndorsedSet={userEndorsedSet}
          isOwnProfile={isOwnProfile}
          onEdit={() => setEditing(true)}
          onEndorseSkill={handleEndorseSkill}
        />
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <ProfileProjectsTab
          projectsList={projectsList}
          loadingProjects={loadingProjects}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* TAB 4: FRIENDS & CONNECTIONS */}
      {activeTab === 'friends' && (
        <ProfileFriendsTab
          friendsList={friendsList}
          loadingFriends={loadingFriends}
          friendCount={activeUser?.friendCount ?? 0}
        />
      )}

      {/* â”€â”€â”€ Floating Confirmation Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl surface-floating border border-foreground/10 text-white text-xs font-semibold shadow-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

