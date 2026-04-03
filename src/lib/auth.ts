// Auth client — talks to the Express backend (server/index.js).
// Data is stored in server/game.db (SQLite file on disk).

export interface ScoreEntry {
  username: string;
  score: number;
  won: boolean;
  playedAt: string;
}

export async function createUser(
  username: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data;
}

export async function verifyUser(username: string, password: string): Promise<boolean> {
  const res = await fetch('/api/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function addScore(username: string, score: number, won: boolean): Promise<void> {
  await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, score, won }),
  });
}

export async function getUserScores(username: string): Promise<ScoreEntry[]> {
  const res = await fetch(`/api/scores/${encodeURIComponent(username)}`);
  const data = await res.json();
  return data.map((r: { username: string; score: number; won: boolean; played_at: string }) => ({
    username: r.username,
    score: r.score,
    won: r.won,
    playedAt: r.played_at,
  }));
}
