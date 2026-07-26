import { motion } from 'framer-motion';
import { ImageIcon, Lightbulb, RefreshCw, ScanEye, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Badge, Button, Card, SectionTitle, Skeleton, Spinner } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { hasGeminiKey, solveProblem } from '@/lib/gemini';
import type { SolverResult } from '@/types';

export function Solver() {
  const toast = useToast();
  const [image, setImage] = useState<{ mime: string; data: string; preview: string } | null>(null);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<SolverResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.warning('Please upload an image file (PNG, JPG, etc.).');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.warning('Image is too large. Please use one under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        setImage({ mime: file.type, data: base64, preview: dataUrl });
        setResult(null);
      };
      reader.onerror = () => toast.error('Could not read that image.');
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const run = useCallback(async () => {
    if (!image) {
      toast.warning('Upload an image of the problem first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await solveProblem(image, context);
      setResult(r);
      toast.success(hasGeminiKey ? 'Socratic solution ready.' : 'Demo solution generated. Add a Gemini API key for real Vision analysis.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not solve the problem. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [image, context, toast]);

  const reset = () => {
    setImage(null);
    setResult(null);
    setContext('');
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<ScanEye className="h-6 w-6" />}
        title="Socratic Vision Problem & Equation Solver"
        subtitle="Upload a photo of a math, physics, or CS problem and get a step-by-step Socratic explanation."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <Card
            className={`border-2 border-dashed p-6 transition ${
              dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-300 dark:border-slate-700'
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
              {image ? (
                <div className="relative w-full">
                  <img src={image.preview} alt="Problem preview" className="mx-auto max-h-64 rounded-xl object-contain shadow-md" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute right-2 top-2 rounded-lg bg-slate-900/70 p-1.5 text-white transition hover:bg-slate-900"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Drop a problem image here</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, WEBP up to 8MB</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => fileInput.current?.click()}>
                    <Upload className="h-4 w-4" /> Browse
                  </Button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = '';
                    }}
                  />
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">Optional context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. This is a calculus problem on integration by parts. I'm stuck on the substitution step."
              className="h-24 w-full resize-y rounded-xl border border-slate-200 bg-white/60 p-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" /> Reset
              </Button>
              <Button onClick={run} disabled={loading || !image} className="!bg-emerald-600 hover:!bg-emerald-500">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                {loading ? 'Solving...' : 'Solve step-by-step'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Output */}
        <Card className="min-h-[400px] p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-2"><Spinner label="Reading the image and reasoning through the problem..." /></div>
            </div>
          ) : result ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4">
                <Badge tone="brand">Extracted</Badge>
                <p className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">{result.extracted}</p>
              </div>
              <div>
                <Badge tone="emerald">Socratic explanation</Badge>
                <div className="ai-output mt-2 text-sm text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: mdToHtml(result.explanation) }} />
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <ScanEye className="h-8 w-8" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Upload an image of a problem and your step-by-step Socratic explanation will appear here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

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
    const bq = line.match(/^>\s+(.*)$/);
    if (bq) { closeLists(); html.push(`<blockquote class="border-l-4 border-emerald-400 pl-3 italic text-slate-500 dark:text-slate-400">${inline(bq[1])}</blockquote>`); continue; }
    closeLists();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return html.join('\n');
}
function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\\u20D7/g, '→');
}
