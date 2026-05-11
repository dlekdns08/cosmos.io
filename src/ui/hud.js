export class HUD {
  constructor(renderer) {
    this.renderer = renderer;
    this.scoreEl = document.getElementById('score');
    this.bestEl = document.getElementById('best');
    this.comboEl = document.getElementById('combo');
    this.nextCanvas = document.getElementById('next');
    this._lastNextTier = null;
  }

  update(score, dropper) {
    this.scoreEl.textContent = score.value.toLocaleString();
    this.bestEl.textContent = score.best.toLocaleString();
    if (score.combo > 1.01) {
      this.comboEl.textContent = `x${score.combo.toFixed(1)} COMBO`;
      this.comboEl.style.opacity = 1;
    } else {
      this.comboEl.style.opacity = 0;
    }
    if (dropper.nextTier !== this._lastNextTier) {
      this._lastNextTier = dropper.nextTier;
      this.renderer.drawNextPreview(this.nextCanvas, dropper.nextTier);
    }
  }

  resetPreview() {
    this._lastNextTier = null;
  }
}

export function toast(text, color) {
  const root = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  if (color) el.style.borderColor = color;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
