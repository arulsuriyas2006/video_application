import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  Video,
  Shield,
  ShieldCheck,
  Film,
  Users,
  FolderGit2,
  FolderPlus,
  Building2,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RBAC interactive tester
  const [rbacResult, setRbacResult] = useState(null);
  const [rbacTesting, setRbacTesting] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const testRoleEndpoint = async (target) => {
    setRbacTesting(true);
    setRbacResult(null);
    try {
      const res = await api.get(`/auth/test/${target}`);
      setRbacResult({
        endpoint: `/api/auth/test/${target}`,
        status: 200,
        success: true,
        message: res.data?.message || 'Access granted!',
      });
    } catch (err) {
      setRbacResult({
        endpoint: `/api/auth/test/${target}`,
        status: err.status || 403,
        success: false,
        message: err.message || 'Forbidden: Insufficient role permissions',
      });
    } finally {
      setRbacTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Welcome / Quick Actions Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>VideoFlow Hub • {user?.role} Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Welcome back, <span className="gradient-text">{user?.name}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {user?.role === 'ADMIN' && 'Real-time overview of client accounts, active productions, and agency team assignments.'}
                {user?.role === 'EDITOR' && 'Your current editing queue, client revision requests, and video cuts awaiting review.'}
                {user?.role === 'CLIENT' && 'Track progress on your video campaigns, review cuts, and provide timestamped feedback.'}
              </p>
            </div>

            {/* Role-Specific Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </Link>

                  <Link
                    to="/clients"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all"
                  >
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Manage Clients</span>
                  </Link>
                </>
              )}

              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all"
              >
                <FolderGit2 className="w-4 h-4 text-cyan-400" />
                <span>Browse Projects</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Live Metrics Grid */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            <p className="text-xs">Computing live pipeline metrics...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <span>Production Metrics</span>
              </h2>
            </div>

            {/* ADMIN METRICS */}
            {user?.role === 'ADMIN' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">Total Clients</span>
                  <div className="text-2xl font-black text-white">{stats?.totalClients ?? 0}</div>
                  <div className="text-[10px] text-indigo-400 font-semibold">Active accounts</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">Total Projects</span>
                  <div className="text-2xl font-black text-white">{stats?.totalProjects ?? 0}</div>
                  <div className="text-[10px] text-cyan-400 font-semibold">All time</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">Active In Pipeline</span>
                  <div className="text-2xl font-black text-blue-400">{stats?.activeProjects ?? 0}</div>
                  <div className="text-[10px] text-slate-500">In production</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">In Review</span>
                  <div className="text-2xl font-black text-amber-400">{stats?.inReviewProjects ?? 0}</div>
                  <div className="text-[10px] text-amber-400/80 font-semibold">Needs review</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">Pending Feedback</span>
                  <div className="text-2xl font-black text-rose-400">{stats?.pendingFeedbackProjects ?? 0}</div>
                  <div className="text-[10px] text-rose-400/80 font-semibold">Changes req.</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400">Approved</span>
                  <div className="text-2xl font-black text-emerald-400">{stats?.approvedProjects ?? 0}</div>
                  <div className="text-[10px] text-emerald-400/80 font-semibold">Completed</div>
                </div>
              </div>
            )}

            {/* EDITOR METRICS */}
            {user?.role === 'EDITOR' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Assigned Projects</span>
                  <div className="text-3xl font-black text-white">{stats?.assignedProjects ?? 0}</div>
                  <div className="text-xs text-cyan-400 font-semibold">Active in queue</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Projects in Review</span>
                  <div className="text-3xl font-black text-amber-400">{stats?.inReviewProjects ?? 0}</div>
                  <div className="text-xs text-amber-400/80 font-semibold">With client now</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Pending Feedback</span>
                  <div className="text-3xl font-black text-rose-400">{stats?.pendingFeedbackProjects ?? 0}</div>
                  <div className="text-xs text-rose-400/80 font-semibold">Changes requested</div>
                </div>
              </div>
            )}

            {/* CLIENT METRICS */}
            {user?.role === 'CLIENT' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Active Projects</span>
                  <div className="text-3xl font-black text-white">{stats?.activeProjects ?? 0}</div>
                  <div className="text-xs text-indigo-400 font-semibold">In production</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Waiting For Review</span>
                  <div className="text-3xl font-black text-amber-400">{stats?.videosWaitingForReview ?? 0}</div>
                  <div className="text-xs text-amber-400/80 font-semibold">Ready for your input</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Change Requests</span>
                  <div className="text-3xl font-black text-rose-400">{stats?.changeRequests ?? 0}</div>
                  <div className="text-xs text-rose-400/80 font-semibold">Editor revising</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Approved Cuts</span>
                  <div className="text-3xl font-black text-emerald-400">{stats?.approvedVideos ?? 0}</div>
                  <div className="text-xs text-emerald-400/80 font-semibold">Ready for delivery</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Recent Activity Audit Trail */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Production Activities</span>
            </h2>
            <Link
              to="/projects"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              View Projects &rarr;
            </Link>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            {stats?.recentActivities?.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {stats?.recentActivities?.map((act) => (
                  <div
                    key={act._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                      <div>
                        <span className="text-slate-200 font-medium">{act.message}</span>
                        {act.projectId?.name && (
                          <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
                            ({act.projectId.name})
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RBAC Verification Console */}
        <section className="glass-panel-glow rounded-2xl p-6 border border-indigo-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Role-Based Access Verification (RBAC)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Verify server permission enforcement for your active role (<span className="text-brand-300 font-bold">{user?.role}</span>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => testRoleEndpoint('admin')}
              disabled={rbacTesting}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 transition-all text-left text-xs"
            >
              <div>
                <div className="font-bold text-slate-200">/api/auth/test/admin</div>
                <div className="text-[10px] text-slate-500">ADMIN only</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>

            <button
              onClick={() => testRoleEndpoint('editor')}
              disabled={rbacTesting}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all text-left text-xs"
            >
              <div>
                <div className="font-bold text-slate-200">/api/auth/test/editor</div>
                <div className="text-[10px] text-slate-500">ADMIN + EDITOR</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>

            <button
              onClick={() => testRoleEndpoint('client')}
              disabled={rbacTesting}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all text-left text-xs"
            >
              <div>
                <div className="font-bold text-slate-200">/api/auth/test/client</div>
                <div className="text-[10px] text-slate-500">ALL roles allowed</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {rbacResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                rbacResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {rbacResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{rbacResult.endpoint} &rarr; HTTP {rbacResult.status}: {rbacResult.message}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
