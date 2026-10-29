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

export class EmfSensorService {
  private listeners: Set<Listener> = new Set();
  private magnetometer: GenericMagnetometer | null = null;
  private isRunning: boolean = false;
  private isSimulationMode: boolean = false;
  private baselineMagnitude: number = 45.0; // Typical Earth baseline in µT
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
    timestamp: Date.now(),
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
    // Convert desired delta mG to µT added to baseline
    this.simTargetMagnitude = this.baselineMagnitude + targetMg * 0.1;
  }

  public calibrate() {
    // Tare: Set current raw magnitude as the baseline zero
    this.baselineMagnitude = this.lastReading.magnitude;
    this.processReading(this.lastReading.x, this.lastReading.y, this.lastReading.z);
  }

  public getBaseline(): number {
    return this.baselineMagnitude;
  }

  public async start(): Promise<{ success: boolean; mode: 'native' | 'orientation' | 'simulation' }> {
    if (this.isRunning) return { success: true, mode: this.isSimulationMode ? 'simulation' : 'native' };
    this.isRunning = true;

    if (this.isSimulationMode) {
      this.startSimulator();
      return { success: true, mode: 'simulation' };
    }

    // 1. Try Native W3C Generic Sensor API (Supported in Android Chrome with flags or secure origin)
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
        // Fallback below
      }
    }

    // 2. Try DeviceOrientation / DeviceMotion as fallback
    const fallbackSuccess = this.fallbackToOrientation();
    if (fallbackSuccess) {
      return { success: true, mode: 'orientation' };
    }

    // 3. If no hardware sensor is available (e.g. desktop), auto-switch to simulator
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
    // Generate derived magnetic vector approximation based on device compass heading
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

    this.simulationInterval = window.setInterval(() => {
      // Smoothly interpolate towards target magnitude with realistic magnetic noise
      const noise = (Math.random() - 0.5) * 0.4;
      this.simCurrentMagnitude += (this.simTargetMagnitude - this.simCurrentMagnitude) * 0.15;
      
      // Gradually decay spike back to baseline
      if (Math.abs(this.simTargetMagnitude - this.baselineMagnitude) > 0.05) {
        this.simTargetMagnitude += (this.baselineMagnitude - this.simTargetMagnitude) * 0.04;
      }

      const current = Math.max(0, this.simCurrentMagnitude + noise);
      // Synthesize 3D coordinates
      const x = current * 0.4;
      const y = current * 0.3;
      const z = Math.sqrt(Math.max(0, current * current - x * x - y * y));

      this.processReading(x, y, z);
    }, 40); // 25 Hz update rate
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
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    // Delta from calibrated baseline in µT
    const deltaMagnitude = Math.abs(magnitude - this.baselineMagnitude);
    // 1 µT = 10 milliGauss
    const milliGauss = deltaMagnitude * 10;
    const level = getLedLevel(milliGauss);

    const reading: SensorReading = {
      x,
      y,
      z,
      magnitude,
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
