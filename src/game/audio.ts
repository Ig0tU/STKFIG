export class DoodleAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.55;
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  private noise(duration: number, color = 0.4) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const n = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = last * color + w * (1 - color);
      d[i] = last;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  scribble(pan = 0) {
    if (!this.ctx || !this.sfx) return;
    const src = this.noise(0.09, 0.85);
    if (!src) return;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 900;
    bp.Q.value = 1.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    src.connect(bp);
    bp.connect(g);
    g.connect(p);
    p.connect(this.sfx);
    src.start();
  }

  snap(heavy = false) {
    if (!this.ctx || !this.sfx) return;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(heavy ? 140 : 280, t);
    o.frequency.exponentialRampToValueAtTime(40, t + (heavy ? 0.22 : 0.12));
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(heavy ? 0.5 : 0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (heavy ? 0.24 : 0.13));
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(t + 0.26);
    const n = this.noise(heavy ? 0.18 : 0.08, 0.2);
    if (n) {
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(heavy ? 0.35 : 0.16, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      n.connect(ng);
      ng.connect(this.sfx);
      n.start();
    }
  }

  whoosh() {
    if (!this.ctx || !this.sfx) return;
    const src = this.noise(0.16, 0.7);
    if (!src) return;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    const t = this.ctx.currentTime;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  block() {
    if (!this.ctx || !this.sfx) return;
    const o = this.ctx.createOscillator();
    o.type = "square";
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(t + 0.1);
  }

  ko() {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.6);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.62);
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(t + 0.65);
  }

  exBlast() {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(t + 0.4);
  }

  grab() {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(t + 0.2);
  }
}
