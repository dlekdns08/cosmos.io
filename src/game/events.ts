import Matter from 'matter-js';
import { tierInfo } from '../config/tiers.js';
import { makeBody, WIDTH, HEIGHT, TOP_LINE_Y } from '../physics/world.js';
import type { Dropper } from '../physics/dropper.js';

const SUPERNOVA_RADIUS = 240;
const SUPERNOVA_BONUS = 500;
const BLACKHOLE_DURATION = 5000;
const BLACKHOLE_PULL = 0.0008;
const BLACKHOLE_ABSORB_DIST = 80;
const SCATTER_MAX_TIER = 10;

export interface SupernovaCallbacks {
  onSupernova?: (cx: number, cy: number, bonus: number, count: number) => void;
}

export interface BlackholeCallbacks {
  dropper: Dropper;
  onAbsorb?: (body: Matter.Body, x: number, y: number, tier: number) => void;
  onBlackholeEnd?: (absorbedScore: number) => void;
}

export interface BigBangCallbacks {
  onBigBang?: () => void;
}

export function runSupernova(world: Matter.World, supernovaBody: Matter.Body, callbacks: SupernovaCallbacks): void {
  const cx = supernovaBody.position.x;
  const cy = supernovaBody.position.y;
  const sr2 = SUPERNOVA_RADIUS * SUPERNOVA_RADIUS;
  const all = Matter.Composite.allBodies(world);
  const affected: Matter.Body[] = [];
  for (const b of all) {
    if (b.label !== 'cosmic') continue;
    if (b === supernovaBody) continue;
    const dx = b.position.x - cx;
    const dy = b.position.y - cy;
    if (dx * dx + dy * dy > sr2) continue;
    affected.push(b);
  }

  for (const b of affected) {
    if (b.tier == null) continue;
    const bonus = b.tier >= 7 ? 2 : 1;
    const newTier = Math.min(SCATTER_MAX_TIER, b.tier + bonus);
    const info = tierInfo(newTier);
    const nx = info.radius + 20 + Math.random() * (WIDTH - info.radius * 2 - 40);
    const ny = TOP_LINE_Y + info.radius + 40 + Math.random() * (HEIGHT - TOP_LINE_Y - info.radius * 2 - 80);
    Matter.World.remove(world, b);
    const nb = makeBody(nx, ny, info);
    Matter.Body.setVelocity(nb, {
      x: (Math.random() - 0.5) * 12,
      y: (Math.random() - 0.5) * 12,
    });
    Matter.World.add(world, nb);
  }

  callbacks.onSupernova?.(cx, cy, SUPERNOVA_BONUS, affected.length);
}

export function runBlackholePhase(world: Matter.World, blackhole: Matter.Body, callbacks: BlackholeCallbacks): void {
  if (blackhole._phaseActive) return;
  blackhole._phaseActive = true;
  callbacks.dropper.enabled = false;
  const startTime = performance.now();
  let absorbed = 0;

  function tick(): void {
    const elapsed = performance.now() - startTime;
    if (elapsed >= BLACKHOLE_DURATION || !blackhole._phaseActive) {
      if (blackhole._phaseActive) {
        Matter.World.remove(world, blackhole);
        blackhole._phaseActive = false;
      }
      callbacks.dropper.enabled = true;
      callbacks.onBlackholeEnd?.(absorbed);
      return;
    }
    const all = Matter.Composite.allBodies(world);
    for (const b of all) {
      if (b.label !== 'cosmic' || b === blackhole) continue;
      const dx = blackhole.position.x - b.position.x;
      const dy = blackhole.position.y - b.position.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2) + 1;
      const pull = BLACKHOLE_PULL * b.mass * (1 + elapsed / 1000);
      Matter.Body.applyForce(b, b.position, {
        x: (pull * dx) / d,
        y: (pull * dy) / d,
      });
      if (d < BLACKHOLE_ABSORB_DIST && b.tier != null) {
        absorbed += b.tier * 10;
        Matter.World.remove(world, b);
        callbacks.onAbsorb?.(b, blackhole.position.x, blackhole.position.y, b.tier);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function runBigBang(world: Matter.World, callbacks: BigBangCallbacks): void {
  const all = Matter.Composite.allBodies(world);
  for (const b of all) {
    if (b.label !== 'cosmic' || b.tier == null) continue;
    const info = tierInfo(b.tier);
    const nx = info.radius + 20 + Math.random() * (WIDTH - info.radius * 2 - 40);
    const ny = TOP_LINE_Y + info.radius + 80 + Math.random() * (HEIGHT - TOP_LINE_Y - info.radius * 2 - 120);
    Matter.Body.setPosition(b, { x: nx, y: ny });
    Matter.Body.setVelocity(b, {
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 16,
    });
    Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
  }
  callbacks.onBigBang?.();
}
