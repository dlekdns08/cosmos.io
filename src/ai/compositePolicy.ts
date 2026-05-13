import { HeuristicPolicy } from './heuristic.js';
import { NeuralPolicy } from './neuralPolicy.js';
import type { DropDecision, Policy, PolicyContext } from './policy.js';

export type CompositeMode = 'heuristic' | 'training' | 'neural';

export const MODE_LABEL: Record<CompositeMode, string> = {
  heuristic: '휴리스틱',
  training: '학습 중',
  neural: 'NN',
};

/**
 * Pluggable policy that runs heuristic + behavior cloning on a neural net.
 * - 'heuristic': just the rule-based bot. No training.
 * - 'training': heuristic decides, NN observes and trains to imitate.
 * - 'neural': NN decides alone.
 */
export class CompositePolicy implements Policy {
  readonly name = 'composite';
  heuristic: HeuristicPolicy;
  neural: NeuralPolicy;
  mode: CompositeMode;
  lastLoss = 0;
  private _emaLoss = 0;
  private _emaInit = false;

  constructor(initialMode: CompositeMode = 'training') {
    this.heuristic = new HeuristicPolicy();
    this.neural = new NeuralPolicy();
    this.mode = initialMode;
  }

  setMode(m: CompositeMode): void {
    this.mode = m;
  }

  decide(ctx: PolicyContext): DropDecision {
    if (this.mode === 'neural') {
      return this.neural.decide(ctx);
    }
    const dec = this.heuristic.decide(ctx);
    if (this.mode === 'training') {
      const loss = this.neural.trainOn(ctx, dec.x);
      this.lastLoss = loss;
      if (!this._emaInit) { this._emaLoss = loss; this._emaInit = true; }
      else this._emaLoss = this._emaLoss * 0.95 + loss * 0.05;
    }
    return dec;
  }

  save(): void { this.neural.save(); }
  resetNN(): void { this.neural.reset(); this._emaLoss = 0; this._emaInit = false; }

  get samples(): number { return this.neural.steps; }
  get emaLoss(): number { return this._emaLoss; }
}
