# Ghost EMF & Acoustic Meter - Architecture

## 1. System Overview
A high-precision mobile-responsive web application replicating classic handheld electromagnetic field (EMF) meters (specifically the 5-LED K-II design) with live phone sensor integration, calibration, real-time waveform graphing, acoustic analysis, and customizable audio recording.

## 2. Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Modern CSS3 + Tailwind design tokens (glassmorphism, physical meter hardware chassis, authentic LED diffusion and glow physics)
- **Sensor APIs:**
  - W3C Generic Sensor API (`Magnetometer`)
  - `DeviceOrientationEvent` / `DeviceMotionEvent` fallback
  - Realistic Synthetic Signal Generator (for desktop browsers and devices lacking hardware magnetometers)
- **Audio Processing:**
  - Web Audio API (`AudioContext`, `AnalyserNode`, `MediaStreamAudioSourceNode`)
  - `MediaRecorder` API for recorded EVP/sound sessions
  - Real-time FFT Fast Fourier Transform for frequency visualizer

## 3. Core Modules
1. **EMF Core (`src/services/emfSensor.ts`)**:
   - Interfaces with native magnetometer or orientation fallback.
   - Computes 3-axis magnitude: $B = \sqrt{x^2 + y^2 + z^2}$.
   - Converts microteslas ($\mu\text{T}$) to milliGauss ($1\,\mu\text{T} = 10\,\text{mG}$).
   - Tare / Calibration baseline compensation ($30-60\,\mu\text{T}$ Earth geomagnetic baseline subtraction).
2. **K-II LED Indicator (`src/components/K2LedMeter.tsx`)**:
   - Exact 5-LED scale matching physical meter:
     - LED 1 (0 - 1.5 mG): Normal / Baseline (Dark Green)
     - LED 2 (1.5 - 2.5 mG): Low (Light Green)
     - LED 3 (2.5 - 10 mG): Caution / Mid (Yellow)
     - LED 4 (10 - 20 mG): High (Orange)
     - LED 5 (20+ mG): Extreme / Spike (Red)
   - Real-time physical LED glow blur and specular highlight reflection.
3. **Live Waveform Graph (`src/components/LiveGraph.tsx`)**:
   - High-performance HTML5 `<canvas>` rendering 60 FPS rolling history of magnetic flux.
   - Spike detection marker and alert threshold line.
4. **Audio Recorder & Frequency Analyzer (`src/components/AudioAnalyzer.tsx`)**:
   - Microphone input with gain control.
   - Real-time 64-band frequency spectrum visualizer.
   - Decibel ($dBFS$) level meter.
   - Session recording with waveform review and export.
5. **Spike Alert System (`src/services/alertService.ts`)**:
   - Web Audio synthesizer beeps synchronized with LED thresholds.
   - Mobile Haptic feedback (`navigator.vibrate`).
