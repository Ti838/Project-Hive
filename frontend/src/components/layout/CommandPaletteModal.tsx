'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Loader2,
  Users,
  Building2,
  FolderKanban,
  GraduationCap,
  ArrowRight,
  Star,
  LayoutDashboard,
  Rss,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { displayName } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { User as UserType, Team as TeamType, Project as ProjectType } from '@/types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cmdQuery: string;
  setCmdQuery: (q: string) => void;
  searchLoading: boolean;
  liveUsers: UserType[];
  liveTeams: TeamType[];
  liveProjects: ProjectType[];
  onSelect: (path: string) => void;
  cmdInputRef: React.RefObject<HTMLInputElement | null>;
  onSearch: (e: React.FormEvent) => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  cmdQuery,
  setCmdQuery,
  searchLoading,
  liveUsers,
  liveTeams,
  liveProjects,
  onSelect,
  cmdInputRef,
  onSearch,
}: CommandPaletteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/70 backdrop-blur-md"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-xl surface-floating rounded-2xl border border-border/70 shadow-2xl overflow-hidden z-10"
          >
            {/* Search Bar Input */}
            <form onSubmit={onSearch} className="flex items-center border-b border-border/60 px-4 h-14">
              <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
              <input
                ref={cmdInputRef}
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Search students, teams, showcase, or jump to route..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {cmdQuery && (
                <button
                  type="button"
                  onClick={() => setCmdQuery('')}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg tap-press mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border/60 rounded-md">
                ESC
              </kbd>
            </form>

            {/* Suggestions / Results */}
            <div className="p-2 max-h-96 overflow-y-auto space-y-2">
              {cmdQuery.trim() ? (
                <>
                  {/* Live Search Status Indicator */}
                  {searchLoading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Searching students, squads, and projects…</span>
                    </div>
                  )}

                  {/* Quick Direct Search Actions */}
                  <div className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      Quick Jump
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(`/people?search=${encodeURIComponent(cmdQuery.trim())}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Search students directory for &ldquo;{cmdQuery}&rdquo;</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">↵ Enter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelect(`/teams?search=${encodeURIComponent(cmdQuery.trim())}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Search squads & hubs for &ldquo;{cmdQuery}&rdquo;</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">Jump</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelect(`/showcase?search=${encodeURIComponent(cmdQuery.trim())}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left tap-press cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Search showcase for &ldquo;{cmdQuery}&rdquo;</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">Jump</span>
                    </button>
                  </div>

                  {/* Live Matching Students & Peers */}
                  {liveUsers.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-primary" /> Students & Peers ({liveUsers.length})
                      </div>
                      {liveUsers.map((u) => {
                        const uName = displayName(u);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => onSelect(`/profile/${u.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar user={u} size="xs" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground group-hover:text-primary transition-colors">
                                  <span className="truncate">{uName}</span>
                                  {u.is_verified && (
                                    <span className="text-primary text-[10px]">✓</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {u.university || u.major || u.email}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Live Matching Teams / Squads */}
                  {liveTeams.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-primary" /> Squads & Hubs ({liveTeams.length})
                      </div>
                      {liveTeams.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelect(`/teams`)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {t.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {t.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {t.category || (t.type === 'community' ? 'Community Hub' : 'Project Squad')} • {t.member_count ?? t.members?.length ?? 1} members
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live Matching Showcase Projects */}
                  {liveProjects.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                        <FolderKanban className="w-3 h-3 text-primary" /> Showcase Projects ({liveProjects.length})
                      </div>
                      {liveProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelect(`/showcase`)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-accent/70 transition-colors text-left tap-press cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-500/30" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {p.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {p.category || 'Innovation'} • {p.upvotes ?? p.upvote_count ?? p.likes ?? 0} upvotes
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchLoading && liveUsers.length === 0 && liveTeams.length === 0 && liveProjects.length === 0 && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No direct live records found. Click a quick jump option above or press Enter to search.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    Quick Navigate
                  </div>
                  {[
                    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/feed', label: 'Feed & Campus Updates', icon: Rss },
                    { href: '/messages', label: 'Real-time Chat & Direct Messages', icon: MessageSquare },
                    { href: '/people', label: 'Students & Peer Discovery', icon: Users },
                    { href: '/teams', label: 'Teams & Project Squads', icon: Building2 },
                    { href: '/showcase', label: 'Project Showcase', icon: FolderKanban },
                    { href: '/generator', label: 'Hive AI Studio', icon: Sparkles },
                  ].map(({ href, label, icon: Icon }) => (
                    <button
                      key={href}
                      type="button"
                      onClick={() => onSelect(href)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors text-left tap-press cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{href}</span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer status */}
            <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Navigation & Search</span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">↵</kbd>
                to select
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

