import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LectureResult, SolverResult, Flashcard, QuizQuestion } from '@/types';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();

export const hasGeminiKey = Boolean(API_KEY && API_KEY.length > 10);

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const TEXT_MODEL = 'gemini-1.5-flash';
const VISION_MODEL = 'gemini-1.5-flash';

function tryParseJson<T>(raw: string): T | null {
  // Strip code fences and leading prose
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = cleaned.search(/[{[]/);
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

async function generateJson<T>(
  prompt: string,
  model = TEXT_MODEL,
  images?: { mime: string; data: string }[],
): Promise<T> {
  if (!genAI) throw new Error('Gemini API key not configured');
  const gm = genAI.getGenerativeModel({ model });
  const parts: any[] = [{ text: prompt }];
  if (images?.length) {
    for (const img of images) parts.push({ inlineData: img });
  }
  const result = await gm.generateContent({ contents: [{ role: 'user', parts }] });
  const text = result.response.text();
  const parsed = tryParseJson<T>(text);
  if (!parsed) throw new Error('The AI returned an unexpected response. Please try again.');
  return parsed;
}

/* ---------------- Lecture Transcriber ---------------- */

const LECTURE_PROMPT = `You are an expert academic study assistant. Analyse the following lecture transcript or notes and produce a structured study output as JSON with EXACTLY this shape:
{
  "summary": "A structured summary in markdown with a short overview paragraph followed by 5-8 bullet points of key takeaways and 3 core concepts.",
  "terminology": [{"term":"...","definition":"a clear one-sentence definition"}],
  "examQuestions": ["Three high-yield exam-style questions that test understanding, not rote recall."]
}
Return ONLY valid JSON, no prose, no code fences.

LECTURE CONTENT:
"""
{{CONTENT}}
"""`;

export async function analyzeLecture(content: string): Promise<LectureResult> {
  if (!hasGeminiKey) return mockLecture(content);
  const prompt = LECTURE_PROMPT.replace('{{CONTENT}}', content.slice(0, 12000));
  const r = await generateJson<LectureResult>(prompt);
  return {
    summary: r.summary ?? '',
    terminology: Array.isArray(r.terminology) ? r.terminology : [],
    examQuestions: Array.isArray(r.examQuestions) ? r.examQuestions.slice(0, 3) : [],
  };
}

/* ---------------- Socratic Vision Solver ---------------- */

const SOLVER_PROMPT = `You are a Socratic tutor for Math, Physics, and Computer Science. The user has uploaded an image of a problem or equation (and possibly provided context). Do NOT just give the final answer. Instead, walk through the problem step-by-step in a Socratic manner: identify the concept, state the relevant formulas, show intermediate working, and explain the logic at each step. Use markdown.

Return JSON with EXACTLY this shape:
{
  "extracted": "The text/equation you recognised from the image, transcribed cleanly.",
  "explanation": "A step-by-step Socratic explanation in markdown. Use headings (## Step 1 ...), bullet points, and LaTeX-style inline formulas where helpful."
}
Return ONLY valid JSON, no prose, no code fences.

USER CONTEXT: {{CONTEXT}}`;

export async function solveProblem(
  image: { mime: string; data: string },
  context: string,
): Promise<SolverResult> {
  if (!hasGeminiKey) return mockSolver(context);
  const prompt = SOLVER_PROMPT.replace('{{CONTEXT}}', context || '(none provided)');
  const r = await generateJson<SolverResult>(prompt, VISION_MODEL, [image]);
  return { extracted: r.extracted ?? '', explanation: r.explanation ?? '' };
}

/* ---------------- Flashcards & Quiz ---------------- */

const DECK_PROMPT = `You are an expert educator. From the provided study material, generate a flashcard deck and an adaptive multiple-choice quiz. Return JSON with EXACTLY this shape:
{
  "cards": [{"front":"a clear question or prompt","back":"a concise answer with a short explanation"}],
  "quiz": [{"question":"...","options":["4 options"],"correctIndex":0,"explanation":"why the correct option is right and others are wrong"}]
}
Rules:
- Generate 8-10 flashcards.
- Generate 5 multiple-choice questions, each with exactly 4 options.
- "correctIndex" is the 0-based index of the correct option.
- Each "explanation" should clarify why the right answer is correct.
Return ONLY valid JSON, no prose, no code fences.

STUDY MATERIAL:
"""
{{CONTENT}}
"""`;

export async function generateDeck(content: string): Promise<{ cards: Flashcard[]; quiz: QuizQuestion[] }> {
  if (!hasGeminiKey) return mockDeck(content);
  const prompt = DECK_PROMPT.replace('{{CONTENT}}', content.slice(0, 12000));
  const r = await generateJson<{ cards: Flashcard[]; quiz: QuizQuestion[] }>(prompt);
  const cards = (r.cards || []).map((c, i) => ({
    id: `c${Date.now()}_${i}`,
    front: c.front,
    back: c.back,
  }));
  const quiz = (r.quiz || []).map((q, i) => ({
    id: `q${Date.now()}_${i}`,
    question: q.question,
    options: q.options?.length === 4 ? q.options : [...(q.options || []), '', '', '', ''].slice(0, 4),
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation || '',
  }));
  return { cards, quiz };
}

/* ---------------- Socratic Tutor Chat ---------------- */

const TUTOR_SYSTEM = `You are StudyPulse's Socratic tutor — a patient, encouraging academic mentor across all subjects (math, physics, chemistry, biology, CS, humanities, languages). Teach Socratically: ask guiding questions, lead the student to discover answers, give hints and analogies, and only state a direct answer when the student is stuck. Keep replies concise (3-6 short paragraphs), use markdown for clarity, and end with a single thought-provoking question when appropriate. Never fabricate facts.`;

export async function* streamTutorChat(
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): AsyncGenerator<string> {
  if (!genAI) {
    // Mock streaming reply
    const mock = mockTutorReply(userMessage);
    for (const word of mock.split(/(\s+)/)) {
      await new Promise((r) => setTimeout(r, 12));
      yield word;
    }
    return;
  }
  const model = genAI.getGenerativeModel({ model: TEXT_MODEL, systemInstruction: TUTOR_SYSTEM });
  const contents = [
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const result = await model.generateContentStream({ contents });
  for await (const chunk of result.stream) {
    const t = chunk.text();
    if (t) yield t;
  }
}

/* ---------------- Mock fallbacks ---------------- */

function mockLecture(content: string): LectureResult {
  const topic = content.split(/\s+/).slice(0, 6).join(' ') || 'the lecture';
  return {
    summary: `### Overview\nThis lecture covers ${topic} and related concepts. Below is a structured breakdown of the key material.\n\n### Key Takeaways\n- The central theme of **${topic}** is introduced with foundational definitions and context.\n- Core mechanisms are explained through worked examples and conceptual diagrams.\n- The lecturer emphasises the relationship between theory and practical application.\n- Common student misconceptions are addressed with counter-examples.\n- The session closes with a preview of the next topic and recommended reading.\n\n### Core Concepts\n1. **Foundational principle** — the underlying rule governing the topic.\n2. **Application framework** — how the principle is applied in practice.\n3. **Edge cases** — scenarios where the standard approach must be adapted.`,
    terminology: [
      { term: 'Concept A', definition: 'A foundational idea introduced early in the lecture that underpins later material.' },
      { term: 'Concept B', definition: 'An applied framework extending Concept A to real-world scenarios.' },
      { term: 'Concept C', definition: 'A specialised edge case requiring adaptation of the standard approach.' },
    ],
    examQuestions: [
      `Explain the significance of ${topic} and how it relates to the broader curriculum.`,
      `Compare and contrast two approaches discussed in the lecture on ${topic}.`,
      `Given a scenario involving ${topic}, identify the correct framework and justify your choice.`,
    ],
  };
}

function mockSolver(context: string): SolverResult {
  const ctx = context || 'a generic equation';
  return {
    extracted: `Recognised problem: ${ctx}. (Demo mode — upload an image with a real API key to use Gemini Vision.)`,
    explanation: `## Step 1 — Identify the concept\nThe problem involves **${ctx}**. First, identify which branch of mathematics or physics applies.\n\n## Step 2 — State the relevant formula\nRecall the governing equation. For example, if this is a kinematics problem, you might use:\n- \\u20D7v = \\u20D7u + a\\u20D7t\n\n## Step 3 — Substitute known values\nList what is given and what must be found. Substitute carefully, keeping units consistent.\n\n## Step 4 — Solve step-by-step\nRearrange algebraically before plugging in numbers to reduce rounding errors.\n\n## Step 5 — Verify\nCheck the result by dimensional analysis and by estimating the expected order of magnitude.\n\n> This is a **demo response**. Add your \`VITE_GEMINI_API_KEY\` to enable real Socratic analysis of uploaded images.`,
  };
}

function mockDeck(content: string): { cards: Flashcard[]; quiz: QuizQuestion[] } {
  const seed = content.split(/\s+/).filter(Boolean).slice(0, 8);
  const topics = seed.length >= 4 ? seed : ['Topic A', 'Topic B', 'Topic C', 'Topic D', 'Topic E', 'Topic F', 'Topic G', 'Topic H'];
  const cards: Flashcard[] = topics.map((t, i) => ({
    id: `mock_c_${i}`,
    front: `What is ${t}?`,
    back: `${t} is a key concept from the provided material. (Demo answer — add a Gemini API key for AI-generated content.)`,
  }));
  const quiz: QuizQuestion[] = topics.slice(0, 5).map((t, i) => ({
    id: `mock_q_${i}`,
    question: `Which statement best describes ${t}?`,
    options: [
      `${t} is the central concept discussed in the material.`,
      `${t} is unrelated to the topic.`,
      `${t} only applies to history.`,
      `${t} was disproven in 1990.`,
    ],
    correctIndex: 0,
    explanation: `The first option is correct because ${t} is directly drawn from the study material. The other options are distractors.`,
  }));
  return { cards, quiz };
}

function mockTutorReply(userMessage: string): string {
  const topic = userMessage.slice(0, 80) || 'your topic';
  return `Great question about **${topic}**. Let's work through this together rather than me just handing you the answer.\n\nFirst, let's make sure we understand what's being asked. What do you think is the *core idea* behind ${topic}? Try putting it in your own words — even a rough guess helps me see where you are.\n\nHere's a small hint: most of these concepts come down to a relationship between two quantities. Can you identify which two quantities matter here?\n\nOnce you've thought about that, here's a guiding question: **what would change if one of those quantities doubled?** That thought experiment often reveals the underlying rule.\n\n> I'm running in demo mode right now. Add your \`VITE_GEMINI_API_KEY\` to chat with the real Gemini-powered tutor.`;
}
