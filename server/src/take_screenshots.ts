import puppeteer from 'puppeteer-core';
import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\aryam\\Desktop\\Quiz_App_Screenshots';
const DESKTOP_DIR = 'C:\\Users\\aryam\\Desktop';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ScreenshotRecord {
  filename: string;
  title: string;
  role: 'Host' | 'Player';
  viewport: string;
  description: string;
}

const capturedScreenshots: ScreenshotRecord[] = [];

async function record(
  page: any,
  filename: string,
  title: string,
  role: 'Host' | 'Player',
  viewport: string,
  description: string
) {
  const filePath = path.join(OUTPUT_DIR, filename);
  await sleep(500);
  await page.screenshot({ path: filePath, fullPage: false });
  capturedScreenshots.push({ filename, title, role, viewport, description });
  console.log(`[Captured] ${filename} (${role} - ${viewport})`);
}

async function capture() {
  console.log('======================================================');
  console.log('ARENA QUIZ — SCREENSHOT RECORDER (CLEAN FLOW)');
  console.log('Chrome Binary:', CHROME_PATH);
  console.log('Output Directory:', OUTPUT_DIR);
  console.log('======================================================\n');

  // Obtain real JWT token for host sessions
  console.log('Authenticating host account...');
  let hostToken = '';
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@arena.edu', password: 'admin123' }),
    });
    const data = await res.json();
    hostToken = data.token;
  } catch (err) {
    console.error('Auth failed:', err);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
    ],
  });

  // 1. Home Page
  console.log('1/16 Capturing Home Page...');
  const pageHome = await browser.newPage();
  await pageHome.setViewport({ width: 1440, height: 900 });
  await pageHome.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await record(
    pageHome,
    '01_Home_Page.png',
    'Landing & Join Screen',
    'Host',
    'Desktop 1440x900',
    'Clean off-white landing screen with 6-char PIN entry and 1-click host tournament launcher.'
  );
  await pageHome.close();

  // 2. Player Join Screen
  console.log('2/16 Capturing Player Join Screen...');
  const pageJoin = await browser.newPage();
  await pageJoin.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageJoin.goto('http://localhost:5173/join', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await record(
    pageJoin,
    '02_Player_Join_Screen.png',
    'Player Room & Nickname Join',
    'Player',
    'Mobile 390x844',
    'Mobile PIN entry, nickname input, and random DiceBear avatar generator with reroll.'
  );
  await pageJoin.close();

  // 3. Quiz Editor
  console.log('3/16 Capturing Quiz Editor...');
  const pageEditor = await browser.newPage();
  await pageEditor.setViewport({ width: 1440, height: 900 });
  await pageEditor.goto('http://localhost:5173/host/editor', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  await record(
    pageEditor,
    '04_Host_Quiz_Editor.png',
    'Quiz & Question Editor',
    'Host',
    'Desktop 1440x900',
    'Linear-style quiz authoring tool with color-coded options (A=Coral, B=Blue, C=Yellow, D=Mint).'
  );
  await pageEditor.close();

  // 4. Host Dashboard
  console.log('4/16 Capturing Host Dashboard...');
  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1440, height: 900 });
  await hostPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  if (hostToken) {
    await hostPage.evaluate((tok) => {
      localStorage.setItem('arena_host_token', tok);
    }, hostToken);
  }
  await hostPage.goto('http://localhost:5173/host/dashboard', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  await record(
    hostPage,
    '03_Host_Dashboard.png',
    'Host Control Dashboard',
    'Host',
    'Desktop 1440x900',
    'Organizers dashboard displaying seeded quizzes, active tournament stats, and 1-click launch.'
  );

  // 5. Launch Live Tournament
  console.log('5/16 Launching Tournament Session...');
  await hostPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const launchBtn = btns.find((b) => b.textContent?.includes('START LIVE QUIZ'));
    if (launchBtn) launchBtn.click();
  });

  await hostPage.waitForFunction(() => window.location.pathname.includes('/host/lobby/'), { timeout: 10000 });
  await hostPage.setViewport({ width: 1920, height: 1080 }); // Projector 1080p
  await sleep(1200);

  const lobbyUrl = hostPage.url();
  const roomCode = lobbyUrl.split('/').pop() || '';
  console.log(`Tournament Room Active: PIN is ${roomCode}`);

  // 6. Host Lobby (Empty)
  await record(
    hostPage,
    '05_Host_Room_Lobby_Empty.png',
    'Host Projector Lobby (Waiting)',
    'Host',
    'Projector 1920x1080',
    'High-contrast 1080p projector display with giant 96px room code, QR code, and audio toggle.'
  );

  // 7. Connect 2 virtual background bots with await for sessionTokens
  console.log('Connecting background players...');
  const bot1 = io('http://localhost:3001');
  const bot2 = io('http://localhost:3001');

  const joinBotPromise = (bot: any, name: string) => {
    return new Promise<string>((resolve) => {
      bot.on('player:joined', (d: any) => resolve(d.sessionToken));
      bot.emit('player:join', { roomCode, nickname: name, avatar: name });
    });
  };

  const [bot1Token, bot2Token] = await Promise.all([
    joinBotPromise(bot1, 'ByteQueen'),
    joinBotPromise(bot2, 'PixelMaster'),
  ]);
  console.log('Virtual players connected with tokens:', { bot1Token: !!bot1Token, bot2Token: !!bot2Token });

  // 8. Player 1 joins via Mobile page
  console.log(`Player AlexNinja joining room ${roomCode}...`);
  const playerPage = await browser.newPage();
  await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await playerPage.goto(`http://localhost:5173/join/${roomCode}`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await playerPage.type('input[placeholder="Enter your nickname..."]', 'AlexNinja');
  await sleep(400);
  await playerPage.click('button[type="submit"]');

  await playerPage.waitForFunction(() => window.location.pathname.includes('/player/lobby'), { timeout: 10000 });
  await sleep(1200);

  // 9. Player Waiting Room
  console.log('6/16 Capturing Player Waiting Room...');
  await record(
    playerPage,
    '06_Player_Waiting_Room.png',
    'Player Waiting Room',
    'Player',
    'Mobile 390x844',
    'Centered avatar showcase with status "You\'re in! See your name on screen?".'
  );

  // 10. Host Lobby with Players
  console.log('7/16 Capturing Host Lobby (Multiplayer)...');
  await sleep(800);
  await record(
    hostPage,
    '07_Host_Room_Lobby_Multiplayer.png',
    'Host Lobby with Live Players',
    'Host',
    'Projector 1920x1080',
    'Projector view showing multiple real-time avatars dynamically joined and ready to start.'
  );

  // 11. Host Starts Quiz
  console.log('Host clicks "START QUIZ"...');
  await hostPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find((b) => b.textContent?.includes('START QUIZ'));
    if (startBtn) startBtn.click();
  });

  await hostPage.waitForFunction(() => window.location.pathname.includes('/host/game/'), { timeout: 10000 });
  await playerPage.waitForFunction(() => window.location.pathname.includes('/player/game'), { timeout: 10000 });
  await sleep(4000); // 3s countdown + 1s buffer

  // 12. Live Question Host
  console.log('8/16 Capturing Live Question (Host)...');
  await record(
    hostPage,
    '08_Live_Question_Host.png',
    'Live Question (Projector Display)',
    'Host',
    'Projector 1920x1080',
    'Full question display with ticking circular progress ring, live answer count, and 4 colored cards.'
  );

  // 13. Live Question Player
  console.log('9/16 Capturing Live Question (Player)...');
  await record(
    playerPage,
    '09_Live_Question_Player.png',
    'Live Question (Player Phone)',
    'Player',
    'Mobile 390x844',
    'Ergonomic 2x2 touch pads on mobile device matching screen color roles (A, B, C, D).'
  );

  // 14. Player 1 Answers B (Correct)
  console.log('Player AlexNinja answers B...');
  await playerPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    if (btns[1]) btns[1].click();
  });
  await sleep(600);

  // 15. Player Answer Locked
  console.log('10/16 Capturing Player Answer Locked...');
  await record(
    playerPage,
    '10_Player_Answer_Locked.png',
    'Player Answer Locked State',
    'Player',
    'Mobile 390x844',
    'Instant tactile feedback with selected state disabled to prevent double taps.'
  );

  // 16. Bots submit answers
  console.log('Bots submitting answers to conclude question...');
  bot1.emit('player:submit_answer', {
    roomCode,
    sessionToken: bot1Token,
    questionIndex: 0,
    selectedOptionIndex: 1, // Option B (Correct)
  });
  bot2.emit('player:submit_answer', {
    roomCode,
    sessionToken: bot2Token,
    questionIndex: 0,
    selectedOptionIndex: 0, // Option A (Wrong)
  });

  // Question will automatically conclude as 3/3 players answered
  console.log('Waiting for Breakdown view...');
  await hostPage.waitForFunction(
    () => document.body.innerText.includes('View Leaderboard') || document.body.innerText.includes('%'),
    { timeout: 15000 }
  );
  await sleep(1500);

  // 17. Host Breakdown
  console.log('11/16 Capturing Question Breakdown (Host)...');
  await record(
    hostPage,
    '11_Question_Breakdown_Host.png',
    'Question Results & Distribution',
    'Host',
    'Projector 1920x1080',
    'Color-matched horizontal distribution bars showing answer percentages and top scorers this round.'
  );

  // 18. Player Round Result
  console.log('12/16 Capturing Player Round Result...');
  await record(
    playerPage,
    '12_Player_Round_Result.png',
    'Player Round Score & Feedback',
    'Player',
    'Mobile 390x844',
    'Vibrant reward feedback showing correct status, points gained (+940), and streak count.'
  );

  // 19. Advance to Leaderboard
  console.log('Host advancing to Leaderboard...');
  await hostPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find((b) => b.textContent?.includes('View Leaderboard'));
    if (nextBtn) nextBtn.click();
  });
  await hostPage.waitForFunction(
    () => document.body.innerText.includes('Leaderboard') && document.body.innerText.includes('Score'),
    { timeout: 10000 }
  );
  await sleep(1500);

  // 20. Host Cumulative Leaderboard
  console.log('13/16 Capturing Host Leaderboard...');
  await record(
    hostPage,
    '13_Host_Leaderboard.png',
    'Cumulative Tournament Leaderboard',
    'Host',
    'Projector 1920x1080',
    'Top 5 ranking table with player avatars, scores, and real-time rank delta indicators (▲1).'
  );

  // 21. Player Leaderboard Position
  console.log('14/16 Capturing Player Leaderboard Position...');
  await record(
    playerPage,
    '14_Player_Leaderboard_Position.png',
    'Player Leaderboard Position',
    'Player',
    'Mobile 390x844',
    'Personal rank card showing current position among all campus contenders.'
  );

  // 22. Advance to Final Podium
  console.log('Host triggering Final Podium...');
  const adminSocket = io('http://localhost:3001');
  adminSocket.emit('host:force_podium', { roomCode });
  await sleep(2500);
  adminSocket.disconnect();

  // 23. Host Final Podium
  console.log('15/16 Capturing Grand Podium (Host)...');
  await record(
    hostPage,
    '15_Podium_Celebration_Host.png',
    'Grand Champion Podium & Fireworks',
    'Host',
    'Projector 1920x1080',
    '3-Tier Gold/Silver/Bronze podium with champion crowns, avatars, and canvas-confetti bursts.'
  );

  // 24. Player Final Podium
  console.log('16/16 Capturing Final Finish (Player)...');
  await record(
    playerPage,
    '16_Player_Final_Podium.png',
    'Player Final Tournament Finish',
    'Player',
    'Mobile 390x844',
    'Personal finish celebration card and final rank badge.'
  );

  // Close pages and browser
  bot1.disconnect();
  bot2.disconnect();
  await hostPage.close();
  await playerPage.close();
  await browser.close();

  console.log('\n======================================================');
  console.log(`✓ All 16 Screenshots Successfully Captured to:`);
  console.log(`   ${OUTPUT_DIR}`);
  console.log('======================================================\n');

  generateDesktopShowcase();
}

function generateDesktopShowcase() {
  const htmlPath = path.join(DESKTOP_DIR, 'ARENA_QUIZ_SHOWCASE.html');
  const relativeDir = 'Quiz_App_Screenshots';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arena Quiz — Full UI Showcase</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0F1123;
      --card-bg: #1A1B3A;
      --border: rgba(255, 255, 255, 0.1);
      --text: #F3F4F6;
      --muted: #9CA3AF;
      --accent: #7C3AED;
      --coral: #FF5A5F;
      --blue: #3B82F6;
      --yellow: #FBBF24;
      --mint: #34D399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Nunito', sans-serif;
      padding: 40px 24px 80px;
    }
    header {
      max-width: 1200px;
      margin: 0 auto 40px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(124, 58, 237, 0.2);
      border: 1px solid rgba(124, 58, 237, 0.4);
      color: #C4B5FD;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    h1 {
      font-family: 'Fredoka', cursive;
      font-size: 42px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: var(--muted);
      font-size: 17px;
      max-width: 650px;
      margin: 0 auto;
    }
    .folder-info {
      margin-top: 16px;
      font-size: 13px;
      color: #94A3B8;
      background: rgba(255,255,255,0.05);
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .folder-info code {
      color: var(--mint);
      font-weight: bold;
    }
    .grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 28px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.5);
      border-color: rgba(124, 58, 237, 0.5);
    }
    .img-container {
      width: 100%;
      height: 240px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    .img-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s;
    }
    .card:hover .img-container img {
      transform: scale(1.02);
    }
    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: space-between;
    }
    .tags {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tag-role {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
    .tag-role.host { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .tag-role.player { background: rgba(251, 191, 36, 0.2); color: #FCD34D; }
    .tag-viewport {
      font-size: 11px;
      color: var(--muted);
    }
    h2.card-title {
      font-family: 'Fredoka', cursive;
      font-size: 20px;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    p.card-desc {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.45;
      margin-bottom: 14px;
    }
    .card-actions {
      border-top: 1px solid var(--border);
      padding-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-actions a {
      color: #C4B5FD;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: color 0.15s;
    }
    .card-actions a:hover {
      color: #FFFFFF;
      text-decoration: underline;
    }
    .filename {
      font-family: monospace;
      font-size: 11px;
      color: #6B7280;
    }

    /* Lightbox Modal */
    #modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 30px;
      cursor: zoom-out;
    }
    #modal img {
      max-width: 95vw;
      max-height: 92vh;
      border-radius: 12px;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
      object-fit: contain;
    }
  </style>
</head>
<body>

  <header>
    <div class="badge">✨ Real-Time Multiplayer Quiz Platform</div>
    <h1>Arena Quiz — UI & Workflow Gallery</h1>
    <p class="subtitle">Complete visual capture of every screen, responsive state, and real-time interaction.</p>
    <div class="folder-info">
      Saved directory: <code>${OUTPUT_DIR}</code>
    </div>
  </header>

  <div class="grid">
    ${capturedScreenshots
      .map(
        (s) => `
    <div class="card">
      <div class="img-container" onclick="openModal('${relativeDir}/${s.filename}')">
        <img src="${relativeDir}/${s.filename}" alt="${s.title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div>
          <div class="tags">
            <span class="tag-role ${s.role.toLowerCase()}">${s.role}</span>
            <span class="tag-viewport">${s.viewport}</span>
          </div>
          <h2 class="card-title">${s.title}</h2>
          <p class="card-desc">${s.description}</p>
        </div>
        <div class="card-actions">
          <span class="filename">${s.filename}</span>
          <a href="${relativeDir}/${s.filename}" target="_blank">Open Full Image ↗</a>
        </div>
      </div>
    </div>
    `
      )
      .join('')}
  </div>

  <div id="modal" onclick="closeModal()">
    <img id="modal-img" src="" alt="Fullscreen view" />
  </div>

  <script>
    function openModal(src) {
      document.getElementById('modal-img').src = src;
      document.getElementById('modal').style.display = 'flex';
    }
    function closeModal() {
      document.getElementById('modal').style.display = 'none';
    }
  </script>

</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`✓ Showcase HTML created at: ${htmlPath}`);
}

capture().catch((err) => {
  console.error('Screenshot capture encountered an error:', err);
  process.exit(1);
});
