import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { LeaderboardEntry } from './types.js';

const DB_PATH = process.env.COSMOS_DB ?? 'server/data/cosmos.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_score INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    alive INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_best ON sessions(best_score DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_alive ON sessions(alive DESC, updated_at DESC);
`);

const upsertStmt = db.prepare(`
  INSERT INTO sessions (id, name, current_score, best_score, alive, updated_at, created_at)
  VALUES (@id, @name, 0, 0, 0, @now, @now)
  ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at
`);

const updateScoreStmt = db.prepare(`
  UPDATE sessions
  SET current_score = @score,
      alive = @alive,
      best_score = CASE WHEN @score > best_score THEN @score ELSE best_score END,
      updated_at = @now
  WHERE id = @id
`);

const markDeadStmt = db.prepare(`
  UPDATE sessions SET alive = 0, current_score = 0, updated_at = @now WHERE id = @id
`);

const finalizeStmt = db.prepare(`
  UPDATE sessions
  SET alive = 0,
      best_score = CASE WHEN @score > best_score THEN @score ELSE best_score END,
      current_score = 0,
      updated_at = @now
  WHERE id = @id
`);

const topStmt = db.prepare<[number]>(`
  SELECT id, name, current_score AS score, best_score AS best, alive,
         CASE WHEN current_score > best_score THEN current_score ELSE best_score END AS display
  FROM sessions
  ORDER BY display DESC, alive DESC, updated_at DESC
  LIMIT ?
`);

const sessionExistsStmt = db.prepare<[string]>(`SELECT id FROM sessions WHERE id = ?`);

interface TopRow {
  id: string;
  name: string;
  score: number;
  best: number;
  alive: number;
  display: number;
}

export function ensureSession(id: string, name: string): void {
  const now = Date.now();
  upsertStmt.run({ id, name, now });
}

export function hasSession(id: string): boolean {
  return !!sessionExistsStmt.get(id);
}

export function updateScore(id: string, score: number, alive: boolean): void {
  if (!hasSession(id)) return;
  updateScoreStmt.run({ id, score, alive: alive ? 1 : 0, now: Date.now() });
}

export function markDead(id: string): void {
  if (!hasSession(id)) return;
  markDeadStmt.run({ id, now: Date.now() });
}

export function finalizeGame(id: string, score: number): void {
  if (!hasSession(id)) return;
  finalizeStmt.run({ id, score, now: Date.now() });
}

export function getLeaderboard(limit = 20): LeaderboardEntry[] {
  const rows = topStmt.all(limit) as TopRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    score: r.score,
    best: r.best,
    alive: r.alive === 1,
  }));
}

export function shutdown(): void {
  db.close();
}
