import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  CornerDownRight,
  Reply,
  Check,
  RotateCcw,
  User,
  Sparkles,
  Loader2,
  Trash2,
  ShieldCheck,
  Film
} from 'lucide-react';

export default function CommentPanel({
  videoId,
  currentTime,
  comments = [],
  onSeekToTimestamp,
  onAddComment,
  onResolveToggle,
  onReplyAdded,
  onDeleteComment,
}) {
  const { user } = useAuth();
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [message, setMessage] = useState('');
  const [capturedTimestamp, setCapturedTimestamp] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | OPEN | RESOLVED
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartComment = () => {
    setCapturedTimestamp(currentTime);
    setIsAddingComment(true);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(capturedTimestamp, message.trim());
      setMessage('');
      setIsAddingComment(false);
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyMessage.trim()) return;
    setReplySubmitting(true);
    try {
      await onReplyAdded(commentId, replyMessage.trim());
      setReplyMessage('');
      setReplyingToId(null);
    } catch (err) {
      alert(err.message || 'Failed to post reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  const getRolePill = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Admin
          </span>
        );
      case 'EDITOR':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Editor
          </span>
        );
      case 'CLIENT':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Client
          </span>
        );
      default:
        return null;
    }
  };

  const filteredComments = comments.filter((c) => {
    if (activeFilter === 'OPEN') return c.status === 'OPEN';
    if (activeFilter === 'RESOLVED') return c.status === 'RESOLVED';
    return true;
  });

  const openCount = comments.filter((c) => c.status === 'OPEN').length;
  const resolvedCount = comments.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col h-full space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Review Feedback</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {comments.length}
          </span>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px]">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setActiveFilter('OPEN')}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              activeFilter === 'OPEN'
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setActiveFilter('RESOLVED')}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              activeFilter === 'RESOLVED'
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Add Comment Action */}
      {!isAddingComment ? (
        <button
          onClick={handleStartComment}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 transition-all group"
        >
          <span className="flex items-center gap-2 text-slate-400 group-hover:text-slate-200">
            <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
            <span>Add feedback at</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono font-bold">
            {formatTime(currentTime)}
          </span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmitComment}
          className="p-3.5 rounded-xl bg-slate-900/90 border border-brand-500/30 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Feedback for frame:</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono font-bold">
                {formatTime(capturedTimestamp)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingComment(false)}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          <textarea
            required
            autoFocus
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe required edits: typography, color, audio cue, cut timing..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200 placeholder:text-slate-600 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Post Feedback</span>
            </button>
          </div>
        </form>
      )}

      {/* Comments Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p className="font-medium text-slate-400">No feedback matching filter</p>
            <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
              Scrub the video player to any point and click add feedback to collaborate.
            </p>
          </div>
        ) : (
          filteredComments.map((c) => {
            const isResolved = c.status === 'RESOLVED';
            return (
              <div
                key={c._id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isResolved
                    ? 'bg-slate-950/40 border-slate-900/80 opacity-60 hover:opacity-100'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Timestamp seek button */}
                    <button
                      onClick={() => onSeekToTimestamp(c.timestamp)}
                      title="Seek player to this timestamp"
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition-colors ${
                        isResolved
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(c.timestamp)}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <span>{c.userId?.name}</span>
                      {getRolePill(c.userId?.role)}
                    </div>
                  </div>

                  {/* Actions: Resolve Toggle & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onResolveToggle(c._id)}
                      title={isResolved ? 'Reopen feedback' : 'Mark as resolved'}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isResolved
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-700'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isResolved ? 'Resolved' : 'Resolve'}</span>
                    </button>

                    {(user?.role === 'ADMIN' || user?._id === c.userId?._id) && (
                      <button
                        onClick={() => onDeleteComment(c._id)}
                        title="Delete feedback"
                        className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <p
                  className={`text-xs leading-relaxed ${
                    isResolved
                      ? 'line-through text-slate-500'
                      : 'text-slate-200'
                  }`}
                >
                  {c.message}
                </p>

                {/* Resolution meta */}
                {isResolved && c.resolvedBy && (
                  <div className="text-[10px] text-emerald-400/80 font-medium">
                    Resolved by {c.resolvedBy.name}
                  </div>
                )}

                {/* Nested Threaded Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-3 border-l-2 border-slate-800 space-y-2 pt-1 text-xs">
                    {c.replies.map((rep) => (
                      <div key={rep._id} className="space-y-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                            <CornerDownRight className="w-3 h-3 text-brand-400" />
                            <span>{rep.userId?.name}</span>
                            {getRolePill(rep.userId?.role)}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 pl-4 text-[11px] leading-relaxed">
                          {rep.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Button / Box */}
                {replyingToId === c._id ? (
                  <div className="pt-2 pl-3 border-l-2 border-brand-500/40 space-y-2 animate-in fade-in duration-100">
                    <textarea
                      rows={2}
                      autoFocus
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write reply (e.g. Fixed in V2, updated text...)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={replySubmitting || !replyMessage.trim()}
                        onClick={() => handleSubmitReply(c._id)}
                        className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] shadow-glow"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-0.5 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setReplyingToId(c._id);
                        setReplyMessage('');
                      }}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-300 font-medium transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
