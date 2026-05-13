const KEY = 'cosmos.stats';

export interface LifetimeStats {
  version: 1;
  totalGames: number;
  totalPlayTimeMs: number;
  totalDrops: number;
  totalMerges: number;
  highestTier: number;
  /** Index = tier (0..11). Value = how many bodies of that tier have ever been created via merge. */
  tierCounts: number[];
  bestCombo: number;
  highestScore: number;
  totalNpEarned: number;
  bigBangsUsed: number;
  chargesUsed: number;
  slingshotsTriggered: number;
  supernovasFired: number;
  blackholesMade: number;
  firstPlayAt: number;
}

function defaults(): LifetimeStats {
  return {
    version: 1,
    totalGames: 0,
    totalPlayTimeMs: 0,
    totalDrops: 0,
    totalMerges: 0,
    highestTier: 0,
    tierCounts: new Array(12).fill(0),
    bestCombo: 1,
    highestScore: 0,
    totalNpEarned: 0,
    bigBangsUsed: 0,
    chargesUsed: 0,
    slingshotsTriggered: 0,
    supernovasFired: 0,
    blackholesMade: 0,
    firstPlayAt: Date.now(),
  };
}

export class Stats {
  data: LifetimeStats;
  private gameStartT = 0;

  constructor() {
    this.data = this.load();
  }

  private load(): LifetimeStats {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw) as Partial<LifetimeStats>;
      const merged = { ...defaults(), ...parsed };
      if (!Array.isArray(merged.tierCounts) || merged.tierCounts.length < 12) {
        merged.tierCounts = defaults().tierCounts;
      }
      return merged as LifetimeStats;
    } catch {
      return defaults();
    }
  }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore quota */ }
  }

  startGame(): void {
    this.gameStartT = performance.now();
    this.data.totalGames += 1;
    this.save();
  }

  endGame(finalScore: number, npGained: number): void {
    if (this.gameStartT > 0) {
      this.data.totalPlayTimeMs += performance.now() - this.gameStartT;
      this.gameStartT = 0;
    }
    if (finalScore > this.data.highestScore) this.data.highestScore = finalScore;
    this.data.totalNpEarned += Math.max(0, npGained);
    this.save();
  }

  onDrop(): void { this.data.totalDrops += 1; }

  onMerge(newTier: number, combo: number): void {
    this.data.totalMerges += 1;
    if (newTier > this.data.highestTier) this.data.highestTier = newTier;
    if (newTier >= 0 && newTier < this.data.tierCounts.length) {
      this.data.tierCounts[newTier] = (this.data.tierCounts[newTier] || 0) + 1;
    }
    if (combo > this.data.bestCombo) this.data.bestCombo = combo;
  }

  onBigBang(): void { this.data.bigBangsUsed += 1; }
  onChargeUsed(): void { this.data.chargesUsed += 1; }
  onSlingshot(): void { this.data.slingshotsTriggered += 1; }
  onSupernova(): void { this.data.supernovasFired += 1; }
  onBlackhole(): void { this.data.blackholesMade += 1; }

  reset(): void {
    this.data = defaults();
    this.save();
  }

  /** Force-save (e.g., on visibility change / unload). */
  flush(): void { this.save(); }
}
