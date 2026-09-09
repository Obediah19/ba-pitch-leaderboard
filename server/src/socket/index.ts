import { Server, Socket } from 'socket.io';
import { RoomManager } from '../game/RoomManager.js';
import { RateLimiter } from '../game/rateLimiter.js';
import { registerHostHandlers } from './hostHandlers.js';
import { registerPlayerHandlers } from './playerHandlers.js';
import { normalizeRoomCode, safeToken } from '../game/sanitize.js';
import {
  RATE_LIMITS,
  UNKNOWN_EVENT_LIMIT,
  UNKNOWN_EVENT_WINDOW_MS,
} from '../config.js';

// Every event name the server legitimately handles.
const KNOWN_EVENTS = new Set([
  'player:join', 'player:submit_vote', 'player:reaction', 'player:reconnect',
  'host:create_room', 'host:open_poll', 'host:close_poll', 'host:manual_score', 'host:overwrite_score',
  'host:kick_player', 'host:toggle_lock', 'host:add_participant', 'leaderboard:join',
  'room:sync_request',
  // socket.io internals
  'disconnect', 'disconnecting', 'error',
]);

export function setupSocketIO(io: Server): RoomManager {
  const roomManager = new RoomManager(io);
  const rl = new RateLimiter();

  io.on('connection', (socket: Socket) => {
    registerHostHandlers(io, socket, roomManager, rl);
    registerPlayerHandlers(io, socket, roomManager, rl);

    // Sync state request
    socket.on('room:sync_request', ({ roomCode, sessionToken }) => {
      const [max, win, block] = RATE_LIMITS['room:sync_request'];
      if (!rl.allow(socket.id, 'room:sync_request', max, win, block)) return;
      const code = normalizeRoomCode(roomCode);
      if (!code) return;
      const token = sessionToken != null ? safeToken(sessionToken) ?? undefined : undefined;
      if (token) {
        roomManager.syncClientState(socket.id, code, token);
      }
    });

    // Flood guard: count events we don't recognize; disconnect a socket that spams junk.
    socket.onAny((event: string) => {
      if (KNOWN_EVENTS.has(event)) return;
      if (!rl.allow(socket.id, '__unknown__', UNKNOWN_EVENT_LIMIT, UNKNOWN_EVENT_WINDOW_MS)) {
        console.warn(`[Flood] Disconnecting ${socket.id} — unknown-event flood (last: ${event})`);
        socket.disconnect(true);
      }
    });

    socket.on('disconnect', (reason) => {
      rl.clear(socket.id);
      const { room, player, isHost } = roomManager.handleDisconnect(socket.id);
      if (room) {
        if (isHost) {
          console.log(`[Host] Host disconnected from room ${room.code} (${reason})`);
          io.to(room.code).emit('room:host_disconnected', {
            message: 'Host temporarily disconnected. Waiting for host to reconnect...',
          });
        } else if (player) {
          console.log(`[Player] ${player.nickname} disconnected from room ${room.code}`);
          roomManager.broadcastLobbyUpdate(room);
        }
      }
    });
  });

  return roomManager;
}
