import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  Lock,
  Calendar,
  Download,
  MessageSquare,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ShareReviewModal({ videoId, videoTitle, isOpen, onClose }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // New link form states
  const [title, setTitle] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);

  const fetchLinks = async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/review-links/videos/${videoId}`);
      if (res.data?.success) {
        setLinks(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load review links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && videoId) {
      fetchLinks();
    }
  }, [isOpen, videoId]);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (requirePasscode && !passcode.trim()) {
      setError('Please enter a passcode or disable passcode protection');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const payload = {
        title: title.trim() || `${videoTitle || 'Video'} — Client Sign-Off`,
        requirePasscode,
        passcode: requirePasscode ? passcode.trim() : null,
        expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : null,
        allowComments,
        allowDownload,
      };

      const res = await api.post(`/review-links/videos/${videoId}`, payload);
      if (res.data?.success) {
        // Reset form
        setTitle('');
        setRequirePasscode(false);
        setPasscode('');
        fetchLinks();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate review link');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (linkId) => {
    if (!window.confirm('Revoke this review link? Clients will no longer be able to access it.')) {
      return;
    }
    try {
      await api.delete(`/review-links/${linkId}`);
      setLinks((prev) => prev.filter((l) => l._id !== linkId));
    } catch (err) {
      alert(err.message || 'Failed to revoke review link');
    }
  };

  const handleCopy = (token, id) => {
    const fullUrl = `${window.location.origin}/review/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Client Review Links</h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Generate secure share links for client sign-off without login
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Create New Link Form */}
          <form onSubmit={handleCreateLink} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Create New Review Link
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Link Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nike 60s Cut — Director Signoff"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-brand-500 outline-none"
                />
              </div>

              {/* Protection & Expiration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Passcode toggle */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Require Passcode</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={requirePasscode}
                      onChange={(e) => setRequirePasscode(e.target.checked)}
                      className="accent-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {requirePasscode && (
                    <input
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter client passcode"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 outline-none focus:border-brand-500 font-mono text-xs"
                    />
                  )}
                </div>

                {/* Expiration Select */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <label className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Link Expiration</span>
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-brand-500 cursor-pointer text-xs"
                  >
                    <option value="1">Expires in 24 Hours</option>
                    <option value="7">Expires in 7 Days</option>
                    <option value="30">Expires in 30 Days</option>
                    <option value="">Never Expires</option>
                  </select>
                </div>
              </div>

              {/* Permissions checkboxes */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="accent-brand-500 w-3.5 h-3.5"
                  />
                  <span>Allow comments & annotations</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="accent-brand-500 w-3.5 h-3.5"
                  />
                  <span>Allow video file download</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Generate Review Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Existing Links List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Share Links ({links.length})
            </h4>

            {loading ? (
              <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                <span>Loading review links...</span>
              </div>
            ) : links.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No client review links generated for this video yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {links.map((link) => (
                  <div
                    key={link._id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {link.title}
                        </span>
                        {link.requirePasscode && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 font-mono">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Passcode</span>
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            link.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : link.approvalStatus === 'CHANGES_REQUESTED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {link.approvalStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>{link.viewsCount} views</span>
                        </span>
                        <span>•</span>
                        <span>
                          {link.expiresAt
                            ? `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                            : 'No expiration'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(link.token, link._id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          copiedId === link._id
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {copiedId === link._id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`/review/share/${link.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleRevoke(link._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Revoke link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
