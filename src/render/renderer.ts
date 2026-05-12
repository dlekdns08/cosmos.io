import type Matter from 'matter-js';
import { TIERS, tierInfo, type TierInfo } from '../config/tiers.js';
import { WIDTH, HEIGHT, TOP_LINE_Y } from '../physics/world.js';
import type { Particles } from './particles.js';
import type { Shake } from './shake.js';
import type { Dropper } from '../physics/dropper.js';

interface RGB { r: number; g: number; b: number; }

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbStr({ r, g, b }: RGB, a = 1): string {
  return `rgba(${r},${g},${b},${a})`;
}

function lighten({ r, g, b }: RGB, amt: number): RGB {
  return {
    r: Math.min(255, r + Math.floor(255 * amt)),
    g: Math.min(255, g + Math.floor(255 * amt)),
    b: Math.min(255, b + Math.floor(255 * amt)),
  };
}

interface TierColors { color: RGB; accent: RGB; }

const TIER_RGB: (TierColors | null)[] = TIERS.map((t) =>
  t ? { color: hexToRgb(t.color), accent: hexToRgb(t.accent) } : null,
);

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twSpeed: number;
  twPhase: number;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  t: number;
  starfield: Star[];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.canvas = canvas;
    this.ctx = ctx;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.t = 0;
    this.starfield = [];
    this._initStars();
  }

  private _initStars(): void {
    for (let i = 0; i < 110; i++) {
      this.starfield.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        r: Math.random() * 1.3 + 0.2,
        baseAlpha: Math.random() * 0.55 + 0.15,
        twSpeed: Math.random() * 3 + 1,
        twPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  draw(bodies: Matter.Body[], particles: Particles, shake: Shake, dropper: Dropper, blackholeActive: boolean): void {
    const c = this.ctx;
    this.t += 1 / 60;

    c.save();
    const off = shake.offset();
    c.translate(off.x, off.y);

    const bg = c.createRadialGradient(WIDTH / 2, HEIGHT * 0.35, 0, WIDTH / 2, HEIGHT * 0.35, HEIGHT);
    bg.addColorStop(0, '#0d1234');
    bg.addColorStop(1, '#03040e');
    c.fillStyle = bg;
    c.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    this._drawStars(c);

    c.strokeStyle = 'rgba(255,120,140,0.35)';
    c.lineWidth = 1;
    c.setLineDash([6, 6]);
    c.beginPath();
    c.moveTo(0, TOP_LINE_Y);
    c.lineTo(WIDTH, TOP_LINE_Y);
    c.stroke();
    c.setLineDash([]);

    if (dropper.enabled && !blackholeActive) {
      const info = tierInfo(dropper.nextTier);
      c.strokeStyle = 'rgba(127,77,255,0.18)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(dropper.x, TOP_LINE_Y);
      c.lineTo(dropper.x, HEIGHT - 4);
      c.stroke();
      this._drawPreviewBody(c, dropper.x, TOP_LINE_Y - info.radius - 6, info);
    }

    const sorted = bodies.slice().sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
    for (const b of sorted) this._drawBody(c, b);

    particles.draw(c);

    c.restore();
  }

  private _drawStars(c: CanvasRenderingContext2D): void {
    for (const s of this.starfield) {
      const a = s.baseAlpha + Math.sin(this.t * s.twSpeed + s.twPhase) * 0.2;
      c.fillStyle = `rgba(255,255,255,${Math.max(0, a)})`;
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fill();
    }
  }

  private _drawPreviewBody(c: CanvasRenderingContext2D, x: number, y: number, info: TierInfo): void {
    const colors = TIER_RGB[info.tier];
    if (!colors) return;
    c.save();
    c.globalAlpha = 0.7;
    const r = info.radius;
    const grad = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, rgbStr(lighten(colors.color, 0.35)));
    grad.addColorStop(0.6, rgbStr(colors.color));
    grad.addColorStop(1, rgbStr(colors.accent));
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.fillStyle = 'rgba(127,77,255,0.6)';
    c.beginPath();
    c.moveTo(x - 6, y - r - 14);
    c.lineTo(x + 6, y - r - 14);
    c.lineTo(x, y - r - 6);
    c.closePath();
    c.fill();
  }

  private _drawBody(c: CanvasRenderingContext2D, body: Matter.Body): void {
    if (body.tier == null) return;
    const info = TIERS[body.tier];
    const colors = TIER_RGB[body.tier];
    if (!info || !colors) return;
    const x = body.position.x;
    const y = body.position.y;
    let r = info.radius;

    if (info.pulse) r = r * (1 + Math.sin(this.t * 3.6) * 0.05);
    if (info.supernova) r = r * (1 + Math.sin(this.t * 8) * 0.06);

    if (info.blackhole) {
      this._drawBlackhole(c, x, y, r);
      return;
    }

    if (info.glow > 0) {
      const glowR = r * (1.8 + info.glow * 0.6);
      const glow = c.createRadialGradient(x, y, r * 0.6, x, y, glowR);
      glow.addColorStop(0, rgbStr(colors.color, Math.min(0.5, info.glow * 0.3)));
      glow.addColorStop(0.5, rgbStr(colors.color, Math.min(0.25, info.glow * 0.15)));
      glow.addColorStop(1, rgbStr(colors.color, 0));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = glow;
      c.beginPath();
      c.arc(x, y, glowR, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    if (info.rings) {
      c.save();
      c.translate(x, y);
      c.rotate(body.angle + 0.35);
      c.scale(1, 0.28);
      c.strokeStyle = 'rgba(255,225,170,0.8)';
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, 0, r * 1.5, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = 'rgba(255,225,170,0.35)';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, r * 1.85, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    const grad = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
    grad.addColorStop(0, rgbStr(lighten(colors.color, 0.4)));
    grad.addColorStop(0.55, rgbStr(colors.color));
    grad.addColorStop(1, rgbStr(colors.accent));
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    if (info.supernova) {
      const flickerR = r * (1.0 + 0.15 * Math.sin(this.t * 14));
      c.save();
      c.globalCompositeOperation = 'lighter';
      const fg = c.createRadialGradient(x, y, 0, x, y, flickerR);
      fg.addColorStop(0, 'rgba(255,255,255,0.6)');
      fg.addColorStop(0.6, 'rgba(255,220,90,0.3)');
      fg.addColorStop(1, 'rgba(255,180,40,0)');
      c.fillStyle = fg;
      c.beginPath();
      c.arc(x, y, flickerR, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    if (info.tier === 8) {
      c.save();
      c.translate(x, y);
      c.rotate(this.t * 0.6);
      c.globalCompositeOperation = 'lighter';
      const spikeGrad = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
      spikeGrad.addColorStop(0, 'rgba(255,230,140,0.9)');
      spikeGrad.addColorStop(1, 'rgba(255,160,40,0)');
      c.fillStyle = spikeGrad;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(-r * 1.6, 0);
        c.lineTo(0, -r * 0.18);
        c.lineTo(r * 1.6, 0);
        c.lineTo(0, r * 0.18);
        c.closePath();
        c.fill();
        c.rotate(Math.PI / 4);
      }
      c.restore();
    }
  }

  private _drawBlackhole(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const disk = c.createRadialGradient(x, y, r * 0.9, x, y, r * 3.0);
    disk.addColorStop(0, 'rgba(127,77,255,0.0)');
    disk.addColorStop(0.4, 'rgba(127,77,255,0.55)');
    disk.addColorStop(0.7, 'rgba(255,77,170,0.3)');
    disk.addColorStop(1, 'rgba(127,77,255,0)');
    c.fillStyle = disk;
    c.beginPath();
    c.arc(x, y, r * 3.0, 0, Math.PI * 2);
    c.fill();

    c.translate(x, y);
    c.rotate(this.t * 1.5);
    c.scale(1, 0.4);
    c.strokeStyle = 'rgba(255,220,255,0.7)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    const eh = c.createRadialGradient(x, y, 0, x, y, r);
    eh.addColorStop(0, '#000');
    eh.addColorStop(0.85, '#000');
    eh.addColorStop(1, 'rgba(0,0,0,0.4)');
    c.fillStyle = eh;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }

  drawNextPreview(canvas: HTMLCanvasElement, tier: number): void {
    const c = canvas.getContext('2d');
    if (!c) return;
    const w = (canvas.width = 56);
    const h = (canvas.height = 56);
    c.clearRect(0, 0, w, h);
    const info = TIERS[tier];
    const colors = TIER_RGB[tier];
    if (!info || !colors) return;
    const r = Math.min(w, h) * 0.36;
    const cx = w / 2;
    const cy = h / 2;

    if (info.glow > 0) {
      const glow = c.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8);
      glow.addColorStop(0, rgbStr(colors.color, 0.3));
      glow.addColorStop(1, rgbStr(colors.color, 0));
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
    }

    const grad = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, rgbStr(lighten(colors.color, 0.35)));
    grad.addColorStop(0.55, rgbStr(colors.color));
    grad.addColorStop(1, rgbStr(colors.accent));
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  }
}
