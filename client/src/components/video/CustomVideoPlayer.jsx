import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const CustomVideoPlayer = forwardRef(function CustomVideoPlayer(
  {
    videoUrl,
    comments = [],
    onTimeUpdate,
    onPause,
    onSeek,
    onMarkerClick,
  },
  ref
) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Expose player methods to parent component
  useImperativeHandle(ref, () => ({
    seekTo: (timeInSeconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    getCurrentTime: () => {
      return videoRef.current ? videoRef.current.currentTime : 0;
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    play: () => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    },
  }));

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause(videoRef.current.currentTime);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) onTimeUpdate(curr);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percent * duration;

    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    if (onSeek) onSeek(targetTime);
  };

  const handleTimelineMouseMove = (e) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const skipSeconds = (sec) => {
    if (!videoRef.current || !duration) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const stepFrame = (forward = true) => {
    if (!videoRef.current || !duration) return;
    // Assume standard 24/30fps -> ~0.04s per frame
    const frameTime = 0.04;
    const target = forward
      ? Math.min(duration, videoRef.current.currentTime + frameTime)
      : Math.max(0, videoRef.current.currentTime - frameTime);

    videoRef.current.pause();
    setIsPlaying(false);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.5;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('videoflow-player-wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Keyboard hotkeys (Space for play/pause, Left/Right arrow for seek)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-2);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="videoflow-player-wrapper"
      className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex flex-col group select-none"
    >
      {/* HTML5 Video Element */}
      <div
        className="relative flex-1 flex items-center justify-center bg-black cursor-pointer aspect-video"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Big play button overlay when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-brand-600/90 backdrop-blur-md text-white flex items-center justify-center shadow-glow animate-in zoom-in-75 duration-150">
              <Play className="w-7 h-7 fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Video Review Controls Bar */}
      <div className="bg-slate-950/95 border-t border-slate-800/80 p-3 sm:p-4 space-y-2.5">
        {/* Scrubber Timeline with Comment Markers */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          className="relative h-3 bg-slate-800/80 hover:h-4 rounded-full cursor-pointer transition-all flex items-center"
        >
          {/* Elapsed Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-brand-500 scale-100 group-hover:scale-125 transition-transform" />
          </div>

          {/* Timeline Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-white pointer-events-none shadow-lg z-30"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Frame-Accurate Comment Marker Pins */}
          {duration > 0 &&
            comments.map((c) => {
              const markerPercent = (c.timestamp / duration) * 100;
              const isResolved = c.status === 'RESOLVED';
              return (
                <div
                  key={c._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMarkerClick) onMarkerClick(c.timestamp, c);
                  }}
                  onMouseEnter={() => setActiveTooltip(c._id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-slate-950 transition-all z-20 cursor-pointer ${
                    isResolved
                      ? 'bg-emerald-400 hover:bg-emerald-300 shadow-glow-emerald hover:scale-150 opacity-80'
                      : 'bg-amber-400 hover:bg-amber-300 shadow-glow hover:scale-150'
                  }`}
                  style={{ left: `${markerPercent}%` }}
                >
                  {/* Tooltip on marker hover */}
                  {activeTooltip === c._id && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-left text-[11px] text-white shadow-2xl pointer-events-none whitespace-nowrap z-40 space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={`px-1 rounded font-bold uppercase ${isResolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {isResolved ? 'Resolved' : 'Open'}
                        </span>
                        <span className="font-mono text-slate-300 font-bold">{formatTime(c.timestamp)}</span>
                        <span className="text-slate-400">• {c.userId?.name}</span>
                      </div>
                      <p className="text-slate-300 text-[10px] max-w-xs truncate">
                        "{c.message}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Player Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300 text-xs">
          {/* Left Controls: Play, Step, Time */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white hover:text-brand-300 border border-slate-800 transition-all"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => stepFrame(false)}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Step Back 1 Frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => stepFrame(true)}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Step Forward 1 Frame"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="font-mono text-slate-200 text-xs pl-2 font-medium">
              <span className="text-brand-400">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed, Volume, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Playback speed selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px]">
              <span className="text-slate-500 font-mono">Speed:</span>
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-transparent font-mono text-slate-200 outline-none cursor-pointer"
              >
                <option value={0.25} className="bg-slate-900">0.25x</option>
                <option value={0.5} className="bg-slate-900">0.5x</option>
                <option value={0.75} className="bg-slate-900">0.75x</option>
                <option value={1} className="bg-slate-900">1.0x</option>
                <option value={1.25} className="bg-slate-900">1.25x</option>
                <option value={1.5} className="bg-slate-900">1.5x</option>
                <option value={2} className="bg-slate-900">2.0x</option>
              </select>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 accent-brand-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomVideoPlayer;
