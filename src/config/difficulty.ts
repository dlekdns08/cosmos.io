export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface DifficultySpec {
  id: DifficultyId;
  label: string;
  description: string;
  radiusScale: number;
  dropCooldown: number;
  worldGravityScale: number;
  gameOverThreshold: number;
  dropPoolMax: number;
  topLineY: number;
  comboWindowMs: number;
  restitution: number;
  driftStrength: number;
  driftPeriodMs: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultySpec> = {
  easy: {
    id: 'easy',
    label: '쉬움',
    description: '여유롭게 — 작고 천천히',
    radiusScale: 0.85,
    dropCooldown: 0.55,
    worldGravityScale: 0.0013,
    gameOverThreshold: 4,
    dropPoolMax: 3,
    topLineY: 150,
    comboWindowMs: 1300,
    restitution: 0.14,
    driftStrength: 0,
    driftPeriodMs: 0,
  },
  normal: {
    id: 'normal',
    label: '보통',
    description: '표준 진화',
    radiusScale: 1.0,
    dropCooldown: 0.45,
    worldGravityScale: 0.0015,
    gameOverThreshold: 3,
    dropPoolMax: 3,
    topLineY: 130,
    comboWindowMs: 1000,
    restitution: 0.18,
    driftStrength: 0,
    driftPeriodMs: 0,
  },
  hard: {
    id: 'hard',
    label: '어려움',
    description: '빠른 우주 + 약한 바람',
    radiusScale: 1.10,
    dropCooldown: 0.30,
    worldGravityScale: 0.0018,
    gameOverThreshold: 2.5,
    dropPoolMax: 4,
    topLineY: 100,
    comboWindowMs: 700,
    restitution: 0.28,
    driftStrength: 0.00018,
    driftPeriodMs: 6000,
  },
};
