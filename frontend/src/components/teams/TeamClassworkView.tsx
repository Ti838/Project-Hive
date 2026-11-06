'use client';
// ─── Team Classwork View (Google Classroom & Canvas Grade) ────────────────────

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Calendar, CheckCircle2, Clock, ExternalLink,
  Plus, Trash2, Edit3, AlertCircle, Award, Upload, Link2, X,
  BookOpen, ChevronRight, Check, Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface Deliverable {
  id: string;
  title: string;
  dueDate: string;
  rubric: string;
  status: 'assigned' | 'submitted' | 'reviewed';
  submissionUrl?: string;
  submittedAt?: string;
  score?: string;
}

export interface CourseworkData {
  courseCode?: string;
  instructor?: string;
  deliverables?: Deliverable[];
  syllabusUrl?: string;
}

interface TeamClassworkViewProps {
  teamId: string;
  team: any;
  isLeader: boolean;
  isMember: boolean;
  onUpdate: () => void;
}

const DEFAULT_DELIVERABLES: Deliverable[] = [
  {
    id: 'del_1',
    title: 'Sprint 1: Software Requirements & System Architecture',
    dueDate: '2026-11-20',
    rubric: 'Functional/Non-functional specifications, ERD, and C4 Architecture Diagrams.',
    status: 'submitted',
    submissionUrl: 'https://github.com/Ti838/Project-Hive',
    submittedAt: '2026-11-04',
    score: '96 / 100',
  },
  {
    id: 'del_2',
    title: 'Sprint 2: MVP Core API & Database Integration',
    dueDate: '2026-12-05',
    rubric: 'Working REST & WebSocket endpoints, authentication, and Supabase database schema.',
    status: 'assigned',
  },
  {
    id: 'del_3',
    title: 'Final Capstone: Live Production Deployment & Pitch',
    dueDate: '2026-12-25',
    rubric: 'Live deployed URL, product demo video, user testing feedback, and pitch deck.',
    status: 'assigned',
  },
];

export function TeamClassworkView({ teamId, team, isLeader, isMember, onUpdate }: TeamClassworkViewProps) {
  // Parse coursework data from team.rules
  const getInitialData = (): CourseworkData => {
    if (team?.rules) {
      try {
        const parsed = typeof team.rules === 'string' ? JSON.parse(team.rules) : team.rules;
        if (parsed && typeof parsed === 'object') {
          return {
            courseCode: parsed.courseCode || 'CSE470: Software Engineering Capstone',
            instructor: parsed.instructor || 'Faculty Advisory Panel',
            deliverables: Array.isArray(parsed.deliverables) && parsed.deliverables.length > 0
              ? parsed.deliverables
              : DEFAULT_DELIVERABLES,
            syllabusUrl: parsed.syllabusUrl || 'https://github.com/Ti838/Project-Hive/blob/main/README.md',
          };
        }
      } catch {
        // Fallback
      }
    }
    return {
      courseCode: 'CSE470: Software Engineering Capstone',
      instructor: 'Faculty Advisory Panel',
      deliverables: DEFAULT_DELIVERABLES,
      syllabusUrl: 'https://github.com/Ti838/Project-Hive/blob/main/README.md',
    };
  };

  const [data, setData] = useState<CourseworkData>(getInitialData);
  const [submittingDeliv, setSubmittingDeliv] = useState<Deliverable | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal for new deliverable (Leader only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newRubric, setNewRubric] = useState('');

  // Course Details Edit (Leader only)
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseCodeInput, setCourseCodeInput] = useState(data.courseCode || '');
  const [instructorInput, setInstructorInput] = useState(data.instructor || '');

  const deliverables = data.deliverables || DEFAULT_DELIVERABLES;
  const completedCount = deliverables.filter((d) => d.status === 'submitted' || d.status === 'reviewed').length;
  const progressPercent = deliverables.length > 0 ? Math.round((completedCount / deliverables.length) * 100) : 0;

  const persistCoursework = async (updated: CourseworkData) => {
    setData(updated);
    setSaving(true);
    try {
      await api.teams.update(teamId, {
        rules: JSON.stringify(updated) as any,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update coursework:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTurnIn = (deliv: Deliverable) => {
    setSubmittingDeliv(deliv);
    setSubmissionUrl(deliv.submissionUrl || '');
  };

  const confirmTurnIn = async () => {
    if (!submittingDeliv) return;
    const updatedDeliverables = deliverables.map((d) =>
      d.id === submittingDeliv.id
        ? {
            ...d,
            status: 'submitted' as const,
            submissionUrl: submissionUrl.trim() || 'https://github.com/Ti838/Project-Hive',
            submittedAt: new Date().toISOString().split('T')[0],
          }
        : d
    );
    await persistCoursework({ ...data, deliverables: updatedDeliverables });
    setSubmittingDeliv(null);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newMilestone: Deliverable = {
      id: `del_${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      rubric: newRubric.trim() || 'Complete implementation with documentation and verification.',
      status: 'assigned',
    };

    await persistCoursework({
      ...data,
      deliverables: [...deliverables, newMilestone],
    });

    setNewTitle('');
    setNewDueDate('');
    setNewRubric('');
    setShowAddModal(false);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Remove this academic milestone?')) return;
    const updatedDeliverables = deliverables.filter((d) => d.id !== id);
    await persistCoursework({ ...data, deliverables: updatedDeliverables });
  };

  const saveCourseInfo = async () => {
    await persistCoursework({
      ...data,
      courseCode: courseCodeInput.trim() || 'CSE470: Software Engineering Capstone',
      instructor: instructorInput.trim() || 'Faculty Advisory Panel',
    });
    setEditingCourse(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Google Classroom-Grade Academic Banner ─────────────────────── */}
      <div className="surface-glass rounded-3xl p-6 sm:p-8 border border-foreground/10 shadow-xl relative overflow-hidden bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Google Classroom & Academic Mesh
              </span>
              {isLeader && !editingCourse && (
                <button
                  onClick={() => setEditingCourse(true)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
                  title="Edit Course Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {editingCourse ? (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={courseCodeInput}
                  onChange={(e) => setCourseCodeInput(e.target.value)}
                  placeholder="e.g. CSE470: Software Engineering"
                  className="w-full text-base font-bold bg-background/80 rounded-xl px-3 py-2 border border-border focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={instructorInput}
                  onChange={(e) => setInstructorInput(e.target.value)}
                  placeholder="Instructor / Advisor Name"
                  className="w-full text-xs bg-background/80 rounded-xl px-3 py-2 border border-border focus:border-primary focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveCourseInfo}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Save Course Info
                  </button>
                  <button
                    onClick={() => setEditingCourse(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {data.courseCode}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Instructor: <span className="font-semibold text-foreground/80">{data.instructor}</span> • Team Project Track
                </p>
              </div>
            )}
          </div>

          {/* Progress Card */}
          <div className="surface-floating p-4 rounded-2xl border border-foreground/10 shrink-0 min-w-[200px] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Academic Progress</span>
              <span className="font-mono font-extrabold text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-muted/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right font-medium">
              {completedCount} of {deliverables.length} Deliverables Completed
            </p>
          </div>
        </div>
      </div>

      {/* ── Deliverables Section Header & Add Milestone Action ───────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-base text-foreground">Project Deliverables & Sprints</h3>
        </div>

        {isLeader && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 tap-press transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deliverable</span>
          </button>
        )}
      </div>

      {/* ── Deliverables Grid ────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        {deliverables.map((d, index) => {
          const isSubmitted = d.status === 'submitted';
          const isReviewed = d.status === 'reviewed';

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="surface-glass rounded-2xl p-5 border border-foreground/10 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1',
                      isReviewed
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : isSubmitted
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    )}
                  >
                    {isReviewed ? (
                      <>
                        <Award className="w-3 h-3" /> Graded {d.score ? `(${d.score})` : ''}
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Assigned
                      </>
                    )}
                  </span>

                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due {d.dueDate}
                  </span>

                  {d.submittedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      (Turned in {d.submittedAt})
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-foreground">{d.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                  {d.rubric}
                </p>

                {d.submissionUrl && (
                  <div className="pt-1">
                    <a
                      href={d.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                    >
                      <Link2 className="w-3 h-3" /> View Submitted Artifact ({d.submissionUrl.replace(/^https?:\/\//, '').slice(0, 32)}…)
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                {isMember && (
                  <button
                    onClick={() => handleTurnIn(d)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-semibold tap-press transition-all flex items-center gap-1.5',
                      isSubmitted
                        ? 'bg-secondary hover:bg-accent text-secondary-foreground'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isSubmitted ? 'Resubmit / Edit Link' : 'Turn In'}</span>
                  </button>
                )}

                {isLeader && (
                  <button
                    onClick={() => handleDeleteMilestone(d.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Turn In Submission Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {submittingDeliv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface-floating rounded-3xl p-6 sm:p-7 border border-foreground/15 shadow-2xl max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Turn In Project Deliverable</h3>
                </div>
                <button
                  onClick={() => setSubmittingDeliv(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">{submittingDeliv.title}</p>
                <p className="text-[11px] text-muted-foreground">Rubric criteria: {submittingDeliv.rubric}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Submission URL (GitHub Repo / Live Demo / Google Drive)
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://github.com/... or https://..."
                  className="w-full h-11 text-xs bg-muted/60 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingDeliv(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmTurnIn}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 tap-press transition-all shadow-md"
                >
                  {saving ? 'Submitting…' : 'Submit Deliverable'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Academic Milestone Modal (Leader Only) ───────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface-floating rounded-3xl p-6 sm:p-7 border border-foreground/15 shadow-2xl max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Add Course Deliverable Milestone</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMilestone} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Sprint 3: Security Audit & API Performance Benchmarking"
                    className="w-full h-11 text-xs bg-muted/60 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full h-11 text-xs bg-muted/60 rounded-xl px-4 border border-foreground/10 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Evaluation Criteria / Rubric
                  </label>
                  <textarea
                    rows={3}
                    value={newRubric}
                    onChange={(e) => setNewRubric(e.target.value)}
                    placeholder="List expected deliverables, architecture guidelines, or rubric checkpoints…"
                    className="w-full text-xs bg-muted/60 rounded-xl p-3 border border-foreground/10 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 tap-press transition-all shadow-md"
                  >
                    {saving ? 'Creating…' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

