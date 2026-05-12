import Matter from 'matter-js';
import { MAX_TIER, tierInfo } from '../config/tiers.js';
import { makeBody } from '../physics/world.js';

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
      Matter.Body.setVelocity(next, { x: vx, y: vy });
      Matter.World.add(world, next);

      callbacks.onMerge?.({ body: next, x: mx, y: my, newTier, parents: [a, b] });
    }
  });
}
