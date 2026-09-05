'use client';

// ─── Student Discovery Directory ──────────────────────────────────────────────

import { useEffect, useState, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  UserPlus,
  Users,
  MessageSquare,
  Check,
  GraduationCap,
  Sparkles,
  X,
  Filter,
  CheckCheck,
  Clock,
  ThumbsUp,
  Building2,
  ChevronRight,
  ShieldCheck,
  Radio,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { displayName, cn } from '@/lib/utils';
import type { User, RelationshipState } from '@/types';

// Preset filters for Bangladesh/Global university ecosystems
const MAJORS = [
  'All Majors',
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Software Engineering',
  'Business Administration',
  'Architecture & Design',
  'Data Science & AI',
  'Civil Engineering',
];

const UNIVERSITIES = [
  'All Campuses',
  'SMUCT',
  'BUET',
  'DU',
  'NSU',
  'BRAC University',
  'IUT',
  'AUST',
  'AIUB',
  'UIU',
];

const POPULAR_SKILLS = [
  'React',
  'Next.js',
  'Node.js',
  'TypeScript',
  'Python',
  'Figma',
  'AI/ML',
  'Tailwind CSS',
  'PostgreSQL',
];

export default function PeoplePage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { socket } = useSocket();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('All Majors');
  const [selectedUniversity, setSelectedUniversity] = useState('All Campuses');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Pagination & Data State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [people, setPeople] = useState<User[]>([]);
  const [recommended, setRecommended] = useState<Array<User & { reason?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Optimistic Relationship state map: userId -> RelationshipState
  const [relOverrides, setRelOverrides] = useState<Record<string, RelationshipState>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [endorsedSkillKeys, setEndorsedSkillKeys] = useState<Set<string>>(new Set());

  // 1. Debounce Search Input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 2. Fetch Recommended Peers once
  useEffect(() => {
    let isMounted = true;
    setLoadingRecommended(true);
    api.users
      .getRecommended()
      .then((res) => {
        if (isMounted && res.ok && res.users) {
          setRecommended(res.users);
        }
      })
      .catch((err) => {
        console.error('Failed to load recommended peers:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingRecommended(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Paginated & Filtered People
  const loadPeople = useCallback(
    async (currentPage = 1) => {
      setLoading(true);
      try {
        const majorParam = selectedMajor !== 'All Majors' ? selectedMajor : undefined;
        const uniParam = selectedUniversity !== 'All Campuses' ? selectedUniversity : undefined;
        const skillParam = selectedSkill || undefined;
        const statusParam = availableOnly ? 'available' : undefined;

        const res = await api.users.getPeople({
          search: debouncedSearch || undefined,
          major: majorParam,
          university: uniParam,
          skill: skillParam,
          status: statusParam,
          page: currentPage,
          limit: 18,
        });

        if (res.ok && res.users) {
          setPeople(res.users);
          setTotalCount(res.total || res.users.length);
          setTotalPages(res.pages || 1);
        }
      } catch (err) {
        console.error('Error fetching people directory:', err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, selectedMajor, selectedUniversity, selectedSkill, availableOnly]
  );

  useEffect(() => {
    loadPeople(page);
  }, [loadPeople, page]);

  // 4. Socket.IO Realtime Relationship Listener
  useEffect(() => {
    if (!socket) return;

    const handleRelationshipUpdate = (data: {
      senderId?: string;
      receiverId?: string;
      relationship?: RelationshipState;
      reverseRelationship?: RelationshipState;
    }) => {
      const myId = currentUser?.id;
      if (!myId) return;

      if (data.senderId === myId && data.receiverId) {
        setRelOverrides((prev) => ({
          ...prev,
          [data.receiverId!]: data.relationship || 'NOT_FRIEND',
        }));
      } else if (data.receiverId === myId && data.senderId) {
        setRelOverrides((prev) => ({
          ...prev,
          [data.senderId!]: data.reverseRelationship || 'NOT_FRIEND',
        }));
      }
    };

    socket.on('social:relationship-update', handleRelationshipUpdate);
    return () => {
      socket.off('social:relationship-update', handleRelationshipUpdate);
    };
  }, [socket, currentUser?.id]);

  // 5. Friendship Actions
  const handleConnect = async (targetId: string) => {
    if (actionLoading[targetId]) return;
    setActionLoading((prev) => ({ ...prev, [targetId]: true }));
    setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_SENT' }));

    try {
      const res = await api.friends.requests.send(targetId);
      if (!res.ok) {
        // Rollback on failure
        setRelOverrides((prev) => ({ ...prev, [targetId]: 'NOT_FRIEND' }));
      }
    } catch {
      setRelOverrides((prev) => ({ ...prev, [targetId]: 'NOT_FRIEND' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleCancelRequest = async (targetId: string) => {
    if (actionLoading[targetId]) return;
    setActionLoading((prev) => ({ ...prev, [targetId]: true }));
    setRelOverrides((prev) => ({ ...prev, [targetId]: 'NOT_FRIEND' }));

    try {
      const res = await api.friends.requests.cancel(targetId);
      if (!res.ok) {
        setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_SENT' }));
      }
    } catch {
      setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_SENT' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleAcceptRequest = async (targetId: string) => {
    if (actionLoading[targetId]) return;
    setActionLoading((prev) => ({ ...prev, [targetId]: true }));
    setRelOverrides((prev) => ({ ...prev, [targetId]: 'FRIEND' }));

    try {
      const res = await api.friends.requests.accept(targetId);
      if (!res.ok) {
        setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_RECEIVED' }));
      }
    } catch {
      setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_RECEIVED' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleDeclineRequest = async (targetId: string) => {
    if (actionLoading[targetId]) return;
    setActionLoading((prev) => ({ ...prev, [targetId]: true }));
    setRelOverrides((prev) => ({ ...prev, [targetId]: 'NOT_FRIEND' }));

    try {
      const res = await api.friends.requests.reject(targetId);
      if (!res.ok) {
        setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_RECEIVED' }));
      }
    } catch {
      setRelOverrides((prev) => ({ ...prev, [targetId]: 'REQUEST_RECEIVED' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  // 6. Skill Endorsement Interaction
  const handleToggleEndorse = async (e: React.MouseEvent, studentId: string, skill: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || currentUser.id === studentId) return;

    const skillId = typeof skill === 'string' ? skill : skill.id;
    const key = `${studentId}-${skillId}`;

    const isAlready = endorsedSkillKeys.has(key);
    setEndorsedSkillKeys((prev) => {
      const next = new Set(prev);
      if (isAlready) next.delete(key);
      else next.add(key);
      return next;
    });

    if (typeof skill === 'object' && skill.id) {
      await api.users.endorseSkill(studentId, skill.id).catch(() => {});
    }
  };

  const hasActiveFilters =
    searchInput !== '' ||
    selectedMajor !== 'All Majors' ||
    selectedUniversity !== 'All Campuses' ||
    selectedSkill !== null ||
    availableOnly;

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedMajor('All Majors');
    setSelectedUniversity('All Campuses');
    setSelectedSkill(null);
    setAvailableOnly(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen pb-16 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ─── Hero Header & Search Bar ────────────────────────────────────────── */}
      <div className="pt-2 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Campus Talent Graph & Teammates</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Student Discovery Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Find cross-campus collaborators, complement your technical skillsets, and assemble
              high-performance project squads.
            </p>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-card/80 border border-border/80 rounded-2xl px-4 py-2.5 shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-xs">
              <span className="font-bold text-foreground">
                {totalCount} Verified Student{totalCount === 1 ? '' : 's'}
              </span>
              <p className="text-[10px] text-muted-foreground">Active in network</p>
            </div>
          </div>
        </div>

        {/* Primary Search Bar with Instant Clear */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student name, university, major, or skill (e.g. React, Next.js, Python)..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-card/90 border border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/15 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-xs transition-all outline-hidden"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── Faceted Filter Suite ────────────────────────────────────────── */}
        <div className="bg-card/70 border border-white/10 dark:border-white/5 rounded-3xl p-4 sm:p-5 shadow-xs backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Filter className="w-4 h-4 text-primary" />
              <span>Faceted Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Availability Toggle */}
            <button
              type="button"
              onClick={() => setAvailableOnly(!availableOnly)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer select-none',
                availableOnly
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    availableOnly ? 'bg-emerald-500 shadow-xs shadow-emerald-500/80' : 'bg-zinc-400'
                  )}
                />
                Available for Squads
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {availableOnly ? 'Active' : 'Off'}
              </span>
            </button>

            {/* Department / Major Selector */}
            <div className="relative">
              <select
                value={selectedMajor}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs font-medium text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-hidden cursor-pointer appearance-none"
              >
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Campus Selector */}
            <div className="relative">
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs font-medium text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-hidden cursor-pointer appearance-none"
              >
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Skill Tag Chips */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold text-muted-foreground">Filter by Skillsets:</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = selectedSkill?.toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(isSelected ? null : skill);
                      setPage(1);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs shadow-primary/30 font-semibold'
                        : 'bg-muted/30 border-border/50 text-foreground/80 hover:bg-muted hover:border-border'
                    )}
                  >
                    {skill}
                  </button>
                );
              })}
              {selectedSkill && !POPULAR_SKILLS.some((s) => s.toLowerCase() === selectedSkill.toLowerCase()) && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary text-primary-foreground border border-primary">
                  {selectedSkill}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recommended Peers Shelf ────────────────────────────────────────── */}
      {recommended.length > 0 && !hasActiveFilters && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Recommended for You
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">Based on your campus & skill graph</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((student) => {
              const name = displayName(student);
              const isSelf = currentUser?.id === student.id;
              const relState = relOverrides[student.id] || student.friendshipStatus || 'NOT_FRIEND';

              return (
                <div
                  key={student.id}
                  className="surface-glass rounded-3xl p-4 border border-amber-500/20 bg-linear-to-br from-amber-500/5 via-transparent to-primary/5 hover:border-amber-500/40 hover:shadow-lg transition-all flex flex-col justify-between gap-3 relative overflow-hidden group"
                >
                  {/* Top Match Reason Pill */}
                  {student.reason && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit">
                      <Sparkles className="w-3 h-3" />
                      <span className="truncate max-w-[240px]">{student.reason}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={student}
                      size="lg"
                      showStatus
                      status={student.online_status}
                      interactive
                      onClick={() => router.push(`/profile?id=${student.id}`)}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile?id=${student.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.major || student.department || student.university || 'Campus Scholar'}
                      </p>
                    </div>
                  </div>

                  {/* Context Aware Quick Connect */}
                  {!isSelf && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground/80 truncate">
                        {student.university || 'Active Member'}
                      </span>

                      {relState === 'FRIEND' ? (
                        <Link
                          href={`/messages?user=${student.id}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </Link>
                      ) : relState === 'REQUEST_SENT' ? (
                        <button
                          onClick={() => handleCancelRequest(student.id)}
                          disabled={actionLoading[student.id]}
                          className="px-3 py-1.5 rounded-xl bg-muted/60 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-all cursor-pointer"
                          title="Click to cancel request"
                        >
                          Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(student.id)}
                          disabled={actionLoading[student.id]}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 tap-press transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Main Directory Grid ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            {hasActiveFilters ? 'Filtered Students' : 'Explore All Students'}
          </h2>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-muted/40 border border-border/40 animate-pulse p-5"
              />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-20 bg-card/40 border border-dashed border-border/80 rounded-3xl p-8 space-y-4">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">No students match your criteria</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Try clearing active skill filters or selecting "All Majors" to expand your campus discovery.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {people.map((student) => {
              const name = displayName(student);
              const isSelf = currentUser?.id === student.id;
              const relState = relOverrides[student.id] || student.friendshipStatus || 'NOT_FRIEND';
              const rawSkills = Array.isArray(student.skills) ? student.skills : [];
              const mutualCount = student.mutualCount || 0;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="surface-glass rounded-3xl p-5 border border-white/10 dark:border-white/5 hover:border-primary/40 hover:shadow-xl transition-all flex flex-col justify-between gap-4 bg-card/60 backdrop-blur-md"
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
                              onClick={(e) => handleToggleEndorse(e, student.id, s)}
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

                  {/* ─── Footer: Social Proof & Context-Aware Action Dock ───────────── */}
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
                          onClick={() => handleCancelRequest(student.id)}
                          disabled={actionLoading[student.id]}
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
                            onClick={() => handleAcceptRequest(student.id)}
                            disabled={actionLoading[student.id]}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xs hover:bg-emerald-600 transition-all cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(student.id)}
                            disabled={actionLoading[student.id]}
                            className="px-2 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-rose-500 text-xs font-medium transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(student.id)}
                          disabled={actionLoading[student.id]}
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
            })}
          </div>
        )}

        {/* ─── Pagination Controls ────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
