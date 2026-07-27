import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessagesSquare,
  ScanEye,
  Sparkles,
  Timer,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

type Mode = 'signin' | 'signup';

const FEATURES = [
  { icon: Volume2, label: 'Lecture Transcriber' },
  { icon: ScanEye, label: 'Socratic Vision Solver' },
  { icon: Sparkles, label: 'Flashcards & Quizzes' },
  { icon: CalendarClock, label: 'Spaced-Repetition Planner' },
  { icon: MessagesSquare, label: 'AI Socratic Tutor' },
  { icon: Timer, label: 'Pomodoro Focus Timer' },
];

export function Login() {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.warning('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast.success('Welcome back!');
      } else {
        await signUp(email.trim(), password);
        toast.success('Account created. You are signed in.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        {/* Brand / feature panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/30">
              <BookOpenCheck className="h-6 w-6" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-50 dark:ring-slate-950" />
            </div>
            <div>
              <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">StudyPulse AI</p>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-500 dark:text-brand-300">The Universal Academic Study Suite</p>
            </div>
          </div>

          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">
            Your entire study workflow, <span className="bg-gradient-to-r from-brand-500 to-emerald-500 bg-clip-text text-transparent">in one place</span>.
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Transcribe lectures, solve problems by photo, generate flashcards and quizzes, chat with a Socratic tutor, and schedule spaced repetition — all powered by Google Gemini.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.li
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-sm font-medium text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                  {f.label}
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 sm:p-8">
            {/* Mobile brand */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-extrabold text-slate-900 dark:text-white">StudyPulse AI</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-brand-500">Academic Suite</p>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'signin' ? 'Sign in to continue your study journey.' : 'Start studying smarter in seconds.'}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-white/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full !py-2.5">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing you agree to keep your study data private. We use Supabase secure authentication.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
