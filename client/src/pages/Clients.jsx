import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  FolderGit2,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/clients', {
        params: search ? { search } : {},
      });
      if (res.data?.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', phone: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient._id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      setModalError(err.message || 'Failed to save client');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (clientId, clientName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${clientName}"?`)) {
      return;
    }
    try {
      await api.delete(`/clients/${clientId}`);
      fetchClients();
    } catch (err) {
      alert(err.message || 'Failed to delete client');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-brand-400" />
              <span>Client Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage video production clients, contact leads, and associated projects
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-glow active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Client</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="glass-panel rounded-xl p-3 border border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, contact, or email..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-slate-500 hover:text-slate-300 mr-2 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
            <p className="text-xs">Loading clients directory...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Clients Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `No clients match the search query "${search}".`
                : 'Get started by creating your first client profile to associate video projects.'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Client</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client._id}
                className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-glow transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600/30 to-cyan-500/30 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm">
                        {client.company.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                          {client.company}
                        </h3>
                        <p className="text-xs text-slate-400">{client.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditModal(client, e)}
                        title="Edit Client"
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(client._id, client.company, e)}
                        title="Delete Client"
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      <strong className="text-slate-200">{client.projectCount}</strong>{' '}
                      {client.projectCount === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>

                  <Link
                    to={`/clients/${client._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>View Projects</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full glass-panel-glow rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" />
                <span>{editingClient ? 'Edit Client' : 'Create New Client'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="e.g. Acme Motion Pictures"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Primary Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="sarah@acme.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-brand-500 outline-none text-slate-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingClient ? 'Save Changes' : 'Create Client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
