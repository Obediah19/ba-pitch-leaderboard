import { Socket, Server } from 'socket.io';
import { RoomManager, CompetitionData } from '../game/RoomManager.js';
import { RateLimiter } from '../game/rateLimiter.js';
import { db } from '../db/database.js';
import { safeToken } from '../game/sanitize.js';
import { RATE_LIMITS, MAX_ROOMS_PER_HOST_SOCKET } from '../config.js';

export function registerHostHandlers(io: Server, socket: Socket, roomManager: RoomManager, rl: RateLimiter) {
  socket.on('host:create_room', ({ competitionId, hostUserId }) => {
    try {
      const [max, win, block] = RATE_LIMITS['host:create_room'];
      if (!rl.allow(socket.id, 'host:create_room', max, win, block)) {
        socket.emit('room:error', { message: 'Slow down — too many rooms created too fast.' });
        return;
      }
      if (typeof competitionId !== 'string' || competitionId.length > 64) {
        socket.emit('room:error', { message: 'Invalid competition reference.' });
        return;
      }
      if (roomManager.hostRoomCount(socket.id) >= MAX_ROOMS_PER_HOST_SOCKET) {
        socket.emit('room:error', { message: 'You already have the maximum number of live rooms.' });
        return;
      }

      const dbComp = db.getCompetitionById(competitionId);
      if (!dbComp) {
        socket.emit('room:error', { message: 'Competition template not found!' });
        return;
      }

      const compData: CompetitionData = {
        id: dbComp.id,
        title: dbComp.title,
        description: dbComp.description,
        participants: dbComp.participants.map(p => ({
          id: p.id,
          order: p.participant_order,
          name: p.name,
          productIdea: p.product_idea,
          score: p.score,
          voteCount: p.vote_count
        })),
      };

      const room = roomManager.createRoom(socket.id, compData, hostUserId);
      if (!room) {
        socket.emit('room:error', { message: 'Server is at capacity. Try again shortly.' });
        return;
      }

      socket.join(room.code);

      socket.emit('host:room_created', {
        roomCode: room.code,
        title: room.competition.title,
        isLocked: room.isLocked,
        participants: room.competition.participants
      });

      console.log(`[Host] Room created: ${room.code} for competition: "${room.competition.title}"`);
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit('room:error', { message: 'Failed to create room' });
    }
  });

  socket.on('host:open_poll', ({ roomCode, participantId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    roomManager.openPoll(roomCode, participantId);
  });

  socket.on('host:close_poll', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    roomManager.closePoll(roomCode);
  });

  socket.on('host:manual_score', ({ roomCode, participantId, scoreDelta }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    const added = roomManager.addManualScore(roomCode, participantId, Number(scoreDelta) || 0);
    if (added) {
      // Also update DB since this is a manual change that persists
      const dbComp = db.getCompetitionById(room.competition.id);
      if (dbComp) {
        const p = dbComp.participants.find(x => x.id === participantId);
        if (p) {
          p.score += (Number(scoreDelta) || 0);
          db.save();
        }
      }
    }
  });

  socket.on('host:overwrite_score', ({ roomCode, participantId, newScore }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    const updated = roomManager.overwriteScore(roomCode, participantId, Number(newScore) || 0);
    if (updated) {
      // Also update DB since this is a manual change that persists
      const dbComp = db.getCompetitionById(room.competition.id);
      if (dbComp) {
        const p = dbComp.participants.find(x => x.id === participantId);
        if (p) {
          p.score = (Number(newScore) || 0);
          db.save();
        }
      }
    }
  });

  socket.on('host:kick_player', ({ roomCode, sessionToken, playerId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    const target = sessionToken || playerId;
    if (!target) return;
    roomManager.kickPlayer(roomCode, target);
  });

  socket.on('host:toggle_lock', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    room.isLocked = !room.isLocked;
    io.to(room.code).emit('room:lock_status', { isLocked: room.isLocked });
    roomManager.broadcastLobbyUpdate(room);
  });

  socket.on('host:add_participant', ({ roomCode, name, productIdea }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    roomManager.addParticipantToRoom(roomCode, String(name || ''), String(productIdea || ''));
  });
}
