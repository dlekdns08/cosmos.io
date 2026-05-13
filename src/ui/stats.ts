import type { Stats } from '../game/stats.js';
import { TIERS } from '../config/tiers.js';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

export class StatsPanel {
  el: HTMLElement;
  gridEl: HTMLElement;
  closeBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  private stats: Stats;
  private onClose?: () => void;

  constructor(stats: Stats) {
    this.stats = stats;
    this.el = requireEl('stats-modal');
    this.gridEl = requireEl('stats-grid');
    this.closeBtn = requireEl('stats-close') as HTMLButtonElement;
    this.resetBtn = requireEl('stats-reset') as HTMLButtonElement;
    this.closeBtn.addEventListener('click', () => this.hide());
    this.resetBtn.addEventListener('click', () => {
      if (!confirm('누적 통계를 초기화할까요?')) return;
      this.stats.reset();
      this.render();
    });
  }

  show(onClose?: () => void): void {
    this.onClose = onClose;
    this.render();
    this.el.classList.add('show');
  }

  hide(): void {
    this.el.classList.remove('show');
    this.onClose?.();
    this.onClose = undefined;
  }

  private render(): void {
    const d = this.stats.data;
    const items: Array<{ label: string; value: string }> = [
      { label: '총 게임', value: d.totalGames.toLocaleString() },
      { label: '총 플레이 시간', value: formatDuration(d.totalPlayTimeMs) },
      { label: '최고 점수', value: d.highestScore.toLocaleString() },
      { label: '최장 콤보', value: `×${d.bestCombo.toFixed(1)}` },
      { label: '총 드롭', value: d.totalDrops.toLocaleString() },
      { label: '총 머지', value: d.totalMerges.toLocaleString() },
      { label: '최고 도달 단계', value: d.highestTier > 0 ? `${d.highestTier} (${TIERS[d.highestTier]?.name ?? '-'})` : '-' },
      { label: '항성 생성', value: (d.tierCounts[8] ?? 0).toLocaleString() },
      { label: '적색거성 생성', value: (d.tierCounts[9] ?? 0).toLocaleString() },
      { label: '초신성 발동', value: d.supernovasFired.toLocaleString() },
      { label: '블랙홀 생성', value: d.blackholesMade.toLocaleString() },
      { label: '슬링샷 발동', value: d.slingshotsTriggered.toLocaleString() },
      { label: '코스믹 차지 사용', value: d.chargesUsed.toLocaleString() },
      { label: '빅뱅 사용', value: d.bigBangsUsed.toLocaleString() },
      { label: '획득 NP 총합', value: d.totalNpEarned.toLocaleString() },
    ];
    const frag = document.createDocumentFragment();
    for (const it of items) {
      const cell = document.createElement('div');
      cell.className = 'stats-cell';
      cell.innerHTML = `<span class="stats-label">${it.label}</span><span class="stats-value">${it.value}</span>`;
      frag.appendChild(cell);
    }
    this.gridEl.replaceChildren(frag);
  }
}
