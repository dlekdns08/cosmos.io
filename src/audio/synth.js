export class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  merge(tier) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const baseFreq = 180 * Math.pow(1.07, tier);
    const osc = ctx.createOscillator();
    osc.type = tier >= 8 ? 'sawtooth' : tier >= 5 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t0 + 0.06);
    const gain = ctx.createGain();
    const peak = Math.min(0.22, 0.12 + tier * 0.01);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.22);
  }

  drop() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }

  boom() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const length = Math.floor(ctx.sampleRate * 0.7);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.frequency.exponentialRampToValueAtTime(120, t0 + 0.5);
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  blackhole() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t0);
    osc.frequency.exponentialRampToValueAtTime(28, t0 + 5);
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(55, t0);
    osc2.frequency.exponentialRampToValueAtTime(14, t0 + 5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.32, t0 + 0.6);
    gain.gain.setValueAtTime(0.32, t0 + 4.4);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + 5);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc2.start(t0);
    osc.stop(t0 + 5);
    osc2.stop(t0 + 5);
  }

  bigbang() {
    this.boom();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.5);
  }

  gameover() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.95);
  }
}
