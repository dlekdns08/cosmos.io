import { tierInfo } from '../config/tiers.js';
import { WIDTH } from '../physics/world.js';
import { MLP } from './neural.js';
import { extractFeatures, FEATURE_DIM } from './features.js';
import type { DropDecision, Policy, PolicyContext } from './policy.js';

const HIDDEN_1 = 64;
const HIDDEN_2 = 32;
export const NUM_BUCKETS = 24;
const MODEL_KEY = 'cosmos.ai.weights';

function bucketToX(bucket: number, nextTier: number): number {
  const r = tierInfo(nextTier).radius;
  const minX = r + 6;
  const maxX = WIDTH - r - 6;
  return minX + (maxX - minX) * (bucket / (NUM_BUCKETS - 1));
}

function xToBucket(x: number, nextTier: number): number {
  const r = tierInfo(nextTier).radius;
  const minX = r + 6;
  const maxX = WIDTH - r - 6;
  const norm = (x - minX) / Math.max(1, maxX - minX);
  return Math.max(0, Math.min(NUM_BUCKETS - 1, Math.round(norm * (NUM_BUCKETS - 1))));
}

export class NeuralPolicy implements Policy {
  readonly name = 'neural';
  mlp: MLP;

  constructor() {
    const saved = localStorage.getItem(MODEL_KEY);
    this.mlp = (saved && MLP.deserialize(saved, FEATURE_DIM, NUM_BUCKETS)) ||
               new MLP(FEATURE_DIM, HIDDEN_1, HIDDEN_2, NUM_BUCKETS);
  }

  decide(ctx: PolicyContext): DropDecision {
    const f = extractFeatures(ctx.bodies, ctx.nextTier, ctx.queueTier, 0);
    const probs = this.mlp.predict(f);
    let bestBucket = 0;
    let best = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > best) { best = probs[i]; bestBucket = i; }
    }
    return { x: bucketToX(bestBucket, ctx.nextTier) };
  }

  /** Behaviour-cloning step: train the MLP to predict `targetX` for this context. */
  trainOn(ctx: PolicyContext, targetX: number): number {
    const f = extractFeatures(ctx.bodies, ctx.nextTier, ctx.queueTier, 0);
    const target = xToBucket(targetX, ctx.nextTier);
    return this.mlp.trainStep(f, target);
  }

  save(): void {
    try {
      localStorage.setItem(MODEL_KEY, this.mlp.serialize());
    } catch {
      // localStorage quota: silently ignore
    }
  }

  reset(): void {
    this.mlp = new MLP(FEATURE_DIM, HIDDEN_1, HIDDEN_2, NUM_BUCKETS);
    try { localStorage.removeItem(MODEL_KEY); } catch { /* ignore */ }
  }

  get steps(): number { return this.mlp.t; }
}
