'use client';
// ─── People & Teammates Directory ──────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Users, MessageSquare, Check, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { displayName, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { User } from '@/types';

export default function PeoplePage() {
  const [people, setPeople] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.users.getPeople(1, 60).then((res) => {
      if (res.ok && res.users) {
        // Deduplicate users by ID
        const seen = new Set<string>();
        const unique = res.users.filter((u) => {
          if (!u.id || seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });
        setPeople(unique);
      }
      setLoading(false);
    });
  }, []);

  const sendFriendReq = async (id: string) => {
    setRequested((prev) => ({ ...prev, [id]: true }));
    await api.friends.requests.send(id);
  };

  const filtered = people.filter(
    (u) =>
      displayName(u).toLowerCase().includes(search.toLowerCase()) ||
      u.university?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase()) ||
      u.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover Teammates</h1>
        <p className="text-sm text-muted-foreground">Find collaborators by university, major, and technical skillset</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by student name, university, or skill (e.g., Python, React)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No students match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((student) => {
            const name = displayName(student);
            const color = student.avatar_color || getAvatarColor(student.id);
            const isReq = requested[student.id];

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <Link href={`/profile/view?id=${student.id}`} className="relative shrink-0 group">
                    {student.avatar ? (
                      <img src={student.avatar} alt={name} className="w-12 h-12 rounded-xl object-cover group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    {student.online_status === 'online' && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/view?id=${student.id}`} className="font-bold text-sm truncate block hover:text-primary transition-colors">
                      {name}
                    </Link>
                    {student.university && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        {student.university}
                      </p>
                    )}
                    {student.department && (
                      <p className="text-xs text-muted-foreground/80 truncate">{student.department}</p>
                    )}
                  </div>
                </div>

                {student.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {student.bio}
                  </p>
                )}

                {student.skills && student.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.slice(0, 4).map((s) => (
                      <span key={s} className="text-[11px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                    {student.skills.length > 4 && (
                      <span className="text-[11px] text-muted-foreground">+{student.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => sendFriendReq(student.id)}
                    disabled={isReq}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors min-h-[38px]',
                      isReq
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {isReq ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {isReq ? 'Connected' : 'Connect'}
                  </button>
                  <Link
                    href={`/profile/view?id=${student.id}`}
                    className="py-2 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors flex items-center gap-1 min-h-[38px]"
                    title="View Profile"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/messages`}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[38px] flex items-center justify-center"
                    title="Send message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

