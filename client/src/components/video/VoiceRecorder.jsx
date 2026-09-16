import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Check,
  X,
  Play,
  Pause,
  AlertCircle,
  Volume2
} from 'lucide-react';

export default function VoiceRecorder({ onAudioReady, onCancel, maxDuration = 120 }) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'recorded'
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const previewAudioRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Audio Recording
  const startRecording = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioDuration(recordingTime);
        setRecordingState('recorded');

        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start(200); // chunk every 200ms
      setRecordingState('recording');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser.'
          : err.message || 'Failed to initialize microphone recording.'
      );
      setRecordingState('idle');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // Re-record
  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setRecordingTime(0);
    setRecordingState('idle');
    setPreviewPlaying(false);
  };

  // Attach & Complete
  const handleConfirm = () => {
    if (audioBlob && onAudioReady) {
      onAudioReady(audioBlob, audioDuration);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-brand-500/30 space-y-3 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white text-xs">Voice Feedback Note</span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Cancel Voice Note"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      {/* STATE 1: IDLE - Ready to record */}
      {recordingState === 'idle' && (
        <div className="py-4 flex flex-col items-center justify-center space-y-3 text-center">
          <button
            type="button"
            onClick={startRecording}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-glow-rose active:scale-95 transition-all group"
            title="Start Recording"
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-200">Click to record voice note</p>
            <p className="text-[11px] text-slate-500">
              Maximum length: {Math.floor(maxDuration / 60)} minutes
            </p>
          </div>
        </div>
      )}

      {/* STATE 2: RECORDING - Live in progress */}
      {recordingState === 'recording' && (
        <div className="py-3 flex flex-col items-center justify-center space-y-3.5">
          {/* Pulsing indicator & timer */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="font-mono font-bold text-rose-300 text-sm tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Animated soundwave bars */}
          <div className="flex items-center gap-1 h-8">
            {[40, 80, 50, 100, 70, 90, 60, 100, 45, 75, 95, 60, 80, 40].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-rose-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i % 5) * 120}ms`,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>

          {/* Stop Button */}
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-glow-rose active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {/* STATE 3: RECORDED - Preview & Confirm */}
      {recordingState === 'recorded' && audioUrl && (
        <div className="space-y-3">
          <audio
            ref={previewAudioRef}
            src={audioUrl}
            onEnded={() => setPreviewPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                const a = previewAudioRef.current;
                if (!a) return;
                if (previewPlaying) {
                  a.pause();
                  setPreviewPlaying(false);
                } else {
                  a.play();
                  setPreviewPlaying(true);
                }
              }}
              className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow active:scale-95 transition-all flex-shrink-0"
              title={previewPlaying ? 'Pause Preview' : 'Play Preview'}
            >
              {previewPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex-1 text-xs">
              <p className="font-semibold text-white">Voice Note Preview</p>
              <p className="text-[10px] font-mono text-slate-400">
                Duration: {formatTime(audioDuration)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Re-record"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Attach Voice Note</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
