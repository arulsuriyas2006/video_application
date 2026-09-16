import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomVideoPlayer from '../components/video/CustomVideoPlayer';
import CommentPanel from '../components/video/CommentPanel';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
  AlertCircle,
  Columns,
  Radio,
  Users,
  Eye,
  Share2
} from 'lucide-react';
import ShareReviewModal from '../components/video/ShareReviewModal';

export default function VideoReview() {
  const { projectId, videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    activeViewers,
    joinVideoRoom,
    leaveVideoRoom,
    emitCowatchSync,
  } = useSocket();

  const playerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [project, setProject] = useState(null);
  const [video, setVideo] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [activeShapes, setActiveShapes] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time toast and presence state
  const [toastMessage, setToastMessage] = useState(null);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, videoRes, versionsRes, commentsRes, annotationsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/videos/${videoId}`),
        api.get(`/projects/${projectId}/versions`),
        api.get(`/videos/${videoId}/comments`),
        api.get(`/videos/${videoId}/annotations`),
      ]);

      if (projectRes.data?.success) setProject(projectRes.data.data);
      if (videoRes.data?.success) setVideo(videoRes.data.data);
      if (versionsRes.data?.success) setVersions(versionsRes.data.data);
      if (commentsRes.data?.success) setComments(commentsRes.data.data);
      if (annotationsRes.data?.success) setAnnotations(annotationsRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load video review session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, videoId]);

  // Join video review socket room with user presence
  useEffect(() => {
    if (videoId && user) {
      joinVideoRoom(videoId, user);
    }
    return () => {
      if (videoId) {
        leaveVideoRoom(videoId);
      }
    };
  }, [videoId, user, joinVideoRoom, leaveVideoRoom]);

  // Socket event listeners for real-time collaboration
  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (data) => {
      if (data.videoId === videoId && data.comment) {
        setComments((prev) => {
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [...prev, data.comment].sort((a, b) => a.timestamp - b.timestamp);
        });

        if (data.comment.annotationId) {
          api
            .get(`/videos/${videoId}/annotations`)
            .then((res) => {
              if (res.data?.success) setAnnotations(res.data.data);
            })
            .catch(() => {});
        }

        const author = data.comment.userId?.name || 'A reviewer';
        showToast(`💬 ${author} added feedback at ${Math.floor(data.comment.timestamp)}s`);
      }
    };

    const handleNewReply = (data) => {
      if (data.reply && data.parentCommentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === data.parentCommentId) {
              const existingReplies = c.replies || [];
              if (existingReplies.some((r) => r._id === data.reply._id)) return c;
              return { ...c, replies: [...existingReplies, data.reply] };
            }
            return c;
          })
        );
        const replier = data.reply.userId?.name || 'A reviewer';
        showToast(`↩️ ${replier} replied to feedback`);
      }
    };

    const handleCommentResolved = (data) => {
      if (data.commentId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === data.commentId
              ? {
                  ...c,
                  status: data.status,
                  resolvedBy: data.resolvedBy,
                  resolvedAt: data.resolvedAt,
                }
              : c
          )
        );
        showToast(`✓ Feedback marked as ${data.status}`);
      }
    };

    const handleCommentDeleted = (data) => {
      if (data.commentId) {
        setComments((prev) => prev.filter((c) => c._id !== data.commentId));
        setAnnotations((prev) =>
          prev.filter(
            (a) =>
              a.commentId?._id !== data.commentId && a.commentId !== data.commentId
          )
        );
        showToast(`🗑️ Feedback removed`);
      }
    };

    socket.on('new_comment', handleNewComment);
    socket.on('new_reply', handleNewReply);
    socket.on('comment_resolved', handleCommentResolved);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.off('new_comment', handleNewComment);
      socket.off('new_reply', handleNewReply);
      socket.off('comment_resolved', handleCommentResolved);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [socket, videoId]);

  const handleSeek = (timestamp, comment = null) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
    if (comment) {
      setActiveCommentId(comment._id);
    }
  };

  const handleAddComment = async (
    timestamp,
    message,
    shapes = [],
    audioBlob = null,
    audioDuration = 0
  ) => {
    let payload;
    let headers = {};

    if (audioBlob) {
      const formData = new FormData();
      formData.append('timestamp', timestamp);
      formData.append('message', message || '');
      formData.append('voiceNoteDuration', audioDuration || 0);
      if (shapes && shapes.length > 0) {
        formData.append('shapes', JSON.stringify(shapes));
      }
      formData.append('audio', audioBlob, 'voice-note.webm');
      payload = formData;
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      payload = {
        timestamp,
        message,
        shapes,
      };
    }

    const res = await api.post(`/videos/${videoId}/comments`, payload, { headers });
    if (res.data?.success) {
      const [commentsRes, annotationsRes] = await Promise.all([
        api.get(`/videos/${videoId}/comments`),
        api.get(`/videos/${videoId}/annotations`),
      ]);
      if (commentsRes.data?.success) setComments(commentsRes.data.data);
      if (annotationsRes.data?.success) setAnnotations(annotationsRes.data.data);
      setActiveShapes([]);
      setIsAnnotating(false);
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
      setAnnotations((prev) => prev.filter((a) => a.commentId?._id !== commentId && a.commentId !== commentId));
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
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white relative">
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

          {/* Right Header Toolbar: Collaborators Presence & Versions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Presence Pill */}
            <div className="relative">
              <button
                onClick={() => setShowPresenceModal(!showPresenceModal)}
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs transition-all shadow-sm"
                title="View active collaborators in this review room"
              >
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-slate-200 text-xs">
                    {activeViewers.length > 0 ? `${activeViewers.length} Online` : '1 Online'}
                  </span>
                </div>

                {/* Avatar stack */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  {activeViewers.slice(0, 3).map((viewer, idx) => (
                    <div
                      key={viewer.socketId || viewer.id || idx}
                      className="w-5 h-5 rounded-full border-2 border-slate-900 bg-brand-600 text-[9px] font-bold text-white flex items-center justify-center"
                      title={viewer.name}
                    >
                      {viewer.name?.charAt(0) || 'U'}
                    </div>
                  ))}
                  {activeViewers.length > 3 && (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-800 text-[8px] font-bold text-slate-300 flex items-center justify-center">
                      +{activeViewers.length - 3}
                    </div>
                  )}
                </div>
              </button>

              {/* Active Collaborators Dropdown */}
              {showPresenceModal && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 z-50 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                    <span>Collaborators in Room</span>
                    <span className="text-emerald-400 font-mono text-[10px]">{activeViewers.length || 1} active</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeViewers.length === 0 ? (
                      <div className="text-xs text-slate-300 py-1.5 px-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold">{user?.name}</span>
                        <span className="text-[10px] text-slate-500">(You)</span>
                      </div>
                    ) : (
                      activeViewers.map((viewer, idx) => (
                        <div
                          key={viewer.socketId || viewer.id || idx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {viewer.name?.charAt(0) || 'U'}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-slate-200 text-xs truncate">
                                {viewer.name}{' '}
                                {viewer.id === user?._id && (
                                  <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{viewer.role || 'VIEWER'}</div>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Compare Cuts Button */}
            {versions.length >= 2 && (
              <Link
                to={`/compare/${projectId}/${versions[1]._id}/${versions[0]._id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all"
                title="Compare Video Cuts Side-by-Side"
              >
                <Columns className="w-3.5 h-3.5 text-brand-400" />
                <span>Compare Cuts</span>
              </Link>
            )}

            {/* Share Review Link Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all"
              title="Generate Client Review Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>

            {/* Version Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Cut:</span>
              <select
                value={videoId}
                onChange={(e) =>
                  navigate(`/review/${projectId}/${e.target.value}`)
                }
                className="bg-transparent font-bold text-slate-200 outline-none cursor-pointer text-xs"
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
              savedAnnotations={annotations}
              activeShapes={activeShapes}
              onAddShape={(shape) =>
                setActiveShapes((prev) => [...prev, shape])
              }
              onClearShapes={() => setActiveShapes([])}
              onTimeUpdate={(time) => setCurrentTime(time)}
              isAnnotating={isAnnotating}
              setIsAnnotating={setIsAnnotating}
              onCommentMarkerClick={(c) => {
                handleSeek(c.timestamp, c);
              }}
            />
          </div>

          {/* Comment Panel Sidebar (1 column on lg) */}
          <div className="lg:col-span-1">
            <CommentPanel
              comments={comments}
              currentTime={currentTime}
              activeShapes={activeShapes}
              activeCommentId={activeCommentId}
              onSeek={handleSeek}
              onAddComment={handleAddComment}
              onResolveToggle={handleResolveToggle}
              onReplyAdded={handleReplyAdded}
              onDeleteComment={handleDeleteComment}
              onStartAnnotation={() => setIsAnnotating(true)}
              onClearShapes={() => setActiveShapes([])}
            />
          </div>
        </div>
      </main>

      {/* Real-time Collaboration Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-brand-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-3 backdrop-blur-md animate-in fade-in duration-200">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Share Review Modal */}
      <ShareReviewModal
        videoId={videoId}
        videoTitle={video?.title}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
