"use client";

/**
 * Synthesised interface sound. No audio files: every sound is built from
 * oscillators and filtered noise at runtime. Off until the visitor opts in.
 */
class HudAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: { stop: () => void } | null = null;
  enabled = false;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      this.ensure();
      this.startHum();
      this.chirp(880, 1320, 0.09, 0.05);
    } else {
      this.stopHum();
    }
  }

  /** A soft two-tone chirp: the "lock-on" of the reticle. */
  lock() {
    if (!this.enabled) return;
    this.chirp(1650, 2400, 0.035, 0.018);
  }

  tick() {
    if (!this.enabled) return;
    this.chirp(2600, 2600, 0.018, 0.012);
  }

  confirm() {
    if (!this.enabled) return;
    this.chirp(660, 990, 0.08, 0.04);
    setTimeout(() => this.chirp(990, 1480, 0.1, 0.035), 70);
  }

  /** Power-up sweep for engaging the interface. */
  engage() {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 1.1);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 1.0);
    filter.Q.value = 8;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 1.6);
    this.noiseBurst(0.9, 0.05, 1800);
    setTimeout(() => this.chirp(1200, 1800, 0.12, 0.05), 900);
  }

  /** CRT power-down for leaving cinematic mode. */
  powerDown() {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.7);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.85);
    this.stopHum();
  }

  /** Optional spoken greeting, British voice if the browser has one. */
  speak(text: string) {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find((v) => /en-GB/i.test(v.lang) && /male|daniel|arthur|google uk english male/i.test(v.name)) ||
        voices.find((v) => /en-GB/i.test(v.lang)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (pick) u.voice = pick;
      u.rate = 1.02;
      u.pitch = 0.92;
      u.volume = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* speech is a nice-to-have */
    }
  }

  private chirp(from: number, to: number, dur: number, vol: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(dur: number, vol: number, freq: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
  }

  private startHum() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.hum) return;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.022, t + 2);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = "sine";
    b.type = "triangle";
    a.frequency.value = 55;
    b.frequency.value = 82.6;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(lp.frequency);
    a.connect(lp);
    b.connect(lp);
    lp.connect(out).connect(this.master);
    a.start();
    b.start();
    lfo.start();
    this.hum = {
      stop: () => {
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        a.stop(now + 0.7);
        b.stop(now + 0.7);
        lfo.stop(now + 0.7);
      },
    };
  }

  private stopHum() {
    this.hum?.stop();
    this.hum = null;
  }
}

export const hudAudio = new HudAudio();
