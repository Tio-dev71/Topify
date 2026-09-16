import { useState, useEffect } from 'react';
import { Building2, Plus, Users, Mail, Loader2, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface Workspace {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    posts: number;
    socialAccounts: number;
  };
  allowedEmails: { email: string }[];
}

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  async function fetchWorkspaces() {
    try {
      const res = await api.get('/super-admin/workspaces');
      setWorkspaces(res.data?.workspaces || []);
    } catch {
      console.error('Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkspace(id: string, wsName: string) {
    if (!confirm(`Are you sure you want to completely delete the workspace "${wsName}" and all its users, posts, and data? This action cannot be undone.`)) return;

    setDeleting(id);
    try {
      await api.delete(`/super-admin/workspaces?id=${id}`);
      toast.success(`Workspace ${wsName} deleted successfully`);
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete workspace');
    } finally {
      setDeleting(null);
    }
  }

  async function generateMagicLink(memberEmail: string) {
    setGenerating(memberEmail);
    try {
      const res = await api.post('/team/magic-link', { email: memberEmail });
      if (res.data?.link) {
        await navigator.clipboard.writeText(res.data.link);
        toast.success(`Magic link for ${memberEmail} copied to clipboard!`);
      } else {
        toast.error('Failed to generate link');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate link');
    } finally {
      setGenerating(null);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !adminEmail.trim()) return;

    setAdding(true);
    try {
      await api.post('/super-admin/workspaces', {
        name: name.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
      });
      toast.success(`Workspace ${name} created`);
      setName('');
      setAdminEmail('');
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create workspace');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tenants and workspaces.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-1 text-gray-900">Create New Client Workspace</h2>
        <p className="text-sm text-gray-500 mb-4">
          Provision a new isolated workspace and assign an Admin email.
        </p>
        <form onSubmit={createWorkspace} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company Name"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={adding}
            />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={adding}
            />
          </div>
          <button
            type="submit"
            disabled={adding || !name.trim() || !adminEmail.trim()}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm inline-flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Tenant
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Workspaces</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500">Loading workspaces...</div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No workspaces found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-medium text-[15px] text-gray-900">{ws.name}</h3>
                    {ws.allowedEmails?.[0]?.email && (
                      <p className="text-sm text-purple-600 font-medium mt-0.5">
                        {ws.allowedEmails[0].email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {ws._count?.users || 0} Users
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {ws._count?.socialAccounts || 0} Accounts
                      </div>
                    </div>
                    {ws.allowedEmails?.[0]?.email && (
                      <button
                        onClick={() => generateMagicLink(ws.allowedEmails[0].email)}
                        disabled={generating === ws.allowedEmails[0].email}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                        title="Copy Admin Login Link"
                      >
                        {generating === ws.allowedEmails[0].email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium hidden sm:inline">Copy Link</span>
                      </button>
                    )}
                    {ws.id !== 'default-workspace' && (
                      <button
                        onClick={() => deleteWorkspace(ws.id, ws.name)}
                        disabled={deleting === ws.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center w-8 h-8 flex-shrink-0"
                        title="Delete Workspace"
                      >
                        {deleting === ws.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
