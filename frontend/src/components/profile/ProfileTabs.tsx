'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  School,
  Users,
  Code2,
  GitBranch,
  Terminal,
  GraduationCap,
  Award,
  Sparkles,
  FolderGit2,
  Loader2,
} from 'lucide-react';
import { cn, displayName } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserProfileHoverCard } from '@/components/ui/UserProfileHoverCard';
import type { User } from '@/types';

// ─── TAB 1: ProfileOverviewTab ───────────────────────────────────────────────
interface ProfileOverviewTabProps {
  activeUser: any;
  currentUser: any;
  isOwnProfile: boolean;
}

export function ProfileOverviewTab({
  activeUser,
  currentUser,
  isOwnProfile,
}: ProfileOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Identity & Academic Highlights */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="surface-glass border border-foreground/10 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <School className="w-4 h-4 text-primary" /> Academic Profile
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">University</span>
              <span className="font-semibold text-foreground">
                {activeUser?.university || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Department / Major</span>
              <span className="font-semibold text-foreground">
                {activeUser?.major || activeUser?.department || 'General'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Study Year</span>
              <span className="font-semibold text-foreground">
                Year {activeUser?.year_of_study || activeUser?.yearOfStudy || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="surface-glass border border-foreground/10 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Activity & Collaboration
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Collaborative Friends</span>
              <span className="font-semibold text-foreground">{activeUser?.friendCount ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Projects Showcase</span>
              <span className="font-semibold text-foreground">
                {activeUser?.projectCount ?? 0} projects
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Available Hours</span>
              <span className="font-semibold text-foreground">
                {activeUser?.hours_per_week || activeUser?.hoursPerWeek || 10} hrs / week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Developer & Academic Identity Card */}
      <div className="surface-glass border border-foreground/10 rounded-2xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" /> Verified Developer & Academic Identity
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {activeUser?.settings?.lookingForSquads !== false
              ? '🟢 Available for Squad Recruitment'
              : '⚪ Focus Mode'}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-foreground" /> GitHub Developer
            </div>
            <p className="font-mono text-xs font-bold text-foreground truncate">
              {activeUser?.github
                ? activeUser.github.replace(/^https?:\/\/github\.com\/?/, '@')
                : 'Connected'}
            </p>
            <p className="text-[10px] text-muted-foreground">Active Contributor</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-amber-500" /> Competitive Coding
            </div>
            <p className="font-mono text-xs font-bold text-foreground truncate">
              LeetCode / Codeforces
            </p>
            <p className="text-[10px] text-muted-foreground">Problem Solver</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Google Scholar
            </div>
            <p className="font-mono text-xs font-bold text-foreground truncate">
              {activeUser?.department || 'Academic Mesh'}
            </p>
            <p className="text-[10px] text-muted-foreground">Undergrad Researcher</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <Award className="w-3.5 h-3.5 text-purple-500" /> Hackathon Track
            </div>
            <p className="font-mono text-xs font-bold text-foreground truncate">
              Devpost / Campus
            </p>
            <p className="text-[10px] text-muted-foreground">
              {activeUser?.projectCount ?? 1} Published Works
            </p>
          </div>
        </div>
      </div>

      {/* Profile Strength & Completion (Own profile only) */}
      {isOwnProfile && (() => {
        const u = activeUser || currentUser;
        const skillsList = Array.isArray(u?.skills) ? u.skills : [];
        const fields = [
          Boolean(u?.first_name || u?.firstName),
          Boolean(u?.last_name || u?.lastName),
          Boolean(u?.avatar || u?.avatar_color || u?.avatarColor),
          Boolean(u?.bio && String(u.bio).trim().length > 5),
          Boolean(u?.university),
          Boolean(u?.department || u?.major),
          Boolean(u?.year_of_study || u?.yearOfStudy),
          Boolean(skillsList.length > 0),
          Boolean(u?.github || u?.github_url || u?.linkedin || u?.linkedin_url || u?.portfolio || u?.portfolio_url),
        ];
        const calc = Math.round((fields.filter(Boolean).length / fields.length) * 100);
        const completionPct = (u?.completion_percentage && u.completion_percentage > 0)
          ? u.completion_percentage
          : calc;

        return (
          <div className="surface-glass border border-foreground/10 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-foreground">Profile Strength & Teammate Readiness</p>
              </div>
              <span className={cn(
                'text-xs font-extrabold px-2.5 py-0.5 rounded-full',
                completionPct >= 80 ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-primary/15 text-primary border border-primary/30'
              )}>
                {completionPct}% Complete
              </span>
            </div>
            <div className="h-2.5 bg-muted/70 rounded-full overflow-hidden p-0.5 border border-foreground/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(8, completionPct))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full transition-all',
                  completionPct >= 80 ? 'bg-emerald-500' : 'bg-primary'
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completionPct >= 100
                ? '🎉 Excellent! Your profile is 100% complete and highlighted to potential campus project recruiters.'
                : 'Add your university, bio, technical skills, and social links to attract top teammates.'}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── TAB 2: ProfileSkillsTab ─────────────────────────────────────────────────
interface ProfileSkillsTabProps {
  activeUser: any;
  skills: string[];
  endorsedSkills: Record<string, number>;
  userEndorsedSet: Set<string>;
  isOwnProfile: boolean;
  onEdit: () => void;
  onEndorseSkill: (skill: string) => void;
}

export function ProfileSkillsTab({
  activeUser,
  skills,
  endorsedSkills,
  userEndorsedSet,
  isOwnProfile,
  onEdit,
  onEndorseSkill,
}: ProfileSkillsTabProps) {
  const currentSkills = activeUser?.skills || skills;
  const hasNoSkills = (activeUser?.skills?.length ?? 0) === 0 && skills.length === 0;

  return (
    <div className="surface-glass border border-foreground/10 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Technical & Domain Skills
          </h3>
          <p className="text-xs text-muted-foreground">
            Peer-verified skills backed by fellow students and project teammates
          </p>
        </div>
        {isOwnProfile && (
          <button
            onClick={onEdit}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            + Add Skills
          </button>
        )}
      </div>

      {hasNoSkills ? (
        <div className="text-center py-10 text-muted-foreground space-y-2">
          <p className="text-sm">No skills added yet.</p>
          {isOwnProfile && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Add Your First Skill
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 pt-2">
          {currentSkills.map((skillItem: any) => {
            const skill = typeof skillItem === 'string' ? skillItem : skillItem?.name || '';
            const count = endorsedSkills[skill] ?? 0;
            const isEndorsed = userEndorsedSet.has(skill);
            return (
              <div
                key={skill}
                className="inline-flex items-center gap-2 text-xs bg-muted/60 border border-foreground/10 rounded-2xl pl-3.5 pr-2 py-1.5 shadow-2xs transition-all hover:border-primary/40"
              >
                <span className="font-semibold text-foreground">{skill}</span>
                {count > 0 && (
                  <span className="bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {count}
                  </span>
                )}
                {!isOwnProfile && (
                  <button
                    onClick={() => onEndorseSkill(skill)}
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-xl tap-press transition-colors cursor-pointer',
                      isEndorsed
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground'
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
  );
}

// ─── TAB 3: ProfileProjectsTab ───────────────────────────────────────────────
interface ProfileProjectsTabProps {
  projectsList: any[];
  loadingProjects: boolean;
  isOwnProfile: boolean;
}

export function ProfileProjectsTab({
  projectsList,
  loadingProjects,
  isOwnProfile,
}: ProfileProjectsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-primary" /> Showcase & Pinned Repositories
          </h3>
          <p className="text-xs text-muted-foreground">Public student projects and repositories</p>
        </div>
        {isOwnProfile && (
          <Link
            href="/projects"
            className="text-xs font-semibold text-primary hover:underline"
          >
            + New Project
          </Link>
        )}
      </div>

      {loadingProjects ? (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      ) : projectsList.length === 0 ? (
        <div className="surface-glass border border-foreground/10 rounded-3xl p-10 text-center text-muted-foreground space-y-3">
          <FolderGit2 className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium">No projects showcase yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projectsList.map((p) => (
            <Link
              key={p.id}
              href="/projects"
              className="surface-glass border border-foreground/10 hover:border-primary/40 rounded-2xl p-4 transition-all shadow-sm block space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground truncate">{p.title || p.name}</h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {p.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {p.description || 'No description provided'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: ProfileFriendsTab ────────────────────────────────────────────────
interface ProfileFriendsTabProps {
  friendsList: User[];
  loadingFriends: boolean;
  friendCount: number;
}

export function ProfileFriendsTab({
  friendsList,
  loadingFriends,
  friendCount,
}: ProfileFriendsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Friends & Teammates ({friendCount})
        </h3>
        <p className="text-xs text-muted-foreground">
          Campus connections and verified student collaborators
        </p>
      </div>

      {loadingFriends ? (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      ) : friendsList.length === 0 ? (
        <div className="surface-glass border border-foreground/10 rounded-3xl p-10 text-center text-muted-foreground space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium">No connections listed yet.</p>
          <Link
            href="/people"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90"
          >
            Discover Teammates
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {friendsList.map((f) => (
            <UserProfileHoverCard key={f.id} user={f}>
              <Link
                href={`/profile/view?id=${f.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl surface-glass border border-foreground/10 hover:border-primary/40 transition-all shadow-xs"
              >
                <UserAvatar
                  user={f}
                  size="md"
                  showStatus
                  status={f.online_status === 'online' ? 'online' : 'offline'}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate text-foreground">{displayName(f)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{f.university || 'Student'}</p>
                </div>
              </Link>
            </UserProfileHoverCard>
          ))}
        </div>
      )}
    </div>
  );
}

