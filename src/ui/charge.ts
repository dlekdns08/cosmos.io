import type { ChargeKind, CosmicCharge } from '../game/cosmicCharge.js';

const KINDS: ChargeKind[] = ['charged', 'slow', 'attract'];

export class ChargePanel {
  fillEl: HTMLElement;
  labelEl: HTMLElement;
  gaugeEl: HTMLElement;
  btnEls: Record<ChargeKind, HTMLButtonElement>;
  private charge: CosmicCharge;

  constructor(charge: CosmicCharge, onSelect: (kind: ChargeKind) => void) {
    this.charge = charge;
    this.fillEl = requireEl('charge-fill');
    this.labelEl = requireEl('charge-label');
    this.gaugeEl = this.fillEl.parentElement as HTMLElement;
    this.btnEls = {
      charged: requireEl('charge-btn-charged') as HTMLButtonElement,
      slow: requireEl('charge-btn-slow') as HTMLButtonElement,
      attract: requireEl('charge-btn-attract') as HTMLButtonElement,
    };
    for (const k of KINDS) {
      this.btnEls[k].addEventListener('click', () => onSelect(k));
    }
  }

  syncFromCharge(): void {
    const pct = this.charge.pct;
    this.fillEl.style.width = `${Math.min(100, pct * 100)}%`;
    this.labelEl.textContent = this.charge.ready ? 'READY · 1·2·3' : `CHARGE ${Math.floor(pct * 100)}%`;
    this.gaugeEl.classList.toggle('ready', this.charge.ready);
    const ready = this.charge.ready;
    for (const k of KINDS) {
      this.btnEls[k].disabled = !ready;
      this.btnEls[k].classList.toggle('selected', this.charge.selected === k);
    }
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
