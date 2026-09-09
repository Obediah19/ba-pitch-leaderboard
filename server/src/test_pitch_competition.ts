import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function testPitchCompetitionFlow() {
  console.log('=====================================================');
  console.log('🚀 PITCH COMPETITION FULL STRESS TEST & CHECKLIST');
  console.log('=====================================================\n');

  // 1. Health check & Host authentication
  console.log('Step 1: Checking backend health & Host auth...');
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const health = await healthRes.json();
  if (health.status !== 'ok') throw new Error('Backend health check failed');
  console.log('  ✓ Backend health check passed.');

  const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@arena.edu', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) throw new Error('Host login failed');
  console.log(`  ✓ Host logged in: ${loginData.user.name} (${loginData.user.email})`);

  // 2. Fetch competitions
  console.log('\nStep 2: Fetching competition library...');
  const compRes = await fetch(`${SERVER_URL}/api/competitions`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const compData = await compRes.json();
  if (!compData.competitions || compData.competitions.length === 0) {
    throw new Error('No competitions found in library: ' + JSON.stringify(compData));
  }
  const targetComp = compData.competitions[0];
  console.log(`  ✓ Found competition: "${targetComp.title}" with ${targetComp.participants.length} pitch participants.`);

  // 3. Connect Host socket and create room
  console.log('\nStep 3: Creating live room via Host socket...');
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', resolve));

  let roomCode = '';
  let participantsList: any[] = [];

  await new Promise<void>((resolve, reject) => {
    hostSocket.emit('host:create_room', {
      competitionId: targetComp.id,
      hostUserId: loginData.user.id,
    });

    hostSocket.on('host:room_created', (data) => {
      roomCode = data.roomCode;
      participantsList = data.participants;
      console.log(`  ✓ Live room created! Room Code: [ ${roomCode} ]`);
      resolve();
    });

    hostSocket.on('room:error', (err) => reject(new Error(err.message)));
  });

  const p1 = participantsList[0];
  const p2 = participantsList[1];
  console.log(`  ✓ Participant 1: "${p1.name}" (${p1.productIdea})`);
  console.log(`  ✓ Participant 2: "${p2.name}" (${p2.productIdea})`);

  // 4. Connect Live Leaderboard socket
  console.log('\nStep 4: Connecting Live Leaderboard subscriber...');
  const leaderboardSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => leaderboardSocket.on('connect', resolve));

  let latestLeaderboard: any[] = [];
  leaderboardSocket.on('leaderboard:update', (data) => {
    latestLeaderboard = data.leaderboard;
    console.log('  📡 [Leaderboard Live Event] Updated Rankings:');
    data.leaderboard.forEach((item: any, index: number) => {
      console.log(`     #${index + 1} ${item.name} — Total Points: ${item.totalScore} (${item.voteCount} votes)`);
    });
  });

  leaderboardSocket.emit('leaderboard:join', { roomCode });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Connect 3 Audience Voter Sockets
  console.log('\nStep 5: Joining 3 audience voter participants...');
  const player1 = io(SERVER_URL, { transports: ['websocket'] });
  const player2 = io(SERVER_URL, { transports: ['websocket'] });
  const player3 = io(SERVER_URL, { transports: ['websocket'] });

  let p1Token = '';
  let p2Token = '';
  let p3Token = '';

  await Promise.all([
    new Promise<void>((resolve) => player1.on('connect', resolve)),
    new Promise<void>((resolve) => player2.on('connect', resolve)),
    new Promise<void>((resolve) => player3.on('connect', resolve)),
  ]);

  await Promise.all([
    new Promise<void>((resolve) => {
      player1.emit('player:join', { roomCode, nickname: 'Judge Alice', avatar: 'seed-alice' });
      player1.on('player:joined', (d) => { p1Token = d.sessionToken; resolve(); });
    }),
    new Promise<void>((resolve) => {
      player2.emit('player:join', { roomCode, nickname: 'Judge Bob', avatar: 'seed-bob' });
      player2.on('player:joined', (d) => { p2Token = d.sessionToken; resolve(); });
    }),
    new Promise<void>((resolve) => {
      player3.emit('player:join', { roomCode, nickname: 'Judge Charlie', avatar: 'seed-charlie' });
      player3.on('player:joined', (d) => { p3Token = d.sessionToken; resolve(); });
    }),
  ]);
  console.log('  ✓ 3 Voters joined room successfully!');

  // 6. Host opens poll for Participant 1
  console.log(`\nStep 6: Host opening poll for "${p1.name}"...`);
  const pollOpenPromise = new Promise<void>((resolve) => {
    player1.on('game:poll_open', (d) => {
      console.log(`  ✓ Voters received poll_open for: ${d.name} ("${d.productIdea}")`);
      resolve();
    });
  });

  hostSocket.emit('host:open_poll', { roomCode, participantId: p1.id });
  await pollOpenPromise;

  // 7. Voters submit scores (8, 9, 10) -> Expected Total for P1: 27 pts
  console.log('\nStep 7: Submitting votes (Alice: 8, Bob: 9, Charlie: 10)...');
  const v1 = new Promise<void>((r) => player1.on('player:vote_acknowledged', (d) => { console.log(`  ✓ Alice vote acknowledged: ${d.score}/10`); r(); }));
  const v2 = new Promise<void>((r) => player2.on('player:vote_acknowledged', (d) => { console.log(`  ✓ Bob vote acknowledged: ${d.score}/10`); r(); }));
  const v3 = new Promise<void>((r) => player3.on('player:vote_acknowledged', (d) => { console.log(`  ✓ Charlie vote acknowledged: ${d.score}/10`); r(); }));

  player1.emit('player:submit_vote', { roomCode, sessionToken: p1Token, participantId: p1.id, score: 8 });
  player2.emit('player:submit_vote', { roomCode, sessionToken: p2Token, participantId: p1.id, score: 9 });
  player3.emit('player:submit_vote', { roomCode, sessionToken: p3Token, participantId: p1.id, score: 10 });

  await Promise.all([v1, v2, v3]);
  await new Promise((r) => setTimeout(r, 500));

  // 8. Host closes poll for Participant 1
  console.log('\nStep 8: Host closing poll for Participant 1...');
  const pollClosePromise = new Promise<void>((resolve) => {
    player1.on('game:poll_closed', () => {
      console.log('  ✓ Voters received poll_closed event.');
      resolve();
    });
  });
  hostSocket.emit('host:close_poll', { roomCode });
  await pollClosePromise;

  // 9. Host applies manual score adjustment (+50 bonus points to P1)
  console.log('\nStep 9: Testing Host Manual Score Adjustment (+50 pts to Participant 1)...');
  hostSocket.emit('host:manual_score', { roomCode, participantId: p1.id, scoreDelta: 50 });
  await new Promise((r) => setTimeout(r, 500));

  // 10. Host overwrites score for Participant 2 (SET to 850 pts)
  console.log('\nStep 10: Testing Host Overwrite Score (SET Participant 2 to 850 pts)...');
  hostSocket.emit('host:overwrite_score', { roomCode, participantId: p2.id, newScore: 850 });
  await new Promise((r) => setTimeout(r, 500));

  // 11. Final Verification of Leaderboard Scores
  console.log('\nStep 11: Verifying Final Leaderboard State...');
  const finalP1 = latestLeaderboard.find((x: any) => x.id === p1.id);
  const finalP2 = latestLeaderboard.find((x: any) => x.id === p2.id);

  const expectedP1 = (p1.score || 0) + 8 + 9 + 10 + 50;

  console.log(`  • Participant 1 ("${p1.name}"): ${finalP1.totalScore} pts (Expected: ${expectedP1} pts)`);
  console.log(`  • Participant 2 ("${p2.name}"): ${finalP2.totalScore} pts (Expected: 850 pts)`);

  if (finalP1.totalScore !== expectedP1) {
    throw new Error(`P1 Score mismatch! Expected ${expectedP1}, got ${finalP1.totalScore}`);
  }
  if (finalP2.totalScore !== 850) {
    throw new Error(`P2 Score mismatch! Expected 850, got ${finalP2.totalScore}`);
  }

  console.log('\n=====================================================');
  console.log('✅ ALL STRESS TEST & INTEGRATION CHECKPOINTS PASSED!');
  console.log('=====================================================\n');

  hostSocket.disconnect();
  leaderboardSocket.disconnect();
  player1.disconnect();
  player2.disconnect();
  player3.disconnect();
  process.exit(0);
}

testPitchCompetitionFlow().catch((err) => {
  console.error('\n❌ STRESS TEST FAILED:', err);
  process.exit(1);
});
