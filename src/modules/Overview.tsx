import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Flame,
  MessagesSquare,
  ScanEye,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Volume2,
  Zap,
} from 'lucide-react';
import { Badge, BarChart, Card } from '@/components/ui';
import { hasGeminiKey } from '@/lib/gemini';
import type { FocusSession, ModuleKey, QuizAttempt, UserStats } from '@/types';
import { NAV_ITEMS } from '@/components/Sidebar';

const MODULE_CARDS: { key: ModuleKey; icon: typeof Volume2; gradient: string; points: string[] }[] = [
  { key: 'transcriber', icon: Volume2, gradient: 'from-brand-500 to-brand-700', points: ['Audio & text input', '3-part AI summary', 'Exam questions'] },
  { key: 'solver', icon: ScanEye, gradient: 'from-emerald-500 to-teal-700', points: ['Image upload', 'Handwriting OCR', 'Socratic steps'] },
  { key: 'flashcards', icon: Sparkles, gradient: 'from-amber-500 to-orange-600', points: ['3D flip cards', 'Adaptive MCQs', 'Saved decks'] },
  { key: 'planner', icon: CalendarClock, gradient: 'from-rose-500 to-pink-600', points: ['Auto spaced repetition', 'Mastery tracking', 'Timeline view'] },
  { key: 'tutor', icon: MessagesSquare, gradient: 'from-sky-500 to-indigo-600', points: ['Socratic dialogue', 'All subjects', 'Saved sessions'] },
  { key: 'focus', icon: Timer, gradient: 'from-violet-500 to-purple-600', points: ['Pomodoro timer', 'Focus & break cycles', 'Session tracking'] },
];

export function Overview({
  stats,
  attempts,
  focusSessions,
  onNavigate,
}: {
  stats: UserStats;
  attempts: QuizAttempt[];
  focusSessions: FocusSession[];
  onNavigate: (k: ModuleKey) => void;
}) {
  const recent = [...attempts].sort((a, b) => b.takenAt - a.takenAt).slice(0, 4);
  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.pct, 0) / attempts.length)
    : 0;

  // Build last-7-days focus-minutes chart
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const mins = focusSessions
      .filter((s) => new Date(s.completedAt).toISOString().slice(0, 10) === key)
      .reduce((sum, s) => sum + s.minutes, 0);
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: mins, tone: 'bg-brand-500' };
  });

  const statCards = [
    { label: 'Day Streak', value: stats.streak, suffix: 'days', icon: Flame, tone: 'from-amber-400 to-orange-500' },
    { label: 'Mastery', value: stats.masteryPct, suffix: '%', icon: Target, tone: 'from-emerald-400 to-teal-500' },
    { label: 'Quizzes Taken', value: stats.quizzesTaken, suffix: '', icon: Zap, tone: 'from-brand-400 to-brand-600' },
    { label: 'Focus Minutes', value: stats.focusMinutes, suffix: 'm', icon: Timer, tone: 'from-violet-400 to-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Badge tone={hasGeminiKey ? 'emerald' : 'amber'}>
              {hasGeminiKey ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Gemini connected</> : <><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Demo mode — add API key</>}
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl">
              Your universal <span className="bg-gradient-to-r from-brand-500 to-emerald-500 bg-clip-text text-transparent">academic study suite</span>
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Transcribe lectures, solve problems by photo, generate flashcards & quizzes, and schedule spaced-repetition revision — all in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate('transcriber')}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500"
              >
                <Volume2 className="h-4 w-4" /> Start transcribing
              </button>
              <button
                onClick={() => onNavigate('flashcards')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" /> Generate flashcards
              </button>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/30" />
              <div className="absolute inset-2 rounded-full bg-brand-500/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-2xl shadow-brand-600/40">
                <BookOpenCheck className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.tone} text-white shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {s.value}<span className="text-base font-medium text-slate-400">{s.suffix}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Module grid */}
      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-slate-900 dark:text-white">Study modules</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODULE_CARDS.map((m, i) => {
            const Icon = m.icon;
            const nav = NAV_ITEMS.find((n) => n.key === m.key)!;
            return (
              <motion.button
                key={m.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => onNavigate(m.key)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 text-left shadow-sm backdrop-blur transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${m.gradient} opacity-10 blur-2xl transition group-hover:opacity-20`} />
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">{nav.label}</h4>
                      <ArrowRight className="h-4 w-4 -translate-x-1 text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{nav.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {m.points.map((p) => (
                        <li key={p}>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-500" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Focus minutes — last 7 days</h3>
          </div>
          <BarChart data={chartData} height={140} />
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Quick stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.lecturesProcessed}</p>
              <p className="text-xs text-slate-500">Lectures processed</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.tutorChats}</p>
              <p className="text-xs text-slate-500">Tutor chats</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.topicsTracked}</p>
              <p className="text-xs text-slate-500">Topics tracked</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <p className="text-2xl font-bold text-emerald-500">{avg}%</p>
              <p className="text-xs text-slate-500">Avg quiz score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent quiz attempts */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Recent quiz activity</h3>
          <Badge tone="brand">Avg {avg}%</Badge>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Zap className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No quizzes yet. Generate a deck and take a quiz to see your progress here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{a.deckTitle}</p>
                  <p className="text-xs text-slate-400">{new Date(a.takenAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.score}/{a.total}</span>
                  <Badge tone={a.pct >= 80 ? 'emerald' : a.pct >= 50 ? 'amber' : 'rose'}>{a.pct}%</Badge>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
