// Minimal pure-TS MLP with Adam.
// Architecture: input → hidden1 (ReLU) → hidden2 (ReLU) → logits → softmax.
// Trained one sample at a time via cross-entropy with a target class index.

const BETA1 = 0.9;
const BETA2 = 0.999;
const EPS = 1e-8;

function gaussian(): number {
  const u = Math.max(1e-9, Math.random());
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function heInit(size: number, fanIn: number): Float32Array {
  const arr = new Float32Array(size);
  const sigma = Math.sqrt(2 / Math.max(1, fanIn));
  for (let i = 0; i < size; i++) arr[i] = gaussian() * sigma;
  return arr;
}

function linear(W: Float32Array, b: Float32Array, x: Float32Array, rows: number, cols: number): Float32Array {
  const out = new Float32Array(rows);
  for (let i = 0; i < rows; i++) {
    let sum = b[i];
    const off = i * cols;
    for (let j = 0; j < cols; j++) sum += W[off + j] * x[j];
    out[i] = sum;
  }
  return out;
}

function reluInPlace(v: Float32Array): void {
  for (let i = 0; i < v.length; i++) if (v[i] < 0) v[i] = 0;
}

export function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  const out = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp(logits[i] - max);
    sum += out[i];
  }
  const inv = 1 / sum;
  for (let i = 0; i < logits.length; i++) out[i] *= inv;
  return out;
}

export class MLP {
  din: number; h1: number; h2: number; dout: number;

  W1: Float32Array; b1: Float32Array;
  W2: Float32Array; b2: Float32Array;
  W3: Float32Array; b3: Float32Array;

  // Adam moments
  mW1: Float32Array; vW1: Float32Array; mb1: Float32Array; vb1: Float32Array;
  mW2: Float32Array; vW2: Float32Array; mb2: Float32Array; vb2: Float32Array;
  mW3: Float32Array; vW3: Float32Array; mb3: Float32Array; vb3: Float32Array;

  t = 0;

  constructor(din: number, h1: number, h2: number, dout: number) {
    this.din = din; this.h1 = h1; this.h2 = h2; this.dout = dout;
    this.W1 = heInit(h1 * din, din);  this.b1 = new Float32Array(h1);
    this.W2 = heInit(h2 * h1, h1);    this.b2 = new Float32Array(h2);
    this.W3 = heInit(dout * h2, h2);  this.b3 = new Float32Array(dout);
    this.mW1 = new Float32Array(this.W1.length);  this.vW1 = new Float32Array(this.W1.length);
    this.mb1 = new Float32Array(h1);              this.vb1 = new Float32Array(h1);
    this.mW2 = new Float32Array(this.W2.length);  this.vW2 = new Float32Array(this.W2.length);
    this.mb2 = new Float32Array(h2);              this.vb2 = new Float32Array(h2);
    this.mW3 = new Float32Array(this.W3.length);  this.vW3 = new Float32Array(this.W3.length);
    this.mb3 = new Float32Array(dout);            this.vb3 = new Float32Array(dout);
  }

  forward(x: Float32Array): { a1: Float32Array; a2: Float32Array; logits: Float32Array } {
    const z1 = linear(this.W1, this.b1, x, this.h1, this.din);
    reluInPlace(z1);
    const z2 = linear(this.W2, this.b2, z1, this.h2, this.h1);
    reluInPlace(z2);
    const logits = linear(this.W3, this.b3, z2, this.dout, this.h2);
    return { a1: z1, a2: z2, logits };
  }

  predict(x: Float32Array): Float32Array {
    return softmax(this.forward(x).logits);
  }

  trainStep(x: Float32Array, target: number, lr = 0.01): number {
    const { a1, a2, logits } = this.forward(x);
    const probs = softmax(logits);
    const loss = -Math.log(Math.max(1e-9, probs[target]));

    this.t += 1;
    const bc1 = 1 - Math.pow(BETA1, this.t);
    const bc2 = 1 - Math.pow(BETA2, this.t);

    // d_logits = probs - one_hot(target)
    const dz3 = probs;
    dz3[target] -= 1;

    const da2 = this.dense_backward(this.W3, this.b3, this.mW3, this.vW3, this.mb3, this.vb3,
      dz3, a2, this.dout, this.h2, lr, bc1, bc2);
    for (let i = 0; i < a2.length; i++) if (a2[i] <= 0) da2[i] = 0;

    const da1 = this.dense_backward(this.W2, this.b2, this.mW2, this.vW2, this.mb2, this.vb2,
      da2, a1, this.h2, this.h1, lr, bc1, bc2);
    for (let i = 0; i < a1.length; i++) if (a1[i] <= 0) da1[i] = 0;

    this.dense_backward(this.W1, this.b1, this.mW1, this.vW1, this.mb1, this.vb1,
      da1, x, this.h1, this.din, lr, bc1, bc2);

    return loss;
  }

  // Backprop through a dense layer + Adam update in place. Returns dInput.
  private dense_backward(
    W: Float32Array, b: Float32Array,
    mW: Float32Array, vW: Float32Array, mb: Float32Array, vb: Float32Array,
    dOut: Float32Array, input: Float32Array,
    rows: number, cols: number,
    lr: number, bc1: number, bc2: number,
  ): Float32Array {
    // Compute dInput first (using current weights).
    const dIn = new Float32Array(cols);
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let i = 0; i < rows; i++) sum += W[i * cols + j] * dOut[i];
      dIn[j] = sum;
    }
    // Then Adam-update W and b.
    for (let i = 0; i < rows; i++) {
      const dz = dOut[i];
      const newMb = BETA1 * mb[i] + (1 - BETA1) * dz;
      const newVb = BETA2 * vb[i] + (1 - BETA2) * dz * dz;
      mb[i] = newMb; vb[i] = newVb;
      b[i] -= lr * (newMb / bc1) / (Math.sqrt(newVb / bc2) + EPS);

      const off = i * cols;
      for (let j = 0; j < cols; j++) {
        const idx = off + j;
        const g = dz * input[j];
        const newMw = BETA1 * mW[idx] + (1 - BETA1) * g;
        const newVw = BETA2 * vW[idx] + (1 - BETA2) * g * g;
        mW[idx] = newMw; vW[idx] = newVw;
        W[idx] -= lr * (newMw / bc1) / (Math.sqrt(newVw / bc2) + EPS);
      }
    }
    return dIn;
  }

  serialize(): string {
    const parts = [
      this.W1, this.b1, this.W2, this.b2, this.W3, this.b3,
      this.mW1, this.vW1, this.mb1, this.vb1,
      this.mW2, this.vW2, this.mb2, this.vb2,
      this.mW3, this.vW3, this.mb3, this.vb3,
    ];
    let total = 0;
    for (const p of parts) total += p.length;
    const combined = new Float32Array(total);
    let off = 0;
    for (const p of parts) { combined.set(p, off); off += p.length; }

    const bytes = new Uint8Array(combined.buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))));
    }
    return JSON.stringify({
      v: 1,
      din: this.din, h1: this.h1, h2: this.h2, dout: this.dout,
      t: this.t,
      w: btoa(binary),
    });
  }

  static deserialize(json: string, expectedDin: number, expectedDout: number): MLP | null {
    try {
      const data = JSON.parse(json) as {
        v?: number; din: number; h1: number; h2: number; dout: number; t: number; w: string;
      };
      if (data.v !== 1) return null;
      if (data.din !== expectedDin || data.dout !== expectedDout) return null;
      const m = new MLP(data.din, data.h1, data.h2, data.dout);
      m.t = data.t | 0;
      const binary = atob(data.w);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const combined = new Float32Array(bytes.buffer);

      const parts: Float32Array[] = [
        m.W1, m.b1, m.W2, m.b2, m.W3, m.b3,
        m.mW1, m.vW1, m.mb1, m.vb1,
        m.mW2, m.vW2, m.mb2, m.vb2,
        m.mW3, m.vW3, m.mb3, m.vb3,
      ];
      let off = 0;
      for (const p of parts) {
        if (off + p.length > combined.length) return null;
        p.set(combined.subarray(off, off + p.length));
        off += p.length;
      }
      return m;
    } catch {
      return null;
    }
  }
}
