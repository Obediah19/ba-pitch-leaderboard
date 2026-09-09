import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { apiRequest } from '../../services/api.js';
import { sound } from '../../services/audio.js';
import { SpotlightCard } from '../../components/ReactBits/SpotlightCard.js';
import { Play, Plus, Copy, Trash2, Edit, HelpCircle, LayoutGrid } from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ competitions: any[] }>('/api/competitions');
      setQuizzes(data.competitions || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onCreated = (d: { roomCode: string }) => { sound.playTick(); navigate(`/host/lobby/${d.roomCode}`); };
    const onError = () => setLaunching(null);
    socket.on('host:room_created', onCreated);
    socket.on('room:error', onError);
    return () => { socket.off('host:room_created', onCreated); socket.off('room:error', onError); };
  }, [socket, navigate]);

  const launch = (id: string) => {
    if (!socket) return;
    setLaunching(id);
    socket.emit('host:create_room', { quizId: id, hostUserId: user?.id, settings: { showTextOnPlayerScreen: true } });
  };
  const duplicate = async (id: string) => { try { await apiRequest(`/api/quizzes/${id}/duplicate`, { method: 'POST' }); load(); } catch (e) { console.error(e); } };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this quiz? This cannot be undone.')) return;
    try { await apiRequest(`/api/quizzes/${id}`, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-paper)] text-[var(--color-ink)] p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-line)]">
          <div>
            <span className="eyebrow text-[var(--color-volt)] flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Host</span>
            <h1 className="text-3xl font-display font-bold mt-1">Competition Library</h1>
            <p className="text-sm font-semibold text-[var(--color-ink-soft)] mt-0.5">Launch one live, or build a new one.</p>
          </div>
          <Link to="/host/editor" className="btn-volt inline-flex items-center gap-2 px-5 py-2.5 text-sm self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Create Competition
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card-paper p-6 flex flex-col gap-4">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-11 w-full mt-2" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="card-paper p-12 flex flex-col items-center text-center gap-3">
            <span className="text-4xl">🗂️</span>
            <h3 className="text-xl font-display font-bold">No quizzes yet</h3>
            <p className="text-sm text-[var(--color-ink-soft)] max-w-xs">Build your first quiz — add questions, set timers and points, then launch it live in one click.</p>
            <Link to="/host/editor" className="btn-volt inline-flex items-center gap-2 px-5 py-2.5 text-sm mt-2">
              <Plus className="w-4 h-4" /> Create your first quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz, i) => (
              <motion.div key={quiz.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              >
                <SpotlightCard className="p-6 flex flex-col justify-between gap-6 h-full !bg-[var(--color-paper-raised)] !border-[var(--color-line)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[rgba(139,92,246,0.1)] text-[var(--color-volt)]`}>
                        Pitch
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-faint)]">
                        <HelpCircle className="w-3.5 h-3.5" /> {quiz.participants?.length || 0} participants
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold">{quiz.title}</h3>
                      <p className="text-xs font-semibold text-[var(--color-ink-soft)] line-clamp-2 mt-1">{quiz.description || 'No description.'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-line)]">
                    <button onClick={() => launch(quiz.id)} disabled={launching === quiz.id}
                      className="btn-volt w-full py-3 text-sm flex items-center justify-center gap-2">
                      <Play className="w-4 h-4 fill-white" /> {launching === quiz.id ? 'Launching…' : 'START LIVE QUIZ'}
                    </button>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-soft)]">
                      <Link to={`/host/editor/${quiz.id}`} className="flex items-center gap-1 hover:text-[var(--color-ink)] transition"><Edit className="w-3.5 h-3.5" /> Edit</Link>
                      <button onClick={() => duplicate(quiz.id)} className="flex items-center gap-1 hover:text-[var(--color-ink)] transition"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                      <button onClick={() => remove(quiz.id)} className="flex items-center gap-1 hover:text-[var(--color-bad)] transition"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
