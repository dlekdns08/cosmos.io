import { UNLOCK_TRACK, type UnlockEffect } from '../config/unlocks.js';

const NP_KEY = 'cosmos.np';
const BLACKHOLE_TOTAL_KEY = 'cosmos.blackholes';
const FIRST_ACHIEVED_KEY = 'cosmos.firstAchieved';

export interface MetaSnapshot {
  np: number;
  unlocked: Set<UnlockEffect>;
  blackholeTotal: number;
}

function loadInt(key: string): number {
  return parseInt(localStorage.getItem(key) ?? '0', 10);
}

function loadSet(key: string): Set<string> {
  const raw = localStorage.getItem(key);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export class Meta {
  np: number;
  unlocked: Set<UnlockEffect>;
  blackholeTotal: number;
  private firstAchieved: Set<string>;

  constructor() {
    this.np = loadInt(NP_KEY);
    this.blackholeTotal = loadInt(BLACKHOLE_TOTAL_KEY);
    this.firstAchieved = loadSet(FIRST_ACHIEVED_KEY) as Set<string>;
    this.unlocked = new Set();
    this._refreshUnlocked();
  }

  private _refreshUnlocked(): void {
    this.unlocked.clear();
    for (const node of UNLOCK_TRACK) {
      if (this.np >= node.np) this.unlocked.add(node.id);
    }
  }

  hasUnlock(id: UnlockEffect): boolean {
    return this.unlocked.has(id);
  }

  registerBlackhole(): void {
    this.blackholeTotal += 1;
    localStorage.setItem(BLACKHOLE_TOTAL_KEY, String(this.blackholeTotal));
  }

  registerFirstAchievement(key: string): boolean {
    if (this.firstAchieved.has(key)) return false;
    this.firstAchieved.add(key);
    saveSet(FIRST_ACHIEVED_KEY, this.firstAchieved);
    return true;
  }

  awardForGame(finalScore: number, blackholesThisGame: number, firstAchievementsThisGame: number): {
    npGained: number;
    newUnlocks: UnlockEffect[];
  } {
    const npGained =
      Math.floor(finalScore / 1000) +
      blackholesThisGame * 50 +
      firstAchievementsThisGame * 20;
    const prev = new Set(this.unlocked);
    this.np += npGained;
    localStorage.setItem(NP_KEY, String(this.np));
    this._refreshUnlocked();
    const newUnlocks: UnlockEffect[] = [];
    for (const id of this.unlocked) {
      if (!prev.has(id)) newUnlocks.push(id);
    }
    return { npGained, newUnlocks };
  }

  snapshot(): MetaSnapshot {
    return { np: this.np, unlocked: new Set(this.unlocked), blackholeTotal: this.blackholeTotal };
  }
}
