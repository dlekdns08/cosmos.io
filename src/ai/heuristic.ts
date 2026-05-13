import type Matter from 'matter-js';
import { tierInfo } from '../config/tiers.js';
import { WIDTH, HEIGHT, topLineY } from '../physics/world.js';
import type { DropDecision, Policy, PolicyContext } from './policy.js';

const NUM_BUCKETS = 24;

interface Landing {
  y: number;
  supportTier: number;
}

function predictLanding(bodies: Matter.Body[], x: number, nextR: number): Landing {
  let landingY = HEIGHT - nextR - 5;
  let supportTier = -1;
  for (const b of bodies) {
    if (b.tier == null) continue;
    const br = b.circleRadius ?? 0;
    const horizDist = Math.abs(b.position.x - x);
    // Body counts as 'under' our drop if our circles would overlap horizontally
    // when the dropped body is directly above it.
    const overlap = (nextR + br) * 0.86;
    if (horizDist > overlap) continue;
    const candidateY = b.position.y - br - nextR;
    if (candidateY < landingY) {
      landingY = candidateY;
      supportTier = b.tier;
    }
  }
  return { y: landingY, supportTier };
}

function scoreCandidate(bodies: Matter.Body[], x: number, nextTier: number, nextR: number, tly: number): number {
  const { y: landingY, supportTier } = predictLanding(bodies, x, nextR);
  let score = 0;

  // Big reward for landing directly on a same-tier body (instant merge).
  if (supportTier === nextTier) {
    score += 4000 + nextTier * 400;
  } else if (supportTier > 0 && supportTier < nextTier) {
    // Slight penalty for landing on a smaller tier (wastes the bigger drop).
    score -= 50;
  }

  // Adjacent same-tier bodies near the landing point (lateral merge possibility).
  for (const b of bodies) {
    if (b.tier !== nextTier) continue;
    const horizDist = Math.abs(b.position.x - x);
    const vertDist = Math.abs(b.position.y - landingY);
    const sumR = nextR + (b.circleRadius ?? 0);
    if (horizDist < sumR * 1.6 && vertDist < sumR * 1.3) {
      score += Math.max(0, 1500 - horizDist * 4);
    }
  }

  // Hard penalty for landing too close to the top line — that's how you lose.
  const distFromTop = landingY - tly;
  if (distFromTop < nextR + 20) score -= 50000;
  else if (distFromTop < 100) score -= 8000;
  else if (distFromTop < 180) score -= 1500;
  else if (distFromTop < 260) score -= 200;

  // Slight bonus for landing deep (lower in the playfield).
  score += landingY * 0.4;

  // Mild centre bias — keeps the bot from cornering itself.
  score -= Math.abs(x - WIDTH / 2) * 0.3;

  // Light jitter to break ties so the bot doesn't get stuck dropping on the same column repeatedly.
  score += (Math.random() - 0.5) * 5;

  return score;
}

export class HeuristicPolicy implements Policy {
  readonly name = 'heuristic';

  decide(ctx: PolicyContext): DropDecision {
    const info = tierInfo(ctx.nextTier);
    const r = info.radius;
    const minX = r + 6;
    const maxX = WIDTH - r - 6;
    const tly = topLineY();

    const debug: { x: number; score: number }[] = [];
    let bestX = (minX + maxX) / 2;
    let bestScore = -Infinity;

    for (let i = 0; i < NUM_BUCKETS; i++) {
      const x = minX + (maxX - minX) * (i / (NUM_BUCKETS - 1));
      const score = scoreCandidate(ctx.bodies, x, ctx.nextTier, r, tly);
      debug.push({ x, score });
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
      }
    }

    return { x: bestX, debug };
  }
}
