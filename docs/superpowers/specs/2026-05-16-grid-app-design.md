
# Grid App — Design Spec
**Date:** 2026-05-16  
**Status:** Approved

---

## Overview

A real-time shared grid where multiple users simultaneously capture cells. Anyone who opens the site picks a name and color, then clicks cells to claim them. All changes propagate instantly to every connected client. A 10-second cooldown per cell prevents spam and creates strategic tension.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev server, clean component model |
| Backend | Node.js + Express | Lightweight, same language as frontend |
| Real-time | Socket.io | Battle-tested WS with reconnection, room support |
| Database | SQLite (better-sqlite3) | Zero external services, sync API, survives restarts |

---

## Grid

- **Size:** 40 × 40 = 1,600 cells
- **Cell IDs:** Integers 0–1599 (row-major: `id = row * 40 + col`)
- **States:** unclaimed (no owner) or owned (name + color + timestamps)
- **Rendering:** CSS Grid, each cell ~12–14px with 1.5px gap, fills viewport

---

## User Identity

- On first visit: modal prompts for a display name and color selection (6 preset neon colors: `#e040fb`, `#00e5ff`, `#76ff03`, `#ff6d00`, `#ff4081`, `#40c4ff`)
- Identity stored in `localStorage` — persists across page refreshes, lost on new browser/device
- No backend accounts, no passwords
- Each browser session gets a unique `socketId`; name+color are attached on `join`

---

## Data Model

### SQLite — `cells` table

```sql
CREATE TABLE cells (
  id           INTEGER PRIMARY KEY,  -- 0–1599
  owner_name   TEXT,
  owner_color  TEXT,
  captured_at  INTEGER,              -- Unix ms
  locked_until INTEGER               -- Unix ms, cooldown expiry
);
```

On startup: populate all 1600 rows with `NULL` owner if not present. Load into in-memory Map.

### In-memory state (server)

```js
// Map<cellId: number, cell: CellState>
const grid = new Map()

// Map<socketId: string, { name: string, color: string }> for online users
const users = new Map()
```

---

## Real-time Protocol

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join` | `{ name: string, color: string }` | Register identity, receive grid state |
| `capture_cell` | `{ cellId: number }` | Attempt to capture a cell |

### Server → Client

| Event | Payload | Recipient |
|---|---|---|
| `grid_state` | `{ cells: CellState[] }` | Joining socket only |
| `cell_updated` | `{ id, ownerName, ownerColor, capturedAt, lockedUntil }` | All sockets (broadcast) |
| `capture_rejected` | `{ cellId, reason: 'cooldown', remainingMs }` | Requesting socket only |
| `online_count` | `{ count: number }` | All sockets |
| `leaderboard` | `{ entries: [{ name, color, count }] }` | All sockets (top 5) |

---

## Capture Logic (Server)

```
on capture_cell({ cellId }):
  cell = grid.get(cellId)
  if cell.lockedUntil > Date.now():
    emit capture_rejected to socket
    return
  
  now = Date.now()
  updated = { ownerName, ownerColor, capturedAt: now, lockedUntil: now + 10_000 }
  grid.set(cellId, updated)
  db.updateCell(cellId, updated)          // synchronous SQLite write
  io.emit('cell_updated', { id: cellId, ...updated })
  io.emit('leaderboard', computeLeaderboard())
```

**Conflict resolution:** Server is the single source of truth. First `capture_cell` to arrive wins. No client-side state is trusted for ownership.

---

## Cooldown

- **Duration:** 10 seconds per cell after capture
- **Server:** `lockedUntil` timestamp checked at capture time; no cleanup job needed
- **Client:** After receiving `cell_updated`, renders a countdown overlay using `Date.now()` vs `lockedUntil` via `requestAnimationFrame` or a 1s interval — no server polling
- **Expired locks:** Implicitly cleared — server checks `lockedUntil > Date.now()` at capture time; stale values in DB are harmless

---

## UI Components

### Layout
- Full-viewport dark background (`#0a0a0f`)
- Top bar: app name, online count (live), user identity chip
- Center: grid (scrollable if viewport too small)
- Right panel (160px): leaderboard + personal stats
- First-visit modal: name input + color picker + "Enter the Grid" CTA

### Cell States (CSS)
| State | Visual |
|---|---|
| Unclaimed | `#111128` background, no glow |
| Owned | User color fill + `box-shadow` glow |
| On cooldown | User color + countdown overlay text |
| Hovered (unclaimed) | Subtle highlight, cursor pointer |
| Hovered (owned) | Tooltip with owner name |
| Just captured (mine) | Scale pulse animation → settle |
| Rejected capture | Brief red flash, no state change |

### Animations
- **Capture:** `scale(1.3) → scale(1)` + color flood over 200ms
- **Cooldown countdown:** overlaid `Xs` text, fades out when lock expires
- **Online count change:** number fades in/out
- **Leaderboard update:** smooth reorder with CSS transition

---

## File Structure

```
grid-app/
├── server/
│   ├── index.js          # Express + Socket.io setup, event handlers
│   ├── db.js             # SQLite init, queries (init, getAll, update)
│   └── grid.js           # In-memory grid Map, leaderboard computation
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Root, socket connection, global state
│       ├── socket.js         # Socket.io-client singleton
│       ├── components/
│       │   ├── Grid.jsx          # 40×40 grid container
│       │   ├── Cell.jsx          # Single cell, cooldown timer, animations
│       │   ├── UserModal.jsx     # First-visit name+color picker
│       │   ├── TopBar.jsx        # App name, online count, identity chip
│       │   └── Leaderboard.jsx   # Right panel, top 5 + personal stats
│       └── hooks/
│           └── useCooldown.js    # Countdown timer hook for Cell
├── package.json          # Root: scripts using concurrently to run both
└── .gitignore
```

---

## Startup Sequence

1. `npm run dev` (root) starts both server (port 3001) and Vite (port 5173)
2. Server: init SQLite, seed 1600 cells if not present, load grid into memory
3. Client: Vite proxies `/socket.io` to `localhost:3001`
4. Browser: load React app → check localStorage for identity
   - If identity exists → connect socket, emit `join`
   - If not → show modal → on submit → connect socket, emit `join`
5. Socket connected → server sends `grid_state` → React renders grid

---

## Bonus Features (in scope)

- Live online user count in top bar
- Top-5 leaderboard by cells owned (updates after every capture)
- Personal stats: cells owned, % territory, rank
- Capture animation + cooldown countdown overlay
- Tooltip on hover showing owner name

## Out of Scope

- Authentication / persistent accounts
- Zoom/pan (40×40 fits in viewport without it)
- Mobile touch optimization
- Chat or emotes
- Per-user capture history
