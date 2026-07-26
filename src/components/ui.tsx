import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          {icon}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-500" />
      </div>
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500 shadow-sm shadow-brand-600/20',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function BarChart({ data, max, height = 120 }: { data: { label: string; value: number; tone?: string }[]; max?: number; height?: number }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / m) * (height - 24));
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{d.value}</span>
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${d.tone ?? 'bg-brand-500'}`}
              style={{ height: h }}
            />
            <span className="text-[10px] text-slate-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
