# GRID

A real-time multiplayer territory game. Open it, pick a name and color, and start claiming cells on a shared 40×40 board. Every click is instantly visible to everyone else online.

---

## Demo

```
┌─────────────────────────────────────────────────────────────┐
│  ● GRID                              ● 4 online   ● saksham │
├──────────────────────────────────────────────────┬──────────┤
│                                                  │LEADERBOARD
│   ░░░░░░░▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │          │
│   ░░░░░░░▓▓░░░▒▒▒░░░░░░░░░░░░░░░░▓▓▓░░░░░░    │ ● saksham│
│   ░░░░░▓▓▓▓░░░▒▒▒░░░░░░░░░░░░░░░░▓▓▓░░░░░░    │ ● alex   │
│   ░░░░░▓▓▓▓░░░░░░░░░░▒▒░░░░░░░░░░░░░░░░░░░    │ ● mira   │
│   ░░░░░░░░░░░░░░░░░░░▒▒░░░░██░░░░░░░░░░░░░    │ ● jay    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░    │          │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │YOUR STATS│
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │ 47 cells │
│                  40 × 40 grid                  │  2.9%    │
│           click any cell to capture            │  #1 rank │
└──────────────────────────────────────────────────┴──────────┘

  ▓ saksham  ▒ alex  █ mira  ░ unclaimed
```

**What happens when you click:**
- Your color floods the cell instantly
- Every other browser sees it in ~50ms via WebSocket
- A 10-second cooldown locks the cell before it can be recaptured
- The leaderboard updates live

---

## Features

- **Real-time sync** — WebSocket broadcast to all connected clients, no polling
- **Territory control** — 1,600 cells (40×40), each ownable and re-claimable
- **10-second cooldown** — server-enforced per cell; prevents spam, creates strategy
- **Live leaderboard** — top 5 by cells owned, updates after every capture
- **Personal stats** — your cell count, territory %, and rank
- **Capture animations** — scale pulse on claim, red flash on rejected capture
- **Cooldown countdown** — live `Xs` overlay on each locked cell
- **Persistence** — grid state survives server restarts (SQLite)
- **Identity** — pick a name and one of 6 neon colors; stored in localStorage

---

## Tech Stack

### Frontend — React + Vite

| Piece | Why |
|---|---|
| **React 18** | Component model maps cleanly to grid cells as state |
| **Vite 5** | Sub-second HMR during development, fast production builds |
| **socket.io-client** | Persistent WebSocket with automatic reconnection |
| **CSS (no framework)** | Custom dark/neon theme; ~200 lines, no runtime overhead |

The entire grid is a flat CSS Grid of 1,600 `<button>` elements. Each cell is a controlled component that reads from a central cells array — when the server broadcasts `cell_updated`, React re-renders only the changed cell.

### Backend — Node.js + Socket.io

| Piece | Why |
|---|---|
| **Express 4** | Serves the built client in production; minimal boilerplate |
| **Socket.io 4** | Rooms, reconnection handling, WebSocket + polling fallback |
| **better-sqlite3** | Synchronous SQLite — perfect for single-process Node, zero setup |

The server is the single source of truth. Capture requests are validated against an in-memory `Map` (fast reads, no DB round-trip on every click). SQLite is written to only on successful captures and read once at startup to hydrate the Map.

### Real-time Architecture

```
Browser A                  Server                  Browser B
   │                          │                        │
   │── capture_cell(42) ─────▶│                        │
   │                    check cooldown                  │
   │                    update Map + SQLite             │
   │◀── cell_updated ─────────│──── cell_updated ──────▶│
   │◀── leaderboard ──────────│──── leaderboard ────────▶│
```

**Conflict resolution:** First `capture_cell` to arrive wins. The server checks `cell.lockedUntil > Date.now()` atomically — no race condition possible in single-threaded Node.

**Cooldown:** `lockedUntil = capturedAt + 10_000` stored on the server. Clients render a countdown purely from the timestamp — no polling, no server ticks.

---

## Local Setup

**Requirements:** Node.js 20+, npm

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/grid-app.git
cd grid-app

# 2. Install all dependencies (server + client)
npm run install:all

# 3. Start dev server (both backend + frontend, with hot reload)
npm run dev
```

Open **http://localhost:5173** — the React app proxies WebSocket traffic to the Node server at port 3001.

To simulate multiple users, open a second tab in **incognito** (or a different browser) — localStorage identity is separate per profile.

### Running tests

```bash
# Server (Node.js built-in test runner)
npm run test:server

# Client (Vitest + React Testing Library)
cd client && npx vitest run
```

### Project structure

```
grid-app/
├── server/
│   ├── index.js      # Express + Socket.io event handlers
│   ├── db.js         # SQLite init, seed, cell updates
│   └── grid.js       # Pure functions: canCapture, applyCapture, leaderboard
├── client/
│   └── src/
│       ├── App.jsx              # Root: socket lifecycle + global state
│       ├── socket.js            # socket.io-client singleton
│       ├── components/
│       │   ├── Grid.jsx         # 40×40 cell container
│       │   ├── Cell.jsx         # Single cell: color, glow, cooldown timer
│       │   ├── UserModal.jsx    # First-visit identity picker
│       │   ├── TopBar.jsx       # Online count + identity chip
│       │   └── Leaderboard.jsx  # Top-5 + personal stats
│       └── hooks/
│           └── useCooldown.js   # Countdown timer hook
└── package.json      # Root: dev/build/start scripts
```

---

## Deployment

The app deploys as a single Node.js process that serves both the API and the built client.

### Railway (recommended)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set **Build command:** `npm run build`
4. Set **Start command:** `npm start`
5. Done — Railway gives you a public URL

```bash
npm run build   # builds client/dist/
npm start       # NODE_ENV=production, serves client + WebSocket on same port
```

---

## Design decisions

**Why SQLite and not PostgreSQL/Redis?**  
For a single Node process, SQLite is simpler, faster for reads, and requires no external service. The grid is loaded into memory at startup — SQLite is only written on capture. If the app needed horizontal scaling (multiple servers), Redis pub/sub would be the right call.

**Why no authentication?**  
Identity (name + color) lives in localStorage. It's enough for a game — you see your color everywhere, the leaderboard tracks your name, and refreshing preserves your identity. Adding OAuth would add friction before the fun.

**Why not Supabase/Firebase Realtime?**  
We're explicitly evaluating backend + real-time thinking, not managed service integration. Building the WebSocket layer from scratch demonstrates the mechanics: event protocol, broadcast vs. unicast, server-authoritative state, conflict resolution.
