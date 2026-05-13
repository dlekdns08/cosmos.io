import type Matter from 'matter-js';
import type { Dropper } from '../physics/dropper.js';
import type { Policy } from './policy.js';

export interface BotCallbacks {
  /** Returns the list of cosmic bodies currently in the world. */
  getBodies: () => Matter.Body[];
  /** Triggers a drop using the same path as a player click. */
  drop: () => void;
  /** Hook for whoever owns the dropper to read its state. */
  dropper: Dropper;
  /** Called when the bot makes a decision (for UI / training). */
  onDecide?: (targetX: number) => void;
}

export class AIBot {
  enabled = false;
  policy: Policy;
  private callbacks: BotCallbacks;
  private targetX: number | null = null;
  private lastDecideAt = 0;
  private redecideIntervalMs = 250;
  private moveSpeedPxPerFrame = 16;
  private dropTolerancePx = 4;

  constructor(policy: Policy, callbacks: BotCallbacks) {
    this.policy = policy;
    this.callbacks = callbacks;
  }

  setPolicy(p: Policy): void {
    this.policy = p;
  }

  enable(): void {
    this.enabled = true;
    this.reset();
  }

  disable(): void {
    this.enabled = false;
    this.reset();
  }

  reset(): void {
    this.targetX = null;
    this.lastDecideAt = 0;
  }

  update(nowMs: number): void {
    if (!this.enabled) return;
    const d = this.callbacks.dropper;
    if (!d.enabled) return;

    const needNewTarget =
      this.targetX == null || (nowMs - this.lastDecideAt > this.redecideIntervalMs);
    if (needNewTarget) {
      const bodies = this.callbacks.getBodies();
      const decision = this.policy.decide({
        bodies,
        nextTier: d.nextTier,
        queueTier: d.queueTier,
      });
      this.targetX = decision.x;
      this.lastDecideAt = nowMs;
      this.callbacks.onDecide?.(this.targetX);
    }

    const target = this.targetX as number;
    const dx = target - d.x;
    if (Math.abs(dx) > 0.5) {
      const step = Math.sign(dx) * Math.min(Math.abs(dx), this.moveSpeedPxPerFrame);
      d.setX(d.x + step);
    }

    if (Math.abs(d.x - target) <= this.dropTolerancePx && d.cooldown <= 0) {
      this.callbacks.drop();
      // Don't immediately ask for a new target — wait until next interval so the
      // physics has a moment to settle into a new state.
      this.targetX = null;
    }
  }
}
