/**
 * High-precision K-II Audio & Alert Engine
 * Features:
 * 1. Intelligent Threshold Filter (Level 1 & 2 are completely silent, eliminating false beeps)
 * 2. Authentic K-II Clicker / Geiger audio synthesis
 * 3. Ghost Box / ITC Sound Sweep (Spain Paranormal signature feature)
 */
class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastAlertTime: number = 0;
  private soundMode: 'clicker' | 'beep' = 'clicker';

  // ITC / Ghost Box Sweep Generator
  private itcInterval: number | null = null;
  private isItcActive: boolean = false;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSoundMode(mode: 'clicker' | 'beep') {
    this.soundMode = mode;
  }

  public getSoundMode(): 'clicker' | 'beep' {
    return this.soundMode;
  }

  /**
   * Triggers alert sound only on meaningful anomalies (Levels 3, 4, 5).
   * Level 1 (Power Green) and Level 2 (Low Green) are strictly silent.
   */
  public triggerAlert(level: 1 | 2 | 3 | 4 | 5, _milliGauss: number) {
    // Level 1 and 2 are SILENT - no constant beeping!
    if (this.isMuted || level <= 2) return;

    const now = Date.now();
    // Spaced alert intervals:
    // Level 3 (Yellow) -> Every 800ms
    // Level 4 (Orange) -> Every 400ms
    // Level 5 (Red)    -> Every 200ms
    const minInterval = level === 5 ? 200 : level === 4 ? 400 : 800;
    if (now - this.lastAlertTime < minInterval) return;

    this.lastAlertTime = now;
    this.initContext();

    if (this.audioCtx) {
      try {
        if (this.soundMode === 'clicker') {
          // Authentic Geiger / Electromagnetic tick click
          this.playClick(level);
        } else {
          // Classic electronic alert chirp
          this.playBeep(level);
        }
      } catch {
        // AudioContext may be waiting for first user touch
      }
    }

    // Android Haptic Vibration only on High / Extreme
    if (navigator.vibrate) {
      try {
        if (level === 5) {
          navigator.vibrate(35);
        } else if (level === 4) {
          navigator.vibrate(18);
        }
      } catch {
        // Ignore
      }
    }
  }

  private playClick(level: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(level === 5 ? 1200 : level === 4 ? 900 : 650, this.audioCtx.currentTime);

    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  private playBeep(level: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const freq = level === 5 ? 1400 : level === 4 ? 1050 : 750;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Spain Paranormal signature "Ghost Box / ITC Sweep" audio engine
   * Synthesizes short white noise phonetic radio sweeps
   */
  public toggleItcSweep(): boolean {
    if (this.isItcActive) {
      this.stopItcSweep();
      return false;
    } else {
      this.startItcSweep();
      return true;
    }
  }

  public getIsItcActive(): boolean {
    return this.isItcActive;
  }

  private startItcSweep() {
    this.initContext();
    this.isItcActive = true;

    this.itcInterval = window.setInterval(() => {
      if (!this.audioCtx || this.isMuted) return;
      try {
        // Generate brief 40ms radio static burst
        const bufferSize = this.audioCtx.sampleRate * 0.04;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to emulate AM/FM radio frequency sweeps
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300 + Math.random() * 2400;
        filter.Q.value = 3.0;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        noise.start();
      } catch {
        // Ignore
      }
    }, 120); // 120ms radio sweep rate matching SPK2
  }

  private stopItcSweep() {
    this.isItcActive = false;
    if (this.itcInterval) {
      clearInterval(this.itcInterval);
      this.itcInterval = null;
    }
  }
}

export const soundAlertService = new SoundAlertService();
