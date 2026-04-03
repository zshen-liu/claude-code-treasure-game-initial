Deploy this project to Vercel as a full-stack app (React frontend + Express/SQLite backend). Follow these steps exactly:

## Step 1 — Check Vercel CLI
Run `vercel --version` to see if the CLI is installed. If the command fails, run `npm install -g vercel` to install it.

## Step 2 — Create `api/server.js` (Vercel serverless entry point)
Create the file `api/server.js` with the following content. This wraps the Express app as a Vercel serverless function. The only change from the original `server/index.js` is that the SQLite DB path is set to `/tmp/game.db` (Vercel's writable filesystem) instead of `__dirname`:

```js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// On Vercel, only /tmp is writable. Data resets on cold starts (acceptable for demo).
const DB_PATH = process.env.VERCEL ? '/tmp/game.db' : path.join(__dirname, '..', 'server', 'game.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username      TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT NOT NULL REFERENCES users(username),
    score     INTEGER NOT NULL,
    won       INTEGER NOT NULL,
    played_at TEXT NOT NULL
  );
`);

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required.' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ success: false, error: 'Username must be 3–20 alphanumeric characters or underscores.' });
  if (password.length < 4) return res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
  const existing = db.prepare('SELECT username FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (existing) return res.status(400).json({ success: false, error: 'Username already taken.' });
  db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)').run(username, Buffer.from(password).toString('base64'), new Date().toISOString());
  res.json({ success: true, username });
});

app.post('/api/signin', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT password_hash FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (!user || user.password_hash !== Buffer.from(password).toString('base64')) return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  res.json({ success: true, username });
});

app.post('/api/scores', (req, res) => {
  const { username, score, won } = req.body;
  db.prepare('INSERT INTO scores (username, score, won, played_at) VALUES (?, ?, ?, ?)').run(username, score, won ? 1 : 0, new Date().toISOString());
  res.json({ success: true });
});

app.get('/api/scores/:username', (req, res) => {
  const rows = db.prepare('SELECT username, score, won, played_at FROM scores WHERE LOWER(username) = LOWER(?) ORDER BY played_at DESC').all(req.params.username);
  res.json(rows.map(r => ({ ...r, won: r.won === 1 })));
});

app.get('/api/users/count', (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json(result);
});

module.exports = app;
```

## Step 3 — Create `vercel.json`
Create the file `vercel.json` in the project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Step 4 — Create `.vercelignore`
Create `.vercelignore` to exclude the local SQLite DB and server folder (we use `api/server.js` instead):

```
server/game.db
```

## Step 5 — Build and deploy
1. Run `npm run build` to build the frontend and confirm it succeeds.
2. Run `vercel --prod` to deploy. If prompted to log in, tell the user to complete the login in the browser. If asked about project settings:
   - Framework: Other
   - Build command: `npm run build`
   - Output directory: `build`
   - Install command: `npm install`

## Step 6 — Return the URL
After deployment completes, capture and display the production URL from the Vercel output (it looks like `https://your-project.vercel.app`). Tell the user they can open this URL to play the game.

**Note for the user:** Score history persists within a Vercel instance session but resets on cold starts (infrequent). This is a known limitation of SQLite on serverless — a persistent database like Vercel Postgres would fix it.
