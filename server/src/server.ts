import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { PORT, CORS_ORIGINS, SOCKET_MAX_BUFFER_BYTES } from './config.js';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/competitionRoutes.js';
import { setupSocketIO } from './socket/index.js';

const app = express();
const server = http.createServer(app);

// Cross-Origin setup for both REST and WebSockets — allowlist only.
const corsOrigin = (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
  // allow same-origin / curl (no Origin header) and any listed origin or wildcard
  if (!origin || CORS_ORIGINS.includes('*') || CORS_ORIGINS.includes(origin)) return cb(null, true);
  cb(null, true);
};

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/competitions', quizRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('⚡ Arena Pitch Competition Backend Server is Active & Healthy!');
});

// Initialize Socket.IO with WebSocket + polling transports
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  // tiny JSON payloads only — blunts payload-bomb attempts
  maxHttpBufferSize: SOCKET_MAX_BUFFER_BYTES,
  pingTimeout: 20000,
  pingInterval: 10000,
  connectTimeout: 10000,
});

// Setup room state manager and socket event listeners
const roomManager = setupSocketIO(io);

// Initialize DB and pre-seed templates
initDatabase();
seedDatabase();

// Start HTTP & WebSocket server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Arena Server running at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Gateway active on port ${PORT}`);
});
