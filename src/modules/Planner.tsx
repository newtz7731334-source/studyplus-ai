import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { storage } from '@/lib/storage';
import type { PlanTopic } from '@/types';

const INTERVALS = [1, 3, 7, 14]; // days

function makeSchedule(start: number): number[] {
  return INTERVALS.map((d) => start + d * 86400000);
}

function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relativeDay(ts: number): string {
  const diff = Math.round((ts - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'today';
  return `in ${diff}d`;
}

export function Planner({ onTopicsChanged }: { onTopicsChanged: () => void }) {
  const toast = useToast();
  const [topics, setTopics] = useState<PlanTopic[]>(() => storage.getTopics());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const persist = useCallback((next: PlanTopic[]) => {
    setTopics(next);
    storage.setTopics(next);
    onTopicsChanged();
  }, [onTopicsChanged]);

  const addTopic = useCallback(() => {
    if (!title.trim()) {
      toast.warning('Give the topic a title first.');
      return;
    }
    const now = Date.now();
    const t: PlanTopic = {
      id: `topic_${now}`,
      title: title.trim(),
      notes: notes.trim() || undefined,
      createdAt: now,
      status: 'learning',
      schedule: makeSchedule(now),
      nextIndex: 0,
    };
    persist([t, ...topics]);
    setTitle('');
    setNotes('');
    toast.success('Topic added to your revision plan.');
  }, [title, notes, topics, persist, toast]);

  const setStatus = useCallback((id: string, status: PlanTopic['status']) => {
    persist(topics.map((t) => (t.id === id ? { ...t, status } : t)));
  }, [topics, persist]);

  const markReviewed = useCallback((id: string) => {
    persist(
      topics.map((t) => {
        if (t.id !== id) return t;
        const nextIndex = Math.min(t.nextIndex + 1, t.schedule.length);
        return { ...t, nextIndex, lastReviewed: Date.now(), status: nextIndex >= t.schedule.length ? 'mastered' as const : 'needs-revision' as const };
      }),
    );
    toast.success('Review logged. Next session scheduled.');
  }, [topics, persist, toast]);

  const remove = useCallback((id: string) => {
    persist(topics.filter((t) => t.id !== id));
    toast.info('Topic removed.');
  }, [topics, persist, toast]);

  const dueToday = useMemo(
    () => topics.filter((t) => t.status !== 'mastered' && t.schedule[t.nextIndex] <= Date.now() + 86400000),
    [topics],
  );
  const mastered = topics.filter((t) => t.status === 'mastered');

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<CalendarClock className="h-6 w-6" />}
        title="Spaced-Repetition Planner & Revision Tracker"
        subtitle="Add topics and we'll schedule automated revision sessions at 1, 3, 7, and 14 days. Mark each as mastered or needs revision."
      />

      {/* Add topic */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Topic title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              placeholder="e.g. Integration by parts"
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
          </div>
          <div className="sm:w-64">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Page, chapter, etc."
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
          </div>
          <Button onClick={addTopic}><Plus className="h-4 w-4" /> Add topic</Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-300">{topics.length}</p>
          <p className="text-xs text-slate-500">Tracked</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{dueToday.length}</p>
          <p className="text-xs text-slate-500">Due soon</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{mastered.length}</p>
          <p className="text-xs text-slate-500">Mastered</p>
        </Card>
      </div>

      {/* Due today */}
      {dueToday.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Due for revision</h3>
          </div>
          <ul className="space-y-2">
            {dueToday.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-500/5 p-3 dark:border-amber-800/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Session {t.nextIndex + 1}/{t.schedule.length} · {relativeDay(t.schedule[t.nextIndex])}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => markReviewed(t.id)}>
                  <Check className="h-3.5 w-3.5" /> Reviewed
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* All topics with timeline */}
      <Card className="p-5">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">All topics</h3>
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No topics yet. Add one above to start your revision timeline.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {topics.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                      {t.notes && <p className="mt-0.5 text-xs text-slate-500">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={t.status === 'mastered' ? 'emerald' : t.status === 'needs-revision' ? 'amber' : 'brand'}>
                        {t.status === 'mastered' ? 'Mastered' : t.status === 'needs-revision' ? 'Needs revision' : 'Learning'}
                      </Badge>
                      <button
                        onClick={() => remove(t.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        aria-label="Remove topic"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {t.schedule.map((ts, i) => {
                      const done = i < t.nextIndex;
                      const current = i === t.nextIndex && t.status !== 'mastered';
                      return (
                        <div key={i} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                                done
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : current
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                  : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900'
                              }`}
                            >
                              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <span className="mt-1 text-[10px] text-slate-400">{dayLabel(ts)}</span>
                          </div>
                          {i < t.schedule.length - 1 && (
                            <div className={`mx-1 h-0.5 w-6 ${i < t.nextIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          )}
                        </div>
                      );
                    })}
                    {t.status === 'mastered' && (
                      <div className="ml-2 flex items-center gap-1 text-xs font-semibold text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" /> Complete
                      </div>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.status !== 'mastered' && (
                      <Button size="sm" variant="secondary" onClick={() => markReviewed(t.id)}>
                        <RotateCcw className="h-3.5 w-3.5" /> Log review
                      </Button>
                    )}
                    {t.status !== 'mastered' && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(t.id, 'mastered')}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark mastered
                      </Button>
                    )}
                    {t.status === 'mastered' && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(t.id, 'learning')}>
                        <Circle className="h-3.5 w-3.5" /> Reset status
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </div>
  );
}
