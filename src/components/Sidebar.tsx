import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpenCheck,
  CalendarClock,
  LayoutDashboard,
  MessagesSquare,
  ScanEye,
  Sparkles,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import type { ModuleKey, NavItem } from '@/types';

export const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', description: 'Your study dashboard', icon: LayoutDashboard },
  { key: 'transcriber', label: 'Lecture Transcriber', description: 'Audio & notes to summaries', icon: Volume2 },
  { key: 'solver', label: 'Socratic Solver', description: 'Vision problem solver', icon: ScanEye },
  { key: 'flashcards', label: 'Flashcards & Quiz', description: 'AI decks and quizzes', icon: Sparkles },
  { key: 'planner', label: 'Study Planner', description: 'Spaced repetition', icon: CalendarClock },
  { key: 'tutor', label: 'AI Socratic Tutor', description: 'Chat with a mentor', icon: MessagesSquare },
  { key: 'focus', label: 'Focus Timer', description: 'Pomodoro sessions', icon: Timer },
];

export function Sidebar({
  active,
  onSelect,
  open,
  onClose,
}: {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950/80 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
              <BookOpenCheck className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
            </div>
            <div>
              <p className="font-display text-base font-bold leading-tight text-slate-900 dark:text-white">StudyPulse AI</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-brand-500 dark:text-brand-300">Academic Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-700 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-500"
                  />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-300' : ''}`} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{item.description}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500/10 to-emerald-500/10 px-3 py-3">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Powered by <span className="font-semibold">Gemini 1.5</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
