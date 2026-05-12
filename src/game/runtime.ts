import { DIFFICULTIES, type DifficultyId, type DifficultySpec } from '../config/difficulty.js';
import { applyRadiusScale } from '../config/tiers.js';

const KEY = 'cosmos.difficulty';

let current: DifficultySpec = DIFFICULTIES.normal;

function _apply(spec: DifficultySpec): void {
  current = spec;
  applyRadiusScale(spec.radiusScale);
}

export function loadDifficulty(): DifficultySpec {
  const saved = localStorage.getItem(KEY);
  if (saved && saved in DIFFICULTIES) {
    _apply(DIFFICULTIES[saved as DifficultyId]);
  } else {
    _apply(DIFFICULTIES.normal);
  }
  return current;
}

export function setDifficulty(id: DifficultyId): DifficultySpec {
  _apply(DIFFICULTIES[id]);
  localStorage.setItem(KEY, id);
  return current;
}

export function getDifficulty(): DifficultySpec {
  return current;
}
