import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { sanitizeNickname, sanitizeAvatarSeed } from './sanitize.js';
import {
  MAX_PLAYERS_PER_ROOM,
  MAX_ROOMS,
  ALLOWED_REACTIONS,
  REACTION_MIN_INTERVAL_MS,
  REACTION_BURST_MAX,
  REACTION_BURST_WINDOW_MS,
  REACTION_BATCH_FLUSH_MS,
  REACTION_BATCH_ROOM_THRESHOLD,
  STORM_WINDOW_MS,
  STORM_MIN_PLAYERS,
  STORM_DOMINANCE,
  STORM_COOLDOWN_MS,
  ROOM_GC_INTERVAL_MS,
  ROOM_EMPTY_LOBBY_TTL_MS,
  ROOM_INACTIVITY_TTL_MS,
} from '../config.js';

export interface ParticipantData {
  id: string;
  order: number;
  name: string;
  productIdea: string;
  score: number;
  voteCount: number;
}

export interface CompetitionData {
  id: string;
  title: string;
  description: string;
  participants: ParticipantData[];
}

export interface PlayerState {
  playerId: string;
  sessionToken: string;
  socketId: string;
  nickname: string;
  avatar: string;
  hasVotedCurrent: boolean;
  isConnected: boolean;
  reactionHits: number[]; // recent reaction timestamps (rate-limit)
}

export type RoomStatus = 'LOBBY' | 'POLL_OPEN' | 'POLL_CLOSED' | 'ENDED';

export interface RoomState {
  code: string;
  hostSocketId: string;
  hostUserId?: string;
  competition: CompetitionData;
  status: RoomStatus;
  activeParticipantId: string | null;
  isLocked: boolean;
  players: Map<string, PlayerState>; // keyed by sessionToken
  socketToToken: Map<string, string>; // socketId -> sessionToken
  createdAt: number;
  lastActivityAt: number;
  // emoji reaction batching (large rooms) + storm detection
  reactionBatch: string[];
  reactionBatchTimer: NodeJS.Timeout | null;
  stormWindow: { emoji: string; at: number }[];
  stormCooldownUntil: number;
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private io: Server;
  private gcTimer: NodeJS.Timeout;

  constructor(io: Server) {
    this.io = io;
    this.gcTimer = setInterval(() => this.collectIdleRooms(), ROOM_GC_INTERVAL_MS);
  }

  public roomCount(): number {
    return this.rooms.size;
  }

  public hostRoomCount(hostSocketId: string): number {
    let n = 0;
    for (const r of this.rooms.values()) if (r.hostSocketId === hostSocketId) n++;
    return n;
  }

  private touch(room: RoomState) {
    room.lastActivityAt = Date.now();
  }

  public destroyRoom(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.reactionBatchTimer) clearInterval(room.reactionBatchTimer);
    this.rooms.delete(code);
    console.log(`[GC] Room ${code} destroyed`);
  }

  private collectIdleRooms() {
    const now = Date.now();
    for (const room of Array.from(this.rooms.values())) {
      const idle = now - room.lastActivityAt;
      const emptyLobby =
        room.status === 'LOBBY' && room.players.size === 0 && idle > ROOM_EMPTY_LOBBY_TTL_MS;
      if (emptyLobby || idle > ROOM_INACTIVITY_TTL_MS) {
        this.io.to(room.code).emit('room:ended', { reason: 'Room closed due to inactivity.' });
        this.destroyRoom(room.code);
      }
    }
  }

  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(hostSocketId: string, competition: CompetitionData, hostUserId?: string): RoomState | null {
    if (this.rooms.size >= MAX_ROOMS) {
      console.warn(`[Capacity] Refused room creation: ${this.rooms.size}/${MAX_ROOMS} rooms live`);
      return null;
    }
    const code = this.generateRoomCode();
    const now = Date.now();
    const room: RoomState = {
      code,
      hostSocketId,
      hostUserId,
      competition,
      status: 'LOBBY',
      activeParticipantId: null,
      isLocked: false,
      players: new Map(),
      socketToToken: new Map(),
      createdAt: now,
      lastActivityAt: now,
      reactionBatch: [],
      reactionBatchTimer: null,
      stormWindow: [],
      stormCooldownUntil: 0,
    };

    this.rooms.set(code, room);
    return room;
  }

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  public getRoomBySocketId(socketId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId || room.socketToToken.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public joinRoom(
    code: string,
    socketId: string,
    nickname: string,
    avatar: string,
    existingToken?: string
  ): { success: boolean; error?: string; player?: PlayerState; room?: RoomState } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found.' };
    if (room.isLocked) return { success: false, error: 'This room is currently locked by the host.' };

    if (!existingToken && room.players.size >= MAX_PLAYERS_PER_ROOM) {
      return { success: false, error: 'This room is full.' };
    }

    if (existingToken && room.players.has(existingToken)) {
      const player = room.players.get(existingToken)!;
      room.socketToToken.delete(player.socketId);
      player.socketId = socketId;
      player.isConnected = true;
      room.socketToToken.set(socketId, existingToken);
      return { success: true, player, room };
    }

    const cleanNick = sanitizeNickname(nickname);
    const cleanAvatar = sanitizeAvatarSeed(avatar);

    let finalNick = cleanNick;
    let suffix = 1;
    const existingNicknames = new Set(Array.from(room.players.values()).map(p => p.nickname.toLowerCase()));
    while (existingNicknames.has(finalNick.toLowerCase())) {
      finalNick = `${cleanNick} (${suffix++})`;
    }

    const sessionToken = uuidv4();
    const player: PlayerState = {
      playerId: uuidv4(),
      sessionToken,
      socketId,
      nickname: finalNick,
      avatar: cleanAvatar,
      hasVotedCurrent: false,
      isConnected: true,
      reactionHits: [],
    };

    room.players.set(sessionToken, player);
    room.socketToToken.set(socketId, sessionToken);

    return { success: true, player, room };
  }

  public handleDisconnect(socketId: string): { room?: RoomState; player?: PlayerState; isHost: boolean } {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return { isHost: false };

    if (room.hostSocketId === socketId) {
      return { room, isHost: true };
    }

    const token = room.socketToToken.get(socketId);
    if (token && room.players.has(token)) {
      const player = room.players.get(token)!;
      player.isConnected = false;
      room.socketToToken.delete(socketId);
      return { room, player, isHost: false };
    }

    return { room, isHost: false };
  }

  public kickPlayer(code: string, sessionToken: string): boolean {
    const room = this.getRoom(code);
    if (!room || !room.players.has(sessionToken)) return false;

    const player = room.players.get(sessionToken)!;
    room.socketToToken.delete(player.socketId);
    room.players.delete(sessionToken);

    this.io.to(player.socketId).emit('room:kicked', { message: 'You were removed from the room by the host.' });
    this.broadcastLobbyUpdate(room);
    return true;
  }

  public broadcastLobbyUpdate(room: RoomState) {
    this.touch(room);
    const playerList = Array.from(room.players.values()).map(p => ({
      playerId: p.playerId,
      nickname: p.nickname,
      avatar: p.avatar,
      isConnected: p.isConnected,
    }));

    this.io.to(room.code).emit('room:lobby_update', {
      roomCode: room.code,
      title: room.competition.title,
      isLocked: room.isLocked,
      players: playerList,
      totalPlayers: playerList.length,
    });

    this.io.to(room.hostSocketId).emit('host:roster_private', {
      players: Array.from(room.players.values()).map(p => ({
        playerId: p.playerId,
        sessionToken: p.sessionToken,
        nickname: p.nickname,
      })),
    });
  }

  // Reactions logic
  private reactionAllowedInStatus(status: RoomStatus): boolean {
    return status === 'LOBBY' || status === 'POLL_CLOSED';
  }

  public handleReaction(code: string, sessionToken: string, emoji: unknown): void {
    const room = this.getRoom(code);
    if (!room || !this.reactionAllowedInStatus(room.status)) return;
    const player = room.players.get(sessionToken);
    if (!player) return;
    if (typeof emoji !== 'string' || !(ALLOWED_REACTIONS as readonly string[]).includes(emoji)) return;

    const now = Date.now();
    player.reactionHits = player.reactionHits.filter(t => now - t < REACTION_BURST_WINDOW_MS);
    const last = player.reactionHits[player.reactionHits.length - 1] ?? 0;
    if (now - last < REACTION_MIN_INTERVAL_MS) return;
    if (player.reactionHits.length >= REACTION_BURST_MAX) return;
    player.reactionHits.push(now);
    this.touch(room);

    if (room.players.size >= REACTION_BATCH_ROOM_THRESHOLD) {
      room.reactionBatch.push(emoji);
      if (!room.reactionBatchTimer) {
        room.reactionBatchTimer = setInterval(() => this.flushReactionBatch(room), REACTION_BATCH_FLUSH_MS);
      }
    } else {
      this.io.to(room.code).emit('room:reaction', { emoji, playerId: player.playerId });
    }

    this.detectStorm(room, emoji, now);
  }

  private flushReactionBatch(room: RoomState) {
    if (room.reactionBatch.length === 0) {
      if (room.reactionBatchTimer) {
        clearInterval(room.reactionBatchTimer);
        room.reactionBatchTimer = null;
      }
      return;
    }
    const emojis = room.reactionBatch.splice(0, 120);
    this.io.to(room.code).emit('room:reaction_batch', { emojis });
  }

  private detectStorm(room: RoomState, emoji: string, now: number) {
    if (now < room.stormCooldownUntil) return;
    room.stormWindow = room.stormWindow.filter(e => now - e.at < STORM_WINDOW_MS);
    room.stormWindow.push({ emoji, at: now });

    const connected = Array.from(room.players.values()).filter(p => p.isConnected).length;
    if (connected < STORM_MIN_PLAYERS) return;

    const counts = new Map<string, number>();
    for (const e of room.stormWindow) counts.set(e.emoji, (counts.get(e.emoji) || 0) + 1);
    for (const [em, c] of counts) {
      if (c / connected >= STORM_DOMINANCE) {
        room.stormCooldownUntil = now + STORM_COOLDOWN_MS;
        room.stormWindow = [];
        this.io.to(room.code).emit('room:emoji_storm', { emoji: em });
        return;
      }
    }
  }

  // Polling logic
  public openPoll(code: string, participantId: string) {
    const room = this.getRoom(code);
    if (!room) return;
    this.touch(room);
    
    room.status = 'POLL_OPEN';
    room.activeParticipantId = participantId;
    
    // Reset players' vote status
    room.players.forEach(p => p.hasVotedCurrent = false);

    const participant = room.competition.participants.find(p => p.id === participantId);
    
    this.io.to(room.code).emit('game:poll_open', {
      participantId,
      name: participant?.name,
      productIdea: participant?.productIdea
    });
  }

  public closePoll(code: string) {
    const room = this.getRoom(code);
    if (!room || room.status !== 'POLL_OPEN') return;
    this.touch(room);

    room.status = 'POLL_CLOSED';
    room.activeParticipantId = null;

    this.io.to(room.code).emit('game:poll_closed');
  }

  public submitVote(
    code: string,
    sessionToken: string,
    participantId: string,
    score: number
  ): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room || room.status !== 'POLL_OPEN') return { success: false, error: 'Poll is not active.' };
    if (room.activeParticipantId !== participantId) return { success: false, error: 'Invalid participant.' };

    const player = room.players.get(sessionToken);
    if (!player) return { success: false, error: 'Player not found.' };
    if (player.hasVotedCurrent) return { success: false, error: 'You have already voted.' };

    if (score < 1 || score > 10) return { success: false, error: 'Score must be between 1 and 10.' };

    const participant = room.competition.participants.find(p => p.id === participantId);
    if (!participant) return { success: false, error: 'Participant not found.' };

    participant.score += score;
    participant.voteCount += 1;
    player.hasVotedCurrent = true;

    this.io.to(player.socketId).emit('player:vote_acknowledged', { score });
    
    // Broadcast leaderboard update via a separate room for observers (live leaderboard page)
    this.broadcastLeaderboardUpdate(room);

    return { success: true };
  }
  
  public addManualScore(code: string, participantId: string, scoreDelta: number): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    
    const participant = room.competition.participants.find(p => p.id === participantId);
    if (!participant) return false;
    
    participant.score += scoreDelta;
    this.broadcastLeaderboardUpdate(room);
    return true;
  }

  public overwriteScore(code: string, participantId: string, newScore: number): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    
    const participant = room.competition.participants.find(p => p.id === participantId);
    if (!participant) return false;
    
    participant.score = newScore;
    this.broadcastLeaderboardUpdate(room);
    return true;
  }

  public addParticipantToRoom(code: string, name: string, productIdea: string): ParticipantData | null {
    const room = this.getRoom(code);
    if (!room) return null;
    this.touch(room);

    const newPart: ParticipantData = {
      id: uuidv4(),
      order: room.competition.participants.length,
      name: name.trim() || `Participant ${room.competition.participants.length + 1}`,
      productIdea: productIdea.trim() || '',
      score: 0,
      voteCount: 0,
    };

    room.competition.participants.push(newPart);

    this.io.to(room.hostSocketId).emit('host:participants_updated', {
      participants: room.competition.participants,
    });
    this.broadcastLeaderboardUpdate(room);

    const dbComp = db.getCompetitionById(room.competition.id);
    if (dbComp) {
      dbComp.participants.push({
        id: newPart.id,
        competition_id: dbComp.id,
        participant_order: newPart.order,
        name: newPart.name,
        product_idea: newPart.productIdea,
        score: 0,
        vote_count: 0,
      });
      db.save();
    }

    return newPart;
  }

  public broadcastLeaderboardUpdate(room: RoomState) {
    const leaderboard = room.competition.participants.map(p => {
      return {
        id: p.id,
        name: p.name,
        productIdea: p.productIdea,
        voteCount: p.voteCount,
        totalScore: p.score
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    this.io.to(room.code).emit('leaderboard:update', { leaderboard });
    this.io.to(`leaderboard_${room.code}`).emit('leaderboard:update', { leaderboard });
  }

  public sendLeaderboardUpdate(socketId: string, code: string) {
    const room = this.getRoom(code);
    if (!room) return;
    const leaderboard = room.competition.participants.map(p => ({
      id: p.id,
      name: p.name,
      productIdea: p.productIdea,
      voteCount: p.voteCount,
      totalScore: p.score
    })).sort((a, b) => b.totalScore - a.totalScore);

    this.io.to(socketId).emit('leaderboard:update', { leaderboard });
  }

  public syncClientState(socketId: string, code: string, sessionToken: string) {
    const room = this.getRoom(code);
    const player = room?.players.get(sessionToken);
    if (!room || !player) return;

    this.io.to(socketId).emit('player:sync', {
      status: room.status,
      activeParticipantId: room.activeParticipantId,
      hasVoted: player.hasVotedCurrent,
      participant: room.activeParticipantId 
        ? room.competition.participants.find(p => p.id === room.activeParticipantId)
        : null
    });
  }
}
