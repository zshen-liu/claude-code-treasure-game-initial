# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server at http://localhost:3000 (auto-opens browser)
npm run build        # build to ./build/
node server/index.js # start Express backend at http://localhost:3001
```

No test runner is configured.

## Architecture

Full-stack app: React + TypeScript (Vite) frontend with an Express + SQLite backend.

**Game mechanics (`src/App.tsx`):**
- 3 treasure boxes, one randomly assigned a treasure each round
- Clicking a box: +$100 if treasure, -$50 if skeleton
- Game ends when the treasure box is found or all boxes are opened
- State: `boxes[]`, `score`, `gameEnded`, `currentUser`, `scoreHistory` — reset via `initializeGame()`
- Animations via `motion/react` (Framer Motion) — 3D flip on open, scale on hover

**Authentication flow:**
- Guest mode (no data stored) or signed-in mode (scores persisted to SQLite)
- `src/lib/auth.ts` — API client: `createUser`, `verifyUser`, `addScore`, `getUserScores`
- `src/components/AuthModal.tsx` — Sign in / Sign up tabs with validation
- All API calls go to `localhost:3001` (proxied by Vite in dev)

**Backend (`server/index.js`):**
- Express 5 + `better-sqlite3` on port 3001
- SQLite DB at `server/game.db` (created automatically on first run)
- Tables: `users` (username PK, password_hash, created_at), `scores` (id, username FK, score, won, played_at)
- Endpoints: `POST /api/signup`, `POST /api/signin`, `POST /api/scores`, `GET /api/scores/:username`, `GET /api/users/count`
- Passwords stored as base64 (not bcrypt) — this is intentional for simplicity in this demo

**Assets:**
- `src/assets/` — chest images (`treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`)
- `src/audios/` — sound files (`chest_open.mp3`, `chest_open_with_evil_laugh.mp3`)

**UI components (`src/components/ui/`):**
- Pre-built shadcn/ui components backed by Radix UI primitives + Tailwind CSS
- Import alias `@` maps to `src/`

**Styling:**
- Tailwind CSS utility classes (no separate CSS modules)
- Amber/treasure color scheme throughout
- Global styles in `src/index.css` and `src/styles/globals.css`

**Build output:** `./build/` (not `dist/`)
