import type { Renderer } from '../render/renderer.js';
import type { Score } from '../game/score.js';
import type { Dropper } from '../physics/dropper.js';

export class HUD {
  renderer: Renderer;
  scoreEl: HTMLElement;
  bestEl: HTMLElement;
  comboEl: HTMLElement;
  nextCanvas: HTMLCanvasElement;
  private _lastNextTier: number | null;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.scoreEl = requireEl('score');
    this.bestEl = requireEl('best');
    this.comboEl = requireEl('combo');
    this.nextCanvas = requireEl('next') as HTMLCanvasElement;
    this._lastNextTier = null;
  }

  update(score: Score, dropper: Dropper): void {
    this.scoreEl.textContent = score.value.toLocaleString();
    this.bestEl.textContent = score.best.toLocaleString();
    if (score.combo > 1.01) {
      this.comboEl.textContent = `x${score.combo.toFixed(1)} COMBO`;
      this.comboEl.style.opacity = '1';
    } else {
      this.comboEl.style.opacity = '0';
    }
    if (dropper.nextTier !== this._lastNextTier) {
      this._lastNextTier = dropper.nextTier;
      this.renderer.drawNextPreview(this.nextCanvas, dropper.nextTier);
    }
  }

  resetPreview(): void {
    this._lastNextTier = null;
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

export function toast(text: string, color?: string): void {
  const root = document.getElementById('toasts');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  if (color) el.style.borderColor = color;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
