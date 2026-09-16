import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  ArrowLeft,
  Columns,
  SplitSquareVertical,
  Repeat,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sliders,
  ChevronDown,
  Info,
  Layers,
  Clock,
  HardDrive,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';

const VIEW_MODES = {
  SIDE_BY_SIDE: 'SIDE_BY_SIDE',
  WIPE_SLIDER: 'WIPE_SLIDER',
  AB_FLIP: 'AB_FLIP',
};

const AUDIO_MODES = {
  V1: 'V1',
  V2: 'V2',
  MUTE: 'MUTE',
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms
    .toString()
    .padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const sign = bytes < 0 ? '-' : '+';
  return `${sign}${parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function VersionCompare() {
  const { projectId, v1Id, v2Id } = useParams();
  const navigate = useNavigate();

  // Data states
  const [data, setData] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Playback & Synchronization states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [viewMode, setViewMode] = useState(VIEW_MODES.SIDE_BY_SIDE);
  const [audioSource, setAudioSource] = useState(AUDIO_MODES.V2);
  const [wipePosition, setWipePosition] = useState(50); // percentage 0 - 100
  const [activeFlipCut, setActiveFlipCut] = useState('V2'); // 'V1' or 'V2'
  const [showStatsDrawer, setShowStatsDrawer] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video refs
  const v1VideoRef = useRef(null);
  const v2VideoRef = useRef(null);
  const wipeContainerRef = useRef(null);
  const isDraggingWipe = useRef(false);
  const workspaceContainerRef = useRef(null);

  // Load project versions and comparison data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [compareRes, versionsRes] = await Promise.all([
          api.get(`/projects/${projectId}/compare?v1=${v1Id}&v2=${v2Id}`),
          api.get(`/projects/${projectId}/versions`),
        ]);

        if (isMounted) {
          if (compareRes.data?.success) {
            setData(compareRes.data.data);
            const maxDuration = Math.max(
              compareRes.data.data.v1.duration || 0,
              compareRes.data.data.v2.duration || 0
            );
            setDuration(maxDuration);
          }
          if (versionsRes.data?.success) {
            setAllVersions(versionsRes.data.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load video comparison data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId, v1Id, v2Id]);

  // Manage audio mute states
  useEffect(() => {
    if (v1VideoRef.current) {
      v1VideoRef.current.muted = audioSource !== AUDIO_MODES.V1;
    }
    if (v2VideoRef.current) {
      v2VideoRef.current.muted = audioSource !== AUDIO_MODES.V2;
    }
  }, [audioSource]);

  // Master Play / Pause
  const togglePlayPause = () => {
    const v1 = v1VideoRef.current;
    const v2 = v2VideoRef.current;
    if (!v1 || !v2) return;

    if (isPlaying) {
      v1.pause();
      v2.pause();
      setIsPlaying(false);
    } else {
      // Sync positions before play
      v2.currentTime = v1.currentTime;
      Promise.all([v1.play(), v2.play()])
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Synchronized seek
  const handleSeek = (time) => {
    const v1 = v1VideoRef.current;
    const v2 = v2VideoRef.current;
    const target = Math.max(0, Math.min(time, duration));
    if (v1) v1.currentTime = target;
    if (v2) v2.currentTime = target;
    setCurrentTime(target);
  };

  // Frame Stepping (1 frame ~ 1/30 sec)
  const stepFrame = (forward = true) => {
    const frameTime = 1 / 30;
    const nextTime = forward ? currentTime + frameTime : currentTime - frameTime;
    handleSeek(nextTime);
  };

  // Skip relative
  const skipRelative = (deltaSeconds) => {
    handleSeek(currentTime + deltaSeconds);
  };

  // Rate change
  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (v1VideoRef.current) v1VideoRef.current.playbackRate = rate;
    if (v2VideoRef.current) v2VideoRef.current.playbackRate = rate;
  };

  // Sync monitor: keep slave video aligned with master video
  const handleV1TimeUpdate = () => {
    const v1 = v1VideoRef.current;
    const v2 = v2VideoRef.current;
    if (!v1) return;

    setCurrentTime(v1.currentTime);

    // If drift is greater than 50ms, re-sync v2
    if (v2 && Math.abs(v1.currentTime - v2.currentTime) > 0.05) {
      v2.currentTime = v1.currentTime;
    }
  };

  // End of video reached
  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Wipe slider mouse drag handlers
  const handleWipeMove = useCallback((clientX) => {
    if (!wipeContainerRef.current) return;
    const rect = wipeContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setWipePosition(pct);
  }, []);

  const handleMouseDownWipe = (e) => {
    isDraggingWipe.current = true;
    handleWipeMove(e.clientX);

    const onMouseMove = (moveEvent) => {
      if (isDraggingWipe.current) {
        handleWipeMove(moveEvent.clientX);
      }
    };

    const onMouseUp = () => {
      isDraggingWipe.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Switch versions in comparison
  const handleVersionChange = (side, newVersionId) => {
    if (side === 'v1') {
      navigate(`/compare/${projectId}/${newVersionId}/${v2Id}`);
    } else {
      navigate(`/compare/${projectId}/${v1Id}/${newVersionId}`);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!workspaceContainerRef.current) return;
    if (!document.fullscreenElement) {
      workspaceContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs">Preparing Video Comparison Workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || 'Comparison could not be initiated.'}</span>
          </div>
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const { project, v1, v2, diffStats } = data;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col space-y-4">
        {/* Top Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${projectId}`}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Return to Project"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white truncate max-w-[280px] sm:max-w-md">
                  {project.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold">
                  Version Diff
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronized dual-player comparison & revision analysis
              </p>
            </div>
          </div>

          {/* Version Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-amber-400 font-bold text-[11px]">A:</span>
              <select
                value={v1Id}
                onChange={(e) => handleVersionChange('v1', e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
              >
                {allVersions.map((ver) => (
                  <option
                    key={ver._id}
                    value={ver._id}
                    disabled={ver._id === v2Id}
                    className="bg-slate-900 text-slate-200"
                  >
                    V{ver.versionNumber} ({ver.title})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600 font-bold text-xs">VS</span>

            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-cyan-400 font-bold text-[11px]">B:</span>
              <select
                value={v2Id}
                onChange={(e) => handleVersionChange('v2', e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
              >
                {allVersions.map((ver) => (
                  <option
                    key={ver._id}
                    value={ver._id}
                    disabled={ver._id === v1Id}
                    className="bg-slate-900 text-slate-200"
                  >
                    V{ver.versionNumber} ({ver.title})
                  </option>
                ))}
              </select>
            </div>

            {/* Diff Stats Toggle */}
            <button
              onClick={() => setShowStatsDrawer(!showStatsDrawer)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                showStatsDrawer
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                  : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Diff Insights"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold text-[11px]">Diff Stats</span>
            </button>
          </div>
        </div>

        {/* Diff Stats Overview Bar */}
        {showStatsDrawer && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
            <div className="space-y-0.5 border-r border-slate-800/60 pr-2">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-400" />
                <span>Duration Delta</span>
              </div>
              <div
                className={`font-mono font-bold ${
                  diffStats.durationDeltaSeconds > 0
                    ? 'text-amber-400'
                    : diffStats.durationDeltaSeconds < 0
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}
              >
                {diffStats.durationDeltaSeconds > 0 ? `+` : ``}
                {diffStats.durationDeltaSeconds}s
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  ({v1.duration}s &rarr; {v2.duration}s)
                </span>
              </div>
            </div>

            <div className="space-y-0.5 border-r border-slate-800/60 pr-2">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                <span>File Size Delta</span>
              </div>
              <div className="font-mono font-bold text-slate-200">
                {formatBytes(diffStats.fileSizeDeltaBytes)}
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  ({(v1.fileSize / (1024 * 1024)).toFixed(1)}M &rarr;{' '}
                  {(v2.fileSize / (1024 * 1024)).toFixed(1)}M)
                </span>
              </div>
            </div>

            <div className="space-y-0.5 border-r border-slate-800/60 pr-2">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                <span>V1 Feedback</span>
              </div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span>{diffStats.v1TotalComments} comments</span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  ({diffStats.v1ResolvedComments} resolved)
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>V2 Feedback</span>
              </div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span>{diffStats.v2TotalComments} comments</span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  ({diffStats.v2ResolvedComments} resolved)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Mode & Audio Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          {/* View Modes */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode(VIEW_MODES.SIDE_BY_SIDE)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === VIEW_MODES.SIDE_BY_SIDE
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => setViewMode(VIEW_MODES.WIPE_SLIDER)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === VIEW_MODES.WIPE_SLIDER
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Wipe Slider</span>
            </button>

            <button
              onClick={() => setViewMode(VIEW_MODES.AB_FLIP)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === VIEW_MODES.AB_FLIP
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>A/B Flip</span>
            </button>
          </div>

          {/* Audio Source & Quick Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
              <span className="text-slate-400 text-[10px] px-1.5 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span>Audio:</span>
              </span>
              <button
                onClick={() => setAudioSource(AUDIO_MODES.V1)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  audioSource === AUDIO_MODES.V1
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                V{v1.versionNumber} (A)
              </button>
              <button
                onClick={() => setAudioSource(AUDIO_MODES.V2)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  audioSource === AUDIO_MODES.V2
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                V{v2.versionNumber} (B)
              </button>
              <button
                onClick={() => setAudioSource(AUDIO_MODES.MUTE)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  audioSource === AUDIO_MODES.MUTE
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mute
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Workspace Container */}
        <div
          ref={workspaceContainerRef}
          className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex-1 flex flex-col justify-center min-h-[420px]"
        >
          {/* MODE 1: SIDE BY SIDE */}
          {viewMode === VIEW_MODES.SIDE_BY_SIDE && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 h-full">
              {/* Left Cut (V1) */}
              <div className="relative rounded-xl overflow-hidden bg-black flex flex-col justify-center aspect-video group">
                <video
                  ref={v1VideoRef}
                  src={v1.filePath}
                  playsInline
                  onTimeUpdate={handleV1TimeUpdate}
                  onEnded={handleEnded}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>V{v1.versionNumber} (Cut A)</span>
                </div>
                <div className="absolute bottom-2 left-2 text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                  {v1.title}
                </div>
              </div>

              {/* Right Cut (V2) */}
              <div className="relative rounded-xl overflow-hidden bg-black flex flex-col justify-center aspect-video group">
                <video
                  ref={v2VideoRef}
                  src={v2.filePath}
                  playsInline
                  onEnded={handleEnded}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>V{v2.versionNumber} (Cut B)</span>
                </div>
                <div className="absolute bottom-2 right-2 text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                  {v2.title}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: WIPE SLIDER */}
          {viewMode === VIEW_MODES.WIPE_SLIDER && (
            <div
              ref={wipeContainerRef}
              className="relative w-full aspect-video max-h-[70vh] mx-auto bg-black select-none overflow-hidden"
              onMouseDown={handleMouseDownWipe}
            >
              {/* Bottom Layer: V1 (Cut A) */}
              <video
                ref={v1VideoRef}
                src={v1.filePath}
                playsInline
                onTimeUpdate={handleV1TimeUpdate}
                onEnded={handleEnded}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Top Layer: V2 (Cut B) clipped from left up to wipePosition */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(${wipePosition}% 0, 100% 0, 100% 100%, ${wipePosition}% 100%)`,
                }}
              >
                <video
                  ref={v2VideoRef}
                  src={v2.filePath}
                  playsInline
                  onEnded={handleEnded}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                style={{ left: `${wipePosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-[11px] font-bold">
                  ↔
                </div>
              </div>

              {/* Badges indicating left and right versions */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-black z-10 pointer-events-none">
                V{v1.versionNumber} (A)
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-black z-10 pointer-events-none">
                V{v2.versionNumber} (B)
              </div>
            </div>
          )}

          {/* MODE 3: A/B FLIP */}
          {viewMode === VIEW_MODES.AB_FLIP && (
            <div className="relative w-full aspect-video max-h-[70vh] mx-auto bg-black select-none overflow-hidden">
              <video
                ref={v1VideoRef}
                src={v1.filePath}
                playsInline
                onTimeUpdate={handleV1TimeUpdate}
                onEnded={handleEnded}
                className={`w-full h-full object-contain ${
                  activeFlipCut === 'V1' ? 'block' : 'hidden'
                }`}
              />
              <video
                ref={v2VideoRef}
                src={v2.filePath}
                playsInline
                onEnded={handleEnded}
                className={`w-full h-full object-contain ${
                  activeFlipCut === 'V2' ? 'block' : 'hidden'
                }`}
              />

              {/* Flip Controller Button & Overlay */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveFlipCut((prev) => (prev === 'V1' ? 'V2' : 'V1'))
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all active:scale-95"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Switch Cut (Current: {activeFlipCut})</span>
                </button>
              </div>

              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold z-10">
                Viewing: {activeFlipCut === 'V1' ? `V${v1.versionNumber} (${v1.title})` : `V${v2.versionNumber} (${v2.title})`}
              </div>
            </div>
          )}
        </div>

        {/* Master Control Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          {/* Scrubber Timeline */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-brand-400 font-bold min-w-[65px]">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.01}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:h-2.5 transition-all"
              />
            </div>

            <span className="text-xs font-mono text-slate-400 font-medium min-w-[65px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Master Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Skip -5s */}
              <button
                onClick={() => skipRelative(-5)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Rewind 5s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Step -1 Frame */}
              <button
                onClick={() => stepFrame(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono"
                title="Step -1 frame (1/30s)"
              >
                -1f
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Step +1 Frame */}
              <button
                onClick={() => stepFrame(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono"
                title="Step +1 frame (1/30s)"
              >
                +1f
              </button>

              {/* Skip +5s */}
              <button
                onClick={() => skipRelative(5)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Forward 5s"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback speed presets */}
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-xl text-xs">
              <span className="text-slate-500 text-[10px] mr-1">Speed:</span>
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                    playbackRate === rate
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
