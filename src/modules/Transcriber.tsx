import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Download,
  FileText,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, SectionTitle, Skeleton, Spinner } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { analyzeLecture, hasGeminiKey } from '@/lib/gemini';
import { downloadText, lectureToText } from '@/lib/export';
import type { LectureResult, UserStats } from '@/types';

type Tab = 'summary' | 'terms' | 'questions';

export function Transcriber({
  stats,
  onUpdateStats,
}: {
  stats: UserStats;
  onUpdateStats: (patch: Partial<UserStats>) => void;
}) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState<LectureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('summary');
  const [dragging, setDragging] = useState(false);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef<any>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      const isAudio = file.type.startsWith('audio/');
      const isText = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name);
      if (isAudio) {
        toast.info('Audio file received. Browser-based transcription is limited — paste a transcript or use the live recorder for best results.');
        return;
      }
      if (isText) {
        try {
          const content = await file.text();
          setText((prev) => (prev ? prev + '\n\n' + content : content));
          toast.success('File content loaded.');
        } catch {
          toast.error('Could not read that file.');
        }
        return;
      }
      toast.warning('Unsupported file type. Upload audio (MP3/WAV) or a text file.');
    },
    [toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const startRecording = useCallback(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Live speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((t) => (t + ' ' + finalText).trim());
      setInterim(interimText);
    };
    rec.onerror = () => toast.error('Recording error. Check microphone permissions.');
    rec.onend = () => {
      setRecording(false);
      setInterim('');
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }, [toast]);

  const stopRecording = useCallback(() => {
    recRef.current?.stop?.();
    recRef.current = null;
    setRecording(false);
    setInterim('');
  }, []);

  const combined = (transcript + '\n' + text).trim();

  const runAnalysis = useCallback(async () => {
    if (!combined || combined.length < 20) {
      toast.warning('Please provide at least a few sentences of lecture content first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await analyzeLecture(combined);
      setResult(r);
      setTab('summary');
      onUpdateStats({ lecturesProcessed: stats.lecturesProcessed + 1 });
      toast.success(hasGeminiKey ? 'Analysis complete.' : 'Demo analysis generated. Add a Gemini API key for real AI output.');
    } catch (err: any) {
      toast.error(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [combined, onUpdateStats, stats.lecturesProcessed, toast]);

  const reset = () => {
    setResult(null);
    setText('');
    setTranscript('');
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Volume2 className="h-6 w-6" />}
        title="Lecture Transcriber & Summarizer"
        subtitle="Upload audio or paste lecture notes to generate structured summaries, vocabulary, and exam questions."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          {/* Dropzone */}
          <Card
            className={`border-2 border-dashed p-6 transition ${
              dragging ? 'border-brand-500 bg-brand-500/5' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Drag & drop audio or notes</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">MP3, WAV, TXT, or MD</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => fileInput.current?.click()}>
                <Plus className="h-4 w-4" /> Browse files
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="audio/*,text/*,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          </Card>

          {/* Recorder */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                  {recording && <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-rose-500/40" />}
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live recording</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Browser speech-to-text (Chrome/Edge)</p>
                </div>
              </div>
              {recording ? (
                <Button variant="danger" size="sm" onClick={stopRecording}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={startRecording}>
                  <Mic className="h-3.5 w-3.5" /> Record
                </Button>
              )}
            </div>
            {recording && (
              <div className="mt-3 rounded-lg bg-rose-500/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                {interim || 'Listening...'}
              </div>
            )}
            {transcript && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Live transcript</span>
                  <button onClick={() => setTranscript('')} className="text-xs text-rose-500 hover:underline">clear</button>
                </div>
                <p className="max-h-28 overflow-y-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{transcript}</p>
              </div>
            )}
          </Card>

          {/* Text input */}
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lecture notes</span>
              </div>
              <span className="text-xs text-slate-400">{wordCount} words</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your lecture transcript or notes here..."
              className="h-40 w-full resize-y rounded-xl border border-slate-200 bg-white/60 p-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" /> Clear
              </Button>
              <Button onClick={runAnalysis} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Analyzing...' : 'Analyze lecture'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <Card className="min-h-[400px] p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <div className="pt-2"><Spinner label="Generating structured study output..." /></div>
              </div>
            ) : result ? (
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                  {([
                    { k: 'summary', label: 'Summary', icon: BookOpen },
                    { k: 'terms', label: 'Terminology', icon: FileText },
                    { k: 'questions', label: 'Exam Questions', icon: Volume2 },
                  ] as const).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          tab === t.k
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" /> {t.label}
                      </button>
                    );
                  })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      downloadText(`lecture-summary-${Date.now()}.txt`, lectureToText(result));
                      toast.success('Summary exported.');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === 'summary' && (
                      <div className="ai-output text-sm text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: mdToHtml(result.summary) }} />
                    )}
                    {tab === 'terms' && (
                      <ul className="space-y-3">
                        {result.terminology.length === 0 && <p className="text-sm text-slate-500">No terminology extracted.</p>}
                        {result.terminology.map((t, i) => (
                          <li key={i} className="rounded-xl border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                            <p className="font-semibold text-brand-600 dark:text-brand-300">{t.term}</p>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{t.definition}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tab === 'questions' && (
                      <ol className="space-y-3">
                        {result.examQuestions.map((q, i) => (
                          <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                            <Badge tone="brand">{i + 1}</Badge>
                            <p className="text-sm text-slate-700 dark:text-slate-200">{q}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                  <Volume2 className="h-8 w-8" />
                </div>
                <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                  Your structured summary, key terminology, and high-yield exam questions will appear here.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Minimal, safe markdown -> HTML (headings, bold, lists, paragraphs)
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = esc(md).split(/\r?\n/);
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeLists(); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { closeLists(); html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) { if (!inOl) { closeLists(); html.push('<ol>'); inOl = true; } html.push(`<li>${inline(ol[1])}</li>`); continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) { if (!inUl) { closeLists(); html.push('<ul>'); inUl = true; } html.push(`<li>${inline(ul[1])}</li>`); continue; }
    closeLists();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return html.join('\n');
}
function inline(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
