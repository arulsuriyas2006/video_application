import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CustomVideoPlayer from '../components/video/CustomVideoPlayer';
import CommentPanel from '../components/video/CommentPanel';
import {
  Film,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Check,
  Building2,
  Play
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PublicReview() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(null);
  const [passcodeSubmitting, setPasscodeSubmitting] = useState(false);

  // Approval modal states
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVE'); // 'APPROVE' or 'REQUEST_CHANGES'
  const [reviewerName, setReviewerName] = useState(
    localStorage.getItem('videoflow_guest_name') || ''
  );
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Video review & comment states
  const playerRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [activeShapes, setActiveShapes] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAnnotating, setIsAnnotating] = useState(false);

  // Fetch session data
  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedPassToken = sessionStorage.getItem(`passcode_token_${token}`);
      const headers = {};
      if (storedPassToken) {
        headers['x-review-passcode-token'] = storedPassToken;
      }

      const res = await axios.get(`${API_BASE}/review-links/public/${token}`, {
        headers,
      });

      if (res.data?.success) {
        const data = res.data.data;
        if (data.requiresPasscode) {
          setRequiresPasscode(true);
          setSession(data);
        } else {
          setRequiresPasscode(false);
          setSession(data);
          setComments(data.comments || []);
          setAnnotations(data.annotations || []);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load client review session'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSession();
    }
  }, [token]);

  // Handle Passcode Unlock
  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setPasscodeSubmitting(true);
    setPasscodeError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/review-links/public/${token}/verify`,
        { passcode: passcode.trim() }
      );
      if (res.data?.success && res.data.passcodeToken) {
        sessionStorage.setItem(
          `passcode_token_${token}`,
          res.data.passcodeToken
        );
        setPasscode('');
        fetchSession();
      }
    } catch (err) {
      setPasscodeError(
        err.response?.data?.message || 'Incorrect access passcode'
      );
    } finally {
      setPasscodeSubmitting(false);
    }
  };

  // Handle guest comment addition
  const handleAddComment = async (
    timestamp,
    message,
    shapes = [],
    audioBlob = null,
    audioDuration = 0
  ) => {
    try {
      const storedName = reviewerName.trim() || 'Client Reviewer';
      localStorage.setItem('videoflow_guest_name', storedName);

      const res = await axios.post(
        `${API_BASE}/review-links/public/${token}/comments`,
        {
          timestamp,
          message,
          authorName: storedName,
          shapes,
        }
      );

      if (res.data?.success) {
        setComments((prev) => [...prev, res.data.data]);
        setActiveShapes([]);
        setIsAnnotating(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post feedback');
    }
  };

  // Submit Approval / Change Request decision
  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await axios.post(
        `${API_BASE}/review-links/public/${token}/decision`,
        {
          decision: decisionType,
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail.trim(),
          notes: decisionNotes.trim(),
        }
      );

      if (res.data?.success) {
        localStorage.setItem('videoflow_guest_name', reviewerName.trim());
        setSession((prev) => ({
          ...prev,
          link: {
            ...prev.link,
            approvalStatus: res.data.data.approvalStatus,
            clientReviewerName: res.data.data.clientReviewerName,
            approvalNotes: decisionNotes.trim(),
            decidedAt: res.data.data.decidedAt,
          },
        }));
        setIsDecisionModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 flex items-center px-6">
          <div className="flex items-center gap-2 font-black text-white text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span>VideoFlow</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs font-medium">Opening secure client review room...</span>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 flex items-center px-6">
          <div className="flex items-center gap-2 font-black text-white text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>VideoFlow</span>
          </div>
        </header>
        <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white">Access Denied or Link Expired</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // Passcode Challenge Screen
  if (requiresPasscode) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 font-black text-white text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>VideoFlow</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Passcode Protected</span>
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-glow">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">Enter Review Passcode</h2>
              <p className="text-xs text-slate-400">
                This video cut is confidential. Enter the security passcode provided by the production team.
              </p>
            </div>

            {passcodeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handlePasscodeSubmit} className="space-y-3">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter access passcode"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-2xl px-4 py-3 text-center text-white placeholder-slate-600 outline-none font-mono text-sm tracking-widest"
              />

              <button
                type="submit"
                disabled={passcodeSubmitting || !passcode.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {passcodeSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock Video Review</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const { link, project, video } = session;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black text-white text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>VideoFlow</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium truncate max-w-[200px]">
              {project?.name}
            </span>
            <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-extrabold text-[10px] border border-brand-500/30">
              V{video?.versionNumber}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {link.allowDownload && video?.filePath && (
            <a
              href={video.filePath}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Cut</span>
            </a>
          )}

          {link.approvalStatus === 'PENDING' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDecisionType('REQUEST_CHANGES');
                  setIsDecisionModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all"
              >
                Request Changes
              </button>

              <button
                onClick={() => {
                  setDecisionType('APPROVE');
                  setIsDecisionModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-glow active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Cut</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-4">
        {/* Decision Banner if already decided */}
        {link.approvalStatus === 'APPROVED' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-glow">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Cut Approved for Final Delivery</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    OFFICIAL SIGN-OFF
                  </span>
                </h3>
                <p className="text-slate-300 text-[11px] pt-0.5">
                  Approved by <strong>{link.clientReviewerName}</strong> on{' '}
                  {link.decidedAt ? new Date(link.decidedAt).toLocaleString() : 'recently'}
                  {link.approvalNotes && ` — "${link.approvalNotes}"`}
                </p>
              </div>
            </div>
          </div>
        )}

        {link.approvalStatus === 'CHANGES_REQUESTED' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-rose-500/15 border border-rose-500/40 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Revisions Requested</h3>
                <p className="text-slate-300 text-[11px] pt-0.5">
                  Requested by <strong>{link.clientReviewerName}</strong>
                  {link.approvalNotes && `: "${link.approvalNotes}"`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setDecisionType('APPROVE');
                setIsDecisionModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Update to Approved
            </button>
          </div>
        )}

        {/* Video Player + Comment Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
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
                if (playerRef.current) playerRef.current.seekTo(c.timestamp);
              }}
            />

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{video.title}</span>
                <span>•</span>
                <span>{video.width}x{video.height}</span>
              </div>
              <div className="font-mono text-[11px]">
                {comments.length} Review Notes
              </div>
            </div>
          </div>

          {/* Comment Sidebar */}
          <div className="lg:col-span-1">
            {link.allowComments ? (
              <CommentPanel
                comments={comments}
                currentTime={currentTime}
                activeShapes={activeShapes}
                onSeek={(ts) => playerRef.current?.seekTo(ts)}
                onAddComment={handleAddComment}
                onResolveToggle={() => {}}
                onReplyAdded={() => {}}
                onDeleteComment={() => {}}
                onStartAnnotation={() => setIsAnnotating(true)}
                onClearShapes={() => setActiveShapes([])}
              />
            ) : (
              <div className="glass-panel rounded-2xl p-6 text-center border border-slate-800 text-xs text-slate-400 space-y-2">
                <Lock className="w-6 h-6 text-slate-500 mx-auto" />
                <h4 className="font-bold text-white text-sm">Feedback Closed</h4>
                <p>Comments and annotations are disabled for this preview link.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Client Sign-Off Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="space-y-1.5 text-center">
              <div
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
                  decisionType === 'APPROVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {decisionType === 'APPROVE' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-black text-white">
                {decisionType === 'APPROVE' ? 'Approve Video Cut' : 'Request Revisions'}
              </h3>
              <p className="text-xs text-slate-400">
                {decisionType === 'APPROVE'
                  ? `You are providing formal sign-off for "${video.title}" (V${video.versionNumber}).`
                  : `Please provide revision instructions for the editing team.`}
              </p>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Jane Doe (Marketing Director)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="e.g. jane@clientcompany.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sign-Off Notes / Feedback
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    decisionType === 'APPROVE'
                      ? 'e.g. Color grade and pacing look fantastic. Approved!'
                      : 'e.g. Please increase audio volume on dialogue at 00:15.'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingDecision}
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-glow flex items-center gap-1.5 transition-all ${
                    decisionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {decisionType === 'APPROVE' ? 'Confirm Approval' : 'Submit Revisions'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
