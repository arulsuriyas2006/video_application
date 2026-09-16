import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Mic } from 'lucide-react';

export default function VoiceNotePlayer({ src, duration = 0 }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (duration && !isNaN(duration)) {
      setTotalDuration(duration);
    }
  }, [duration]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setTotalDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const target = pct * totalDuration;
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const cycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressPercent = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  // Generate 20 static wave bar heights for visual waveform
  const waveBars = [
    25, 45, 70, 30, 85, 55, 95, 60, 40, 80, 100, 65, 50, 75, 35, 90, 45, 60, 30, 50
  ];

  return (
    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-brand-500/20 shadow-inner flex flex-col gap-2 select-none">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-glow active:scale-95 transition-all flex-shrink-0"
          title={isPlaying ? 'Pause' : 'Play Voice Note'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Interactive Waveform / Scrubber Bar */}
        <div
          onClick={handleSeek}
          className="flex-1 flex items-center gap-0.5 h-7 px-1 rounded-lg bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all relative overflow-hidden group"
          title="Click to seek"
        >
          {/* Progress fill overlay */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-brand-500/15 pointer-events-none transition-all"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Soundwave bars */}
          {waveBars.map((height, idx) => {
            const barPct = (idx / waveBars.length) * 100;
            const isPlayed = barPct <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full z-10"
              >
                <div
                  className={`w-full rounded-full transition-all duration-150 ${
                    isPlayed
                      ? 'bg-brand-400'
                      : 'bg-slate-700 group-hover:bg-slate-600'
                  } ${
                    isPlaying && isPlayed ? 'animate-pulse' : ''
                  }`}
                  style={{
                    height: `${height}%`,
                    maxHeight: '100%',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Time & Speed controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-mono text-[10px] text-slate-400 font-bold">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-brand-300 border border-slate-800 transition-colors"
            title="Cycle Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
