const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Database stored as a real file on disk
const DB_PATH = path.join(__dirname, 'game.db');
const db = new Database(DB_PATH);

// Schema
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

console.log(`SQLite database at: ${DB_PATH}`);

// POST /api/signup
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required.' });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ success: false, error: 'Username must be 3–20 alphanumeric characters or underscores.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
  }
  const existing = db.prepare('SELECT username FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Username already taken.' });
  }
  db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .run(username, Buffer.from(password).toString('base64'), new Date().toISOString());
  res.json({ success: true, username });
});

// POST /api/signin
app.post('/api/signin', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT password_hash FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (!user || user.password_hash !== Buffer.from(password).toString('base64')) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }
  res.json({ success: true, username });
});

// POST /api/scores
app.post('/api/scores', (req, res) => {
  const { username, score, won } = req.body;
  db.prepare('INSERT INTO scores (username, score, won, played_at) VALUES (?, ?, ?, ?)')
    .run(username, score, won ? 1 : 0, new Date().toISOString());
  res.json({ success: true });
});

// GET /api/scores/:username
app.get('/api/scores/:username', (req, res) => {
  const rows = db.prepare(
    'SELECT username, score, won, played_at FROM scores WHERE LOWER(username) = LOWER(?) ORDER BY played_at DESC'
  ).all(req.params.username);
  res.json(rows.map(r => ({ ...r, won: r.won === 1 })));
});

// GET /api/users/count  (for debugging)
app.get('/api/users/count', (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json(result);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
