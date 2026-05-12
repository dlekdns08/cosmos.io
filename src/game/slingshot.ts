import Matter from 'matter-js';
import { TIERS } from '../config/tiers.js';

const RING_INNER_FACTOR = 1.35;
const RING_OUTER_FACTOR = 1.95;
const SLING_BOOST = 1.6;
const SLING_TAG_MS = 1500;
const COOLDOWN_MS = 250;

const lastSlung = new WeakMap<Matter.Body, number>();

export interface SlingshotEvent {
  ring: Matter.Body;
  body: Matter.Body;
  x: number;
  y: number;
}

export function runSlingshot(bodies: Matter.Body[], onSling: (e: SlingshotEvent) => void): void {
  const rings: Matter.Body[] = [];
  for (const b of bodies) {
    if (b.tier === 7) rings.push(b);
  }
  if (!rings.length) return;
  const now = performance.now();

  for (const ring of rings) {
    const ringInfo = TIERS[7];
    if (!ringInfo) continue;
    const innerR = ringInfo.radius * RING_INNER_FACTOR;
    const outerR = ringInfo.radius * RING_OUTER_FACTOR;
    const inner2 = innerR * innerR;
    const outer2 = outerR * outerR;

    for (const b of bodies) {
      if (b === ring) continue;
      // Only planets (tier 6) get slung by the giant planet's ring.
      // Tier 7+ are too massive — slinging them caused stars to fly upward and trigger game over.
      if (b.tier !== 6) continue;
      const last = lastSlung.get(b) ?? 0;
      if (now - last < COOLDOWN_MS) continue;

      const dx = b.position.x - ring.position.x;
      const dy = b.position.y - ring.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < inner2 || d2 > outer2) continue;

      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      const tx = -ny;
      const ty = nx;

      const v = b.velocity;
      const speed = Math.hypot(v.x, v.y);
      const sign = v.x * tx + v.y * ty < 0 ? -1 : 1;
      const newSpeed = Math.max(speed, 4) * SLING_BOOST;
      Matter.Body.setVelocity(b, {
        x: tx * newSpeed * sign,
        y: ty * newSpeed * sign,
      });
      b._slingshotUntil = now + SLING_TAG_MS;
      lastSlung.set(b, now);
      onSling({ ring, body: b, x: b.position.x, y: b.position.y });
    }
  }
}

export function wasJustSlung(body: Matter.Body, now: number = performance.now()): boolean {
  return body._slingshotUntil != null && body._slingshotUntil > now;
}
