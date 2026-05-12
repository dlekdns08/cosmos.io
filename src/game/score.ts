const BEST_KEY = 'cosmos.best';
const BIGBANG_KEY = 'cosmos.bigbang';
const COMBO_WINDOW_MS = 1000;
const COMBO_MAX = 5;
const COMBO_MULT = 1.5;

export interface MergeResult {
  gained: number;
  combo: number;
  multiplier: number;
}

export interface MergeModifiers {
  charge?: boolean;
  slingshot?: boolean;
  orbit?: boolean;
}

export class Score {
  value: number;
  best: number;
  bigbangUses: number;
  combo: number;
  private _lastMergeT: number;

  constructor() {
    this.value = 0;
    this.best = parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10);
    this.bigbangUses = parseInt(localStorage.getItem(BIGBANG_KEY) ?? '0', 10);
    this.combo = 1;
    this._lastMergeT = 0;
  }

  addMerge(tier: number, mods: MergeModifiers = {}): MergeResult {
    const now = performance.now();
    if (now - this._lastMergeT < COMBO_WINDOW_MS) {
      this.combo = Math.min(this.combo * COMBO_MULT, COMBO_MAX);
    } else {
      this.combo = 1;
    }
    this._lastMergeT = now;
    const base = Math.pow(2, tier);
    let multiplier = this.combo;
    if (mods.charge) multiplier *= 1.2;
    if (mods.slingshot) multiplier *= 1.5;
    if (mods.orbit) multiplier *= 1.3;
    const gained = Math.round(base * multiplier);
    this.value += gained;
    return { gained, combo: this.combo, multiplier };
  }

  add(amount: number): void {
    this.value += amount;
  }

  comboDecay(nowMs: number): void {
    if (this.combo > 1 && nowMs - this._lastMergeT > COMBO_WINDOW_MS) {
      this.combo = 1;
    }
  }

  countBigBang(): void {
    this.bigbangUses += 1;
    localStorage.setItem(BIGBANG_KEY, String(this.bigbangUses));
  }

  finalize(): void {
    if (this.value > this.best) {
      this.best = this.value;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
  }

  reset(): void {
    this.value = 0;
    this.combo = 1;
    this._lastMergeT = 0;
  }
}
