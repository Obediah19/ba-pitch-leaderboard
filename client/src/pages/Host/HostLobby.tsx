import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.js';
import { getAvatarDataUri } from '../../services/avatar.js';
import { sound } from '../../services/audio.js';
import { Aurora } from '../../components/ReactBits/Aurora.js';
import { StarBorder } from '../../components/ReactBits/StarBorder.js';
import { DecryptedText } from '../../components/ReactBits/DecryptedText.js';
import { CountUp } from '../../components/ReactBits/CountUp.js';
import { EmojiLayer, EmojiStorm } from '../../components/Game/StageFx.js';
import { Play, Volume2, VolumeX, Copy, Check, Users, UserX, ExternalLink, Plus, UserPlus, X } from 'lucide-react';

export const HostLobby: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const raw = (code || '').toUpperCase();
  const pretty = raw.length === 6 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
  const joinUrl = `${window.location.origin}/join/${raw}`;

  const [players, setPlayers] = useState<any[]>([]);
  const [pitchTeams, setPitchTeams] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [music, setMusic] = useState(false);

  // Add Pitch Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartIdea, setNewPartIdea] = useState('');

  useEffect(() => {
    if (!socket || !raw) return;
    socket.emit('room:sync_request', { roomCode: raw });

    const onLobby = (d: any) => {
      setPlayers((cur) => {
        if ((d.players?.length || 0) > cur.length) sound.playJoin();
        return d.players || [];
      });
      if (d.title) setTitle(d.title);
      if (d.participants) setPitchTeams(d.participants);
    };

    const onParticipantsUpdated = (d: any) => {
      if (d.participants) setPitchTeams(d.participants);
    };

    const onGo = () => { sound.stopLobbyMusic(); navigate(`/host/game/${raw}`); };

    socket.on('room:lobby_update', onLobby);
    socket.on('host:participants_updated', onParticipantsUpdated);
    socket.on('game:countdown', onGo);
    return () => {
      socket.off('room:lobby_update', onLobby);
      socket.off('host:participants_updated', onParticipantsUpdated);
      socket.off('game:countdown', onGo);
      sound.stopLobbyMusic();
    };
  }, [socket, raw, navigate]);

  const toggleMusic = () => {
    if (music) { sound.stopLobbyMusic(); setMusic(false); }
    else { sound.startLobbyMusic(); setMusic(true); }
  };

  const start = () => {
    sound.stopLobbyMusic();
    if (pitchTeams.length === 0) {
      alert('Please add at least 1 pitch team entry before starting live polling! Directing you to the Pitch Control Admin Panel.');
    }
    navigate(`/host/game/${raw}`);
  };

  const copy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kickPlayer = (target: string) => {
    if (!window.confirm('Remove this voter from the room?')) return;
    socket?.emit('host:kick_player', { roomCode: raw, sessionToken: target, playerId: target });
  };

  const handleAddParticipantLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !socket) return;

    socket.emit('host:add_participant', {
      roomCode: raw,
      name: newPartName.trim(),
      productIdea: newPartIdea.trim(),
    });

    setNewPartName('');
    setNewPartIdea('');
    setShowAddModal(false);
  };

  return (
    <Aurora intensity="subtle" className="text-[var(--color-chalk)] overflow-y-auto min-h-screen">
      <EmojiLayer />
      <EmojiStorm />

      <div className="flex flex-col justify-between min-h-screen p-6 sm:p-12 select-none">
        {/* top bar */}
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="font-display font-extrabold text-lg text-[var(--color-chalk)]">{title || 'Business Turnaround Challenge'}</span>
            </div>
            <span className="text-[10px] font-bold text-[var(--color-volt-bright)] uppercase tracking-wider ml-7">
              E-Summit • Magefficie • Entrepreneurial Symposium
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => navigate(`/host/game/${raw}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition shadow-lg"
              title="Open Admin Pitch Control Panel"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Pitch Control Panel
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-volt)] hover:bg-[var(--color-volt)]/80 text-xs font-bold text-white transition shadow-lg"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Pitch / Team
            </button>
            <a
              href={`/leaderboard/${raw}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[var(--color-chalk-soft)] transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-volt)]" /> Live Leaderboard
            </a>
            <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[var(--color-chalk-soft)] transition">
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-good)]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy join link'}
            </button>
            <button onClick={toggleMusic} title={music ? 'Mute music' : 'Play music'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--color-chalk-soft)] transition">
              {music ? <Volume2 className="w-4 h-4 text-[var(--color-good)]" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* hero */}
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-10 my-auto py-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="eyebrow text-[var(--color-chalk-faint)] mb-2">
                Join at <span className="text-[var(--color-chalk)]">{window.location.host}/join</span>
              </span>
              <div className="flex items-baseline gap-4">
                <span className="eyebrow text-[var(--color-chalk-faint)]">Code</span>
                <span className="fs-code font-display font-bold text-[var(--color-chalk)] tabular">
                  <DecryptedText text={pretty} speed={45} maxIterations={12} />
                </span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] shrink-0">
              <QRCodeSVG value={joinUrl} size={128} level="M" />
            </div>
          </div>

          {/* Registered Pitch Teams Section */}
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-chalk-soft)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--color-volt)]" /> Registered Pitch Teams ({pitchTeams.length})
              </span>
              <button
                onClick={() => navigate(`/host/game/${raw}`)}
                className="text-xs text-[var(--color-volt-bright)] hover:underline font-bold"
              >
                Manage Pitches →
              </button>
            </div>
            {pitchTeams.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--color-chalk-faint)]">
                No pitch teams added yet. Click <strong className="text-white">"Pitch Control Panel"</strong> or <strong className="text-white">"+ Add Pitch / Team"</strong> above to add entries.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                {pitchTeams.map((pt, i) => (
                  <div
                    key={pt.id || i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white"
                  >
                    <span className="text-[var(--color-volt-bright)]">{i + 1}.</span>
                    <span>{pt.name}</span>
                    {pt.productIdea && <span className="text-[var(--color-chalk-faint)] font-normal">({pt.productIdea})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-chalk-soft)]">
              <Users className="w-4 h-4 text-[var(--color-volt-bright)]" />
              <CountUp to={players.length} duration={0.5} /> {players.length === 1 ? 'player' : 'players'} joined
            </div>
            {players.length === 0 ? (
              <p className="py-4 text-[var(--color-chalk-faint)] font-semibold text-sm">Waiting for players to enter the code… (You can start anytime!)</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-5 max-w-3xl max-h-64 overflow-y-auto p-2">
                <AnimatePresence>
                  {players.map((p, i) => (
                    <motion.div
                      key={p.playerId}
                      initial={{ scale: 0, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 24, delay: (i % 6) * 0.03 }}
                      className="flex flex-col items-center gap-1.5 group relative"
                    >
                      <button
                        onClick={() => kickPlayer(p.sessionToken || p.playerId)}
                        className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Kick player"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                      <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/80 grid place-items-center overflow-hidden avatar-bob"
                        style={{ animationDelay: `${(i % 6) * 0.22}s` }}>
                        <img src={getAvatarDataUri(p.avatar || p.nickname)} alt={p.nickname} className="w-12 h-12" />
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-chalk-soft)] max-w-[84px] truncate">{p.nickname}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* start */}
        <div className="max-w-xs mx-auto w-full pb-2">
          <StarBorder as="button" onClick={start} color="#8B5CF6" speed="3s" className="w-full">
            <span className="flex items-center justify-center gap-2 py-4 font-display font-bold text-xl text-white">
              <Play className="w-5 h-5 fill-white" /> START COMPETITION
            </span>
          </StarBorder>
        </div>
      </div>

      {/* Add Pitch Live Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-text">
          <div className="w-full max-w-md bg-[var(--color-paper-raised)] border border-[var(--color-line)] rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-[var(--color-ink)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--color-volt)]" /> Add Pitch / Team Entry
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
                  placeholder="e.g. Team HR26"
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
                  placeholder="e.g. Gurgaon AI logistics platform"
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
                  <Plus className="w-4 h-4" /> Add Team Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Aurora>
  );
};
