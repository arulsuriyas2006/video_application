import React, { useState, useRef } from 'react';
import api from '../../services/api';
import {
  UploadCloud,
  X,
  Film,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileVideo,
  Sparkles
} from 'lucide-react';

export default function VideoUploadModal({ projectId, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | success | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const selectFile = (selected) => {
    // Validate file type
    const validExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
    const fileName = selected.name.toLowerCase();
    const isValid =
      selected.type.startsWith('video/') ||
      validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage(
        'Please select a supported video file (MP4, MOV, WEBM, MKV, AVI)'
      );
      return;
    }

    setFile(selected);
    setErrorMessage(null);
    if (!title) {
      // Auto-set title from file name without extension
      const baseName = selected.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please choose a video file to upload');
      return;
    }

    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('projectId', projectId);
    formData.append('title', title);

    try {
      const res = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
            if (percent === 100) {
              setStatus('processing');
            }
          }
        },
      });

      if (res.data?.success) {
        setStatus('success');
        setTimeout(() => {
          onUploadSuccess(res.data.data);
          onClose();
        }, 1200);
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      setStatus('error');
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Failed to upload and process video'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-lg w-full glass-panel-glow rounded-2xl p-6 sm:p-7 border border-indigo-500/30 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-brand-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Video Cut</h3>
              <p className="text-[11px] text-slate-400">
                Creates a new version with automated FFmpeg metadata & thumbnails
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={status === 'uploading' || status === 'processing'}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'success' ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Video Uploaded & Processed!</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              FFmpeg generated metadata and thumbnails. Added to project versions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/avi,.mp4,.mov,.webm,.mkv,.avi"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-400 hover:underline">
                    Click to choose a different video
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      Click to browse or drag & drop video cut
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Supports MP4, MOV, WEBM, MKV, AVI (up to 500MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Cut / Version Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broadcast Cut - Final Color Pass"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100 placeholder:text-slate-600"
              />
            </div>

            {/* Progress Bar */}
            {(status === 'uploading' || status === 'processing') && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                    {status === 'uploading'
                      ? `Uploading Video (${uploadProgress}%)`
                      : 'Processing with FFmpeg (Metadata & Thumbnails)...'}
                  </span>
                  <span className="font-mono text-brand-400">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'uploading' || status === 'processing'}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!file || status === 'uploading' || status === 'processing'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow active:scale-95 transition-all disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Version</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
