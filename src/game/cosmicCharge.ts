export type ChargeKind = 'charged' | 'slow' | 'attract';

const MAX_GAUGE = 100;

export interface ChargeListener {
  onReady?: () => void;
  onChange?: (pct: number) => void;
  onSelectChange?: (kind: ChargeKind | null) => void;
  onUsed?: (kind: ChargeKind) => void;
}

export class CosmicCharge {
  gauge = 0;
  selected: ChargeKind | null = null;
  usedCount = 0;
  rate = 1;
  private wasReady = false;
  private listener: ChargeListener;

  constructor(listener: ChargeListener = {}) {
    this.listener = listener;
  }

  get pct(): number {
    return this.gauge / MAX_GAUGE;
  }

  get ready(): boolean {
    return this.gauge >= MAX_GAUGE;
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  addMerge(tier: number): void {
    if (this.ready) return;
    this.gauge = Math.min(MAX_GAUGE, this.gauge + tier * this.rate);
    this._notifyChange();
  }

  fillFull(): void {
    if (this.gauge >= MAX_GAUGE) return;
    this.gauge = MAX_GAUGE;
    this._notifyChange();
  }

  select(kind: ChargeKind): boolean {
    if (!this.ready) return false;
    if (this.selected === kind) {
      this.selected = null;
    } else {
      this.selected = kind;
    }
    this.listener.onSelectChange?.(this.selected);
    return true;
  }

  consume(): ChargeKind | null {
    if (!this.ready) return null;
    const kind = this.selected;
    if (!kind) return null;
    this.gauge = 0;
    this.selected = null;
    this.usedCount += 1;
    this.listener.onSelectChange?.(null);
    this.listener.onChange?.(0);
    this.wasReady = false;
    this.listener.onUsed?.(kind);
    return kind;
  }

  reset(): void {
    this.gauge = 0;
    this.selected = null;
    this.usedCount = 0;
    this.wasReady = false;
    this.listener.onSelectChange?.(null);
    this.listener.onChange?.(0);
  }

  private _notifyChange(): void {
    this.listener.onChange?.(this.pct);
    if (this.ready && !this.wasReady) {
      this.wasReady = true;
      this.listener.onReady?.();
    }
  }
}
