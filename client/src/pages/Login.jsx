import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  Film,
  Users
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background glow orbs */}
      <div className="absolute top-[-10%] left-[25%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-[1px] shadow-glow mb-2">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Video className="w-6 h-6 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome to <span className="gradient-text">VideoFlow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to access your video collaboration workspace
          </p>
        </div>

        {/* Quick Demo Login Presets */}
        <div className="glass-panel-glow rounded-2xl p-4 border border-indigo-500/20 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Role Testing</span>
            </span>
            <span className="text-[10px] text-slate-500">Seed Accounts</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@videoflow.local', 'AdminPass123!')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 hover:border-indigo-500/40 border border-slate-800 transition-all text-center group"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Admin</span>
              <span className="text-[10px] text-slate-500">Full control</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('editor@videoflow.local', 'EditorPass123!')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 hover:border-cyan-500/40 border border-slate-800 transition-all text-center group"
            >
              <Film className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Editor</span>
              <span className="text-[10px] text-slate-500">Upload & edit</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('client@videoflow.local', 'ClientPass123!')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/50 hover:border-emerald-500/40 border border-slate-800 transition-all text-center group"
            >
              <Users className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Client</span>
              <span className="text-[10px] text-slate-500">Review & approve</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-100 text-xs sm:text-sm placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-100 text-xs sm:text-sm placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-glow active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>

        {/* Health link */}
        <div className="text-center">
          <Link
            to="/health"
            className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1"
          >
            <span>View Phase 1 System Diagnostics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
