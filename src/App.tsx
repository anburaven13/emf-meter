import React, { useState, useEffect, useCallback } from 'react';
import { K2LedMeter } from './components/K2LedMeter';
import { LiveGraph } from './components/LiveGraph';
import { AudioAnalyzer } from './components/AudioAnalyzer';
import { SensorControls } from './components/SensorControls';
import { emfSensorService } from './services/emfSensor';
import { soundAlertService } from './services/soundAlert';
import type { SensorReading } from './types/emf';
import type { SensitivityLevel } from './services/emfSensor';
import { Activity, Info, ShieldAlert, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [reading, setReading] = useState<SensorReading>(() => ({
    x: 0,
    y: 0,
    z: 45,
    magnitude: 45,
    deltaMagnitude: 0,
    milliGauss: 0,
    level: 1,
    timestamp: 0,
  }));

  const [peakMg, setPeakMg] = useState<number>(0);
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('normal');
  const [sensorMode, setSensorMode] = useState<'native' | 'orientation' | 'simulation'>('simulation');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'meter' | 'graph' | 'audio'>('meter');
  const [showInfo, setShowInfo] = useState<boolean>(false);

  useEffect(() => {
    // Start EMF sensor service
    let unsub: (() => void) | null = null;

    const initSensor = async () => {
      const res = await emfSensorService.start();
      setSensorMode(res.mode);
      setIsSimulating(emfSensorService.getIsSimulationMode());

      unsub = emfSensorService.subscribe((newReading) => {
        setReading(newReading);
        setPeakMg((prev) => Math.max(prev, newReading.milliGauss));
        // Trigger sound beep / haptic if thresholds are crossed
        soundAlertService.triggerAlert(newReading.level, newReading.milliGauss);
      });
    };

    initSensor();

    return () => {
      if (unsub) unsub();
      emfSensorService.stop();
    };
  }, []);

  const handleCalibrate = useCallback(() => {
    setIsCalibrating(true);
    emfSensorService.calibrate();
    setTimeout(() => {
      setIsCalibrating(false);
    }, 600);
  }, []);

  const handleSensitivityChange = (newSens: SensitivityLevel) => {
    setSensitivity(newSens);
    emfSensorService.setSensitivity(newSens);
  };

  const handleToggleSimulation = (enabled: boolean) => {
    setIsSimulating(enabled);
    emfSensorService.setSimulationMode(enabled);
    setSensorMode(enabled ? 'simulation' : 'native');
  };

  const handleSimulateSpike = (mg: number) => {
    emfSensorService.setSimulatedSpike(mg);
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-neutral-200 flex flex-col items-center justify-start p-3 sm:p-6 pb-20">
      {/* Top Application Header */}
      <header className="w-full max-w-md flex items-center justify-between py-2 border-b border-[#212328] mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              EMF Ghost Meter <span className="text-[10px] bg-red-600/30 text-red-400 px-1.5 py-0.2 rounded font-mono">K-II</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono">
              Live Sensor & Acoustic Analyzer
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-colors"
          title="Info & Sensor Guide"
        >
          <Info className="w-4 h-4" />
        </button>
      </header>

      {/* Physics / Information Drawer */}
      {showInfo && (
        <div className="w-full max-w-md bg-[#13161b] border border-blue-900/40 rounded-2xl p-4 mb-4 text-xs space-y-2 text-neutral-300">
          <div className="flex items-center space-x-2 text-blue-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>How Real EMF Sensors Work</span>
          </div>
          <p className="text-neutral-400 leading-relaxed">
            This tool measures ambient magnetic flux density in microteslas (µT) and milliGauss (mG).
            Spikes occur naturally around high-current wiring, laptop chargers, speakers, refrigerators, or moving magnetic metals.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Tap the <strong className="text-emerald-400">Tare / Calibrate</strong> thumb pad to subtract the Earth&apos;s ambient geomagnetic field (~30–60 µT) so fluctuations are accurately displayed.
          </p>
        </div>
      )}

      {/* Mobile Tab Navigation Bar */}
      <nav className="w-full max-w-md flex bg-[#141519] p-1 rounded-2xl border border-[#23252c] mb-5">
        <button
          onClick={() => setActiveTab('meter')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'meter'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          K-II Meter
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Live Waveform
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Audio / EVP
        </button>
      </nav>

      {/* Tab 1: Authentic Handheld K-II Meter */}
      <main className="w-full max-w-md flex flex-col items-center space-y-5">
        {activeTab === 'meter' && (
          <div className="w-full flex flex-col items-center space-y-4">
            <K2LedMeter
              reading={reading}
              onCalibrate={handleCalibrate}
              isCalibrating={isCalibrating}
              sensitivity={sensitivity}
              onSensitivityChange={handleSensitivityChange}
            />

            {/* Quick Spike Test Buttons right below meter */}
            <div className="w-full bg-[#121316] border border-[#23252c] rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Quick Spike Test:
              </span>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleSimulateSpike(2.0)}
                  className="px-2.5 py-1 rounded-lg bg-green-950/70 border border-green-800/80 text-green-300 text-xs font-mono font-bold hover:bg-green-800/50 cursor-pointer"
                >
                  2 mG
                </button>
                <button
                  onClick={() => handleSimulateSpike(6.5)}
                  className="px-2.5 py-1 rounded-lg bg-yellow-950/70 border border-yellow-800/80 text-yellow-300 text-xs font-mono font-bold hover:bg-yellow-800/50 cursor-pointer"
                >
                  6 mG
                </button>
                <button
                  onClick={() => handleSimulateSpike(15.0)}
                  className="px-2.5 py-1 rounded-lg bg-orange-950/70 border border-orange-800/80 text-orange-300 text-xs font-mono font-bold hover:bg-orange-800/50 cursor-pointer"
                >
                  15 mG
                </button>
                <button
                  onClick={() => handleSimulateSpike(25.0)}
                  className="px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-mono font-bold hover:bg-red-800/50 cursor-pointer"
                >
                  25 mG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Graph Plot */}
        {activeTab === 'graph' && (
          <div className="w-full flex flex-col space-y-4">
            <LiveGraph
              reading={reading}
              peakValue={peakMg}
              onResetPeak={() => setPeakMg(0)}
            />

            <div className="bg-[#121417] p-4 rounded-2xl border border-[#22242a] text-xs space-y-2">
              <span className="font-semibold text-neutral-300 block">Current Vector Coordinates</span>
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-[#0b0c0e] p-2 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">X AXIS</div>
                  <div className="text-emerald-400 font-bold">{reading.x.toFixed(1)} µT</div>
                </div>
                <div className="bg-[#0b0c0e] p-2 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">Y AXIS</div>
                  <div className="text-emerald-400 font-bold">{reading.y.toFixed(1)} µT</div>
                </div>
                <div className="bg-[#0b0c0e] p-2 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">Z AXIS</div>
                  <div className="text-emerald-400 font-bold">{reading.z.toFixed(1)} µT</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Audio & Sound Analysis */}
        {activeTab === 'audio' && (
          <div className="w-full flex flex-col space-y-4">
            <AudioAnalyzer />
          </div>
        )}

        {/* Bottom Sensor Source & Hardware Controls */}
        <SensorControls
          isSimulating={isSimulating}
          onToggleSimulation={handleToggleSimulation}
          onSimulateSpike={handleSimulateSpike}
          sensorMode={sensorMode}
        />
      </main>
    </div>
  );
};

export default App;
