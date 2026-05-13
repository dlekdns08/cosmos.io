import Matter from 'matter-js';
import { MAX_TIER, tierInfo } from '../config/tiers.js';
import { makeBody, topLineY, HEIGHT, WIDTH } from '../physics/world.js';

export interface MergeInfo {
  body: Matter.Body;
  x: number;
  y: number;
  newTier: number;
  parents: [Matter.Body, Matter.Body];
}

export interface MergeCallbacks {
  onMerge?: (info: MergeInfo) => void;
}

export function setupMerge(engine: Matter.Engine, world: Matter.World, callbacks: MergeCallbacks): void {
  Matter.Events.on(engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (a.label !== 'cosmic' || b.label !== 'cosmic') continue;
      if (a.tier == null || b.tier == null) continue;
      if (a.tier !== b.tier) continue;
      if (a.tier >= MAX_TIER) continue;
      if (a._merged || b._merged) continue;
      a._merged = true;
      b._merged = true;

      const newTier = a.tier + 1;
      const info = tierInfo(newTier);
      const mx = (a.position.x + b.position.x) / 2;
      const my = (a.position.y + b.position.y) / 2;
      let vx = (a.velocity.x + b.velocity.x) / 2;
      let vy = (a.velocity.y + b.velocity.y) / 2;
      // Clamp inherited velocity so heavy merged bodies (esp. tier 8+) can't shoot off
      // from accumulated collision impulses around the moment of merge.
      const MAX_INHERIT = 4;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_INHERIT) {
        const k = MAX_INHERIT / speed;
        vx *= k;
        vy *= k;
      }

      Matter.World.remove(world, a);
      Matter.World.remove(world, b);

      const next = makeBody(mx, my, info);

      // Tier 8+ are huge and heavy enough that small bodies can shove them around;
      // anchor them on creation — zero velocity and clamp position fully inside the playfield.
      if (newTier >= 8) {
        Matter.Body.setVelocity(next, { x: 0, y: 0 });
        const minY = topLineY() + info.radius + 30;
        const maxY = HEIGHT - info.radius - 5;
        const minX = info.radius + 5;
        const maxX = WIDTH - info.radius - 5;
        const clampX = (x: number) => Math.max(minX, Math.min(maxX, x));
        const clampY = (y: number) => Math.max(minY, Math.min(maxY, y));
        Matter.Body.setPosition(next, { x: clampX(next.position.x), y: clampY(next.position.y) });

        // Push the new heavy body away from any existing tier 8+ to prevent spawn-overlap.
        // Iterate a few times so it slides past multiple stars if needed.
        const all = Matter.Composite.allBodies(world);
        for (let iter = 0; iter < 6; iter++) {
          let moved = false;
          for (const other of all) {
            if (other === next || other.label !== 'cosmic') continue;
            if (other.tier == null || other.tier < 8) continue;
            const dx = next.position.x - other.position.x;
            const dy = next.position.y - other.position.y;
            const d2 = dx * dx + dy * dy;
            const minD = info.radius + (other.circleRadius ?? 0) + 1;
            if (d2 >= minD * minD || d2 < 0.001) continue;
            const d = Math.sqrt(d2);
            const push = minD - d;
            let ux = dx / d;
            let uy = dy / d;
            // Mostly vertical overlap → prefer horizontal push (anchor blocks vertical).
            if (Math.abs(ux) < 0.25) {
              const leftRoom = next.position.x;
              const rightRoom = WIDTH - next.position.x;
              ux = leftRoom > rightRoom ? -1 : 1;
              uy = 0;
            }
            const nx2 = clampX(next.position.x + ux * push);
            const ny2 = clampY(next.position.y + uy * push);
            Matter.Body.setPosition(next, { x: nx2, y: ny2 });
            moved = true;
          }
          if (!moved) break;
        }
      } else {
        Matter.Body.setVelocity(next, { x: vx, y: vy });
      }

      Matter.World.add(world, next);

      callbacks.onMerge?.({ body: next, x: mx, y: my, newTier, parents: [a, b] });
    }
  });
}
