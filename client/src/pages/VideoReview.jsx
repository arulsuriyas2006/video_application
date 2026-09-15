import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomVideoPlayer from '../components/video/CustomVideoPlayer';
import CommentPanel from '../components/video/CommentPanel';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft,
  Film,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Layers,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function VideoReview() {
  const { projectId, videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const playerRef = useRef(null);

  const [project, setProject] = useState(null);
  const [video, setVideo] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, videoRes, versionsRes, commentsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/videos/${videoId}`),
        api.get(`/projects/${projectId}/versions`),
        api.get(`/videos/${videoId}/comments`),
      ]);

      if (projectRes.data?.success) setProject(projectRes.data.data);
      if (videoRes.data?.success) setVideo(videoRes.data.data);
      if (versionsRes.data?.success) setVersions(versionsRes.data.data);
      if (commentsRes.data?.success) setComments(commentsRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load video review session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, videoId]);

  const handleSeek = (timestamp) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const handleAddComment = async (timestamp, message) => {
    const res = await api.post(`/videos/${videoId}/comments`, {
      timestamp,
      message,
    });
    if (res.data?.success) {
      // Re-fetch comments to maintain timeline order
      const commentsRes = await api.get(`/videos/${videoId}/comments`);
      if (commentsRes.data?.success) setComments(commentsRes.data.data);
    }
  };

  const handleResolveToggle = async (commentId) => {
    const res = await api.patch(`/comments/${commentId}/resolve`);
    if (res.data?.success) {
      const updated = res.data.data;
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, status: updated.status } : c
        )
      );
    }
  };

  const handleReplyAdded = async (commentId, message) => {
    const res = await api.post(`/comments/${commentId}/replies`, { message });
    if (res.data?.success) {
      const reply = res.data.data;
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        )
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs">Preparing video review room...</span>
        </div>
      </div>
    );
  }

  if (error || !video || !project) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || 'Video cut not found'}</span>
          </div>
          <Link
            to={`/projects/${projectId}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {project.name}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/20 border border-brand-500/40 text-brand-300 font-extrabold text-xs">
                V{video.versionNumber}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {video.title}
              </h1>
              <StatusBadge status={video.status} />
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2 pt-0.5">
              <span>Client: <strong className="text-slate-200">{project.clientId?.company}</strong></span>
              <span>•</span>
              <span>Uploaded by {video.uploadedBy?.name}</span>
              <span>•</span>
              <span>{video.width}x{video.height}</span>
            </p>
          </div>

          {/* Version Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Switch Version:</span>
              <select
                value={videoId}
                onChange={(e) =>
                  navigate(`/review/${projectId}/${e.target.value}`)
                }
                className="bg-transparent font-bold text-slate-200 outline-none cursor-pointer"
              >
                {versions.map((ver) => (
                  <option
                    key={ver._id}
                    value={ver._id}
                    className="bg-slate-900 text-slate-200"
                  >
                    V{ver.versionNumber} — {ver.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Video Player + Comment Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Video Player (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <CustomVideoPlayer
              ref={playerRef}
              videoUrl={video.filePath}
              comments={comments}
              onTimeUpdate={(t) => setCurrentTime(t)}
              onMarkerClick={(timestamp) => handleSeek(timestamp)}
            />

            {/* Quick tips bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Hotkeys: <strong className="text-slate-400">Space</strong> (Play/Pause) • <strong className="text-slate-400">&larr; / &rarr;</strong> (Seek 2s)</span>
              <span>Click any timeline pin to jump to feedback</span>
            </div>
          </div>

          {/* Timestamp Comment Sidebar (1 column on lg) */}
          <div className="lg:col-span-1 h-full min-h-[500px]">
            <CommentPanel
              videoId={video._id}
              currentTime={currentTime}
              comments={comments}
              onSeekToTimestamp={handleSeek}
              onAddComment={handleAddComment}
              onResolveToggle={handleResolveToggle}
              onReplyAdded={handleReplyAdded}
              onDeleteComment={handleDeleteComment}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
