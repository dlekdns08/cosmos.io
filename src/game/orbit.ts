import Matter from 'matter-js';
import { TIERS } from '../config/tiers.js';

export const ORBIT_DURATION_MS = 1000;
export const ORBIT_RADIUS = 80;
export const ORBIT_PULL = 0.0005;

export function markOrbitActive(body: Matter.Body, now: number = performance.now()): void {
  const info = body.tier != null ? TIERS[body.tier] : null;
  if (!info || !info.orbitBonus) return;
  body._orbitUntil = now + ORBIT_DURATION_MS;
}

export function applyOrbitForces(bodies: Matter.Body[], now: number = performance.now()): void {
  const actives: Matter.Body[] = [];
  for (const b of bodies) {
    if (b._orbitUntil != null && b._orbitUntil > now) actives.push(b);
  }
  if (actives.length < 2) return;
  const r2 = ORBIT_RADIUS * ORBIT_RADIUS;
  for (const a of actives) {
    for (const b of actives) {
      if (a === b) continue;
      if (a.tier !== b.tier) continue;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2 || d2 < 1) continue;
      const d = Math.sqrt(d2);
      const fall = 1 - d2 / r2;
      const force = ORBIT_PULL * a.mass * fall / d;
      Matter.Body.applyForce(a, a.position, { x: force * dx, y: force * dy });
    }
  }
}

export function isOrbitActive(body: Matter.Body, now: number = performance.now()): boolean {
  return body._orbitUntil != null && body._orbitUntil > now;
}
