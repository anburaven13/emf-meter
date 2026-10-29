import React from 'react';
import { K2_LED_CONFIG } from '../types/emf';
import type { SensorReading } from '../types/emf';

interface K2LedMeterProps {
  reading: SensorReading;
  onCalibrate: () => void;
  isCalibrating?: boolean;
}

export const K2LedMeter: React.FC<K2LedMeterProps> = ({
  reading,
  onCalibrate,
  isCalibrating = false,
}) => {
  const currentLevel = reading.level;

  return (
    <div className="relative flex flex-col items-center justify-start select-none w-full max-w-[340px] mx-auto">
      {/* Handheld Device Outer Chassis */}
      <div
        className="relative w-full rounded-t-[44px] rounded-b-[24px] p-4 flex flex-col items-center shadow-2xl transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, #323539 0%, #1c1d20 30%, #151618 70%, #202226 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -3px 6px rgba(0, 0, 0, 0.6)',
          border: '1px solid #3c4046',
        }}
      >
        {/* Chassis Top Ridge Bevel */}
        <div className="w-[85%] h-2 bg-[#121315] rounded-full mb-3 opacity-60 shadow-inner" />

        {/* Meter Display Window Inset */}
        <div
          className="relative w-full bg-[#0d0e10] rounded-[18px] p-3 border border-[#2b2d31] flex flex-col items-center overflow-hidden"
          style={{
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Glass Specular Reflection Highlight */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[18px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 60%)',
            }}
          />

          {/* 5 Physical LEDs Arc */}
          <div className="relative z-10 w-full flex justify-around items-end pt-2 pb-3 px-1">
            {K2_LED_CONFIG.map((led, index) => {
              const isActive = currentLevel >= led.level;
              // Slightly curve the LEDs vertically like the physical curved meter
              const verticalOffsets = [10, 3, 0, 3, 10];
              const yOffset = verticalOffsets[index];

              return (
                <div
                  key={led.level}
                  className="flex flex-col items-center transition-transform duration-150"
                  style={{ transform: `translateY(${yOffset}px)` }}
                >
                  {/* LED Dome Body */}
                  <div
                    className="relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-100"
                    style={{
                      backgroundColor: isActive ? led.onColor : led.offColor,
                      boxShadow: isActive
                        ? `0 0 18px 4px ${led.glowColor}, 0 0 32px 10px ${led.glowColor}, inset 0 2px 4px rgba(255,255,255,0.85)`
                        : 'inset 0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(255,255,255,0.05)',
                      border: '1.5px solid #141517',
                    }}
                  >
                    {/* Inner Specular Bulb Reflection */}
                    <div
                      className="w-2.5 h-2 rounded-full absolute top-1 left-1.5 transition-opacity duration-150"
                      style={{
                        backgroundColor: '#ffffff',
                        opacity: isActive ? 0.95 : 0.2,
                        filter: 'blur(0.5px)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arched Scale Plate (Matching K-II Visual Scale) */}
          <div className="relative z-10 w-full mt-4 bg-[#f2f2f0] rounded-b-lg rounded-t-sm p-2 flex flex-col items-center shadow-md">
            {/* Colored Segment Rays */}
            <div className="w-full flex h-8 rounded-sm overflow-hidden border border-[#555]">
              <div className="flex-1 bg-[#10b981] flex items-center justify-center border-r border-[#333]">
                <span className="text-[9px] font-black text-black">1.5</span>
              </div>
              <div className="flex-1 bg-[#84cc16] flex items-center justify-center border-r border-[#333]">
                <span className="text-[9px] font-black text-black">2.5</span>
              </div>
              <div className="flex-1 bg-[#eab308] flex items-center justify-center border-r border-[#333]">
                <span className="text-[9px] font-black text-black">10</span>
              </div>
              <div className="flex-1 bg-[#f97316] flex items-center justify-center border-r border-[#333]">
                <span className="text-[9px] font-black text-black">20</span>
              </div>
              <div className="flex-1 bg-[#ef4444] flex items-center justify-center">
                <span className="text-[9px] font-black text-white">20+</span>
              </div>
            </div>

            {/* Scale Label */}
            <div className="mt-1 text-center font-bold tracking-tight text-[11px] text-gray-800">
              milli GAUSS (mG)
            </div>
          </div>
        </div>

        {/* Central Recessed Button Pad (Thumb indentation with arrows) */}
        <button
          onClick={onCalibrate}
          disabled={isCalibrating}
          title="Tap to Tare / Calibrate Earth Geomagnetic Baseline"
          className="relative mt-8 w-28 h-32 rounded-2xl bg-[#17181a] border-2 border-[#2c2e33] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all group overflow-hidden"
          style={{
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.85), 0 2px 4px rgba(255,255,255,0.05)',
          }}
        >
          {/* Subtle directional arrows matching device image */}
          <div className="flex flex-col items-center space-y-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <div className="w-5 h-2 border-t-2 border-l-2 border-neutral-400 rotate-45 transform translate-y-1" />
            <div className="w-5 h-2 border-t-2 border-l-2 border-neutral-400 rotate-45 transform translate-y-0.5" />
            <div className="w-5 h-2 border-t-2 border-l-2 border-neutral-400 rotate-45" />
          </div>

          <span className="mt-3 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase group-hover:text-emerald-400 transition-colors">
            {isCalibrating ? 'Calibrating...' : 'Tare / Calibrate'}
          </span>
        </button>

        {/* Live Digital Telemetry readout */}
        <div className="mt-6 w-full flex items-center justify-between px-3 py-2 bg-[#111214] rounded-xl border border-[#2a2b2f]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-neutral-400">Flux Delta</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {reading.milliGauss.toFixed(1)} <span className="text-xs text-neutral-400">mG</span>
            </span>
          </div>

          <div className="h-7 w-[1px] bg-neutral-800" />

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-mono text-neutral-400">Raw Field</span>
            <span className="text-sm font-mono text-neutral-300">
              {reading.magnitude.toFixed(1)} <span className="text-[10px] text-neutral-400">µT</span>
            </span>
          </div>
        </div>

        {/* Chassis Lower Taper Grip Accents */}
        <div className="w-full flex justify-between px-2 mt-4 opacity-40">
          <div className="w-1.5 h-6 bg-[#3a3d42] rounded-full" />
          <div className="w-1.5 h-6 bg-[#3a3d42] rounded-full" />
        </div>
      </div>
    </div>
  );
};
