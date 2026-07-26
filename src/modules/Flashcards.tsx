import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, SectionTitle, Skeleton, Spinner } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { generateDeck, hasGeminiKey } from '@/lib/gemini';
import { storage } from '@/lib/storage';
import { deckToText, downloadText } from '@/lib/export';
import type { Deck, Flashcard, QuizAttempt, QuizQuestion, UserStats } from '@/types';

type Mode = 'cards' | 'quiz';

export function Flashcards({
  stats,
  onUpdateStats,
  onQuizCompleted,
}: {
  stats: UserStats;
  onUpdateStats: (patch: Partial<UserStats>) => void;
  onQuizCompleted: (attempt: QuizAttempt) => void;
}) {
  const toast = useToast();
  const [content, setContent] = useState('');
  const [generated, setGenerated] = useState<{ cards: Flashcard[]; quiz: QuizQuestion[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<Deck[]>(() => storage.getDecks());
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [mode, setMode] = useState<Mode>('cards');

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  const run = useCallback(async () => {
    if (content.trim().length < 20) {
      toast.warning('Paste at least a paragraph of study material first.');
      return;
    }
    setLoading(true);
    setGenerated(null);
    try {
      const r = await generateDeck(content);
      setGenerated(r);
      toast.success(hasGeminiKey ? 'Deck generated.' : 'Demo deck generated. Add a Gemini API key for real AI content.');
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }, [content, toast]);

  const saveDeck = useCallback(() => {
    if (!generated) return;
    const deck: Deck = {
      id: `deck_${Date.now()}`,
      title: content.trim().split(/\s+/).slice(0, 4).join(' ') || 'Untitled deck',
      createdAt: Date.now(),
      cards: generated.cards,
      quiz: generated.quiz,
    };
    const next = [deck, ...decks];
    setDecks(next);
    storage.setDecks(next);
    setActiveDeck(deck);
    setGenerated(null);
    toast.success('Deck saved to your library.');
  }, [generated, content, decks, toast]);

  const deleteDeck = useCallback(
    (id: string) => {
      const next = decks.filter((d) => d.id !== id);
      setDecks(next);
      storage.setDecks(next);
      if (activeDeck?.id === id) setActiveDeck(null);
      toast.info('Deck removed.');
    },
    [decks, activeDeck, toast],
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Sparkles className="h-6 w-6" />}
        title="AI Flashcards & Adaptive Quiz Generator"
        subtitle="Paste notes or syllabus text to generate 3D flip flashcards and an adaptive multiple-choice quiz."
      />

      {!activeDeck && !generated && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Study material</span>
            </div>
            <span className="text-xs text-slate-400">{wordCount} words</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your syllabus, lecture notes, or any study text here..."
            className="h-40 w-full resize-y rounded-xl border border-slate-200 bg-white/60 p-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
          />
          <div className="mt-3 flex items-center justify-end">
            <Button onClick={run} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate deck'}
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-5">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <div className="pt-1"><Spinner label="Creating flashcards and quiz questions..." /></div>
          </div>
        </Card>
      )}

      {generated && !loading && (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge tone="brand">Preview</Badge>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {generated.cards.length} flashcards · {generated.quiz.length} quiz questions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setGenerated(null)}>
                <X className="h-4 w-4" /> Discard
              </Button>
              <Button size="sm" onClick={saveDeck}>
                <Save className="h-4 w-4" /> Save to library
              </Button>
            </div>
          </div>
          <FlashcardViewer cards={generated.cards} />
        </Card>
      )}

      {activeDeck && (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setActiveDeck(null)}>
                <ChevronLeft className="h-4 w-4" /> Library
              </Button>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{activeDeck.title}</h3>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  downloadText(`deck-${activeDeck.title.slice(0, 20).replace(/\s+/g, '-')}.txt`, deckToText(activeDeck));
                  toast.success('Deck exported.');
                }}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              {(['cards', 'quiz'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {m === 'cards' ? <Layers className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
                  {m === 'cards' ? 'Flashcards' : 'Quiz'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'cards' ? (
            <FlashcardViewer cards={activeDeck.cards} />
          ) : (
            <QuizRunner
              deck={activeDeck}
              onComplete={(score, total) => {
                const pct = total ? Math.round((score / total) * 100) : 0;
                const attempt: QuizAttempt = {
                  deckId: activeDeck.id,
                  deckTitle: activeDeck.title,
                  score,
                  total,
                  pct,
                  takenAt: Date.now(),
                };
                const attempts = [attempt, ...storage.getAttempts()].slice(0, 50);
                storage.setAttempts(attempts);
                onUpdateStats({ quizzesTaken: stats.quizzesTaken + 1 });
                onQuizCompleted(attempt);
                toast.success(`Quiz complete: ${score}/${total} (${pct}%)`);
              }}
            />
          )}
        </Card>
      )}

      {/* Library */}
      {!activeDeck && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Saved decks</h3>
            <Badge tone="slate">{decks.length}</Badge>
          </div>
          {decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No decks yet. Generate one above and save it to your library.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {decks.map((d) => (
                <li key={d.id} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-4 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900/40">
                  <button onClick={() => { setActiveDeck(d); setMode('cards'); }} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{d.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {d.cards.length} cards · {d.quiz.length} quiz · {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteDeck(d.id)}
                    className="ml-2 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    aria-label="Delete deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function FlashcardViewer({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setIndex(0); setFlipped(false); }, [cards]);

  if (!cards.length) return <p className="text-sm text-slate-500">No flashcards.</p>;
  const card = cards[index];
  const next = () => { setFlipped(false); setIndex((i) => (i + 1) % cards.length); };
  const prev = () => { setFlipped(false); setIndex((i) => (i - 1 + cards.length) % cards.length); };

  return (
    <div>
      <div className="flip-perspective mx-auto h-64 w-full max-w-xl">
        <button
          onClick={() => setFlipped((f) => !f)}
          className={`flip-inner ${flipped ? 'is-flipped' : ''} h-full w-full cursor-pointer text-left`}
        >
          <div className="flip-face flex h-full w-full flex-col items-center justify-center rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-500/10 to-brand-700/10 p-6 text-center shadow-md dark:border-brand-800">
            <span className="absolute left-4 top-4 text-xs font-semibold uppercase tracking-wider text-brand-500">Question</span>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{card.front}</p>
            <span className="absolute bottom-4 text-xs text-slate-400">Click to flip</span>
          </div>
          <div className="flip-face flip-back flex h-full w-full flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-teal-700/10 p-6 text-center shadow-md dark:border-emerald-800">
            <span className="absolute left-4 top-4 text-xs font-semibold uppercase tracking-wider text-emerald-500">Answer</span>
            <p className="text-base text-slate-700 dark:text-slate-200">{card.back}</p>
            <span className="absolute bottom-4 text-xs text-slate-400">Click to flip back</span>
          </div>
        </button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={prev}><ChevronLeft className="h-4 w-4" /> Prev</Button>
        <span className="text-sm font-medium text-slate-500">{index + 1} / {cards.length}</span>
        <Button variant="secondary" size="sm" onClick={next}>Next <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function QuizRunner({ deck, onComplete }: { deck: Deck; onComplete: (score: number, total: number) => void }) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!deck.quiz.length) return <p className="text-sm text-slate-500">No quiz questions in this deck.</p>;
  const q = deck.quiz[i];
  const total = deck.quiz.length;

  const choose = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correctIndex) setScore((s) => s + 1);
  };

  const advance = () => {
    if (i + 1 >= total) {
      setDone(true);
      onComplete(selected === q.correctIndex ? score : score, total);
    } else {
      setI((x) => x + 1);
      setSelected(null);
    }
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <Trophy className="h-8 w-8" />
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-slate-900 dark:text-white">{score}/{total}</p>
        <p className="mt-1 text-sm text-slate-500">{pct}% correct</p>
        <Button className="mt-5" size="sm" onClick={() => { setI(0); setSelected(null); setScore(0); setDone(false); }}>
          <RefreshCw className="h-4 w-4" /> Retry quiz
        </Button>
      </div>
    );
  }

  const progress = ((i + (selected !== null ? 1 : 0)) / total) * 100;

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Question {i + 1} of {total}</span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full rounded-full bg-brand-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <p className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">{q.question}</p>
          <ul className="space-y-2">
            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.correctIndex;
              const isPicked = idx === selected;
              let cls = 'border-slate-200 bg-white/50 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/40';
              if (selected !== null) {
                if (isCorrect) cls = 'border-emerald-400 bg-emerald-500/10';
                else if (isPicked) cls = 'border-rose-400 bg-rose-500/10';
                else cls = 'border-slate-200 opacity-60 dark:border-slate-700';
              }
              return (
                <li key={idx}>
                  <button
                    onClick={() => choose(idx)}
                    disabled={selected !== null}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${cls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500 dark:border-slate-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-200">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <div className={`rounded-xl p-3 text-sm ${selected === q.correctIndex ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                <p className="font-semibold">{selected === q.correctIndex ? 'Correct!' : 'Not quite.'}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{q.explanation}</p>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={advance}>
                  {i + 1 >= total ? 'Finish' : 'Next question'} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
