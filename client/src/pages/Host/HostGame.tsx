import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.js';
import { Aurora } from '../../components/ReactBits/Aurora.js';
import { EmojiLayer, EmojiStorm } from '../../components/Game/StageFx.js';
import { Play, Square, Plus, ExternalLink, UserPlus, X, Users, UserX, Clock } from 'lucide-react';
import { getAvatarDataUri } from '../../services/avatar.js';

const CircularHostTimer: React.FC<{ remaining: number; total: number }> = ({ remaining, total }) => {
  if (total <= 0) return null;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / total));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="#EF4444"
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute font-mono font-bold text-xs text-white">
        {remaining}s
      </span>
    </div>
  );
};

export const HostGame: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const roomCode = (code || '').toUpperCase();

  const [participants, setParticipants] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<'CLOSED' | 'OPEN'>('CLOSED');
  const [title, setTitle] = useState('');

  // Timer state per participant
  const [selectedTimers, setSelectedTimers] = useState<{ [id: string]: number }>({});
  const [customTimers, setCustomTimers] = useState<{ [id: string]: string }>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);

  // Manual score input state
  const [manualScores, setManualScores] = useState<{ [id: string]: string }>({});

  // Add Pitch Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartIdea, setNewPartIdea] = useState('');

  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.emit('room:sync_request', { roomCode });

    const onRoomCreated = (d: any) => {
      setTitle(d.title);
      setParticipants(d.participants || []);
    };

    const onLobbyUpdate = (d: any) => {
      setVoters(d.players || []);
      if (d.title) setTitle(d.title);
    };

    const onParticipantsUpdated = (d: any) => {
      setParticipants(d.participants || []);
    };

    const onLeaderboardUpdate = (d: any) => {
      setParticipants((prev) => {
        return prev.map((p) => {
          const lb = d.leaderboard.find((l: any) => l.id === p.id);
          if (lb) {
            return {
              ...p,
              score: lb.totalScore,
              voteCount: lb.voteCount,
              averageScore: lb.averageScore,
            };
          }
          return p;
        });
      });
    };

    const onTimerTick = (d: any) => {
      setRemainingSeconds(d.remainingSeconds);
      if (d.totalSeconds) setTotalTimerSeconds(d.totalSeconds);
    };

    const onPollClosed = () => {
      setActivePoll(null);
      setPollStatus('CLOSED');
      setRemainingSeconds(0);
      setTotalTimerSeconds(0);
    };

    socket.on('host:room_created', onRoomCreated);
    socket.on('room:lobby_update', onLobbyUpdate);
    socket.on('host:participants_updated', onParticipantsUpdated);
    socket.on('leaderboard:update', onLeaderboardUpdate);
    socket.on('game:poll_timer_tick', onTimerTick);
    socket.on('game:poll_closed', onPollClosed);

    socket.emit('player:join', { roomCode, nickname: 'HOST_OBSERVER', avatar: 'host' });

    return () => {
      socket.off('host:room_created', onRoomCreated);
      socket.off('room:lobby_update', onLobbyUpdate);
      socket.off('host:participants_updated', onParticipantsUpdated);
      socket.off('leaderboard:update', onLeaderboardUpdate);
      socket.off('game:poll_timer_tick', onTimerTick);
      socket.off('game:poll_closed', onPollClosed);
    };
  }, [socket, roomCode]);

  const openPoll = (id: string) => {
    let timerSec = selectedTimers[id] !== undefined ? selectedTimers[id] : 30; // default 30s
    if (timerSec === -1) {
      const customVal = parseInt(customTimers[id] || '30', 10);
      timerSec = !isNaN(customVal) && customVal >= 0 ? customVal : 30;
    }
    socket?.emit('host:open_poll', { roomCode, participantId: id, durationSeconds: timerSec });
    setActivePoll(id);
    setPollStatus('OPEN');
    setTotalTimerSeconds(timerSec);
    setRemainingSeconds(timerSec);
  };

  const closePoll = () => {
    socket?.emit('host:close_poll', { roomCode });
    setActivePoll(null);
    setPollStatus('CLOSED');
    setRemainingSeconds(0);
    setTotalTimerSeconds(0);
  };

  const addScore = (id: string) => {
    const delta = parseFloat(manualScores[id]);
    if (isNaN(delta)) return;
    socket?.emit('host:manual_score', { roomCode, participantId: id, scoreDelta: delta });
    setManualScores((prev) => ({ ...prev, [id]: '' }));
  };

  const overwriteScore = (id: string) => {
    const newScore = parseFloat(manualScores[id]);
    if (isNaN(newScore)) return;
    socket?.emit('host:overwrite_score', { roomCode, participantId: id, newScore });
    setManualScores((prev) => ({ ...prev, [id]: '' }));
  };

  const kickVoter = (target: string) => {
    if (!window.confirm('Kick this participant from the room?')) return;
    socket?.emit('host:kick_player', { roomCode, sessionToken: target, playerId: target });
  };

  const handleAddParticipantLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !socket) return;

    socket.emit('host:add_participant', {
      roomCode,
      name: newPartName.trim(),
      productIdea: newPartIdea.trim(),
    });

    setNewPartName('');
    setNewPartIdea('');
    setShowAddModal(false);
  };

  const realVoters = voters.filter((v) => v.nickname !== 'HOST_OBSERVER');

  return (
    <Aurora intensity="subtle" className="text-[var(--color-chalk)] overflow-y-auto min-h-screen">
      <EmojiLayer />
      <EmojiStorm />

      <div className="flex flex-col min-h-screen p-6 sm:p-10 select-none max-w-5xl mx-auto w-full gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-[var(--color-chalk-soft)] w-max">
              ROOM CODE: {roomCode}
            </span>
            <h1 className="text-2xl font-display font-bold mt-1">{title || 'Business Turnaround Challenge Control'}</h1>
            <span className="text-[10px] font-bold text-[var(--color-volt-bright)] uppercase tracking-wider">
              E-Summit • Magefficie • Entrepreneurial Symposium
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/host/lobby/${roomCode}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition text-white shadow-lg"
              title="Show QR Code & Room Join Screen"
            >
              📺 Room Join Screen
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-volt flex items-center gap-2 px-4 py-2 text-sm font-bold shadow-lg"
            >
              <UserPlus className="w-4 h-4" /> Add Pitch Live
            </button>
            <a
              href={`/leaderboard/${roomCode}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
            >
              <ExternalLink className="w-4 h-4 text-[var(--color-volt)]" /> Live Leaderboard
            </a>
            <button
              onClick={() => navigate('/host/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bad)]/20 hover:bg-[var(--color-bad)]/40 text-[var(--color-bad)] text-sm font-semibold transition"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Audience Voter Roster */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-chalk-soft)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-volt)]" /> Connected Audience Voters ({realVoters.length})
            </span>
            <span className="text-xs text-[var(--color-chalk-faint)] font-semibold">Hover over a voter to kick</span>
          </div>

          {realVoters.length === 0 ? (
            <p className="text-xs font-semibold text-[var(--color-chalk-faint)] py-2">
              No audience members currently connected. Participants join at <strong className="text-white">{window.location.host}/join</strong>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {realVoters.map((v) => (
                <div
                  key={v.playerId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold group relative"
                >
                  <img
                    src={getAvatarDataUri(v.avatar || v.nickname)}
                    alt={v.nickname}
                    className="w-5 h-5 rounded-full"
                  />
                  <span>{v.nickname}</span>
                  <button
                    onClick={() => kickVoter(v.sessionToken || v.playerId)}
                    className="p-1 rounded-full bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition ml-1"
                    title={`Kick ${v.nickname}`}
                  >
                    <UserX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pitch Roster */}
        <div className="flex flex-col gap-6">
          {participants.map((p, idx) => {
            const isVoting = activePoll === p.id && pollStatus === 'OPEN';
            const avgScore =
              p.averageScore !== undefined
                ? Number(p.averageScore).toFixed(2)
                : p.voteCount > 0
                ? (p.score / p.voteCount).toFixed(2)
                : '0.00';

            const currentTimerVal = selectedTimers[p.id] !== undefined ? selectedTimers[p.id] : 30;

            return (
              <div
                key={p.id}
                className={`panel-void p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-2 transition-colors ${
                  isVoting ? 'border-[var(--color-volt)] shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'border-white/5'
                }`}
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-2xl">
                      {idx + 1}. {p.name}
                    </span>
                    {isVoting && (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-[var(--color-volt)] text-white animate-pulse">
                          LIVE POLL OPEN
                        </span>
                        <CircularHostTimer remaining={remainingSeconds} total={totalTimerSeconds} />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-chalk-soft)]">
                    {p.productIdea || 'No idea description'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">
                      Average Score:{' '}
                      <strong className="tabular text-2xl text-[var(--color-volt)] font-display font-bold">
                        {avgScore}
                      </strong>{' '}
                      <span className="text-xs text-[var(--color-chalk-soft)]">/ 10</span>
                    </span>
                    <span className="text-sm text-[var(--color-chalk-faint)]">
                      Audience Votes: <strong className="tabular">{p.voteCount || 0}</strong>
                    </span>
                    <span className="text-xs text-[var(--color-chalk-faint)]">
                      Total Points: <strong className="tabular">{p.score || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                  {!isVoting && (
                    <div className="flex flex-col gap-1.5 bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--color-volt)]" />
                        <span className="font-bold text-[var(--color-chalk-soft)]">Timer:</span>
                        <select
                          value={currentTimerVal}
                          onChange={(e) =>
                            setSelectedTimers((prev) => ({ ...prev, [p.id]: parseInt(e.target.value, 10) }))
                          }
                          className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
                        >
                          <option value={0} className="bg-gray-900 text-white">No Limit</option>
                          <option value={15} className="bg-gray-900 text-white">15 seconds</option>
                          <option value={30} className="bg-gray-900 text-white">30 seconds</option>
                          <option value={45} className="bg-gray-900 text-white">45 seconds</option>
                          <option value={60} className="bg-gray-900 text-white">60 seconds</option>
                          <option value={90} className="bg-gray-900 text-white">90 seconds</option>
                          <option value={120} className="bg-gray-900 text-white">120 seconds</option>
                          <option value={-1} className="bg-gray-900 text-white">⚙️ Custom Sec...</option>
                        </select>
                      </div>

                      {currentTimerVal === -1 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-[var(--color-chalk-faint)]">Sec:</span>
                          <input
                            type="number"
                            min="1"
                            max="3600"
                            placeholder="e.g. 25"
                            value={customTimers[p.id] || ''}
                            onChange={(e) => setCustomTimers((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs font-mono font-bold text-white focus:border-[var(--color-volt)] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {isVoting ? (
                    <button
                      onClick={closePoll}
                      className="btn-answer btn-answer-a w-full py-3 px-6 flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Square className="w-4 h-4 fill-white" /> CLOSE POLL
                    </button>
                  ) : (
                    <button
                      onClick={() => openPoll(p.id)}
                      disabled={pollStatus === 'OPEN'}
                      className="btn-volt w-full py-3 px-6 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-white" /> OPEN POLL
                    </button>
                  )}

                  <div className="flex flex-col gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <input
                      type="number"
                      placeholder="Bonus/Set Points"
                      className="bg-transparent border-b border-white/20 text-sm w-full px-2 py-1 outline-none text-white tabular focus:border-[var(--color-volt)] transition"
                      value={manualScores[p.id] || ''}
                      onChange={(e) => setManualScores((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addScore(p.id)}
                        className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-[var(--color-volt)] transition text-xs font-bold"
                        title="Add or subtract points"
                      >
                        +/- Add
                      </button>
                      <button
                        onClick={() => overwriteScore(p.id)}
                        className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-[var(--color-ans-c)] transition text-xs font-bold text-white"
                        title="Set exact total points"
                      >
                        SET
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="text-center py-16 text-[var(--color-chalk-faint)] font-semibold flex flex-col items-center gap-3">
              <span className="text-4xl">🎙️</span>
              <p className="text-lg">No pitches added yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-volt inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold mt-2"
              >
                <Plus className="w-4 h-4" /> Add your first live pitch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Pitch Live Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--color-paper-raised)] border border-[var(--color-line)] rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-[var(--color-ink)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--color-volt)]" /> Add Pitch Live
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--color-ink-soft)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipantLive} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  Participant / Team Name
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. Team Gamma"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-line)] text-sm font-semibold focus:outline-none focus:border-[var(--color-volt)] transition text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  Product / Startup Idea
                </label>
                <input
                  type="text"
                  value={newPartIdea}
                  onChange={(e) => setNewPartIdea(e.target.value)}
                  placeholder="e.g. Decentralized solar grid network"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-line)] text-sm font-semibold focus:outline-none focus:border-[var(--color-volt)] transition text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[var(--color-ink-soft)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-volt px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add to Live Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Aurora>
  );
};
