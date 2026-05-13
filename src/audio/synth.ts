type AudioContextCtor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextCtor;
  }
}

const BGM_CHORDS: number[][] = [
  [130.81, 196.00, 261.63], // C major (C3 G3 C4)
  [110.00, 164.81, 220.00], // A minor (A2 E3 A3)
  [174.61, 220.00, 349.23], // F major (F3 A3 F4)
  [196.00, 246.94, 392.00], // G major (G3 B3 G4)
];
const BGM_CHORD_DUR = 4.5;
const BGM_STEP_MS = 4000;

export class Synth {
  ctx: AudioContext | null;
  master: GainNode | null;
  bgmGain: GainNode | null;
  private bgmActive = false;
  private bgmStep = 0;
  private bgmTimer: number | null = null;

  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgmGain = null;
  }

  ensure(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const AC: AudioContextCtor = window.AudioContext ?? (window.webkitAudioContext as AudioContextCtor);
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.0;
    this.bgmGain.connect(this.master);
    return this.ctx;
  }

  setMasterVolume(v: number): void {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  bgmStart(): void {
    this.ensure();
    if (!this.ctx || !this.bgmGain) return;
    if (this.bgmActive) return;
    this.bgmActive = true;
    const t = this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(t);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
    this.bgmGain.gain.linearRampToValueAtTime(0.18, t + 1.2);
    this._scheduleBgmChord();
  }

  bgmStop(): void {
    if (!this.ctx || !this.bgmGain) {
      this.bgmActive = false;
      return;
    }
    this.bgmActive = false;
    const t = this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(t);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
    this.bgmGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    if (this.bgmTimer != null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  bgmIsActive(): boolean { return this.bgmActive; }

  private _scheduleBgmChord(): void {
    if (!this.bgmActive || !this.ctx || !this.bgmGain) return;
    const ctx = this.ctx;
    const chord = BGM_CHORDS[this.bgmStep % BGM_CHORDS.length];
    this.bgmStep += 1;
    const t0 = ctx.currentTime;
    const dur = BGM_CHORD_DUR;
    const fadeIn = 0.9;
    const fadeOut = 1.4;
    const sustainPeak = 0.045;

    for (const freq of chord) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(sustainPeak, t0 + fadeIn);
      g.gain.setValueAtTime(sustainPeak, t0 + dur - fadeOut);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.bgmGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.1);
    }
    // Add a soft fifth above as a sparkle
    const sparkle = ctx.createOscillator();
    sparkle.type = 'triangle';
    sparkle.frequency.value = chord[chord.length - 1] * 1.5;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.exponentialRampToValueAtTime(0.012, t0 + fadeIn * 1.3);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    sparkle.connect(sg).connect(this.bgmGain);
    sparkle.start(t0);
    sparkle.stop(t0 + dur + 0.1);

    this.bgmTimer = window.setTimeout(() => this._scheduleBgmChord(), BGM_STEP_MS);
  }

  merge(tier: number, combo = 1): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    // Combo modulates pitch (higher combo = brighter), capped to keep within musical range.
    const comboPitch = Math.min(1.5, 1 + (combo - 1) * 0.18);
    const baseFreq = 180 * Math.pow(1.07, tier) * comboPitch;
    const osc = ctx.createOscillator();
    osc.type = tier >= 8 ? 'sawtooth' : tier >= 5 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t0 + 0.06);
    const gain = ctx.createGain();
    const peak = Math.min(0.24, 0.12 + tier * 0.012);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.24);

    // Combo sparkle: extra short overtone on combo >= 2
    if (combo >= 2) {
      const spark = ctx.createOscillator();
      spark.type = 'sine';
      spark.frequency.value = baseFreq * 2 + combo * 100;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, t0);
      sg.gain.exponentialRampToValueAtTime(0.06, t0 + 0.005);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      spark.connect(sg).connect(this.master);
      spark.start(t0);
      spark.stop(t0 + 0.14);
    }
  }

  drop(): void {
    if (!this.ctx || !this.master) return;
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

  boom(): void {
    if (!this.ctx || !this.master) return;
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

  blackhole(): void {
    if (!this.ctx || !this.master) return;
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

  bigbang(): void {
    this.boom();
    if (!this.ctx || !this.master) return;
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

  chargeReady(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const notes = [880, 1175, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0 + i * 0.06);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.13, t0 + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.06 + 0.4);
      osc.connect(gain).connect(this.master!);
      osc.start(t0 + i * 0.06);
      osc.stop(t0 + i * 0.06 + 0.45);
    });
  }

  chargeUse(kind: 'charged' | 'slow' | 'attract'): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const dur = 0.35;
    if (kind === 'charged') {
      osc.frequency.setValueAtTime(440, t0);
      osc.frequency.exponentialRampToValueAtTime(1760, t0 + dur);
    } else if (kind === 'slow') {
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(220, t0 + dur);
    } else {
      osc.frequency.setValueAtTime(660, t0);
      osc.frequency.exponentialRampToValueAtTime(1320, t0 + dur);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  slingshot(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t0);
    osc.frequency.exponentialRampToValueAtTime(400, t0 + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.22);
  }

  gameover(): void {
    if (!this.ctx || !this.master) return;
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
