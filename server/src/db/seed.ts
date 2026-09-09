import { db, UserRecord, CompetitionRecord } from './database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase() {
  // Check if default user already exists
  let host = db.findUserByEmail('admin@arena.edu');
  let hostId = host ? host.id : uuidv4();

  if (!host) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const defaultUser: UserRecord = {
      id: hostId,
      email: 'admin@arena.edu',
      password_hash: passwordHash,
      name: 'Campus Fest Lead Organizer',
      created_at: new Date().toISOString(),
    };
    db.insertUser(defaultUser);
    console.log('Seeded default host: admin@arena.edu / admin123');
  }

  // Check if competitions already exist
  const existingCompetitions = db.getCompetitionsByUserId(hostId);
  if (existingCompetitions.length > 0) {
    return;
  }

  console.log('Seeding pre-built pitch competition...');

  // 1. Startup Pitch Competition
  const pitchCompetition: CompetitionRecord = {
    id: uuidv4(),
    user_id: hostId,
    title: '🚀 Annual Startup Pitch Competition',
    description: 'Rate the best startup ideas pitched today! Give each team a score from 1 to 10.',
    created_at: new Date().toISOString(),
    participants: [
      {
        id: uuidv4(),
        competition_id: '',
        participant_order: 0,
        name: 'Team Alpha',
        product_idea: 'AI-driven code reviewer for students',
        score: 0,
        vote_count: 0
      },
      {
        id: uuidv4(),
        competition_id: '',
        participant_order: 1,
        name: 'Team Beta',
        product_idea: 'Sustainable smart water bottle',
        score: 0,
        vote_count: 0
      },
      {
        id: uuidv4(),
        competition_id: '',
        participant_order: 2,
        name: 'Team Gamma',
        product_idea: 'Decentralized campus marketplace',
        score: 0,
        vote_count: 0
      }
    ]
  };

  pitchCompetition.participants.forEach(p => {
    p.competition_id = pitchCompetition.id;
  });

  db.insertCompetition(pitchCompetition);

  console.log('Seeding completed successfully with 1 pre-built pitch competition!');
}
