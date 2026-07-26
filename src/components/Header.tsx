import { motion } from 'framer-motion';
import { Flame, Menu, Moon, Sun, Target, Zap } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import type { UserStats } from '@/types';

export function Header({
  stats,
  onMenu,
  title,
}: {
  stats: UserStats;
  onMenu: () => void;
  title: string;
}) {
  const { theme, toggle } = useTheme();

  const chips = [
    { icon: Flame, label: 'Streak', value: `${stats.streak}d`, tone: 'text-amber-500' },
    { icon: Target, label: 'Mastery', value: `${stats.masteryPct}%`, tone: 'text-emerald-500' },
    { icon: Zap, label: 'Quizzes', value: `${stats.quizzesTaken}`, tone: 'text-brand-500' },
  ];

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white lg:hidden">{title}</h2>

      <div className="ml-auto hidden items-center gap-2 sm:flex">
        {chips.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <Icon className={`h-4 w-4 ${c.tone}`} />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* mobile compact chips */}
      <div className="ml-auto flex items-center gap-1.5 sm:hidden">
        {chips.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/60 px-2 py-1 dark:border-slate-800 dark:bg-slate-900/60">
              <Icon className={`h-3.5 w-3.5 ${c.tone}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{c.value}</span>
            </div>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="ml-1 rounded-xl border border-slate-200 bg-white/60 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.button>
    </header>
  );
}
