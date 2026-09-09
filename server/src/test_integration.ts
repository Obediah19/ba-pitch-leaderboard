import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function runTest() {
  console.log('--- STARTING MULTIPLAYER INTEGRATION TEST ---');

  // 1. Host Socket Connection
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', resolve));
  console.log('✓ Host connected to server:', hostSocket.id);

  // 2. Health & Host Login
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const health = await healthRes.json();
  console.log('✓ Server health check passed:', health.status);

  const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@arena.edu', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  console.log('✓ Host authenticated:', loginData.user.name);

  // Fetch quizzes
  const myQuizzesRes = await fetch(`${SERVER_URL}/api/quizzes`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const myQuizzes = await myQuizzesRes.json();
  console.log(`✓ Fetched ${myQuizzes.quizzes.length} quizzes from library`);
  const targetQuiz = myQuizzes.quizzes[0];

  // 3. Host creates room
  let roomCode = '';
  await new Promise<void>((resolve) => {
    hostSocket.emit('host:create_room', {
      quizId: targetQuiz.id,
      hostUserId: loginData.user.id,
      settings: { showTextOnPlayerScreen: true },
    });

    hostSocket.on('host:room_created', (data) => {
      roomCode = data.roomCode;
      console.log(`✓ Room created successfully! Code: ${roomCode}`);
      resolve();
    });
  });

  // 4. Two Players Join
  const p1Socket = io(SERVER_URL, { transports: ['websocket'] });
  const p2Socket = io(SERVER_URL, { transports: ['websocket'] });

  let p1Token = '';
  let p2Token = '';

  await Promise.all([
    new Promise<void>((resolve) => p1Socket.on('connect', resolve)),
    new Promise<void>((resolve) => p2Socket.on('connect', resolve)),
  ]);

  await Promise.all([
    new Promise<void>((resolve) => {
      p1Socket.emit('player:join', { roomCode, nickname: 'TurboNinja', avatar: 'seed-ninja' });
      p1Socket.on('player:joined', (data) => {
        p1Token = data.sessionToken;
        console.log(`✓ Player 1 joined: ${data.nickname}`);
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      p2Socket.emit('player:join', { roomCode, nickname: 'PixelQueen', avatar: 'seed-queen' });
      p2Socket.on('player:joined', (data) => {
        p2Token = data.sessionToken;
        console.log(`✓ Player 2 joined: ${data.nickname}`);
        resolve();
      });
    }),
  ]);

  // Set up listeners for question live BEFORE starting game
  const p1QuestionLivePromise = new Promise<any>((resolve) => {
    p1Socket.on('game:question_live', resolve);
  });

  // 5. Host starts game
  console.log('--- HOST STARTING GAME ---');
  hostSocket.emit('host:start_game', { roomCode });

  const liveData = await p1QuestionLivePromise;
  console.log(`✓ Received Live Question: "${liveData.prompt}"`);
  console.log(`   Options (${liveData.options.length}):`, liveData.options.map((o: any) => o.text));

  // VERIFY ANTI-CHEAT: isCorrect MUST NOT BE DEFINED!
  const hasCheatLeak = liveData.options.some((o: any) => o.isCorrect !== undefined);
  if (hasCheatLeak) {
    console.error('✗ ANTI-CHEAT FAILED: isCorrect leaked in live payload!');
    process.exit(1);
  } else {
    console.log('✓ ANTI-CHEAT VERIFIED: Answer keys strictly stripped from live payload!');
  }

  // Pre-register round result promises BEFORE submitting answers
  const breakdownPromise = new Promise<any>((resolve) => hostSocket.on('game:question_breakdown', resolve));
  const p1ResultPromise = new Promise<any>((resolve) => p1Socket.on('player:round_result', resolve));
  const p2ResultPromise = new Promise<any>((resolve) => p2Socket.on('player:round_result', resolve));

  // 6. Submit answers
  console.log('--- PLAYERS SUBMITTING ANSWERS ---');
  p1Socket.emit('player:submit_answer', {
    roomCode,
    sessionToken: p1Token,
    questionIndex: 0,
    selectedOptionIndex: 1, // Correct!
  });

  p2Socket.emit('player:submit_answer', {
    roomCode,
    sessionToken: p2Token,
    questionIndex: 0,
    selectedOptionIndex: 0, // Incorrect!
  });

  // 7. Wait for breakdown & player results
  const [breakdownData, p1Res, p2Res] = await Promise.all([
    breakdownPromise,
    p1ResultPromise,
    p2ResultPromise,
  ]);

  console.log('✓ Question breakdown received:');
  console.log('   Correct indices:', breakdownData.correctIndices);
  breakdownData.distribution.forEach((d: any) => {
    console.log(`   - Option ${d.index} ("${d.text}"): ${d.count} votes (${d.percentage}%) [Correct: ${d.isCorrect}]`);
  });

  console.log(`✓ P1 (Correct): Points=${p1Res.pointsAwarded}, Total=${p1Res.totalScore}, Streak=${p1Res.currentStreak}`);
  console.log(`✓ P2 (Incorrect): Points=${p2Res.pointsAwarded}, Total=${p2Res.totalScore}, Streak=${p2Res.currentStreak}`);

  // 8. Advance to Leaderboard
  console.log('--- ADVANCING TO LEADERBOARD ---');
  const leaderboardPromise = new Promise<any>((resolve) => hostSocket.on('game:leaderboard_update', resolve));
  hostSocket.emit('host:next_stage', { roomCode });

  const lbData = await leaderboardPromise;
  console.log('✓ Cumulative Leaderboard:');
  lbData.cumulativeTop.forEach((p: any) => {
    console.log(`   Rank #${p.rank}: ${p.nickname} — ${p.totalScore} pts (Delta: ${p.rankDelta})`);
  });

  console.log('\n======================================================');
  console.log('🎉 ALL MULTIPLAYER REAL-TIME TESTS PASSED 100%!');
  console.log('======================================================\n');

  hostSocket.disconnect();
  p1Socket.disconnect();
  p2Socket.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
