import type { DailyChallenges, DailyChallenge } from '../game/dailyChallenge.js';

export class DailyPanel {
  listEl: HTMLElement;
  streakEl: HTMLElement;
  private daily: DailyChallenges;

  constructor(daily: DailyChallenges) {
    this.daily = daily;
    this.listEl = requireEl('daily-list');
    this.streakEl = requireEl('daily-streak');
    this.render();
  }

  render(): void {
    this.streakEl.textContent = `🔥 ${this.daily.streak}`;
    const frag = document.createDocumentFragment();
    for (const c of this.daily.challenges) {
      frag.appendChild(this._row(c));
    }
    this.listEl.replaceChildren(frag);
  }

  private _row(c: DailyChallenge): HTMLElement {
    const row = document.createElement('div');
    row.className = 'daily-row' + (c.done ? ' done' : '');
    const target = getTarget(c);
    row.innerHTML = `
      <div class="check"></div>
      <div class="label">${c.label}</div>
      <div class="prog">${c.progress.toLocaleString()}/${target.toLocaleString()}</div>
    `;
    return row;
  }
}

function getTarget(c: DailyChallenge): number {
  const s = c.spec;
  switch (s.kind) {
    case 'comboHits': return s.target;
    case 'createTier': return s.count;
    case 'score': return s.target;
    case 'slingshots': return s.count;
    case 'charges': return s.count;
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
