import { generateAnonName } from './names.js';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  best: number;
  alive: boolean;
}

interface LeaderboardMessage {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
  yourSessionId: string;
}

interface AckMessage {
  type: 'ack';
}

type ServerMessage = LeaderboardMessage | AckMessage;

interface HelloMessage {
  type: 'hello';
  sessionId: string;
  name: string;
}

interface ScoreMessage {
  type: 'score';
  score: number;
  alive: boolean;
}

interface GameOverMessage {
  type: 'gameover';
  score: number;
}

type ClientMessage = HelloMessage | ScoreMessage | GameOverMessage;

const SESSION_KEY = 'cosmos.sessionId';
const NAME_KEY = 'cosmos.name';
const SCORE_PUSH_INTERVAL_MS = 250;
const RECONNECT_MIN_MS = 500;
const RECONNECT_MAX_MS = 8000;

function loadOrCreate<T>(key: string, factory: () => T): T {
  const existing = localStorage.getItem(key);
  if (existing) return existing as unknown as T;
  const created = factory();
  localStorage.setItem(key, String(created));
  return created;
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface NetClientCallbacks {
  onLeaderboard?: (entries: LeaderboardEntry[], yourSessionId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class NetClient {
  sessionId: string;
  name: string;
  private ws: WebSocket | null = null;
  private callbacks: NetClientCallbacks;
  private pendingScore: { score: number; alive: boolean } | null = null;
  private lastSent: { score: number; alive: boolean } | null = null;
  private flushTimer: number | null = null;
  private reconnectDelay = RECONNECT_MIN_MS;
  private connected = false;
  private destroyed = false;

  constructor(callbacks: NetClientCallbacks = {}) {
    this.sessionId = loadOrCreate(SESSION_KEY, randomId);
    this.name = loadOrCreate(NAME_KEY, generateAnonName);
    this.callbacks = callbacks;
  }

  connect(): void {
    if (this.destroyed) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/ws`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this._scheduleReconnect();
      return;
    }
    this.ws.addEventListener('open', () => this._onOpen());
    this.ws.addEventListener('message', (ev) => this._onMessage(ev));
    this.ws.addEventListener('close', () => this._onClose());
    this.ws.addEventListener('error', () => this.ws?.close());
  }

  private _onOpen(): void {
    this.connected = true;
    this.reconnectDelay = RECONNECT_MIN_MS;
    this._send({ type: 'hello', sessionId: this.sessionId, name: this.name });
    this.callbacks.onConnect?.();
    if (this.pendingScore) this._flush();
  }

  private _onMessage(ev: MessageEvent<string>): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(ev.data) as ServerMessage;
    } catch {
      return;
    }
    if (msg.type === 'leaderboard') {
      this.callbacks.onLeaderboard?.(msg.entries, msg.yourSessionId);
    }
  }

  private _onClose(): void {
    this.connected = false;
    this.callbacks.onDisconnect?.();
    if (!this.destroyed) this._scheduleReconnect();
  }

  private _scheduleReconnect(): void {
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    window.setTimeout(() => this.connect(), delay);
  }

  private _send(msg: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  pushScore(score: number, alive: boolean): void {
    this.pendingScore = { score, alive };
    if (this.flushTimer != null) return;
    this.flushTimer = window.setTimeout(() => this._flush(), SCORE_PUSH_INTERVAL_MS);
  }

  private _flush(): void {
    if (this.flushTimer != null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (!this.pendingScore || !this.connected) return;
    const last = this.lastSent;
    const cur = this.pendingScore;
    if (last && last.score === cur.score && last.alive === cur.alive) {
      this.pendingScore = null;
      return;
    }
    this._send({ type: 'score', score: cur.score, alive: cur.alive });
    this.lastSent = { ...cur };
    this.pendingScore = null;
  }

  notifyGameOver(score: number): void {
    if (this.flushTimer != null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pendingScore = null;
    this.lastSent = { score: 0, alive: false };
    this._send({ type: 'gameover', score });
  }

  destroy(): void {
    this.destroyed = true;
    this.ws?.close();
  }
}
