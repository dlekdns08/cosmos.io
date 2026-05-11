import Matter from 'matter-js';
import { TIERS, MAX_TIER } from '../config/tiers.js';
import { makeBody } from '../physics/world.js';

export function setupMerge(engine, world, callbacks) {
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (a.label !== 'cosmic' || b.label !== 'cosmic') continue;
      if (a.tier !== b.tier) continue;
      if (a.tier >= MAX_TIER) continue;
      if (a._merged || b._merged) continue;
      a._merged = true;
      b._merged = true;

      const newTier = a.tier + 1;
      const info = TIERS[newTier];
      const mx = (a.position.x + b.position.x) / 2;
      const my = (a.position.y + b.position.y) / 2;
      const vx = (a.velocity.x + b.velocity.x) / 2;
      const vy = (a.velocity.y + b.velocity.y) / 2;

      Matter.World.remove(world, a);
      Matter.World.remove(world, b);

      const next = makeBody(mx, my, info);
      Matter.Body.setVelocity(next, { x: vx, y: vy });
      Matter.World.add(world, next);

      callbacks.onMerge?.(next, mx, my, newTier);
    }
  });
}
