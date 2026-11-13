'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  Users,
  CheckCheck,
  Clock,
  UserPlus,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { displayName, cn } from '@/lib/utils';
import type { User, RelationshipState } from '@/types';

interface StudentDirectoryCardProps {
  student: User;
  currentUser: User | null;
  relState: RelationshipState;
  isSelf: boolean;
  actionLoading?: boolean;
  endorsedSkillKeys: Set<string>;
  onConnect: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  onToggleEndorse: (e: React.MouseEvent, studentId: string, skill: any) => void;
}

export function StudentDirectoryCard({
  student,
  currentUser,
  relState,
  isSelf,
  actionLoading,
  endorsedSkillKeys,
  onConnect,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onToggleEndorse,
}: StudentDirectoryCardProps) {
  const router = useRouter();
  const name = displayName(student);
  const rawSkills = Array.isArray(student.skills) ? student.skills : [];
  const mutualCount = student.mutualCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="surface-glass rounded-3xl p-5 border border-foreground/10 dark:border-foreground/5 hover:border-primary/40 hover:shadow-xl transition-all flex flex-col justify-between gap-4 bg-card/60 backdrop-blur-md"
    >
      {/* Student Header Details */}
      <div className="space-y-3">
        <div className="flex items-start gap-3.5">
          <UserAvatar
            user={student}
            size="xl"
            showStatus
            status={student.online_status}
            interactive
            onClick={() => router.push(`/profile?id=${student.id}`)}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile?id=${student.id}`}
                className="font-extrabold text-sm text-foreground hover:text-primary transition-colors truncate block"
              >
                {name}
              </Link>
              {student.is_verified && (
                <span title="Verified Campus Scholar">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                </span>
              )}
            </div>

            {/* Major / University snippet */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary/70" />
              <span className="truncate">
                {student.major || student.department || 'Undergraduate'}
              </span>
            </div>

            {student.university && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                <Building2 className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">{student.university}</span>
                {(student.year_of_study || student.yearOfStudy) && (
                  <span>· Year {student.year_of_study || student.yearOfStudy}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio snippet */}
        {student.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
            {student.bio}
          </p>
        )}

        {/* Skills Row: up to 3 interactive chips */}
        {rawSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rawSkills.slice(0, 3).map((s: any, idx: number) => {
              const skillName = typeof s === 'string' ? s : s?.name || '';
              const skillId = typeof s === 'string' ? s : s?.id;
              const endorsements = typeof s === 'object' ? s?.endorsements || 0 : 0;
              const isEndorsedByMe = endorsedSkillKeys.has(`${student.id}-${skillId}`);

              return (
                <button
                  key={skillId || skillName || idx}
                  type="button"
                  onClick={(e) => onToggleEndorse(e, student.id, s)}
                  title={
                    isSelf
                      ? skillName
                      : `Click to ${isEndorsedByMe ? 'un-endorse' : 'endorse'} ${skillName}`
                  }
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer select-none',
                    isEndorsedByMe
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-xs'
                      : 'bg-muted/40 border-border/60 text-foreground/80 hover:bg-muted/80'
                  )}
                >
                  <span>{skillName}</span>
                  {endorsements > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
                      {endorsements + (isEndorsedByMe ? 1 : 0)}
                    </span>
                  )}
                </button>
              );
            })}
            {rawSkills.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-medium self-center px-1">
                +{rawSkills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Social Proof & Context-Aware Action Dock */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        {/* Mutual Friends Social Proof */}
        <div>
          {mutualCount > 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-primary">
              <Users className="w-3.5 h-3.5" />
              <span>{mutualCount} mutual</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">
              {student.online_status === 'online' ? (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online now
                </span>
              ) : (
                'ProjectHive Member'
              )}
            </span>
          )}
        </div>

        {/* Context Action Button */}
        <div>
          {isSelf ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-muted text-muted-foreground select-none">
              You
            </span>
          ) : relState === 'FRIEND' ? (
            <Link
              href={`/messages?user=${student.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Friends ✓</span>
            </Link>
          ) : relState === 'REQUEST_SENT' ? (
            <button
              onClick={() => onCancelRequest(student.id)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-rose-500/15 hover:text-rose-500 hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer group"
              title="Click to cancel friend request"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="group-hover:hidden">Request Sent</span>
              <span className="hidden group-hover:inline">Cancel</span>
            </button>
          ) : relState === 'REQUEST_RECEIVED' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onAcceptRequest(student.id)}
                disabled={actionLoading}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xs hover:bg-emerald-600 transition-all cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => onDeclineRequest(student.id)}
                disabled={actionLoading}
                className="px-2 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-rose-500 text-xs font-medium transition-all cursor-pointer"
              >
                Decline
              </button>
            </div>
          ) : (
            <button
              onClick={() => onConnect(student.id)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 tap-press transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Connect</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

