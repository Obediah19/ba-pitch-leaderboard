import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface ParticipantRecord {
  id: string;
  competition_id: string;
  participant_order: number;
  name: string;
  product_idea: string;
  score: number;
  vote_count: number;
}

export interface CompetitionRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  participants: ParticipantRecord[];
}

export interface GameSessionRecord {
  id: string;
  competition_id: string;
  host_id?: string;
  room_code: string;
  status: string;
  total_players: number;
  created_at: string;
  ended_at?: string;
}

export interface GamePlayerResultRecord {
  id: string;
  session_id: string;
  nickname: string;
  avatar: string;
  total_score: number;
  rank: number;
}

export interface DatabaseSchema {
  users: UserRecord[];
  competitions: CompetitionRecord[];
  game_sessions: GameSessionRecord[];
  game_player_results: GamePlayerResultRecord[];
}

class JsonDatabase {
  private filePath: string;
  private data: DatabaseSchema;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.resolve(dataDir, 'arena_db.json');

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        // Migrate old quiz data if needed, or just initialize cleanly if missing competitions
        if (!this.data.competitions) {
            this.data.competitions = [];
        }
      } catch (err) {
        console.error('Failed to parse existing arena_db.json, reinitializing:', err);
        this.data = this.getDefaultSchema();
        this.save();
      }
    } else {
      this.data = this.getDefaultSchema();
      this.save();
    }
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      competitions: [],
      game_sessions: [],
      game_player_results: [],
    };
  }

  public save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // User queries
  public findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public insertUser(user: UserRecord) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Competition queries
  public getCompetitionsByUserId(userId: string): CompetitionRecord[] {
    return this.data.competitions.filter(c => c.user_id === userId);
  }

  public getAllCompetitions(): CompetitionRecord[] {
    return this.data.competitions;
  }

  public getCompetitionById(id: string): CompetitionRecord | undefined {
    return this.data.competitions.find(c => c.id === id);
  }

  public insertCompetition(competition: CompetitionRecord) {
    this.data.competitions.push(competition);
    this.save();
    return competition;
  }

  public updateCompetition(id: string, updated: Partial<CompetitionRecord>): CompetitionRecord | undefined {
    const idx = this.data.competitions.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.competitions[idx] = { ...this.data.competitions[idx], ...updated };
    this.save();
    return this.data.competitions[idx];
  }

  public deleteCompetition(id: string): boolean {
    const initialLen = this.data.competitions.length;
    this.data.competitions = this.data.competitions.filter(c => c.id !== id);
    const deleted = this.data.competitions.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Game Sessions & Results
  public insertGameSession(session: GameSessionRecord) {
    this.data.game_sessions.push(session);
    this.save();
    return session;
  }

  public insertGamePlayerResults(results: GamePlayerResultRecord[]) {
    this.data.game_player_results.push(...results);
    this.save();
  }

  public getGameSessionById(id: string): GameSessionRecord | undefined {
    return this.data.game_sessions.find(s => s.id === id);
  }

  public getGamePlayerResults(sessionId: string): GamePlayerResultRecord[] {
    return this.data.game_player_results
      .filter(r => r.session_id === sessionId)
      .sort((a, b) => a.rank - b.rank);
  }
}

export const db = new JsonDatabase();

export function initDatabase() {
  console.log('JSON Database loaded successfully!');
}
