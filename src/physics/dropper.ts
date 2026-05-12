import Matter from 'matter-js';
import { TIERS, DROP_TIER_MAX, tierInfo } from '../config/tiers.js';
import { makeBody, WIDTH, TOP_LINE_Y } from './world.js';

export type DropCallback = (body: Matter.Body) => void;

export class Dropper {
  world: Matter.World;
  onDrop?: DropCallback;
  x: number;
  nextTier: number;
  queueTier: number;
  cooldown: number;
  enabled: boolean;

  constructor(world: Matter.World, onDrop?: DropCallback) {
    this.world = world;
    this.onDrop = onDrop;
    this.x = WIDTH / 2;
    this.nextTier = this._pick();
    this.queueTier = this._pick();
    this.cooldown = 0;
    this.enabled = true;
  }

  private _pick(): number {
    return 1 + Math.floor(Math.random() * DROP_TIER_MAX);
  }

  setX(x: number): void {
    const r = tierInfo(this.nextTier).radius;
    this.x = Math.max(r + 4, Math.min(WIDTH - r - 4, x));
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  drop(): Matter.Body | null {
    if (!this.enabled || this.cooldown > 0) return null;
    const info = tierInfo(this.nextTier);
    const body = makeBody(this.x, TOP_LINE_Y - info.radius - 6, info);
    Matter.World.add(this.world, body);
    this.onDrop?.(body);
    this.nextTier = this.queueTier;
    this.queueTier = this._pick();
    this.cooldown = 0.45;
    return body;
  }

  reset(): void {
    this.nextTier = this._pick();
    this.queueTier = this._pick();
    this.cooldown = 0;
    this.enabled = true;
  }
}
