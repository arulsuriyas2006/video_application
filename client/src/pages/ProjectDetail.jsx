import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import VideoUploadModal from '../components/video/VideoUploadModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FolderGit2,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  Film,
  MessageSquare,
  Activity as ActivityIcon,
  FileText,
  Info,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  Play,
  FileVideo,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [versions, setVersions] = useState([]);
  const [projectComments, setProjectComments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('ALL');

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, activitiesRes, versionsRes, commentsRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/activities`),
        api.get(`/projects/${id}/versions`),
        api.get(`/projects/${id}/comments`),
      ]);

      if (projectRes.data?.success) setProject(projectRes.data.data);
      if (activitiesRes.data?.success) setActivities(activitiesRes.data.data);
      if (versionsRes.data?.success) setVersions(versionsRes.data.data);
      if (commentsRes.data?.success) setProjectComments(commentsRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    setVersionsLoading(true);
    try {
      const res = await api.get(`/projects/${id}/versions`);
      if (res.data?.success) setVersions(res.data.data);
    } catch (err) {
      console.error('Failed to reload versions:', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.put(`/projects/${id}`, { status: newStatus });
      if (res.data?.success) {
        setProject(res.data.data);
        const actRes = await api.get(`/projects/${id}/activities`);
        if (actRes.data?.success) setActivities(actRes.data.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleDeleteVideo = async (videoId, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete video cut "${title}"?`)) return;
    try {
      await api.delete(`/videos/${videoId}`);
      fetchVersions();
      const actRes = await api.get(`/projects/${id}/activities`);
      if (actRes.data?.success) setActivities(actRes.data.data);
    } catch (err) {
      alert(err.message || 'Failed to delete video');
    }
  };

  const handleUploadSuccess = () => {
    fetchVersions();
    // Refresh activities
    api.get(`/projects/${id}/activities`).then((res) => {
      if (res.data?.success) setActivities(res.data.data);
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs">Loading project workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || 'Project not found or access denied'}</span>
          </div>
          <Link
            to="/projects"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  const canUpload =
    user?.role === 'ADMIN' ||
    (user?.role === 'EDITOR' &&
      project.assignedEditorId &&
      project.assignedEditorId._id === user._id);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'brief', label: 'Creative Brief', icon: FileText },
    {
      id: 'videos',
      label: `Videos & Cuts (${versions.length})`,
      icon: Film,
    },
    {
      id: 'feedback',
      label: `Feedback (${projectComments.length})`,
      icon: MessageSquare,
    },
    { id: 'activity', label: 'Activity Log', icon: ActivityIcon },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Navigation breadcrumb */}
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
        </div>

        {/* Project Header Banner */}
        <section className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-indigo-500/20 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-slate-200">{project.clientId?.company}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {project.name}
              </h1>

              {project.description && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {canUpload && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Video Cut</span>
                </button>
              )}

              {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Status:</span>
                  <select
                    disabled={statusUpdating}
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-transparent font-semibold text-brand-300 outline-none cursor-pointer"
                  >
                    <option value="DRAFT" className="bg-slate-900 text-slate-200">Draft</option>
                    <option value="IN_PROGRESS" className="bg-slate-900 text-slate-200">In Progress</option>
                    <option value="IN_REVIEW" className="bg-slate-900 text-slate-200">In Review</option>
                    <option value="CHANGES_REQUESTED" className="bg-slate-900 text-slate-200">Changes Requested</option>
                    <option value="APPROVED" className="bg-slate-900 text-slate-200">Approved</option>
                    <option value="COMPLETED" className="bg-slate-900 text-slate-200">Completed</option>
                  </select>
                </div>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to={`/projects/${project._id}/edit`}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={handleDeleteProject}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all text-xs"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <UserCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Editor:{' '}
                <strong className="text-white">
                  {project.assignedEditorId ? project.assignedEditorId.name : 'Unassigned'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>
                Due Date:{' '}
                <strong className="text-white">
                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline set'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                Revisions:{' '}
                <strong className="text-white">
                  {versions.length} {versions.length === 1 ? 'Cut' : 'Cuts'}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto pb-0.5 text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-500 text-brand-300 bg-brand-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <section className="space-y-6">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-400" />
                    <span>Project Scope</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {project.description || 'No detailed scope provided yet.'}
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-cyan-400" />
                      <span>Latest Video Cut</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      View All Versions ({versions.length}) &rarr;
                    </button>
                  </div>

                  {versions.length > 0 ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      {versions[0].thumbnailPath ? (
                        <img
                          src={versions[0].thumbnailPath}
                          alt="Thumbnail"
                          className="w-24 h-14 rounded-lg object-cover border border-slate-800"
                        />
                      ) : (
                        <div className="w-24 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                            V{versions[0].versionNumber}
                          </span>
                          <span className="font-bold text-white text-xs">{versions[0].title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {formatDuration(versions[0].duration)} • {versions[0].width}x{versions[0].height} • Uploaded {new Date(versions[0].createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      No video cuts uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-4">
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Client Contact
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-white text-sm">
                      {project.clientId?.company}
                    </div>
                    <div className="text-slate-400">
                      Contact: <span className="text-slate-200">{project.clientId?.name}</span>
                    </div>
                    <div className="text-slate-400">
                      Email: <span className="text-slate-200">{project.clientId?.email}</span>
                    </div>
                    {project.clientId?.phone && (
                      <div className="text-slate-400">
                        Phone: <span className="text-slate-200">{project.clientId?.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Assigned Editor
                  </h3>
                  {project.assignedEditorId ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                        {project.assignedEditorId.name.charAt(0)}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white">{project.assignedEditorId.name}</div>
                        <div className="text-slate-400">{project.assignedEditorId.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      No editor assigned to this project yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. BRIEF TAB */}
          {activeTab === 'brief' && (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Creative Production Brief</span>
                </h3>
                {user?.role === 'ADMIN' && (
                  <Link
                    to={`/projects/${project._id}/edit`}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Brief</span>
                  </Link>
                )}
              </div>

              {project.brief ? (
                <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {project.brief}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No creative brief added for this project yet.
                </div>
              )}
            </div>
          )}

          {/* 3. VIDEOS TAB (Phase 4 Live Feature!) */}
          {activeTab === 'videos' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-brand-400" />
                    <span>Video Revisions & Cuts</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    All historical video versions preserved locally with FFmpeg frame metadata
                  </p>
                </div>

                {canUpload && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload New Cut</span>
                  </button>
                )}
              </div>

              {versionsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                  <p className="text-xs">Loading video versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-1">
                    <h4 className="text-base font-bold text-white">No Video Cuts Yet</h4>
                    <p className="text-xs text-slate-400">
                      Upload the initial cut (V1) to enable frame-accurate video review and client feedback.
                    </p>
                  </div>
                  {canUpload && (
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload First Cut (V1)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {versions.map((v) => (
                    <div
                      key={v._id}
                      className="glass-panel rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/40 hover:shadow-glow transition-all flex flex-col justify-between group"
                    >
                      {/* Video Thumbnail Preview */}
                      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                        {v.thumbnailPath ? (
                          <img
                            src={v.thumbnailPath}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-600">
                            <FileVideo className="w-8 h-8" />
                            <span className="text-[10px]">Thumbnail Processing</span>
                          </div>
                        )}

                        {/* Version pill overlay */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white font-extrabold text-[11px]">
                          V{v.versionNumber}
                        </div>

                        {/* Duration pill overlay */}
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono text-white font-medium">
                          {formatDuration(v.duration)}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors leading-snug">
                              {v.title}
                            </h4>
                            <StatusBadge status={v.status} />
                          </div>

                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {v.originalFileName}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {v.width}x{v.height}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {(v.fileSize / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {v.uploadedBy?.avatar ? (
                              <img
                                src={v.uploadedBy.avatar}
                                alt={v.uploadedBy.name}
                                className="w-5 h-5 rounded-full border border-slate-700"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[9px] flex items-center justify-center text-slate-300 font-bold">
                                {v.uploadedBy?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                              {v.uploadedBy?.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              to={`/review/${project._id}/${v._id}`}
                              className="px-2.5 py-1 rounded-lg bg-brand-600/90 hover:bg-brand-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-glow transition-all"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Review</span>
                            </Link>

                            {user?.role === 'ADMIN' && (
                              <button
                                onClick={(e) => handleDeleteVideo(v._id, v.title, e)}
                                title="Delete this cut"
                                className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. FEEDBACK TAB (Phase 6 Live Feature!) */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-400" />
                    <span>Project Feedback Directory</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    All client and editor review comments across historical video cuts
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setFeedbackFilter('ALL')}
                    className={`px-3 py-1 rounded font-semibold transition-all ${
                      feedbackFilter === 'ALL'
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({projectComments.length})
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('OPEN')}
                    className={`px-3 py-1 rounded font-semibold transition-all ${
                      feedbackFilter === 'OPEN'
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Open ({projectComments.filter((c) => c.status === 'OPEN').length})
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('RESOLVED')}
                    className={`px-3 py-1 rounded font-semibold transition-all ${
                      feedbackFilter === 'RESOLVED'
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Resolved ({projectComments.filter((c) => c.status === 'RESOLVED').length})
                  </button>
                </div>
              </div>

              {projectComments.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-white">No Feedback Recorded Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Open any video cut in the review player to add frame-accurate feedback and collaborate with clients.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectComments
                    .filter((c) => {
                      if (feedbackFilter === 'OPEN') return c.status === 'OPEN';
                      if (feedbackFilter === 'RESOLVED') return c.status === 'RESOLVED';
                      return true;
                    })
                    .map((c) => {
                      const isResolved = c.status === 'RESOLVED';
                      return (
                        <div
                          key={c._id}
                          className={`glass-panel rounded-xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isResolved
                              ? 'border-slate-850 opacity-70'
                              : 'border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {c.videoId && (
                                <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  V{c.videoId.versionNumber}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                {Math.floor(c.timestamp / 60).toString().padStart(2, '0')}:
                                {Math.floor(c.timestamp % 60).toString().padStart(2, '0')}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isResolved
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {isResolved ? 'Resolved' : 'Open'}
                              </span>
                              <span className="text-slate-400 text-[11px] font-semibold">
                                {c.userId?.name}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                • {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p
                              className={`text-xs leading-relaxed ${
                                isResolved ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            >
                              {c.message}
                            </p>
                          </div>

                          {c.videoId && (
                            <Link
                              to={`/review/${project._id}/${c.videoId._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-brand-300 hover:text-white border border-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
                            >
                              <span>Open Review Player</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 5. ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-indigo-400" />
                  <span>Project Activity Timeline</span>
                </h3>
                <span className="text-xs text-slate-500">{activities.length} Recorded Events</span>
              </div>

              {activities.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No activity logged on this project yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                  {activities.map((act) => (
                    <div key={act._id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-brand-500 group-hover:scale-125 transition-transform" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-200">
                          {act.message}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{act.userId?.name || 'System'}</span>
                          <span>•</span>
                          <span>{new Date(act.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Video Upload Modal */}
      {isUploadModalOpen && (
        <VideoUploadModal
          projectId={project._id}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
