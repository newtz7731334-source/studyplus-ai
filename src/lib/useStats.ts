import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { UserStats } from '@/types';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

export function useStats() {
  const [stats, setStats] = useState<UserStats>(() => storage.getStats());

  // Update streak on mount
  useEffect(() => {
    setStats((prev) => {
      const today = todayStr();
      if (prev.lastActiveDay === today) return prev;
      const diff = dayDiff(prev.lastActiveDay, today);
      const newStreak = diff === 1 ? prev.streak + 1 : diff <= 0 ? prev.streak : 1;
      const next = { ...prev, streak: newStreak, lastActiveDay: today };
      storage.setStats(next);
      return next;
    });
  }, []);

  const update = useCallback((patch: Partial<UserStats>) => {
    setStats((prev) => {
      const next = { ...prev, ...patch };
      storage.setStats(next);
      return next;
    });
  }, []);

  const recomputeMastery = useCallback(() => {
    setStats((prev) => {
      const topics = storage.getTopics();
      const mastered = topics.filter((t) => t.status === 'mastered').length;
      const pct = topics.length ? Math.round((mastered / topics.length) * 100) : 0;
      const next = { ...prev, masteryPct: pct, topicsTracked: topics.length };
      storage.setStats(next);
      return next;
    });
  }, []);

  return { stats, update, recomputeMastery };
}
