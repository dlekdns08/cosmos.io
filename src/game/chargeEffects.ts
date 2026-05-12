import Matter from 'matter-js';

const ATTRACT_DURATION_MS = 2500;
const ATTRACT_RADIUS = 200;
const ATTRACT_PULL = 0.0006;

interface AttractorState {
  body: Matter.Body;
  until: number;
}

const attractors: AttractorState[] = [];

export function registerAttractDrop(body: Matter.Body): void {
  attractors.push({ body, until: performance.now() + ATTRACT_DURATION_MS });
}

export function applyChargeAttractors(bodies: Matter.Body[]): void {
  const now = performance.now();
  for (let i = attractors.length - 1; i >= 0; i--) {
    if (attractors[i].until < now || attractors[i].body._merged) {
      attractors.splice(i, 1);
    }
  }
  if (!attractors.length) return;
  const r2 = ATTRACT_RADIUS * ATTRACT_RADIUS;

  for (const { body: src } of attractors) {
    if (src.tier == null) continue;
    for (const b of bodies) {
      if (b === src) continue;
      if (b.tier !== src.tier) continue;
      const dx = src.position.x - b.position.x;
      const dy = src.position.y - b.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2 || d2 < 1) continue;
      const d = Math.sqrt(d2);
      const fall = 1 - d2 / r2;
      const force = ATTRACT_PULL * b.mass * fall / d;
      Matter.Body.applyForce(b, b.position, { x: force * dx, y: force * dy });
    }
  }
}

export function resetChargeAttractors(): void {
  attractors.length = 0;
}
