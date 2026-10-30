// Short, soft UI sounds generated with the Web Audio API (no audio files to load).
class UiAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.5;

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
    if (this.masterGain) this.masterGain.gain.value = this.volume * 0.35;
  }

  private init() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, delay = 0, slideFreq?: number) {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, start + duration);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playClick() {
    this.playTone(660, 'sine', 0.05);
  }

  playAccept() {
    this.playTone(523, 'triangle', 0.09);
    this.playTone(784, 'triangle', 0.14, 0.08);
  }

  playAlert() {
    this.playTone(880, 'sine', 0.18);
    this.playTone(660, 'sine', 0.22, 0.2);
  }

  playError() {
    this.playTone(220, 'triangle', 0.18, 0, 160);
  }

  playScan() {
    this.playTone(500 + Math.random() * 200, 'sine', 0.03);
  }

  playSuccess() {
    [523, 659, 784, 1047].forEach((f, i) => this.playTone(f, 'triangle', i === 3 ? 0.35 : 0.12, i * 0.09));
  }
}

export const soundManager = new UiAudio();
