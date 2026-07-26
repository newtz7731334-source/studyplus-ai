export function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function lectureToText(r: { summary: string; terminology: { term: string; definition: string }[]; examQuestions: string[] }): string {
  const lines: string[] = [];
  lines.push('STUDYPULSE AI — LECTURE SUMMARY');
  lines.push('='.repeat(40));
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-'.repeat(20));
  lines.push(r.summary);
  lines.push('');
  lines.push('CORE TERMINOLOGY');
  lines.push('-'.repeat(20));
  r.terminology.forEach((t) => lines.push(`• ${t.term}: ${t.definition}`));
  lines.push('');
  lines.push('HIGH-YIELD EXAM QUESTIONS');
  lines.push('-'.repeat(20));
  r.examQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  return lines.join('\n');
}

export function deckToText(d: { title: string; cards: { front: string; back: string }[]; quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[] }): string {
  const lines: string[] = [];
  lines.push(`STUDYPULSE AI — DECK: ${d.title}`);
  lines.push('='.repeat(40));
  lines.push('');
  lines.push('FLASHCARDS');
  lines.push('-'.repeat(20));
  d.cards.forEach((c, i) => { lines.push(`Q${i + 1}: ${c.front}`); lines.push(`A${i + 1}: ${c.back}`); lines.push(''); });
  lines.push('QUIZ');
  lines.push('-'.repeat(20));
  d.quiz.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`);
    q.options.forEach((o, j) => lines.push(`   ${String.fromCharCode(65 + j)}. ${o}${j === q.correctIndex ? ' ✓' : ''}`));
    lines.push(`   Explanation: ${q.explanation}`);
    lines.push('');
  });
  return lines.join('\n');
}
