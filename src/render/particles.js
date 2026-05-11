export class Particles {
  constructor() {
    this.list = [];
  }

  emit(x, y, count, color, opts = {}) {
    const speed = opts.speed ?? 4;
    const gravity = opts.gravity ?? 0.18;
    const life = opts.life ?? 1.0;
    const size = opts.size ?? 2;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed + 0.5;
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.5),
        maxLife: life,
        color,
        size: size * (0.6 + Math.random() * 0.8),
        gravity,
      });
    }
  }

  ring(x, y, count, color, radius, opts = {}) {
    const speed = opts.speed ?? 5;
    const life = opts.life ?? 1.2;
    const size = opts.size ?? 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      this.list.push({
        x: x + Math.cos(a) * radius,
        y: y + Math.sin(a) * radius,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: life * (0.6 + Math.random() * 0.5),
        maxLife: life,
        color,
        size: size * (0.7 + Math.random() * 0.6),
        gravity: 0,
      });
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  reset() {
    this.list.length = 0;
  }
}
