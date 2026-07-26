import type { ChatSession, Deck, FocusSession, PlanTopic, QuizAttempt, UserStats } from '@/types';

const KEYS = {
  decks: 'sp_decks_v1',
  attempts: 'sp_quiz_attempts_v1',
  topics: 'sp_plan_topics_v1',
  stats: 'sp_user_stats_v1',
  theme: 'sp_theme_v1',
  chats: 'sp_chat_sessions_v1',
  focus: 'sp_focus_sessions_v1',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
}

export const storage = {
  getDecks: () => read<Deck[]>(KEYS.decks, []),
  setDecks: (d: Deck[]) => write(KEYS.decks, d),

  getAttempts: () => read<QuizAttempt[]>(KEYS.attempts, []),
  setAttempts: (a: QuizAttempt[]) => write(KEYS.attempts, a),

  getTopics: () => read<PlanTopic[]>(KEYS.topics, []),
  setTopics: (t: PlanTopic[]) => write(KEYS.topics, t),

  getStats: () => read<UserStats>(KEYS.stats, {
    streak: 1,
    lastActiveDay: new Date().toISOString().slice(0, 10),
    masteryPct: 0,
    quizzesTaken: 0,
    topicsTracked: 0,
    lecturesProcessed: 0,
    focusMinutes: 0,
    tutorChats: 0,
  }),
  setStats: (s: UserStats) => write(KEYS.stats, s),

  getTheme: () => read<'light' | 'dark'>(KEYS.theme, 'dark'),
  setTheme: (t: 'light' | 'dark') => write(KEYS.theme, t),

  getChats: () => read<ChatSession[]>(KEYS.chats, []),
  setChats: (c: ChatSession[]) => write(KEYS.chats, c),

  getFocus: () => read<FocusSession[]>(KEYS.focus, []),
  setFocus: (f: FocusSession[]) => write(KEYS.focus, f),
};
