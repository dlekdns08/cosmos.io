const BEST_KEY = 'cosmos.best';
const BIGBANG_KEY = 'cosmos.bigbang';
const COMBO_WINDOW_MS = 1000;
const COMBO_MAX = 5;
const COMBO_MULT = 1.5;

export class Score {
  constructor() {
    this.value = 0;
    this.best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    this.bigbangUses = parseInt(localStorage.getItem(BIGBANG_KEY) || '0', 10);
    this.combo = 1;
    this._lastMergeT = 0;
  }

  addMerge(tier) {
    const now = performance.now();
    if (now - this._lastMergeT < COMBO_WINDOW_MS) {
      this.combo = Math.min(this.combo * COMBO_MULT, COMBO_MAX);
    } else {
      this.combo = 1;
    }
    this._lastMergeT = now;
    const base = Math.pow(2, tier);
    const gained = Math.round(base * this.combo);
    this.value += gained;
    return { gained, combo: this.combo };
  }

  add(amount) {
    this.value += amount;
  }

  comboDecay(nowMs) {
    if (this.combo > 1 && nowMs - this._lastMergeT > COMBO_WINDOW_MS) {
      this.combo = 1;
    }
  }

  countBigBang() {
    this.bigbangUses += 1;
    localStorage.setItem(BIGBANG_KEY, String(this.bigbangUses));
  }

  finalize() {
    if (this.value > this.best) {
      this.best = this.value;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
  }

  reset() {
    this.value = 0;
    this.combo = 1;
    this._lastMergeT = 0;
  }
}
