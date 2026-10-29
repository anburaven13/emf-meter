/**
 * Sound & Haptic Alert Service
 * Generates realistic audio clicks and warning beeps when EMF spikes occur,
 * using the Web Audio API without requiring external audio asset files.
 */
class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastBeepTime: number = 0;

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

  public triggerAlert(level: 1 | 2 | 3 | 4 | 5, milliGauss: number) {
    if (this.isMuted || level === 1) return;

    const now = Date.now();
    // Throttle beeps based on level severity (higher levels chirp faster)
    const minInterval = level === 5 ? 100 : level === 4 ? 200 : level === 3 ? 350 : 500;
    if (now - this.lastBeepTime < minInterval) return;

    this.lastBeepTime = now;
    this.initContext();

    if (this.audioCtx) {
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Frequency scales with intensity: 440Hz -> 1800Hz
        const baseFreq = 400 + level * 260 + Math.min(milliGauss * 15, 600);
        osc.type = level >= 4 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

        const duration = level === 5 ? 0.08 : 0.05;
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch {
        // AudioContext may be locked until user interaction
      }
    }

    // Trigger Android Haptic Vibration if supported
    if (navigator.vibrate) {
      try {
        if (level === 5) {
          navigator.vibrate([40, 20, 40]);
        } else if (level >= 3) {
          navigator.vibrate(25);
        }
      } catch {
        // Ignore vibration errors if blocked
      }
    }
  }
}

export const soundAlertService = new SoundAlertService();
