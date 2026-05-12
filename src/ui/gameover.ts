import type { Score } from '../game/score.js';

export class GameOverOverlay {
  el: HTMLElement;
  finalScoreEl: HTMLElement;
  finalBestEl: HTMLElement;
  finalNpEl: HTMLElement;
  restartBtn: HTMLButtonElement;

  constructor(onRestart: () => void) {
    this.el = requireEl('gameover');
    this.finalScoreEl = requireEl('finalScore');
    this.finalBestEl = requireEl('finalBest');
    this.finalNpEl = requireEl('finalNp');
    this.restartBtn = requireEl('restart') as HTMLButtonElement;
    this.restartBtn.addEventListener('click', () => onRestart());
  }

  show(score: Score, npGained: number = 0): void {
    this.finalScoreEl.textContent = score.value.toLocaleString();
    this.finalBestEl.textContent = score.best.toLocaleString();
    this.finalNpEl.textContent = npGained.toLocaleString();
    this.el.classList.add('show');
  }

  hide(): void {
    this.el.classList.remove('show');
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
