// Simple Web Audio API sound generator for retro UI sounds
class RetroAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.2; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    // Resume context if suspended (browser behavior)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, slideFreq?: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'square', 0.05);
  }

  playHover() {
    this.playTone(400, 'sine', 0.03);
  }

  playAccept() {
    this.playTone(600, 'square', 0.1);
    setTimeout(() => this.playTone(800, 'square', 0.15), 100);
  }

  playAlert() {
    this.playTone(200, 'sawtooth', 0.3, 100);
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.2, 50);
  }

  playSpinClick() {
    this.playTone(400 + Math.random() * 200, 'triangle', 0.02);
  }
  
  playJackpot() {
    this.playTone(440, 'square', 0.1);
    setTimeout(() => this.playTone(554, 'square', 0.1), 100);
    setTimeout(() => this.playTone(659, 'square', 0.2), 200);
    setTimeout(() => this.playTone(880, 'square', 0.4), 300);
  }
}

export const soundManager = new RetroAudio();
