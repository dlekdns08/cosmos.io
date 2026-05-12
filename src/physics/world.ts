import Matter from 'matter-js';
import type { TierInfo } from '../config/tiers.js';
import { getDifficulty } from '../game/runtime.js';

export const WIDTH = 480;
export const HEIGHT = 720;
export const WALL_THICKNESS = 60;

export function topLineY(): number {
  return getDifficulty().topLineY;
}

export interface WorldHandle {
  engine: Matter.Engine;
  world: Matter.World;
}

export function setupWorld(): WorldHandle {
  const d = getDifficulty();
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1.0, scale: d.worldGravityScale },
    enableSleeping: false,
  });
  const world = engine.world;

  const opts: Matter.IBodyDefinition = {
    isStatic: true,
    friction: 0.2,
    restitution: 0.05,
    label: 'wall',
  };
  // Ceiling sits far above viewport so drops still spawn above TOP_LINE_Y unobstructed,
  // but anything launched upward (e.g. via the star's gravity well) can't escape the world.
  const CEILING_Y = -200;
  const walls = [
    Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + WALL_THICKNESS / 2, WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, opts),
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT * 2, opts),
    Matter.Bodies.rectangle(WIDTH + WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT * 2, opts),
    Matter.Bodies.rectangle(WIDTH / 2, CEILING_Y - WALL_THICKNESS / 2, WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, opts),
  ];
  Matter.World.add(world, walls);

  return { engine, world };
}

export function applyEngineDifficulty(engine: Matter.Engine): void {
  engine.gravity.scale = getDifficulty().worldGravityScale;
}

export function makeBody(x: number, y: number, tierInfo: TierInfo): Matter.Body {
  const d = getDifficulty();
  const restitution = tierInfo.tier === 6 ? Math.min(0.1, d.restitution * 0.4) : d.restitution;
  const body = Matter.Bodies.circle(x, y, tierInfo.radius, {
    restitution,
    friction: tierInfo.tier === 6 ? 0.08 : 0.04,
    frictionAir: 0.0015,
    density: tierInfo.density,
    label: 'cosmic',
    slop: 0.02,
  });
  body.tier = tierInfo.tier;
  body._spawnT = performance.now();
  return body;
}

export function clearCosmic(world: Matter.World): void {
  const all = Matter.Composite.allBodies(world);
  for (const b of all) {
    if (b.label === 'cosmic') Matter.World.remove(world, b);
  }
}
