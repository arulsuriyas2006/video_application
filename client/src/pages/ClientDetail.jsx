import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import api from '../services/api';
import {
  Users,
  Building2,
  Mail,
  Phone,
  FolderGit2,
  Plus,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/clients/${id}`);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs">Loading client portfolio...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || 'Client not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  const { client, projects } = data;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Navigation back */}
        <div>
          <Link
            to="/clients"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Clients</span>
          </Link>
        </div>

        {/* Client Profile Header */}
        <section className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-indigo-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-xl font-black text-brand-300">
                  {client.company.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{client.company}</h1>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                  <span>Contact: {client.name}</span>
                  <span>•</span>
                  <span>Member since {new Date(client.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <Link
              to={`/projects/new?clientId=${client._id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-glow active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project for Client</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-300">
              <FolderGit2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong>{projects.length}</strong> Total Associated Projects
              </span>
            </div>
          </div>
        </section>

        {/* Client Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <span>Projects Pipeline</span>
            </h2>
            <span className="text-xs text-slate-500">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">
                No projects created for this client yet.
              </p>
              <Link
                to={`/projects/new?clientId=${client._id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create the first project</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <Link
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-glow transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={p.priority} />
                      {p.assignedEditorId ? (
                        <span className="text-[11px] text-slate-400">
                          Editor: <strong className="text-slate-200">{p.assignedEditorId.name}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
