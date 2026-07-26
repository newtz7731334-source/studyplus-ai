import type { LucideIcon } from 'lucide-react';

export type ModuleKey =
  | 'overview'
  | 'transcriber'
  | 'solver'
  | 'flashcards'
  | 'planner'
  | 'tutor'
  | 'focus';

export interface NavItem {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface LectureResult {
  summary: string;
  terminology: { term: string; definition: string }[];
  examQuestions: string[];
}

export interface SolverResult {
  extracted: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Deck {
  id: string;
  title: string;
  createdAt: number;
  cards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface QuizAttempt {
  deckId: string;
  deckTitle: string;
  score: number;
  total: number;
  pct: number;
  takenAt: number;
}

export interface PlanTopic {
  id: string;
  title: string;
  notes?: string;
  createdAt: number;
  status: 'learning' | 'needs-revision' | 'mastered';
  // scheduled revision dates (ms)
  schedule: number[];
  // index of next due schedule entry
  nextIndex: number;
  lastReviewed?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface FocusSession {
  id: string;
  label: string;
  minutes: number;
  completedAt: number;
}

export interface UserStats {
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  masteryPct: number;
  quizzesTaken: number;
  topicsTracked: number;
  lecturesProcessed: number;
  focusMinutes: number;
  tutorChats: number;
}
