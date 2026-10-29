import React, { useEffect, useRef } from 'react';
import type { SensorReading } from '../types/emf';

interface LiveGraphProps {
  reading: SensorReading;
  historySize?: number;
  peakValue: number;
  onResetPeak: () => void;
}

export const LiveGraph: React.FC<LiveGraphProps> = ({
  reading,
  historySize = 120,
  peakValue,
  onResetPeak,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataPointsRef = useRef<number[]>([]);

  useEffect(() => {
    dataPointsRef.current.push(reading.milliGauss);
    if (dataPointsRef.current.length > historySize) {
      dataPointsRef.current.shift();
    }
  }, [reading, historySize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const data = dataPointsRef.current;

      ctx.clearRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = '#1e2126';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Max scale reference (minimum 25 mG to fit scale, or dynamic if spikes higher)
      const currentMax = Math.max(25, Math.max(...data, 10) * 1.15);

      // Draw 20 mG Spike Warning Threshold Line
      const y20 = height - (20 / currentMax) * height;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y20);
      ctx.lineTo(width, y20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 10 mG Caution Threshold Line
      const y10 = height - (10 / currentMax) * height;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y10);
      ctx.lineTo(width, y10);
      ctx.stroke();
      ctx.setLineDash([]);

      if (data.length < 2) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Draw Gradient Graph Area
      const step = width / (historySize - 1);
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 230, 118, 0.45)');
      gradient.addColorStop(0.5, 'rgba(255, 234, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, height);

      data.forEach((val, i) => {
        const x = i * step;
        const normalized = Math.min(val / currentMax, 1);
        const y = height - normalized * height;
        ctx.lineTo(x, y);
      });

      ctx.lineTo((data.length - 1) * step, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Primary Trace Stroke
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = i * step;
        const normalized = Math.min(val / currentMax, 1);
        const y = height - normalized * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Line color based on current latest value
      const latestVal = data[data.length - 1] || 0;
      ctx.strokeStyle =
        latestVal >= 20 ? '#ff1744' :
        latestVal >= 10 ? '#ff9100' :
        latestVal >= 2.5 ? '#ffea00' : '#00e676';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Latest Point Glow Marker
      const lastX = (data.length - 1) * step;
      const lastY = height - Math.min(latestVal / currentMax, 1) * height;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [historySize]);

  return (
    <div className="w-full bg-[#131518] border border-[#26282e] rounded-2xl p-3 flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Live Field Flux
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono text-neutral-400">
          <span>Peak: <strong className="text-emerald-400">{peakValue.toFixed(1)} mG</strong></span>
          <button
            onClick={onResetPeak}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative w-full h-32 bg-[#0a0b0d] rounded-xl overflow-hidden border border-[#1b1c20]">
        <canvas
          ref={canvasRef}
          width={400}
          height={140}
          className="w-full h-full block"
        />

        <div className="absolute top-1 right-2 text-[9px] font-mono text-red-500/70 select-none pointer-events-none">
          Spike line (20mG)
        </div>
      </div>
    </div>
  );
};
