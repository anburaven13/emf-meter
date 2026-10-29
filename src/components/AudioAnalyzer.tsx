import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Download, Volume2, AlertCircle } from 'lucide-react';

export const AudioAnalyzer: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('audio-session.webm');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioLevelDb, setAudioLevelDb] = useState<number>(-60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize Microphone and AnalyserNode
  const startAudio = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      startVisualizer();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Microphone access denied or unavailable.'
      );
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
      mediaRecorderRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const stopAudio = () => {
    stopRecording();
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsListening(false);
    setAudioLevelDb(-60);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedUrl(null);

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setDownloadFileName(`audio-session-${Date.now()}.webm`);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not start recording.'
      );
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 64-band FFT Spectrum Visualizer & RMS decibel meter
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Calculate approximate RMS / dBFS
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = rms > 0 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
      setAudioLevelDb(db);

      // Render Bar Spectrum
      const barCount = 32;
      const barWidth = (width / barCount) - 1.5;
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * height;

        // Gradient from green at base to orange/red at peak
        const barGrad = ctx.createLinearGradient(0, height, 0, 0);
        barGrad.addColorStop(0, '#10b981');
        barGrad.addColorStop(0.6, '#eab308');
        barGrad.addColorStop(1, '#ef4444');

        ctx.fillStyle = barGrad;
        ctx.fillRect(i * (barWidth + 1.5), height - barHeight, barWidth, barHeight);
      }
    };

    draw();
  };


  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-[#131518] border border-[#26282e] rounded-2xl p-4 flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Acoustic & Sound Analysis
          </span>
        </div>

        <button
          onClick={isListening ? stopAudio : startAudio}
          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
        >
          {isListening ? 'Stop Mic' : 'Enable Mic'}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real-time Spectrum Visualizer */}
      <div className="relative w-full h-24 bg-[#0a0b0d] rounded-xl overflow-hidden border border-[#1b1c20] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={96}
          className="w-full h-full block"
        />

        {!isListening && (
          <div className="absolute text-xs text-neutral-500 font-mono">
            Mic Standby (Tap &apos;Enable Mic&apos; to Analyze)
          </div>
        )}
      </div>

      {/* Sound Telemetry & Decibel Level */}
      <div className="mt-3 flex items-center justify-between text-xs font-mono text-neutral-400">
        <div className="flex items-center space-x-2">
          <span>Level:</span>
          <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transition-all duration-75"
              style={{
                width: `${Math.min(100, Math.max(0, ((audioLevelDb + 60) / 60) * 100))}%`,
              }}
            />
          </div>
          <span className="text-neutral-300 font-bold">
            {isListening ? `${audioLevelDb.toFixed(1)} dB` : '-- dB'}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center space-x-1.5 text-red-400 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>REC {formatSeconds(recordingDuration)}</span>
          </div>
        )}
      </div>

      {/* Audio Recording Controls */}
      <div className="mt-4 pt-3 border-t border-[#1f2127] flex items-center justify-between">
        <button
          onClick={toggleRecording}
          disabled={!isListening}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            !isListening
              ? 'opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-500'
              : isRecording
              ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/40'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Record Sound Session</span>
            </>
          )}
        </button>

        {/* Audio Playback & Export when recorded */}
        {recordedUrl && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (!audioPlayerRef.current) return;
                if (isPlayingAudio) {
                  audioPlayerRef.current.pause();
                  setIsPlayingAudio(false);
                } else {
                  audioPlayerRef.current.play();
                  setIsPlayingAudio(true);
                }
              }}
              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
              title="Play Recording"
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            <a
              href={recordedUrl}
              download={downloadFileName}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
              title="Download Session"
            >
              <Download className="w-4 h-4" />
            </a>

            <audio
              ref={audioPlayerRef}
              src={recordedUrl}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};
