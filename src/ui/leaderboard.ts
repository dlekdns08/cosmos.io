import type { LeaderboardEntry } from '../net/client.js';

export class LeaderboardPanel {
  listEl: HTMLElement;
  statusEl: HTMLElement;
  private yourSessionId = '';
  private rendered: LeaderboardEntry[] = [];

  constructor() {
    this.listEl = requireEl('leaderboard-list');
    this.statusEl = requireEl('leaderboard-status');
    this.setStatus('연결 중...');
  }

  setStatus(text: string): void {
    this.statusEl.textContent = text;
  }

  setConnected(connected: boolean): void {
    this.statusEl.textContent = connected ? '실시간' : '오프라인 — 재연결 중';
    this.statusEl.classList.toggle('off', !connected);
  }

  setYourSessionId(id: string): void {
    this.yourSessionId = id;
    this.render(this.rendered);
  }

  render(entries: LeaderboardEntry[]): void {
    this.rendered = entries;
    const frag = document.createDocumentFragment();
    let youShown = false;
    entries.forEach((e, idx) => {
      const isYou = e.id === this.yourSessionId;
      if (isYou) youShown = true;
      frag.appendChild(this._row(idx + 1, e, isYou));
    });
    if (!youShown && this.yourSessionId) {
      const meIdx = entries.findIndex((e) => e.id === this.yourSessionId);
      if (meIdx < 0) {
        const placeholder: LeaderboardEntry = {
          id: this.yourSessionId,
          name: '나',
          score: 0,
          best: 0,
          alive: true,
        };
        frag.appendChild(this._row(null, placeholder, true));
      }
    }
    this.listEl.replaceChildren(frag);
  }

  private _row(rank: number | null, e: LeaderboardEntry, isYou: boolean): HTMLElement {
    const li = document.createElement('div');
    li.className = 'lb-row' + (isYou ? ' you' : '') + (e.alive ? ' alive' : '');

    const rankEl = document.createElement('div');
    rankEl.className = 'lb-rank';
    rankEl.textContent = rank == null ? '–' : `#${rank}`;
    li.appendChild(rankEl);

    const main = document.createElement('div');
    main.className = 'lb-main';

    const name = document.createElement('div');
    name.className = 'lb-name';
    name.textContent = isYou ? `${e.name} (나)` : e.name;
    main.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'lb-meta';
    const shown = Math.max(e.score, e.best);
    const live = e.alive ? '<span class="lb-live">LIVE</span> ' : '';
    meta.innerHTML = `${live}${shown.toLocaleString()}`;
    main.appendChild(meta);

    li.appendChild(main);
    return li;
  }
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
