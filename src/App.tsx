import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar, NAV_ITEMS } from '@/components/Sidebar';
import { Overview } from '@/modules/Overview';
import { Transcriber } from '@/modules/Transcriber';
import { Solver } from '@/modules/Solver';
import { Flashcards } from '@/modules/Flashcards';
import { Planner } from '@/modules/Planner';
import { Tutor } from '@/modules/Tutor';
import { Focus } from '@/modules/Focus';
import { Login } from '@/modules/Login';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';
import { useStats } from '@/lib/useStats';
import { storage } from '@/lib/storage';
import type { FocusSession, ModuleKey, QuizAttempt } from '@/types';

function Shell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) return <Login />;
  return <StudySuite />;
}

function StudySuite() {
  const [active, setActive] = useState<ModuleKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { stats, update, recomputeMastery } = useStats();
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => storage.getAttempts());
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => storage.getFocus());

  const title = useMemo(() => NAV_ITEMS.find((n) => n.key === active)?.label ?? 'StudyPulse AI', [active]);

  const onQuizCompleted = useCallback((attempt: QuizAttempt) => {
    setAttempts((a) => [attempt, ...a].slice(0, 50));
  }, []);

  const onFocusCompleted = useCallback((session: FocusSession) => {
    setFocusSessions((f) => [session, ...f].slice(0, 100));
  }, []);

  const renderModule = () => {
    switch (active) {
      case 'overview':
        return <Overview stats={stats} attempts={attempts} focusSessions={focusSessions} onNavigate={setActive} />;
      case 'transcriber':
        return <Transcriber stats={stats} onUpdateStats={update} />;
      case 'solver':
        return <Solver />;
      case 'flashcards':
        return <Flashcards stats={stats} onUpdateStats={update} onQuizCompleted={onQuizCompleted} />;
      case 'planner':
        return <Planner onTopicsChanged={recomputeMastery} />;
      case 'tutor':
        return <Tutor stats={stats} onUpdateStats={update} />;
      case 'focus':
        return <Focus stats={stats} onUpdateStats={update} onFocusCompleted={onFocusCompleted} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-30" />
      <Sidebar active={active} onSelect={setActive} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Header stats={stats} onMenu={() => setSidebarOpen(true)} title={title} />
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
