import { UNLOCK_TRACK } from '../config/unlocks.js';
import type { Meta } from '../game/meta.js';

export class NebulaPanel {
  el: HTMLElement;
  closeBtn: HTMLButtonElement;
  npEl: HTMLElement;
  trackEl: HTMLElement;
  private onClose?: () => void;

  constructor() {
    this.el = requireEl('nebula');
    this.closeBtn = requireEl('nebula-close') as HTMLButtonElement;
    this.npEl = requireEl('nebula-np');
    this.trackEl = requireEl('nebula-track');
    this.closeBtn.addEventListener('click', () => this.hide());
  }

  show(meta: Meta, onClose?: () => void): void {
    this.onClose = onClose;
    this.npEl.textContent = meta.np.toLocaleString();
    this._renderTrack(meta);
    this.el.classList.add('show');
  }

  hide(): void {
    this.el.classList.remove('show');
    this.onClose?.();
    this.onClose = undefined;
  }

  private _renderTrack(meta: Meta): void {
    const frag = document.createDocumentFragment();
    for (const node of UNLOCK_TRACK) {
      const unlocked = meta.hasUnlock(node.id);
      const row = document.createElement('div');
      row.className = 'nebula-node' + (unlocked ? ' unlocked' : '');
      row.innerHTML = `
        <div class="nebula-np">${node.np.toLocaleString()} NP</div>
        <div class="nebula-info">
          <div class="nebula-name">${node.name}</div>
          <div class="nebula-desc">${node.desc}</div>
        </div>
        <div class="nebula-state">${unlocked ? '해금' : '잠김'}</div>
      `;
      frag.appendChild(row);
    }
    this.trackEl.replaceChildren(frag);
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
