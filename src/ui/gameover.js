export class GameOverOverlay {
  constructor(onRestart) {
    this.el = document.getElementById('gameover');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalBestEl = document.getElementById('finalBest');
    this.restartBtn = document.getElementById('restart');
    this.restartBtn.addEventListener('click', () => onRestart());
  }

  show(score) {
    this.finalScoreEl.textContent = score.value.toLocaleString();
    this.finalBestEl.textContent = score.best.toLocaleString();
    this.el.classList.add('show');
  }

  hide() {
    this.el.classList.remove('show');
  }
}
