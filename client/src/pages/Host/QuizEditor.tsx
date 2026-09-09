import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api.js';
import { Save, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, User, Lightbulb, Trophy } from 'lucide-react';
import { SpotlightCard } from '../../components/ReactBits/SpotlightCard.js';

interface ParticipantForm {
  id?: string;
  name: string;
  product_idea: string;
  score: number;
}

export const QuizEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<ParticipantForm[]>([
    { name: 'Team Alpha', product_idea: 'AI-driven code auditor for student devs', score: 0 },
    { name: 'Team Beta', product_idea: 'Sustainable smart water filter bottle', score: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<{ competition: any }>(`/api/competitions/${id}`)
      .then((data) => {
        const c = data.competition;
        if (c) {
          setTitle(c.title || '');
          setDescription(c.description || '');
          if (c.participants && c.participants.length > 0) {
            setParticipants(
              c.participants.map((p: any) => ({
                id: p.id,
                name: p.name || '',
                product_idea: p.product_idea || '',
                score: p.score || 0,
              }))
            );
          }
        }
      })
      .catch((e) => console.error('Failed to load competition:', e))
      .finally(() => setLoading(false));
  }, [id]);

  const updateParticipant = (index: number, field: keyof ParticipantForm, val: any) => {
    const next = [...participants];
    next[index] = { ...next[index], [field]: val };
    setParticipants(next);
  };

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { name: `Team ${String.fromCharCode(65 + participants.length)}`, product_idea: '', score: 0 },
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) {
      alert('A pitch competition needs at least one participant!');
      return;
    }
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const moveParticipant = (index: number, direction: 'UP' | 'DOWN') => {
    const target = direction === 'UP' ? index - 1 : index + 1;
    if (target < 0 || target >= participants.length) return;
    const next = [...participants];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setParticipants(next);
  };

  const save = async () => {
    if (!title.trim()) {
      alert('Please enter a competition title.');
      return;
    }

    const validParticipants = participants.filter((p) => p.name.trim().length > 0);
    if (validParticipants.length === 0) {
      alert('Please add at least one participant with a name.');
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        participants: validParticipants,
      });

      if (id) {
        await apiRequest(`/api/competitions/${id}`, { method: 'PUT', body });
      } else {
        await apiRequest('/api/competitions', { method: 'POST', body });
      }

      navigate('/host/dashboard');
    } catch (e: any) {
      alert(e.message || 'Failed to save competition');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] flex items-center justify-center font-bold text-lg">
        Loading Competition Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] p-6 sm:p-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-2xl font-display font-bold">
            {id ? 'Edit Pitch Competition' : 'Create Pitch Competition'}
          </h1>
          <button onClick={save} disabled={saving} className="btn-volt flex items-center gap-2 px-5 py-2.5 text-sm font-bold">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Competition'}
          </button>
        </div>

        {/* Competition Meta details */}
        <SpotlightCard className="p-6 flex flex-col gap-4 !bg-[var(--color-paper-raised)] !border-[var(--color-line)]">
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-[var(--color-volt)] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Competition Details
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Competition Title (e.g. Annual Startup Pitch Battle)"
              className="w-full text-2xl font-display font-bold border-0 border-b border-[var(--color-line)] pb-2 bg-transparent focus:outline-none focus:border-[var(--color-volt)] placeholder:text-[var(--color-ink-faint)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional summary for audience)"
              className="w-full text-sm font-semibold text-[var(--color-ink-soft)] border-0 bg-transparent focus:outline-none placeholder:text-[var(--color-ink-faint)] pt-1"
            />
          </div>
        </SpotlightCard>

        {/* Pitch Participants Roster */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="eyebrow text-[var(--color-ink-soft)]">
              Pitch Participants ({participants.length})
            </span>
            <button
              onClick={addParticipant}
              className="btn-volt inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Add Pitch Participant
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {participants.map((p, index) => (
              <SpotlightCard
                key={index}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 !bg-[var(--color-paper-raised)] !border-[var(--color-line)]"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="w-8 h-8 rounded-full bg-[var(--color-volt)]/10 text-[var(--color-volt)] font-display font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-3 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--color-ink-soft)] shrink-0" />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        placeholder={`Participant/Team Name (e.g. Team ${index + 1})`}
                        className="w-full bg-white/5 border border-[var(--color-line)] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-[var(--color-volt)] transition"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[var(--color-ink-soft)] shrink-0" />
                      <input
                        type="text"
                        value={p.product_idea}
                        onChange={(e) => updateParticipant(index, 'product_idea', e.target.value)}
                        placeholder="Product / Startup Idea description"
                        className="w-full bg-white/5 border border-[var(--color-line)] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[var(--color-volt)] transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-line)]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveParticipant(index, 'UP')}
                      disabled={index === 0}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[var(--color-ink-soft)] transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveParticipant(index, 'DOWN')}
                      disabled={index === participants.length - 1}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[var(--color-ink-soft)] transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeParticipant(index)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition ml-2"
                    title="Remove Pitch Participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
