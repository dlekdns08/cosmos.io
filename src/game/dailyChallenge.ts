export type DailyKind =
  | { kind: 'comboHits'; target: number }
  | { kind: 'createTier'; tier: number; count: number }
  | { kind: 'score'; target: number }
  | { kind: 'slingshots'; count: number }
  | { kind: 'charges'; count: number };

export interface DailyChallenge {
  id: string;
  label: string;
  spec: DailyKind;
  progress: number;
  done: boolean;
}

const STREAK_KEY = 'cosmos.streak';
const STREAK_LAST_KEY = 'cosmos.streakLastDay';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function hashDate(date: string): number {
  let h = 5381;
  for (let i = 0; i < date.length; i++) h = ((h << 5) + h + date.charCodeAt(i)) | 0;
  return h >>> 0;
}

function buildSpecs(rand: () => number): DailyKind[] {
  const pool: DailyKind[] = [
    { kind: 'comboHits', target: 3 + Math.floor(rand() * 3) },
    { kind: 'createTier', tier: 7 + Math.floor(rand() * 2), count: 3 + Math.floor(rand() * 4) },
    { kind: 'score', target: 30000 + Math.floor(rand() * 40000) },
    { kind: 'slingshots', count: 2 + Math.floor(rand() * 3) },
    { kind: 'charges', count: 3 + Math.floor(rand() * 4) },
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function describe(spec: DailyKind): string {
  switch (spec.kind) {
    case 'comboHits': return `4 콤보 이상 ${spec.target}회 달성`;
    case 'createTier': return `${spec.tier}단계 ${spec.count}개 만들기`;
    case 'score': return `한 판에 ${spec.target.toLocaleString()}점 달성`;
    case 'slingshots': return `슬링샷 ${spec.count}회 발동`;
    case 'charges': return `차지 ${spec.count}회 사용`;
  }
}

function progressTarget(spec: DailyKind): number {
  switch (spec.kind) {
    case 'comboHits': return spec.target;
    case 'createTier': return spec.count;
    case 'score': return spec.target;
    case 'slingshots': return spec.count;
    case 'charges': return spec.count;
  }
}

export class DailyChallenges {
  date: string;
  challenges: DailyChallenge[];
  streak: number;
  private completedAll: boolean;

  constructor() {
    this.date = todayKey();
    this.challenges = this._load();
    this.streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    this.completedAll = this.challenges.every((c) => c.done);
    this._maybeBreakStreak();
  }

  private _load(): DailyChallenge[] {
    const key = `cosmos.daily.${this.date}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw) as DailyChallenge[];
      } catch {
        /* fall through */
      }
    }
    const rand = seedRandom(hashDate(this.date));
    const specs = buildSpecs(rand);
    const list: DailyChallenge[] = specs.map((spec, i) => ({
      id: `${this.date}-${i}`,
      label: describe(spec),
      spec,
      progress: 0,
      done: false,
    }));
    localStorage.setItem(key, JSON.stringify(list));
    return list;
  }

  private _save(): void {
    localStorage.setItem(`cosmos.daily.${this.date}`, JSON.stringify(this.challenges));
  }

  private _maybeBreakStreak(): void {
    const last = localStorage.getItem(STREAK_LAST_KEY);
    if (!last) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`;
    if (last !== yKey && last !== this.date) {
      this.streak = 0;
      localStorage.setItem(STREAK_KEY, '0');
    }
  }

  bump(spec: DailyKind['kind'], amount: number, extra?: { tier?: number; score?: number; combo?: number }): boolean {
    let anyChanged = false;
    for (const c of this.challenges) {
      if (c.done) continue;
      if (c.spec.kind !== spec) continue;
      if (c.spec.kind === 'createTier' && extra?.tier !== c.spec.tier) continue;
      if (c.spec.kind === 'score') {
        const cur = extra?.score ?? amount;
        if (cur > c.progress) {
          c.progress = cur;
          anyChanged = true;
        }
      } else if (c.spec.kind === 'comboHits') {
        if ((extra?.combo ?? 0) >= 4) {
          c.progress = Math.min(progressTarget(c.spec), c.progress + amount);
          anyChanged = true;
        }
      } else {
        c.progress = Math.min(progressTarget(c.spec), c.progress + amount);
        anyChanged = true;
      }
      if (c.progress >= progressTarget(c.spec)) c.done = true;
    }
    if (anyChanged) {
      this._save();
      this._checkAllDone();
    }
    return anyChanged;
  }

  private _checkAllDone(): void {
    if (this.completedAll) return;
    const allDone = this.challenges.every((c) => c.done);
    if (!allDone) return;
    this.completedAll = true;
    this.streak += 1;
    localStorage.setItem(STREAK_KEY, String(this.streak));
    localStorage.setItem(STREAK_LAST_KEY, this.date);
  }

  isAllDone(): boolean {
    return this.completedAll;
  }
}
