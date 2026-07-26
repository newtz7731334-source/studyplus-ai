import { AnimatePresence, motion } from 'framer-motion';
import { MessagesSquare, Plus, SendHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, SectionTitle, Spinner } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { hasGeminiKey, streamTutorChat } from '@/lib/gemini';
import { storage } from '@/lib/storage';
import type { ChatMessage, ChatSession, UserStats } from '@/types';

function newSession(): ChatSession {
  const now = Date.now();
  return {
    id: `chat_${now}`,
    title: 'New chat',
    createdAt: now,
    messages: [],
  };
}

export function Tutor({
  stats,
  onUpdateStats,
}: {
  stats: UserStats;
  onUpdateStats: (patch: Partial<UserStats>) => void;
}) {
  const toast = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>(() => storage.getChats());
  const [activeId, setActiveId] = useState<string | null>(() => storage.getChats()[0]?.id ?? null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  const persist = (next: ChatSession[]) => {
    setSessions(next);
    storage.setChats(next);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages.length, streaming]);

  const startNew = () => {
    const s = newSession();
    persist([s, ...sessions]);
    setActiveId(s.id);
    setInput('');
  };

  const removeSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    let session = active;
    if (!session) {
      session = newSession();
      persist([session, ...sessions]);
      setActiveId(session.id);
    }
    const userMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content: text, ts: Date.now() };
    const assistantId = `m_${Date.now() + 1}`;
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', ts: Date.now() + 1 };

    const updated: ChatSession = {
      ...session,
      title: session.messages.length === 0 ? text.slice(0, 40) : session.title,
      messages: [...session.messages, userMsg, assistantMsg],
    };
    const next = sessions.filter((s) => s.id !== session!.id);
    persist([updated, ...next]);
    setInput('');
    setStreaming(true);

    try {
      const history = updated.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      let acc = '';
      for await (const chunk of streamTutorChat(history, text)) {
        acc += chunk;
        setSessions((prev) => {
          const copy = prev.map((s) =>
            s.id === updated.id
              ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)) }
              : s,
          );
          storage.setChats(copy);
          return copy;
        });
      }
      onUpdateStats({ tutorChats: stats.tutorChats + 1 });
      if (!hasGeminiKey) toast.info('Demo reply generated. Add a Gemini API key for real AI tutoring.');
    } catch (err: any) {
      toast.error(err?.message || 'The tutor could not respond. Please try again.');
      setSessions((prev) => {
        const copy = prev.map((s) =>
          s.id === updated.id
            ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: 'Sorry, I could not generate a response. Please try again.' } : m)) }
            : s,
        );
        storage.setChats(copy);
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<MessagesSquare className="h-6 w-6" />}
        title="AI Socratic Tutor"
        subtitle="Chat with a patient mentor that guides you to answers through questions, hints, and analogies."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Sessions list */}
        <Card className="h-fit p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chats</span>
            <Button size="sm" variant="ghost" onClick={startNew}><Plus className="h-4 w-4" /></Button>
          </div>
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-slate-400">No chats yet. Start a new conversation.</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((s) => (
                <li key={s.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={`flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      activeId === s.id
                        ? 'bg-brand-500/10 font-semibold text-brand-700 dark:text-brand-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s.title || 'New chat'}
                  </button>
                  <button
                    onClick={() => removeSession(s.id)}
                    className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Chat window */}
        <Card className="flex h-[560px] flex-col p-0">
          {!active ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <MessagesSquare className="h-8 w-8" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Ask the Socratic tutor anything. It will guide you with questions instead of just giving answers.
              </p>
              <Button className="mt-4" size="sm" onClick={startNew}><Plus className="h-4 w-4" /> Start a chat</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{active.title}</p>
                <Badge tone={hasGeminiKey ? 'emerald' : 'amber'}>{hasGeminiKey ? 'Gemini live' : 'Demo'}</Badge>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-400">
                    <Sparkles className="h-6 w-6 text-brand-400" />
                    <p className="mt-2">Ask a question to begin. Try: "Explain Newton's second law" or "Help me understand recursion."</p>
                  </div>
                )}
                {active.messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="ai-output" dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }} />
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                      {m.role === 'assistant' && streaming && m.id === active.messages[active.messages.length - 1].id && (
                        <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-slate-400 align-middle" />
                      )}
                    </div>
                  </motion.div>
                ))}
                {streaming && active.messages.length > 0 && active.messages[active.messages.length - 1].content === '' && (
                  <div className="flex justify-start"><Spinner /></div>
                )}
              </div>
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask the tutor anything... (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                  <Button onClick={send} disabled={streaming || !input.trim()} className="!h-10">
                    {streaming ? <Spinner /> : <SendHorizontal className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
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
  const close = () => { if (inUl) { html.push('</ul>'); inUl = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { close(); continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) { if (!inUl) { close(); html.push('<ul>'); inUl = true; } html.push(`<li>${inline(ul[1])}</li>`); continue; }
    const bq = line.match(/^>\s+(.*)$/);
    if (bq) { close(); html.push(`<blockquote class="border-l-2 border-brand-400 pl-2 italic text-slate-500">${inline(bq[1])}</blockquote>`); continue; }
    close();
    html.push(`<p>${inline(line)}</p>`);
  }
  close();
  return html.join('\n');
}
function inline(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
