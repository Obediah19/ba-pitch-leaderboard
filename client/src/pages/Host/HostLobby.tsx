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
import { Play, Volume2, VolumeX, Copy, Check, Users } from 'lucide-react';

export const HostLobby: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const raw = (code || '').toUpperCase();
  const pretty = raw.length === 6 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
  const joinUrl = `${window.location.origin}/join/${raw}`;

  const [players, setPlayers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [music, setMusic] = useState(false);

  useEffect(() => {
    if (!socket || !raw) return;
    socket.emit('room:sync_request', { roomCode: raw });

    const onLobby = (d: any) => {
      setPlayers((cur) => {
        if ((d.players?.length || 0) > cur.length) sound.playJoin();
        return d.players || [];
      });
      if (d.title) setTitle(d.title);
    };
    const onGo = () => { sound.stopLobbyMusic(); navigate(`/host/game/${raw}`); };

    socket.on('room:lobby_update', onLobby);
    socket.on('game:countdown', onGo);
    return () => {
      socket.off('room:lobby_update', onLobby);
      socket.off('game:countdown', onGo);
      sound.stopLobbyMusic();
    };
  }, [socket, raw, navigate]);

  const toggleMusic = () => {
    if (music) { sound.stopLobbyMusic(); setMusic(false); }
    else { sound.startLobbyMusic(); setMusic(true); }
  };
  const start = () => {
    if (!players.length || !socket) return;
    sound.stopLobbyMusic();
    navigate(`/host/game/${raw}`);
  };
  const copy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Aurora intensity="subtle" className="text-[var(--color-chalk)]">
      <EmojiLayer />
      <EmojiStorm />

      <div className="flex flex-col justify-between min-h-screen p-6 sm:p-12 select-none">
        {/* top bar */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-display font-semibold text-lg text-[var(--color-chalk)]/90">{title || 'Pitch Competition'}</span>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-12 my-auto">
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

          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-chalk-soft)]">
              <Users className="w-4 h-4 text-[var(--color-volt-bright)]" />
              <CountUp to={players.length} duration={0.5} /> {players.length === 1 ? 'player' : 'players'} joined
            </div>
            {players.length === 0 ? (
              <p className="py-8 text-[var(--color-chalk-faint)] font-semibold text-sm">Waiting for players to enter the code…</p>
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
                      className="flex flex-col items-center gap-1.5"
                    >
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
          {players.length > 0 ? (
            <StarBorder as="button" onClick={start} color="#8B5CF6" speed="3s" className="w-full">
              <span className="flex items-center justify-center gap-2 py-4 font-display font-bold text-xl text-white">
                <Play className="w-5 h-5 fill-white" /> START COMPETITION
              </span>
            </StarBorder>
          ) : (
            <button disabled className="btn-volt w-full py-4 text-xl opacity-40">
              <span className="flex items-center justify-center gap-2"><Play className="w-5 h-5 fill-white" /> START COMPETITION</span>
            </button>
          )}
        </div>
      </div>
    </Aurora>
  );
};
