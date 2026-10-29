import { getLedLevel } from '../types/emf';
import type { SensorReading } from '../types/emf';

type Listener = (reading: SensorReading) => void;

interface GenericMagnetometer extends EventTarget {
  x?: number;
  y?: number;
  z?: number;
  start(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Window {
    Magnetometer?: new (options?: { frequency?: number }) => GenericMagnetometer;
  }
}

export type SensitivityLevel = 'low' | 'normal' | 'high';

export class EmfSensorService {
  private listeners: Set<Listener> = new Set();
  private magnetometer: GenericMagnetometer | null = null;
  private isRunning: boolean = false;
  private isSimulationMode: boolean = false;

  // Auto-calibration state
  private baselineMagnitude: number = 0;
  private calibrationSamples: number[] = [];
  private isCalibrated: boolean = false;
  private calibrationTargetSamples: number = 15;

  private sensitivity: SensitivityLevel = 'normal';
  private simulationInterval: number | null = null;
  private simTargetMagnitude: number = 45.0;
  private simCurrentMagnitude: number = 45.0;

  private lastReading: SensorReading = {
    x: 0,
    y: 0,
    z: 45,
    magnitude: 45,
    deltaMagnitude: 0,
    milliGauss: 0,
    level: 1,
    timestamp: 0,
  };

  constructor() {
    this.handleOrientation = this.handleOrientation.bind(this);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.lastReading);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSensitivity(level: SensitivityLevel) {
    this.sensitivity = level;
  }

  public getSensitivity(): SensitivityLevel {
    return this.sensitivity;
  }

  public setSimulationMode(enabled: boolean) {
    if (this.isSimulationMode === enabled) return;
    this.isSimulationMode = enabled;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public getIsSimulationMode(): boolean {
    return this.isSimulationMode;
  }

  public setSimulatedSpike(targetMg: number) {
    this.simTargetMagnitude = this.baselineMagnitude + targetMg * 0.1;
  }

  /**
   * Manual Tare / Calibrate:
   * Sets current ambient reading as baseline zero
   */
  public calibrate() {
    this.calibrationSamples = [];
    this.baselineMagnitude = this.lastReading.magnitude;
    this.isCalibrated = true;
    this.processReading(this.lastReading.x, this.lastReading.y, this.lastReading.z);
  }

  public getBaseline(): number {
    return this.baselineMagnitude;
  }

  public async start(): Promise<{ success: boolean; mode: 'native' | 'orientation' | 'simulation' }> {
    if (this.isRunning) return { success: true, mode: this.isSimulationMode ? 'simulation' : 'native' };
    this.isRunning = true;
    this.isCalibrated = false;
    this.calibrationSamples = [];

    if (this.isSimulationMode) {
      this.startSimulator();
      return { success: true, mode: 'simulation' };
    }

    // 1. Try Native W3C Generic Sensor API (Chrome / Android WebView)
    if (typeof window !== 'undefined' && 'Magnetometer' in window && window.Magnetometer) {
      try {
        const mag = new window.Magnetometer({ frequency: 50 });
        mag.addEventListener('reading', () => {
          if (mag.x !== undefined && mag.y !== undefined && mag.z !== undefined) {
            this.processReading(mag.x, mag.y, mag.z);
          }
        });
        mag.addEventListener('error', () => {
          this.fallbackToOrientation();
        });
        mag.start();
        this.magnetometer = mag;
        return { success: true, mode: 'native' };
      } catch {
        // Fallback
      }
    }

    // 2. Try DeviceOrientation as fallback
    const fallbackSuccess = this.fallbackToOrientation();
    if (fallbackSuccess) {
      return { success: true, mode: 'orientation' };
    }

    // 3. Fallback to Simulator if no sensor found
    this.isSimulationMode = true;
    this.startSimulator();
    return { success: true, mode: 'simulation' };
  }

  private fallbackToOrientation(): boolean {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', this.handleOrientation, true);
      return true;
    }
    return false;
  }

  private handleOrientation(event: DeviceOrientationEvent) {
    const alpha = (event.alpha || 0) * (Math.PI / 180);
    const beta = (event.beta || 0) * (Math.PI / 180);
    const gamma = (event.gamma || 0) * (Math.PI / 180);

    const baseEarthField = 48.0;
    const x = Math.sin(alpha) * Math.cos(beta) * baseEarthField;
    const y = Math.cos(alpha) * Math.sin(gamma) * baseEarthField;
    const z = Math.cos(beta) * baseEarthField;

    this.processReading(x, y, z);
  }

  private startSimulator() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.baselineMagnitude = 45.0;
    this.simCurrentMagnitude = 45.0;
    this.simTargetMagnitude = 45.0;
    this.isCalibrated = true;

    this.simulationInterval = window.setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.15;
      this.simCurrentMagnitude += (this.simTargetMagnitude - this.simCurrentMagnitude) * 0.15;
      
      // Decay spike back to baseline
      if (Math.abs(this.simTargetMagnitude - this.baselineMagnitude) > 0.05) {
        this.simTargetMagnitude += (this.baselineMagnitude - this.simTargetMagnitude) * 0.04;
      }

      const current = Math.max(0, this.simCurrentMagnitude + noise);
      const x = current * 0.4;
      const y = current * 0.3;
      const z = Math.sqrt(Math.max(0, current * current - x * x - y * y));

      this.processReading(x, y, z);
    }, 50);
  }

  public stop() {
    this.isRunning = false;
    if (this.magnetometer) {
      try {
        this.magnetometer.stop();
      } catch {
        // Ignore
      }
      this.magnetometer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.handleOrientation, true);
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private processReading(x: number, y: number, z: number) {
    const rawMagnitude = Math.sqrt(x * x + y * y + z * z);

    // Auto-Tare on first samples so app NEVER starts stuck at Level 5/beeping!
    if (!this.isCalibrated) {
      this.calibrationSamples.push(rawMagnitude);
      if (this.calibrationSamples.length >= this.calibrationTargetSamples) {
        const sum = this.calibrationSamples.reduce((a, b) => a + b, 0);
        this.baselineMagnitude = sum / this.calibrationSamples.length;
        this.isCalibrated = true;
      } else {
        // While calibrating (first 500ms), assume baseline is current reading
        this.baselineMagnitude = rawMagnitude;
      }
    }

    // Delta from calibrated baseline in µT
    let deltaMagnitude = Math.abs(rawMagnitude - this.baselineMagnitude);

    // Apply sensitivity multiplier
    const multiplier = this.sensitivity === 'low' ? 0.6 : this.sensitivity === 'high' ? 1.5 : 1.0;
    deltaMagnitude *= multiplier;

    // 1 µT = 10 milliGauss
    let milliGauss = deltaMagnitude * 10;

    // Noise gate: ignore sensor jitter below 1.2 mG so it stays at silent Level 1
    if (milliGauss < 1.2) {
      milliGauss = 0;
    }

    const level = getLedLevel(milliGauss);

    const reading: SensorReading = {
      x,
      y,
      z,
      magnitude: rawMagnitude,
      deltaMagnitude,
      milliGauss,
      level,
      timestamp: Date.now(),
    };

    this.lastReading = reading;
    this.listeners.forEach((fn) => fn(reading));
  }
}

export const emfSensorService = new EmfSensorService();
