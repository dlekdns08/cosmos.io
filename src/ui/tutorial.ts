const KEY = 'cosmos.tutorial.seen';

interface TutorialState {
  seen: Record<string, boolean>;
}

export type TutorialId =
  | 'firstDrop'
  | 'firstMerge'
  | 'firstChargeReady'
  | 'firstStar'
  | 'firstSupernova'
  | 'firstBlackhole'
  | 'bigBangPrompt';

const TIPS: Record<TutorialId, { title: string; body: string }> = {
  firstDrop: {
    title: '첫 드롭!',
    body: '같은 단계끼리 부딪치면 합쳐져요. 마우스 / 손가락으로 위치를 조정해 떨어뜨려보세요.',
  },
  firstMerge: {
    title: '머지 성공',
    body: '같은 단계를 합치면 한 단계 진화해요. 계속 합쳐서 더 큰 천체를 만들어보세요!',
  },
  firstChargeReady: {
    title: '코스믹 차지 100%',
    body: '하단 1·2·3 버튼 또는 키보드로 효과를 선택해 다음 드롭에 적용하세요.',
  },
  firstStar: {
    title: '★ 항성 탄생',
    body: '항성은 주변 작은 천체를 끌어당겨요. 그 위로 작은 행성들을 떨어뜨려보세요.',
  },
  firstSupernova: {
    title: '✦ 초신성 폭발',
    body: '주변 천체가 흩어지고 한 단계씩 진화해요. 점수 보너스 +500.',
  },
  firstBlackhole: {
    title: '⚫ 블랙홀',
    body: '5초간 모든 천체를 흡수합니다. 흡수된 천체 단계 합 × 10 보너스.',
  },
  bigBangPrompt: {
    title: '빅뱅 사용 가능',
    body: '게임오버 직전 한 번 사용할 수 있어요. 모든 천체를 재배치하고 차지를 100% 충전합니다.',
  },
};

export class Tutorial {
  private state: TutorialState;
  private active = new Set<HTMLElement>();

  constructor() {
    this.state = this.load();
  }

  private load(): TutorialState {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { seen: {} };
      return JSON.parse(raw) as TutorialState;
    } catch {
      return { seen: {} };
    }
  }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* ignore */ }
  }

  show(id: TutorialId, durationMs = 7000): void {
    if (this.state.seen[id]) return;
    this.state.seen[id] = true;
    this.save();

    const tip = TIPS[id];
    const root = document.getElementById('tutorial-host') ?? document.body;
    const el = document.createElement('div');
    el.className = 'tutorial-tip';
    el.innerHTML = `
      <div class="tip-title">${tip.title}</div>
      <div class="tip-body">${tip.body}</div>
      <button type="button" class="tip-close">알겠어요</button>
    `;
    root.appendChild(el);
    this.active.add(el);

    const close = () => {
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        this.active.delete(el);
      }, 220);
    };
    el.querySelector('.tip-close')?.addEventListener('click', close);
    setTimeout(close, durationMs);
  }

  reset(): void {
    this.state.seen = {};
    this.save();
    for (const el of this.active) el.remove();
    this.active.clear();
  }
}
