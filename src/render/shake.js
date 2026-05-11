export class Shake {
  constructor() {
    this.amount = 0;
    this.decay = 60;
  }

  add(amt) {
    this.amount = Math.max(this.amount, amt);
  }

  update(dt) {
    this.amount = Math.max(0, this.amount - dt * this.decay);
  }

  offset() {
    if (this.amount <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.amount,
      y: (Math.random() - 0.5) * this.amount,
    };
  }
}
