import type Matter from 'matter-js';

export interface DropDecision {
  x: number;
  // For future NN / explainability: log the considered candidates + scores.
  debug?: ReadonlyArray<{ x: number; score: number }>;
}

export interface PolicyContext {
  bodies: Matter.Body[];
  nextTier: number;
  queueTier: number;
}

/** A policy is anything that can pick a drop X for the given board + next tiers. */
export interface Policy {
  readonly name: string;
  decide(ctx: PolicyContext): DropDecision;
  /** Optional learning hook: called by the trainer with the chosen X (e.g. from a teacher). */
  observe?(ctx: PolicyContext, chosenX: number): void;
}
