import Matter from 'matter-js';
import { TIERS, DROP_TIER_MAX } from '../config/tiers.js';
import { makeBody, WIDTH, TOP_LINE_Y } from './world.js';

export class Dropper {
  constructor(world, onDrop) {
    this.world = world;
    this.onDrop = onDrop;
    this.x = WIDTH / 2;
    this.nextTier = this._pick();
    this.queueTier = this._pick();
    this.cooldown = 0;
    this.enabled = true;
  }

  _pick() {
    return 1 + Math.floor(Math.random() * DROP_TIER_MAX);
  }

  setX(x) {
    const r = TIERS[this.nextTier].radius;
    this.x = Math.max(r + 4, Math.min(WIDTH - r - 4, x));
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  drop() {
    if (!this.enabled || this.cooldown > 0) return null;
    const info = TIERS[this.nextTier];
    const body = makeBody(this.x, TOP_LINE_Y - info.radius - 6, info);
    Matter.World.add(this.world, body);
    this.onDrop?.(body);
    this.nextTier = this.queueTier;
    this.queueTier = this._pick();
    this.cooldown = 0.45;
    return body;
  }

  reset() {
    this.nextTier = this._pick();
    this.queueTier = this._pick();
    this.cooldown = 0;
    this.enabled = true;
  }
}
