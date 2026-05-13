import Matter from 'matter-js';
import { TIERS } from '../config/tiers.js';

interface Attractor {
  body: Matter.Body;
  g: number;
  r2: number;
}

export function applyGravity(bodies: Matter.Body[]): void {
  const attractors: Attractor[] = [];
  for (const b of bodies) {
    if (b.tier == null) continue;
    const info = TIERS[b.tier];
    if (info && info.gravity != null && info.gravityRadius != null) {
      attractors.push({ body: b, g: info.gravity, r2: info.gravityRadius * info.gravityRadius });
    }
  }
  if (!attractors.length) return;

  for (const b of bodies) {
    if (b._merged) continue;
    if (b.tier == null) continue;
    const info = TIERS[b.tier];
    if (!info || info.gravity != null) continue;

    let fx = 0;
    let fy = 0;
    const bRadius = b.circleRadius ?? 0;
    for (const a of attractors) {
      if (a.body === b) continue;
      const dx = a.body.position.x - b.position.x;
      const dy = a.body.position.y - b.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > a.r2 || d2 < 1) continue;
      const d = Math.sqrt(d2);
      // Stop pulling once we're at (or inside) contact range — otherwise gravity keeps
      // shoving the body into the attractor's surface, faster than matter can resolve the overlap.
      const contactD = (a.body.circleRadius ?? 0) + bRadius + 4;
      if (d <= contactD) continue;
      const fall = 1 - d2 / a.r2;
      // Softened 1/d to avoid runaway forces when a body is just outside contact range.
      const softD = Math.max(d, 25);
      const force = (a.g * b.mass * fall) / softD;
      fx += force * dx;
      fy += force * dy;
    }
    if (fx !== 0 || fy !== 0) {
      Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
    }
  }
}
