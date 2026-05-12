interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class Popups {
  list: Popup[] = [];

  emit(text: string, x: number, y: number, opts: { size?: number; color?: string; life?: number } = {}): void {
    this.list.push({
      text,
      x,
      y,
      life: opts.life ?? 1.0,
      maxLife: opts.life ?? 1.0,
      size: opts.size ?? 18,
      color: opts.color ?? '#ffffff',
    });
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.y -= 30 * dt;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      const scale = t > 0.7 ? 1 + (t - 0.7) * 6 : 1.0 * t + 0.3;
      const alpha = Math.min(1, t * 2);
      const fontSize = p.size * scale;
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${fontSize}px -apple-system, "Pretendard", sans-serif`;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }

  reset(): void {
    this.list.length = 0;
  }
}
