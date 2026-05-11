import Matter from 'matter-js';
import { TIERS } from '../config/tiers.js';

export function applyGravity(bodies) {
  const attractors = [];
  for (const b of bodies) {
    const info = TIERS[b.tier];
    if (info && info.gravity) {
      attractors.push({ body: b, g: info.gravity, r2: info.gravityRadius * info.gravityRadius });
    }
  }
  if (!attractors.length) return;

  for (const b of bodies) {
    if (b._merged) continue;
    const info = TIERS[b.tier];
    if (!info || info.gravity) continue;

    let fx = 0, fy = 0;
    for (const a of attractors) {
      if (a.body === b) continue;
      const dx = a.body.position.x - b.position.x;
      const dy = a.body.position.y - b.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > a.r2 || d2 < 1) continue;
      const d = Math.sqrt(d2);
      const fall = 1 - d2 / a.r2;
      const force = a.g * b.mass * fall / d;
      fx += force * dx;
      fy += force * dy;
    }
    if (fx !== 0 || fy !== 0) {
      Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
    }
  }
}
