import Matter from 'matter-js';
import type { TierInfo } from '../config/tiers.js';

export const WIDTH = 480;
export const HEIGHT = 720;
export const WALL_THICKNESS = 60;
export const TOP_LINE_Y = 130;

export interface WorldHandle {
  engine: Matter.Engine;
  world: Matter.World;
}

export function setupWorld(): WorldHandle {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1.0, scale: 0.0015 },
    enableSleeping: false,
  });
  const world = engine.world;

  const opts: Matter.IBodyDefinition = {
    isStatic: true,
    friction: 0.2,
    restitution: 0.05,
    label: 'wall',
  };
  const walls = [
    Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + WALL_THICKNESS / 2, WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, opts),
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT * 2, opts),
    Matter.Bodies.rectangle(WIDTH + WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT * 2, opts),
  ];
  Matter.World.add(world, walls);

  return { engine, world };
}

export function makeBody(x: number, y: number, tierInfo: TierInfo): Matter.Body {
  const body = Matter.Bodies.circle(x, y, tierInfo.radius, {
    restitution: 0.18,
    friction: 0.04,
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
