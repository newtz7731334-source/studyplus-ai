import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, Pause, Play, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { storage } from '@/lib/storage';
import type { FocusSession, UserStats } from '@/types';

type Phase = 'focus' | 'break';
const PRESETS = [15, 25, 45];

export function Focus({
  stats,
  onUpdateStats,
  onFocusCompleted,
}: {
  stats: UserStats;
  onUpdateStats: (patch: Partial<UserStats>) => void;
  onFocusCompleted: (session: FocusSession) => void;
}) {
  const toast = useToast();
  const [duration, setDuration] = useState(25);
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('');
  const [sessions, setSessions] = useState<FocusSession[]>(() => storage.getFocus());
  const intervalRef = useRef<number | null>(null);

  const persist = useCallback((next: FocusSession[]) => {
    setSessions(next);
    storage.setFocus(next);
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          complete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const complete = useCallback(() => {
    setRunning(false);
    if (phase === 'focus') {
      const s: FocusSession = {
        id: `focus_${Date.now()}`,
        label: label.trim() || 'Study session',
        minutes: duration,
        completedAt: Date.now(),
      };
      persist([s, ...sessions]);
      onFocusCompleted(s);
      onUpdateStats({ focusMinutes: stats.focusMinutes + duration });
      toast.success(`${duration}-minute focus session complete. Take a break!`);
      setPhase('break');
      setRemaining(5 * 60);
    } else {
      toast.info('Break over. Ready for another focus session?');
      setPhase('focus');
      setRemaining(duration * 60);
    }
  }, [phase, duration, label, sessions, persist, onFocusCompleted, onUpdateStats, stats.focusMinutes, toast]);

  const start = () => { setRunning(true); };
  const pause = () => { setRunning(false); };
  const reset = () => {
    setRunning(false);
    setPhase('focus');
    setRemaining(duration * 60);
  };

  const setPreset = (m: number) => {
    setDuration(m);
    setRunning(false);
    setPhase('focus');
    setRemaining(m * 60);
  };

  const removeSession = (id: string) => persist(sessions.filter((s) => s.id !== id));

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const total = phase === 'focus' ? duration * 60 : 5 * 60;
  const progress = total ? ((total - remaining) / total) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const dash = (progress / 100) * circumference;

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => new Date(s.completedAt).toISOString().slice(0, 10) === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Timer className="h-6 w-6" />}
        title="Pomodoro Focus Timer"
        subtitle="Stay focused with timed study sessions and scheduled breaks. Your completed sessions are tracked automatically."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Timer */}
        <Card className="flex flex-col items-center p-6">
          <div className="mb-4 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  duration === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {p} min
              </button>
            ))}
          </div>

          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={phase === 'focus' ? 'stroke-brand-500' : 'stroke-emerald-500'}
                strokeDasharray={`${dash} ${circumference}`}
                animate={{ strokeDasharray: `${dash} ${circumference}` }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="flex flex-col items-center">
              <Badge tone={phase === 'focus' ? 'brand' : 'emerald'}>
                {phase === 'focus' ? <Timer className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                {phase === 'focus' ? 'Focus' : 'Break'}
              </Badge>
              <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-slate-900 dark:text-white">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </p>
            </div>
          </div>

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What are you working on?"
            className="mt-5 w-full max-w-xs rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-center text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          />

          <div className="mt-4 flex items-center gap-2">
            {running ? (
              <Button variant="secondary" onClick={pause}><Pause className="h-4 w-4" /> Pause</Button>
            ) : (
              <Button onClick={start} disabled={remaining === 0}><Play className="h-4 w-4" /> Start</Button>
            )}
            <Button variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</Button>
          </div>
        </Card>

        {/* Stats + history */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-300">{todayMinutes}</p>
              <p className="text-xs text-slate-500">Minutes today</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{todaySessions.length}</p>
              <p className="text-xs text-slate-500">Sessions today</p>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Session history</h3>
              <Badge tone="slate">{sessions.length}</Badge>
            </div>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Timer className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No sessions yet. Complete a focus session to see it here.</p>
              </div>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                <AnimatePresence>
                  {sessions.map((s) => (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{s.label}</p>
                        <p className="text-xs text-slate-400">{new Date(s.completedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{s.minutes}m</Badge>
                        <button
                          onClick={() => removeSession(s.id)}
                          className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                          aria-label="Delete session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
