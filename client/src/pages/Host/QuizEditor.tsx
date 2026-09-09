import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api.js';
import { Save, ArrowLeft, Plus, Trash2, Clock, Zap, CheckCircle2, Circle } from 'lucide-react';

const OPT = [
  { letter: 'A', bg: 'var(--color-ans-a)', fg: '#fff' },
  { letter: 'B', bg: 'var(--color-ans-b)', fg: '#fff' },
  { letter: 'C', bg: 'var(--color-ans-c)', fg: '#fff' },
  { letter: 'D', bg: 'var(--color-ans-d)', fg: '#fff' },
];

const blankQuestion = (poll: boolean) => ({
  id: `q-${Date.now()}`,
  prompt: 'New question',
  time_limit: 20,
  points: poll ? 0 : 1000,
  type: poll ? 'poll' : 'quiz',
  options: [
    { text: 'Option A', is_correct: true },
    { text: 'Option B', is_correct: false },
    { text: 'Option C', is_correct: false },
    { text: 'Option D', is_correct: false },
  ],
});

export const QuizEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPoll, setIsPoll] = useState(false);
  const [questions, setQuestions] = useState<any[]>([blankQuestion(false)]);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ quiz: any }>(`/api/quizzes/${id}`).then((data) => {
      const q = data.quiz;
      setTitle(q.title);
      setDescription(q.description || '');
      setIsPoll(q.is_poll);
      if (q.questions?.length) setQuestions(q.questions);
    }).catch((e) => console.error('Load failed:', e));
  }, [id]);

  const cur = questions[active] || questions[0];
  const patchQ = (field: string, val: any) => {
    const next = [...questions];
    next[active] = { ...next[active], [field]: val };
    setQuestions(next);
  };
  const patchOpt = (oi: number, field: string, val: any) => {
    const next = [...questions];
    const opts = [...next[active].options];
    opts[oi] = { ...opts[oi], [field]: val };
    next[active].options = opts;
    setQuestions(next);
  };
  const setCorrect = (oi: number) => {
    if (isPoll) return;
    const next = [...questions];
    next[active].options = next[active].options.map((o: any, i: number) => ({ ...o, is_correct: i === oi }));
    setQuestions(next);
  };
  const addQ = () => { setQuestions([...questions, blankQuestion(isPoll)]); setActive(questions.length); };
  const delQ = (i: number) => {
    if (questions.length <= 1) return alert('A quiz needs at least one question.');
    const next = questions.filter((_, k) => k !== i);
    setQuestions(next);
    if (active >= next.length) setActive(next.length - 1);
  };

  const save = async () => {
    if (!title.trim()) return alert('Give the quiz a title.');
    setSaving(true);
    try {
      const body = JSON.stringify({ title, description, is_poll: isPoll, questions });
      if (id) await apiRequest(`/api/quizzes/${id}`, { method: 'PUT', body });
      else await apiRequest('/api/quizzes', { method: 'POST', body });
      navigate('/host/dashboard');
    } catch (e: any) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] p-6 sm:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
          <button onClick={() => navigate('/host/dashboard')} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-2xl font-display font-bold">{id ? 'Edit Quiz' : 'Create Quiz'}</h1>
          <button onClick={save} disabled={saving} className="btn-volt flex items-center gap-2 px-5 py-2.5 text-sm">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Quiz'}
          </button>
        </div>

        <div className="card-paper p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title (e.g. Pop Culture Trivia)"
              className="w-full text-xl font-display font-bold border-0 border-b border-[var(--color-line)] pb-1 bg-transparent focus:outline-none focus:border-[var(--color-volt)] placeholder:text-[var(--color-ink-faint)]" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
              className="w-full text-sm text-[var(--color-ink-soft)] border-0 bg-transparent focus:outline-none placeholder:text-[var(--color-ink-faint)] pt-1" />
          </div>
          <div className="flex items-center gap-1 bg-[var(--color-paper-sunk)] p-1 rounded-xl shrink-0">
            <button onClick={() => setIsPoll(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${!isPoll ? 'bg-[var(--color-paper-raised)] text-[var(--color-volt)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}>Quiz (Scored)</button>
            <button onClick={() => setIsPoll(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${isPoll ? 'bg-[var(--color-paper-raised)] text-[var(--color-ans-b)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}>Poll Mode</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center justify-between eyebrow text-[var(--color-ink-soft)] px-1">
              <span>Questions ({questions.length})</span>
              <button onClick={addQ} className="flex items-center gap-1 text-[var(--color-volt)] font-bold"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible max-h-[500px] md:overflow-y-auto">
              {questions.map((q, i) => (
                <div key={q.id || i} onClick={() => setActive(i)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition shrink-0 md:shrink
                    ${active === i ? 'bg-[var(--color-paper-raised)] border-[var(--color-volt)] text-[var(--color-volt)] ring-2 ring-[rgba(139,92,246,0.2)]' : 'bg-[var(--color-paper-raised)] border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-faint)]'}`}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="tabular font-bold text-xs w-5 text-[var(--color-ink-faint)]">{i + 1}</span>
                    <span className="text-xs font-bold truncate max-w-[130px]">{q.prompt || 'Untitled'}</span>
                  </div>
                  {questions.length > 1 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); delQ(i); }} className="text-[var(--color-ink-faint)] hover:text-[var(--color-bad)] p-1 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 card-paper p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <span className="text-sm font-display font-bold">Question {active + 1}</span>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-[var(--color-paper-sunk)] border border-[var(--color-line)] px-3 py-1.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
                  <select value={cur.time_limit || 20} onChange={(e) => patchQ('time_limit', parseInt(e.target.value, 10))} className="bg-transparent font-semibold focus:outline-none">
                    {[5, 10, 15, 20, 30, 60].map((s) => <option key={s} value={s}>{s}s</option>)}
                  </select>
                </div>
                {!isPoll && (
                  <div className="flex items-center gap-1.5 bg-[var(--color-paper-sunk)] border border-[var(--color-line)] px-3 py-1.5 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-[var(--color-ans-c)]" />
                    <select value={cur.points ?? 1000} onChange={(e) => patchQ('points', parseInt(e.target.value, 10))} className="bg-transparent font-semibold focus:outline-none">
                      <option value={1000}>1,000 pts</option>
                      <option value={2000}>2,000 pts</option>
                      <option value={0}>0 pts</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="eyebrow text-[var(--color-ink-soft)]">Question text</label>
              <textarea rows={3} value={cur.prompt} onChange={(e) => patchQ('prompt', e.target.value)}
                className="field w-full p-4 font-display font-semibold text-lg resize-none" />
            </div>

            <div className="flex flex-col gap-3">
              <span className="eyebrow text-[var(--color-ink-soft)]">Answer options {!isPoll && '(pick the correct one)'}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cur.options.map((opt: any, oi: number) => {
                  const t = OPT[oi % 4];
                  const correct = !!opt.is_correct;
                  return (
                    <div key={oi} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition ${correct && !isPoll ? 'border-[var(--color-good)] bg-[rgba(16,185,129,0.06)]' : 'border-[var(--color-line)] bg-[var(--color-paper-sunk)]'}`}>
                      <span className="w-7 h-7 rounded-lg grid place-items-center font-display font-bold text-sm" style={{ background: t.bg, color: t.fg }}>{t.letter}</span>
                      <input value={opt.text} onChange={(e) => patchOpt(oi, 'text', e.target.value)} placeholder={`Option ${t.letter}`}
                        className="flex-1 bg-transparent font-semibold text-sm focus:outline-none" />
                      {!isPoll && (
                        <button type="button" onClick={() => setCorrect(oi)}
                          className={`p-1 rounded-full transition ${correct ? 'text-[var(--color-good)]' : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]'}`}>
                          {correct ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
