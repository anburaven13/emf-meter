# EMF & Acoustic Meter (Android)

An electromagnetic field (EMF) and acoustic analysis mobile application replicating classic 5-LED handheld meters (such as the K-II style meter), with live magnetometer sensor compatibility, tare calibration, real-time waveform graphing, and frequency spectrum sound analysis.

---

## Features

- **Live 5-LED Indicator**:
  - `1.5 mG` (Dark Green): Baseline / Normal
  - `2.5 mG` (Light Green): Low Field
  - `10.0 mG` (Yellow): Caution
  - `20.0 mG` (Orange): High Alert
  - `20.0+ mG` (Red): Extreme Spike (+ audio warning chirp & haptic vibration)
- **Tare / Calibrate Button**:
  - Calibrates against Earth's natural geomagnetic baseline (~30–60 µT) so only local variations are measured.
- **Live Waveform Graph**:
  - Real-time 60 FPS rolling flux history, peak hold, and 20 mG spike threshold line.
- **Audio / Acoustic Analyzer**:
  - Real-time 64-band FFT spectrum visualizer.
  - Sound pressure (dBFS) level meter.
  - In-app session recorder with instant audio playback and export.
- **Interactive Simulator**:
  - Allows full testing and spike simulation on devices or desktops without hardware magnetometers.

---

## Android App & Signed APK Build

This repository includes a native Android Studio project (`android/`) powered by Capacitor and automated with GitHub Actions.

### Automated Cloud Build (Recommended)
Every push to `main` triggers `.github/workflows/build-apk.yml`, which:
1. Compiles web and native Android sources.
2. Automatically generates a release keystore.
3. Builds and cryptographically signs `app-release.apk`.
4. Uploads the signed APK to **GitHub Releases** and workflow **Artifacts** for 1-click download directly to your Android device.

### Local Android Studio Build
1. Open Android Studio.
2. Select **Open** and choose the `android` folder in this repository.
3. Connect your Android phone with USB debugging enabled.
4. Click **Run** or go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local dev server (accessible on local network)
npm run dev

# Sync updates to native Android
npm run build
npx cap sync android
```
