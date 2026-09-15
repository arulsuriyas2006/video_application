import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Database,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  Film,
  PenTool,
  Mic,
  GitBranch,
  Radio,
  Clock,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';

export default function Health() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      if (res.data?.success) {
        setHealthData(res.data.data);
      } else {
        throw new Error('Invalid health response format');
      }
    } catch (err) {
      console.error('Health fetch error:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const phases = [
    { num: '01', name: 'Setup & Health Check', status: 'completed', desc: 'Express + Vite + Tailwind + MongoDB + Socket.io scaffolding' },
    { num: '02', name: 'Authentication & RBAC', status: 'completed', desc: 'Admin, Editor, Client roles with JWT & cookie auth' },
    { num: '03', name: 'Client & Project CRUD', status: 'upcoming', desc: 'Management portals, assignments, priority filters' },
    { num: '04', name: 'Video Upload & FFmpeg', status: 'upcoming', desc: 'Local chunked uploads, metadata probe & thumbnailing' },
    { num: '05', name: 'Frame-Accurate Player', status: 'upcoming', desc: 'Custom HTML5 video controls & timeline markers' },
    { num: '06', name: 'Threaded Collaboration', status: 'upcoming', desc: 'Replies, comment resolution, activity audit trail' },
    { num: '07', name: 'Canvas Annotations', status: 'upcoming', desc: 'Free draw, arrows, shapes & highlight overlays' },
    { num: '08', name: 'Voice Feedback', status: 'upcoming', desc: 'MediaRecorder audio feedback linked to timestamps' },
    { num: '09', name: 'Version Management', status: 'upcoming', desc: 'V1 -> V2 -> Final revisions & version switching' },
    { num: '10', name: 'Real-Time Socket.IO', status: 'upcoming', desc: 'Live comment sync, presence & toast notifications' },
    { num: '11', name: 'Secure Review Links', status: 'upcoming', desc: 'Public client review tokens & approval workflows' },
    { num: '12', name: 'Polish & Seed Data', status: 'upcoming', desc: 'Full sample datasets, responsive QA & final docs' },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">VideoFlow Diagnostics</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30">
                Phase 1 & 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs text-slate-200 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              <span>Real-Time System Diagnostics</span>
            </h2>
            {lastChecked && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated at {lastChecked}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Express Backend</h3>
                    <p className="text-xs text-slate-400">http://localhost:5000</p>
                  </div>
                </div>
                {healthData?.status === 'operational' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertCircle className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Uptime:</span>
                  <span className="text-slate-200 font-mono">
                    {healthData?.uptimeSeconds ? `${healthData.uptimeSeconds} seconds` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Node.js:</span>
                  <span className="text-slate-200 font-mono">{healthData?.system?.nodeVersion || '—'}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">MongoDB Database</h3>
                    <p className="text-xs text-slate-400 font-mono">127.0.0.1:27017</p>
                  </div>
                </div>
                {healthData?.database?.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertCircle className="w-3 h-3" /> Disconnected
                  </span>
                )}
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Database:</span>
                  <span className="text-slate-200 font-mono">videoflow</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>State:</span>
                  <span className="text-emerald-400 font-mono capitalize">{healthData?.database?.status || '—'}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Local Upload Storage</h3>
                    <p className="text-xs text-slate-400">Multer Engine</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Heap Used:</span>
                  <span className="text-slate-200 font-mono">
                    {healthData?.system?.memoryUsageMB?.heapUsed ? `${healthData.system.memoryUsageMB.heapUsed} MB` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Upload Dirs:</span>
                  <span className="text-slate-200 font-mono">videos, thumbnails, audio</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Implementation Progression Tracker</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {phases.map((p) => (
              <div
                key={p.num}
                className={`p-3.5 rounded-xl border transition-all ${
                  p.status === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800/70 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-500">PHASE {p.num}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">{p.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
