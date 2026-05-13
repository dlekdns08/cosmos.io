import type Matter from 'matter-js';
import { WIDTH, HEIGHT, topLineY } from '../physics/world.js';

// 8 columns × 4 rows = 32 grid cells (max tier per cell, normalized)
// + next tier (1) + queue tier (1) + log-normalized score (1) = 35 dims
export const FEATURE_DIM = 35;
const GRID_COLS = 8;
const GRID_ROWS = 4;
const TIER_MAX = 11;

export function extractFeatures(
  bodies: Matter.Body[],
  nextTier: number,
  queueTier: number,
  score: number,
): Float32Array {
  const f = new Float32Array(FEATURE_DIM);
  const tly = topLineY();
  const playH = Math.max(1, HEIGHT - tly);
  const cellW = WIDTH / GRID_COLS;
  const cellH = playH / GRID_ROWS;

  for (const b of bodies) {
    if (b.tier == null) continue;
    const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(b.position.x / cellW)));
    const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((b.position.y - tly) / cellH)));
    const idx = row * GRID_COLS + col;
    const v = b.tier / TIER_MAX;
    if (f[idx] < v) f[idx] = v;
  }

  f[32] = nextTier / TIER_MAX;
  f[33] = queueTier / TIER_MAX;
  f[34] = Math.min(1, Math.log(score + 1) / 12);
  return f;
}
