import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  UserCheck,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const res = await api.get('/projects', { params });
      if (res.data?.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, priorityFilter]);

  const statuses = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FolderGit2 className="w-6 h-6 text-brand-400" />
              <span>Project Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {user?.role === 'ADMIN' && 'Track agency pipelines, editor assignments, and review milestones'}
              {user?.role === 'EDITOR' && 'Your assigned video editing projects and client review cuts'}
              {user?.role === 'CLIENT' && 'Your active video projects, review requests, and approvals'}
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <Link
              to="/projects/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-glow active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="w-full md:flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by title or brief..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="w-full md:w-48">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                  statusFilter === s.id
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
            <p className="text-xs">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Projects Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'No projects match your current filter selections.'
                : 'No projects available yet.'}
            </p>
            {user?.role === 'ADMIN' && (
              <Link
                to="/projects/new"
                className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-glow transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={p.status} />
                    <PriorityBadge priority={p.priority} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors leading-snug">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-1">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-semibold">{p.clientId?.company || 'Unknown Client'}</span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px]">Assigned Editor:</span>
                    {p.assignedEditorId ? (
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] flex items-center justify-center font-bold">
                          {p.assignedEditorId.name.charAt(0)}
                        </div>
                        <span className="text-[11px] truncate max-w-[120px]">
                          {p.assignedEditorId.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px]">Due Date:</span>
                    {p.dueDate ? (
                      <span className="text-[11px] text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(p.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">No deadline</span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end text-xs font-semibold text-brand-400 group-hover:text-brand-300 transition-colors gap-1">
                    <span>Open Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
