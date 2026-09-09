# ⚡ Arena Quiz — Executive Real-Time Multiplayer Quiz & Polling Platform

> An ultra-responsive, executive-grade multiplayer quiz & live polling platform engineered with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **Shadcn UI**, **Express**, and **Socket.IO**. Designed for high-stakes campus fests, conferences, auditoriums, and live audience battles.

---

## 🚀 Quick Start (In 2 Commands)

Make sure you have **[Node.js](https://nodejs.org/)** (v18 or higher) installed on your machine.

### 1. Install All Dependencies
```bash
npm run install:all
```
*(Installs root orchestrator, backend server, and frontend client dependencies concurrently)*

### 2. Launch the Platform
```bash
npm run dev
```

Once running:
* 🎮 **Contender / Player Screen**: [http://localhost:5173](http://localhost:5173)
* 👑 **Host / Organizer Screen**: [http://localhost:5173/host/login](http://localhost:5173/host/login)
* 🔌 **Backend Socket & REST API**: [http://localhost:3001](http://localhost:3001)

---

## ⚡ One-Click Runners

If you don't want to use terminal commands:
* **Windows**: Double-click `start.bat`
* **Mac / Linux**: Run `./start.sh` (or `bash start.sh`)

---

## 🔑 Default Host Login Credentials

The local database auto-seeds on first launch with 3 pre-built campus tournaments:

* **Email**: `admin@arena.edu`
* **Password**: `admin123`

---

## 🎯 How to Run a Live Game (Self-Test Flow)

1. **Open Host Screen**: Navigate to [http://localhost:5173/host/dashboard](http://localhost:5173/host/dashboard) in your browser.
2. **Start a Tournament**: Click **"Start Live Quiz"** on any pre-built quiz (e.g. *⚡ Ultimate Tech Fest Trivia*).
3. **Note the 6-character Room PIN** displayed in the broadcast lobby (with live QR code).
4. **Join as a Player**: Open an **Incognito / Private tab** (or another device on your Wi-Fi) at [http://localhost:5173](http://localhost:5173).
5. **Enter PIN & Nickname**: Type the room PIN, pick your avatar/nickname, and hit **"Enter Arena"**.
6. **Host Launches**: Click **"START QUIZ"** on the host screen to begin the 3-2-1 countdown, live questions, speed-bonus calculations, and the confetti podium celebration!

---

## 📱 Hosting for a Live Audience on Venue Wi-Fi / LAN

Contenders can join directly from their smartphones in the auditorium without installing any app:

1. Connect your host laptop to the venue / campus Wi-Fi.
2. Find your laptop's local IP address (`ipconfig` on Windows or `ifconfig` / `ip a` on Mac/Linux, e.g. `192.168.1.50`).
3. Audience members connect to the same Wi-Fi and open `http://<YOUR_IP>:5173` on their mobile browsers (or scan the QR code on the projector screen).

---

## 🛡️ Scalability & Large-Audience Architecture

Engineered specifically to survive high-concurrency auditorium crowds (hundreds of simultaneous players clicking buttons at once):

1. **Answer Tally Fan-out Throttling (`TALLY_THROTTLE_MS = 200ms`)**:
   * When 500+ contestants click their answers within 1 second, the backend does **not** broadcast 500 individual socket events.
   * Instead, progress tallies are coalesced and throttled to at most 5 updates/sec, protecting the Node.js event loop from choking.

2. **Emoji Reaction Batching (`REACTION_BATCH_ROOM_THRESHOLD = 100`)**:
   * For large crowds (>100 players), audience emoji bursts are aggregated every 400ms into batched packets to minimize packet overhead.
   * Per-player reaction rate limits (`REACTION_BURST_MAX = 8` per 5s) prevent spam bots.

3. **Anti-Cheat & Strict Server-Authoritative Timing**:
   * Timers run strictly on the backend. Client submissions are validated against server timestamps (submitting after time-up is automatically rejected).
   * First-choice locking: players cannot switch options once submitted.
   * Public socket payloads never reveal player session tokens or answer keys.

4. **Payload Protection (`SOCKET_MAX_BUFFER_BYTES = 4096`)**:
   * Hard limits on incoming WebSocket frames blunt payload-bomb and memory-exhaustion exploits.

5. **Configurable Capacity in `.env`**:
   * Set `MAX_PLAYERS_PER_ROOM=1000` or higher in `.env` for mega-auditorium events.

---

## 🔒 Security & Secrets Protection

* **Zero Leaked Secrets**: No private API keys or personal passwords are hardcoded in source code.
* **Safe Fallbacks**: JWT signing keys and CORS origins are configurable via environment variables (`.env.example` provided).
* **Input Sanitization**: Nicknames and avatar seeds are strictly sanitized to prevent HTML/script injection.
* **Self-Contained Database**: Stored in `server/data/arena_db.json` with zero cloud database dependency.

---

## 📁 Project Structure

```
JD PROJECT/
├── client/                  # Frontend SPA (React 18 + Vite + Tailwind + TypeScript)
│   ├── src/
│   │   ├── components/      # UI components (Shadcn UI, React Bits)
│   │   ├── context/         # AuthContext, SocketContext
│   │   ├── pages/           # Home, Host, and Player screens
│   │   └── services/        # REST API calls and avatar utilities
├── server/                  # Real-time Game Server (Express + Socket.IO + TypeScript)
│   ├── src/
│   │   ├── db/              # Embedded JSON database & pre-seeded tournaments
│   │   ├── game/            # RoomManager, scoring engine, nickname sanitizer
│   │   ├── routes/          # REST auth & quiz management endpoints
│   │   ├── socket/          # WebSocket event handlers & rate limiters
│   │   └── server.ts        # Server entrypoint
├── package.json             # Root monorepo orchestrator
├── .env.example             # Configuration template
├── start.bat                # One-click Windows runner
├── start.sh                 # One-click Mac/Linux runner
└── README.md                # Project documentation
```

---

## 📜 License

MIT — Feel free to use, modify, and host for your campus events!
