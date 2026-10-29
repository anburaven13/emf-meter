import React from 'react';
import { Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { soundAlertService } from '../services/soundAlert';

interface SensorControlsProps {
  isSimulating: boolean;
  onToggleSimulation: (enabled: boolean) => void;
  onSimulateSpike: (mg: number) => void;
  sensorMode: 'native' | 'orientation' | 'simulation';
}

export const SensorControls: React.FC<SensorControlsProps> = ({
  isSimulating,
  onToggleSimulation,
  onSimulateSpike,
  sensorMode,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(soundAlertService.getIsMuted());

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundAlertService.setMuted(nextMuted);
  };

  return (
    <div className="w-full bg-[#131518] border border-[#26282e] rounded-2xl p-4 flex flex-col space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Hardware & Simulation
          </span>
        </div>

        {/* Audio Mute / Unmute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
            isMuted
              ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
          title="Toggle Spike Beeps"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Muted' : 'Spike Beeps On'}</span>
        </button>
      </div>

      {/* Mode Status Pill */}
      <div className="flex items-center justify-between text-xs font-mono bg-[#0c0d0f] p-2 rounded-xl border border-[#1b1c20]">
        <span className="text-neutral-400">Sensor Source:</span>
        <span
          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
            sensorMode === 'native'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : sensorMode === 'orientation'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
          }`}
        >
          {sensorMode === 'native'
            ? 'Hardware Magnetometer'
            : sensorMode === 'orientation'
            ? 'Device Orientation Compass'
            : 'Interactive Simulator'}
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-neutral-400">Simulation / Desktop Mode:</span>
        <button
          onClick={() => onToggleSimulation(!isSimulating)}
          className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
            isSimulating
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {isSimulating ? 'Enabled (Manual / Test)' : 'Use Real Device Sensors'}
        </button>
      </div>

      {/* Test Spike Triggers */}
      {isSimulating && (
        <div className="pt-2 border-t border-[#1f2127] flex flex-col space-y-2">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Simulate EMF Spikes (Test LEDs):</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onSimulateSpike(2.0)}
              className="py-1.5 rounded-lg bg-green-950/60 border border-green-800/60 text-green-300 hover:bg-green-800/40 text-xs font-mono font-bold cursor-pointer transition-all"
            >
              2 mG
            </button>
            <button
              onClick={() => onSimulateSpike(6.5)}
              className="py-1.5 rounded-lg bg-yellow-950/60 border border-yellow-800/60 text-yellow-300 hover:bg-yellow-800/40 text-xs font-mono font-bold cursor-pointer transition-all"
            >
              6.5 mG
            </button>
            <button
              onClick={() => onSimulateSpike(15.0)}
              className="py-1.5 rounded-lg bg-orange-950/60 border border-orange-800/60 text-orange-300 hover:bg-orange-800/40 text-xs font-mono font-bold cursor-pointer transition-all"
            >
              15 mG
            </button>
            <button
              onClick={() => onSimulateSpike(28.0)}
              className="py-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-800/40 text-xs font-mono font-bold cursor-pointer transition-all"
            >
              28 mG!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
