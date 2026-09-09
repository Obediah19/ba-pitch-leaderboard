import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.js';
import { Aurora } from '../../components/ReactBits/Aurora.js';
import { EmojiLayer, EmojiStorm } from '../../components/Game/StageFx.js';
import { Play, Square, Plus, ExternalLink, RefreshCw } from 'lucide-react';

export const HostGame: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const roomCode = (code || '').toUpperCase();

  const [participants, setParticipants] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<'CLOSED' | 'OPEN'>('CLOSED');
  const [title, setTitle] = useState('');

  // Manual score input state
  const [manualScores, setManualScores] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (!socket || !roomCode) return;
    
    // Request initial state or listen to room creation
    socket.emit('room:sync_request', { roomCode });

    const onRoomCreated = (d: any) => {
      setTitle(d.title);
      setParticipants(d.participants || []);
    };
    
    const onSync = (d: any) => {
      // For now, host sync just needs to maybe grab participants if they weren't passed.
      // But we can get it from leaderboard updates.
    };

    const onLeaderboardUpdate = (d: any) => {
      // update participants scores from leaderboard
      setParticipants((prev) => {
        return prev.map(p => {
          const lb = d.leaderboard.find((l: any) => l.id === p.id);
          if (lb) {
            return { ...p, score: lb.totalScore, voteCount: lb.voteCount };
          }
          return p;
        });
      });
    };

    socket.on('host:room_created', onRoomCreated);
    socket.on('player:sync', onSync);
    socket.on('leaderboard:update', onLeaderboardUpdate);
    
    // We also need to join the leaderboard room to get updates
    socket.emit('player:join', { roomCode, nickname: 'HOST_OBSERVER', avatar: 'host' });

    return () => {
      socket.off('host:room_created', onRoomCreated);
      socket.off('player:sync', onSync);
      socket.off('leaderboard:update', onLeaderboardUpdate);
    };
  }, [socket, roomCode]);

  const openPoll = (id: string) => {
    socket?.emit('host:open_poll', { roomCode, participantId: id });
    setActivePoll(id);
    setPollStatus('OPEN');
  };

  const closePoll = () => {
    socket?.emit('host:close_poll', { roomCode });
    setActivePoll(null);
    setPollStatus('CLOSED');
  };

  const addScore = (id: string) => {
    const delta = parseFloat(manualScores[id]);
    if (isNaN(delta)) return;
    socket?.emit('host:manual_score', { roomCode, participantId: id, scoreDelta: delta });
    setManualScores(prev => ({ ...prev, [id]: '' }));
  };

  const overwriteScore = (id: string) => {
    const newScore = parseFloat(manualScores[id]);
    if (isNaN(newScore)) return;
    socket?.emit('host:overwrite_score', { roomCode, participantId: id, newScore });
    setManualScores(prev => ({ ...prev, [id]: '' }));
  };

  return (
    <Aurora intensity="subtle" className="text-[var(--color-chalk)] overflow-y-auto">
      <EmojiLayer />
      <EmojiStorm />

      <div className="flex flex-col min-h-screen p-6 sm:p-10 select-none max-w-5xl mx-auto w-full">
        {/* header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-[var(--color-chalk-soft)] w-max">PIN {roomCode}</span>
            <h1 className="text-2xl font-display font-bold mt-2">{title || 'Pitch Competition Control'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/leaderboard/${roomCode}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition">
              <ExternalLink className="w-4 h-4" /> Live Leaderboard
            </a>
            <button onClick={() => navigate('/host/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bad)]/20 hover:bg-[var(--color-bad)]/40 text-[var(--color-bad)] text-sm font-semibold transition">
              End Session
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-8">
          {participants.map((p, idx) => {
            const isVoting = activePoll === p.id && pollStatus === 'OPEN';
            
            return (
              <div key={p.id} className={`panel-void p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-2 transition-colors ${isVoting ? 'border-[var(--color-volt)] shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'border-white/5'}`}>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-2xl">{idx + 1}. {p.name}</span>
                    {isVoting && <span className="px-2 py-0.5 rounded text-xs font-bold bg-[var(--color-volt)] text-white animate-pulse">POLL OPEN</span>}
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-chalk-soft)]">{p.productIdea || 'No idea provided'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">Total Score: <strong className="tabular">{p.score || 0}</strong></span>
                    <span className="text-sm text-[var(--color-chalk-faint)]">Votes: <strong className="tabular">{p.voteCount || 0}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                  {isVoting ? (
                    <button onClick={closePoll} className="btn-answer btn-answer-a w-full py-3 px-6 flex items-center justify-center gap-2 font-bold text-sm">
                      <Square className="w-4 h-4 fill-white" /> CLOSE POLL
                    </button>
                  ) : (
                    <button onClick={() => openPoll(p.id)} disabled={pollStatus === 'OPEN'} className="btn-volt w-full py-3 px-6 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50">
                      <Play className="w-4 h-4 fill-white" /> OPEN POLL
                    </button>
                  )}

                  <div className="flex flex-col gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <input 
                      type="number" 
                      placeholder="Score value" 
                      className="bg-transparent border-b border-white/20 text-sm w-full px-2 py-1 outline-none text-white tabular focus:border-[var(--color-volt)] transition"
                      value={manualScores[p.id] || ''}
                      onChange={(e) => setManualScores(prev => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addScore(p.id)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-[var(--color-volt)] transition text-xs font-bold" title="Add or subtract this amount">
                        +/-
                      </button>
                      <button onClick={() => overwriteScore(p.id)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-[var(--color-ans-c)] transition text-xs font-bold text-white" title="Overwrite score entirely">
                        SET
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {participants.length === 0 && (
            <div className="text-center py-12 text-[var(--color-chalk-faint)] font-semibold">
              No participants found. Make sure this competition has participants.
            </div>
          )}
        </div>
      </div>
    </Aurora>
  );
};
