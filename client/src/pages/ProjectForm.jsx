import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  FolderGit2,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ProjectForm() {
  const { id } = useParams(); // If present, edit mode
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    clientId: preselectedClientId || '',
    assignedEditorId: '',
    status: 'DRAFT',
    priority: 'MEDIUM',
    dueDate: '',
    description: '',
    brief: '',
  });

  const [clients, setClients] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, editorsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/users?role=EDITOR'),
        ]);

        if (clientsRes.data?.success) setClients(clientsRes.data.data);
        if (editorsRes.data?.success) setEditors(editorsRes.data.data);

        // If in edit mode, fetch project
        if (isEdit) {
          const projectRes = await api.get(`/projects/${id}`);
          if (projectRes.data?.success) {
            const p = projectRes.data.data;
            setFormData({
              name: p.name || '',
              clientId: p.clientId?._id || p.clientId || '',
              assignedEditorId: p.assignedEditorId?._id || p.assignedEditorId || '',
              status: p.status || 'DRAFT',
              priority: p.priority || 'MEDIUM',
              dueDate: p.dueDate ? p.dueDate.substring(0, 10) : '',
              description: p.description || '',
              brief: p.brief || '',
            });
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await api.put(`/projects/${id}`, formData);
        navigate(`/projects/${id}`);
      } else {
        const res = await api.post('/projects', formData);
        navigate(`/projects/${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save project');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs">Preparing project form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        <div>
          <Link
            to={isEdit ? `/projects/${id}` : '/projects'}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Back to Project Details' : 'Back to Projects'}</span>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-brand-400" />
            <span>{isEdit ? 'Edit Project Settings' : 'Create New Video Project'}</span>
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6 text-xs sm:text-sm">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">Project Title *</label>
            <input
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Nike Winter Campaign - 60s Broadcast Spot"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100 placeholder:text-slate-600"
            />
          </div>

          {/* Client & Editor Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Client Company *</span>
              </label>
              <select
                required
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100"
              >
                <option value="">Select a Client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assigned Video Editor</span>
              </label>
              <select
                name="assignedEditorId"
                value={formData.assignedEditorId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100"
              >
                <option value="">Unassigned (Assign Later)</option>
                {editors.map((ed) => (
                  <option key={ed._id} value={ed._id}>
                    {ed.name} ({ed.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200">Pipeline Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200">Priority Level</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Due Date</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">Short Summary</label>
            <textarea
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="High-level project scope and distribution channels..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Creative Brief */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">Creative Production Brief</label>
            <textarea
              rows={5}
              name="brief"
              value={formData.brief}
              onChange={handleChange}
              placeholder="Detailed editorial instructions: visual tone, aspect ratios (16:9, 9:16), color grade specs, sound cues, key timestamps..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-100 placeholder:text-slate-600 font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              to={isEdit ? `/projects/${id}` : '/projects'}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-xs"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-glow active:scale-95 transition-all text-xs disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEdit ? 'Save Project Changes' : 'Launch Project'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
