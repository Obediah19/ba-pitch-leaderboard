import { Socket, Server } from 'socket.io';
import { RoomManager } from '../game/RoomManager.js';
import { RateLimiter } from '../game/rateLimiter.js';
import { normalizeRoomCode, safeToken, sanitizeNickname, sanitizeAvatarSeed } from '../game/sanitize.js';
import { RATE_LIMITS } from '../config.js';

export function registerPlayerHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  rl: RateLimiter,
) {
  socket.on('player:join', (payload) => {
    try {
      const [max, win, block] = RATE_LIMITS['player:join'];
      if (!rl.allow(socket.id, 'player:join', max, win, block)) {
        socket.emit('room:error', { message: 'Too many join attempts. Wait a moment and retry.' });
        return;
      }

      const p = payload || {};
      const code = normalizeRoomCode(p.roomCode);
      if (!code) {
        socket.emit('room:error', { message: 'Invalid room code.' });
        return;
      }
      const nickname = sanitizeNickname(p.nickname);
      const avatar = sanitizeAvatarSeed(p.avatar);
      const existingToken = p.sessionToken != null ? safeToken(p.sessionToken) ?? undefined : undefined;

      const result = roomManager.joinRoom(code, socket.id, nickname, avatar, existingToken);

      if (!result.success || !result.player || !result.room) {
        socket.emit('room:error', { message: result.error || 'Failed to join room' });
        return;
      }

      socket.join(result.room.code);

      socket.emit('player:joined', {
        roomCode: result.room.code,
        sessionToken: result.player.sessionToken,
        playerId: result.player.playerId,
        nickname: result.player.nickname,
        avatar: result.player.avatar,
        title: result.room.competition.title,
        status: result.room.status,
      });

      console.log(`[Player] ${result.player.nickname} joined room ${result.room.code}`);
      roomManager.broadcastLobbyUpdate(result.room);
    } catch (err) {
      console.error('Error in player:join:', err);
      socket.emit('room:error', { message: 'Unexpected error joining room' });
    }
  });

  socket.on('player:submit_vote', (payload) => {
    try {
      // Re-using answer rate limit for vote
      const [max, win, block] = RATE_LIMITS['player:submit_answer'];
      if (!rl.allow(socket.id, 'player:submit_answer', max, win, block)) return;

      const p = payload || {};
      const code = normalizeRoomCode(p.roomCode);
      const token = safeToken(p.sessionToken);
      const participantId = p.participantId;
      const score = Number(p.score);
      
      if (!code || !token || !participantId || isNaN(score)) {
        socket.emit('player:vote_error', { message: 'Malformed vote.' });
        return;
      }

      const res = roomManager.submitVote(code, token, participantId, score);
      if (!res.success) {
        socket.emit('player:vote_error', { message: res.error });
      }
    } catch (err) {
      console.error('Error in player:submit_vote:', err);
      socket.emit('player:vote_error', { message: 'Failed to record vote' });
    }
  });

  socket.on('player:reaction', (payload) => {
    try {
      const p = payload || {};
      const code = normalizeRoomCode(p.roomCode);
      const token = safeToken(p.sessionToken);
      if (!code || !token) return;
      roomManager.handleReaction(code, token, p.emoji);
    } catch (err) {
      console.error('Error in player:reaction:', err);
    }
  });

  socket.on('player:reconnect', (payload) => {
    try {
      const [max, win, block] = RATE_LIMITS['player:reconnect'];
      if (!rl.allow(socket.id, 'player:reconnect', max, win, block)) return;

      const p = payload || {};
      const code = normalizeRoomCode(p.roomCode);
      const token = safeToken(p.sessionToken);
      if (!code || !token) {
        socket.emit('room:error', { message: 'Invalid reconnection request.' });
        return;
      }

      const room = roomManager.getRoom(code);
      if (!room || !room.players.has(token)) {
        socket.emit('room:error', { message: 'Previous session not found or room has ended.' });
        return;
      }

      const player = room.players.get(token)!;
      room.socketToToken.delete(player.socketId);
      player.socketId = socket.id;
      player.isConnected = true;
      room.socketToToken.set(socket.id, token);

      socket.join(room.code);

      socket.emit('player:reconnected', {
        roomCode: room.code,
        sessionToken: player.sessionToken,
        playerId: player.playerId,
        nickname: player.nickname,
        avatar: player.avatar,
        status: room.status,
      });

      roomManager.syncClientState(socket.id, room.code, token);
      console.log(`[Player] ${player.nickname} reconnected to room ${room.code}`);
    } catch (err) {
      console.error('Error in player:reconnect:', err);
      socket.emit('room:error', { message: 'Reconnection failed' });
    }
  });

  socket.on('leaderboard:join', (payload) => {
    try {
      const code = normalizeRoomCode(payload?.roomCode);
      if (!code) return;
      socket.join(`leaderboard_${code}`);
      socket.join(code);
      roomManager.sendLeaderboardUpdate(socket.id, code);
    } catch (err) {
      console.error('Error in leaderboard:join:', err);
    }
  });
}
