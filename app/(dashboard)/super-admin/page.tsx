'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  Mail, 
  Loader2, 
  Link2, 
  Trash2, 
  ShieldCheck, 
  Key, 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit2, 
  X, 
  CheckCircle, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Database, 
  FileText, 
  Share2, 
  DollarSign, 
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Workspace = {
  id: string;
  name: string;
  isActive: boolean;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  _count: {
    users: number;
    posts: number;
    socialAccounts: number;
  };
  allowedEmails?: { email: string }[];
};

type UserItem = {
  id: string;
  email: string;
  name?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  licenseKey?: string | null;
  createdAt: string;
  workspaceId?: string | null;
  workspace?: {
    id: string;
    name: string;
    plan: string;
    isActive: boolean;
  } | null;
  _count?: {
    posts: number;
    socialAccounts: number;
  };
};

type SystemMetrics = {
  totalUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalPosts: number;
  publishedPosts: number;
  totalSocialAccounts: number;
  totalCustomers: number;
  totalDeals: number;
  totalCampaigns: number;
};

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workspaces' | 'sql'>('overview');
  const [loading, setLoading] = useState(true);

  // Overview stats
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<{ role: string; count: number }[]>([]);
  const [planDistribution, setPlanDistribution] = useState<{ plan: string; count: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([]);

  // Users Management
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    role: 'STAFF' as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF',
    workspaceId: '',
    licenseKey: '',
  });

  // Workspaces Management
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [showAddWsModal, setShowAddWsModal] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsAdminEmail, setWsAdminEmail] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [deletingWs, setDeletingWs] = useState<string | null>(null);

  // SQL Helper
  const [sqlEmail, setSqlEmail] = useState('admin@yourcompany.com');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchWorkspaces(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/super-admin/stats');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRoleDistribution(data.distribution?.roles || []);
        setPlanDistribution(data.distribution?.plans || []);
        setRecentUsers(data.recentUsers || []);
        setRecentWorkspaces(data.recentWorkspaces || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách người dùng');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/super-admin/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách workspace');
    }
  };

  // User Actions
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editingUser.role,
          name: editingUser.name,
          workspaceId: editingUser.workspaceId || null,
          licenseKey: editingUser.licenseKey || null,
        }),
      });

      if (res.ok) {
        toast.success('Cập nhật người dùng thành công');
        setEditingUser(null);
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email.trim()) return toast.error('Vui lòng nhập Email');

    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userForm.email.trim(),
          name: userForm.name.trim() || undefined,
          role: userForm.role,
          workspaceId: userForm.workspaceId || undefined,
          licenseKey: userForm.licenseKey.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Thêm người dùng mới thành công');
        setShowAddUserModal(false);
        setUserForm({ email: '', name: '', role: 'STAFF', workspaceId: '', licenseKey: '' });
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Không thể tạo người dùng');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.email}"?`)) return;

    try {
      const res = await fetch(`/api/super-admin/users?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa người dùng');
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Không thể xóa người dùng');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  // Workspace Actions
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !wsAdminEmail.trim()) return;

    try {
      const res = await fetch('/api/super-admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wsName.trim(), adminEmail: wsAdminEmail.trim().toLowerCase() }),
      });

      if (res.ok) {
        toast.success(`Tạo Workspace ${wsName} thành công`);
        setWsName('');
        setWsAdminEmail('');
        setShowAddWsModal(false);
        fetchWorkspaces();
        fetchStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Không thể tạo workspace');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleUpdateWorkspacePlan = async (id: string, plan: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    try {
      const res = await fetch('/api/super-admin/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, plan }),
      });

      if (res.ok) {
        toast.success(`Đã nâng gói sang ${plan}`);
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, plan } : w));
        fetchStats();
      } else {
        toast.error('Không thể cập nhật gói');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleToggleWorkspaceActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/super-admin/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });

      if (res.ok) {
        toast.success(`Đã ${!currentActive ? 'kích hoạt' : 'khóa'} workspace`);
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, isActive: !currentActive } : w));
        fetchStats();
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteWorkspace = async (id: string, name: string) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn Workspace "${name}" và toàn bộ dữ liệu người dùng, bài viết liên quan? Hành động này KHÔNG THỂ khôi phục.`)) return;

    setDeletingWs(id);
    try {
      const res = await fetch(`/api/super-admin/workspaces?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Đã xóa Workspace ${name}`);
        fetchWorkspaces();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Xóa thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    } finally {
      setDeletingWs(null);
    }
  };

  const generateMagicLink = async (memberEmail: string) => {
    setGenerating(memberEmail);
    try {
      const res = await fetch('/api/team/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail }),
      });
      const data = await res.json();
      if (res.ok && data.link) {
        await navigator.clipboard.writeText(data.link);
        toast.success(`Đã sao chép Magic Link cho ${memberEmail}!`);
      } else {
        toast.error(data.error || 'Không thể tạo link');
      }
    } catch {
      toast.error('Lỗi tạo link');
    } finally {
      setGenerating(null);
    }
  };

  const copySqlCode = () => {
    const code = `-- 1. Nâng quyền SUPER_ADMIN cho User trong Supabase SQL Editor:
UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE email = '${sqlEmail.trim() || 'admin@yourcompany.com'}';

-- 2. Kiểm tra lại thông tin sau khi nâng quyền:
SELECT id, email, name, role, "workspaceId", "createdAt"
FROM "User"
WHERE email = '${sqlEmail.trim() || 'admin@yourcompany.com'}';`;

    navigator.clipboard.writeText(code);
    setCopiedSql(true);
    toast.success('Đã sao chép lệnh SQL vào clipboard');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredUsers = users.filter(u => {
    const term = userSearch.toLowerCase();
    const matchesSearch = u.email.toLowerCase().includes(term) || (u.name || '').toLowerCase().includes(term);
    if (!userRoleFilter) return matchesSearch;
    return matchesSearch && u.role === userRoleFilter;
  });

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    (w.allowedEmails?.[0]?.email || '').toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-foreground)] tracking-tight">
              Quản Trị Hệ Thống (Super Admin)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Root Level
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Trung tâm điều hành tối cao: Quản trị toàn bộ người dùng, không gian làm việc (Workspaces), phân quyền và hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllData}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Database className="w-4 h-4" />
            Supabase SQL
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-px overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-semibold'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Tổng quan hệ thống
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-semibold'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý Người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'workspaces'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-semibold'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Quản lý Workspace ({workspaces.length})
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sql'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-semibold'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Key className="w-4 h-4" />
          Phân quyền Supabase (SQL)
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1a1b1e] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Tổng Người Dùng</p>
                  <h3 className="text-2xl font-black text-[var(--color-foreground)] mt-1">{metrics?.totalUsers || users.length}</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5">
                <span className="text-blue-600 font-semibold">{users.filter(u => u.role === 'SUPER_ADMIN').length} Super Admin</span>
                <span>•</span>
                <span>{users.filter(u => u.role === 'ADMIN').length} Admin</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1b1e] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Workspaces Hoạt Động</p>
                  <h3 className="text-2xl font-black text-[var(--color-foreground)] mt-1">
                    {metrics?.activeWorkspaces || workspaces.filter(w => w.isActive).length} / {workspaces.length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                {workspaces.filter(w => w.plan === 'ENTERPRISE').length} Enterprise • {workspaces.filter(w => w.plan === 'PRO').length} Pro
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1b1e] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Tổng Bài Viết Đã Đăng</p>
                  <h3 className="text-2xl font-black text-[var(--color-foreground)] mt-1">
                    {metrics?.publishedPosts || 0} / {metrics?.totalPosts || 0}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Tỉ lệ đăng xuất bản tự động cao
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1b1e] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Mạng Xã Hội Đã Liên Kết</p>
                  <h3 className="text-2xl font-black text-[var(--color-foreground)] mt-1">{metrics?.totalSocialAccounts || 0}</h3>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                Đa kênh: Meta, TikTok, YouTube, Zalo
              </div>
            </div>
          </div>

          {/* Quick Setup Supabase Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-500/30 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm mb-1">
                  <Database className="w-4 h-4" />
                  Kích hoạt quyền Super Admin qua Supabase SQL
                </div>
                <p className="text-xs text-[var(--color-foreground)]/80 max-w-2xl leading-relaxed">
                  Bạn có thể cấp quyền <strong>SUPER_ADMIN</strong> cho tài khoản công ty bằng cách chạy lệnh SQL bên dưới trong <strong>Supabase Dashboard ➔ SQL Editor</strong>. Quyền này áp dụng tức thì mà không cần rebuild ứng dụng.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sql')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                Mở lệnh SQL <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Registrations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Người dùng mới gia nhập
                </h3>
                <button onClick={() => setActiveTab('users')} className="text-xs text-purple-600 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {recentUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--color-muted-foreground)]">Chưa có người dùng mới</div>
                ) : (
                  recentUsers.map((u: any) => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-foreground)]">{u.name || u.email}</p>
                        <p className="text-[11px] text-[var(--color-muted-foreground)]">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                        <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                          {format(new Date(u.createdAt), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Workspaces */}
            <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Không gian làm việc gần đây
                </h3>
                <button onClick={() => setActiveTab('workspaces')} className="text-xs text-indigo-600 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {recentWorkspaces.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--color-muted-foreground)]">Chưa có workspace nào</div>
                ) : (
                  recentWorkspaces.map((w: any) => (
                    <div key={w.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-foreground)]">{w.name}</p>
                        <p className="text-[11px] text-[var(--color-muted-foreground)]">
                          {w._count?.users || 0} thành viên • {w._count?.posts || 0} bài viết
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          {w.plan || 'FREE'}
                        </span>
                        <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                          {format(new Date(w.createdAt), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-xs text-[var(--color-foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả quyền</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm Người Dùng
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-muted)]/40 text-[var(--color-muted-foreground)] uppercase text-[10px] font-bold border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5">Vai trò (Role)</th>
                    <th className="px-5 py-3.5">Workspace</th>
                    <th className="px-5 py-3.5">License Key</th>
                    <th className="px-5 py-3.5">Bài viết</th>
                    <th className="px-5 py-3.5">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[var(--color-muted-foreground)]">
                        Không tìm thấy người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center text-xs">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--color-foreground)]">{user.name || 'Chưa đặt tên'}</p>
                              <p className="text-[11px] text-[var(--color-muted-foreground)]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                            user.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                            user.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {user.workspace ? (
                            <span className="font-medium text-[var(--color-foreground)]">{user.workspace.name}</span>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)] italic">Chưa gán</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--color-muted-foreground)]">
                          {user.licenseKey ? (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-[var(--color-foreground)]">
                              {user.licenseKey}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[var(--color-foreground)]">
                          {user._count?.posts || 0}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--color-muted-foreground)] whitespace-nowrap">
                          {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors mr-1"
                            title="Sửa quyền / Workspace"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Xóa người dùng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKSPACES MANAGEMENT */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                placeholder="Tìm workspace theo tên hoặc email admin..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => setShowAddWsModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo Workspace Mới
            </button>
          </div>

          <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-muted)]/40 text-[var(--color-muted-foreground)] uppercase text-[10px] font-bold border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-5 py-3.5">Tên Workspace</th>
                    <th className="px-5 py-3.5">Gói cước (Plan)</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thành viên</th>
                    <th className="px-5 py-3.5">Mạng xã hội</th>
                    <th className="px-5 py-3.5">Bài viết</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredWorkspaces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[var(--color-muted-foreground)]">
                        Không có workspace nào.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkspaces.map(ws => (
                      <tr key={ws.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[var(--color-foreground)]">{ws.name}</div>
                          {ws.allowedEmails?.[0]?.email && (
                            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                              Admin: {ws.allowedEmails[0].email}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={ws.plan}
                            onChange={(e) => handleUpdateWorkspacePlan(ws.id, e.target.value as any)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] font-bold text-[10px] text-[var(--color-foreground)] focus:outline-none cursor-pointer"
                          >
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleWorkspaceActive(ws.id, ws.isActive)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] border transition-colors ${
                              ws.isActive
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                            }`}
                            title="Bấm để bật/tắt kích hoạt"
                          >
                            {ws.isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {ws.isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[var(--color-foreground)]">
                          {ws._count.users} người
                        </td>
                        <td className="px-5 py-3.5 text-[var(--color-foreground)]">
                          {ws._count.socialAccounts} tài khoản
                        </td>
                        <td className="px-5 py-3.5 text-[var(--color-foreground)]">
                          {ws._count.posts} bài
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {ws.allowedEmails?.[0]?.email && (
                            <button
                              onClick={() => generateMagicLink(ws.allowedEmails![0].email)}
                              disabled={generating === ws.allowedEmails[0].email}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors mr-2 inline-flex items-center gap-1 text-[11px] font-medium"
                              title="Tạo Magic Login Link cho Admin workspace"
                            >
                              <Link2 className="w-3 h-3" />
                              {generating === ws.allowedEmails[0].email ? 'Đang tạo...' : 'Magic Link'}
                            </button>
                          )}
                          {ws.id !== 'default-workspace' && (
                            <button
                              onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                              disabled={deletingWs === ws.id}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Xóa Workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SQL SUPABASE GUIDE */}
      {activeTab === 'sql' && (
        <div className="space-y-6 max-w-4xl animate-fade-in">
          <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-base">
              <Database className="w-5 h-5" />
              Lệnh SQL Cấp Quyền Super Admin Trong Supabase
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              Vì dự án đã kết nối trực tiếp với <strong>Supabase PostgreSQL</strong>, bạn có thể cấp quyền quản trị tối cao (Super Admin) cho bất kỳ tài khoản email công ty nào một cách bảo mật và tức thì.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-foreground)]">
                Nhập Email công ty cần cấp quyền:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={sqlEmail}
                  onChange={(e) => setSqlEmail(e.target.value)}
                  placeholder="admin@yourcompany.com"
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={copySqlCode}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Đã sao chép!' : 'Sao chép mã SQL'}
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-gray-950 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed">
{`-- 1. Nâng quyền SUPER_ADMIN cho User trong Supabase SQL Editor:
UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE email = '${sqlEmail.trim() || 'admin@yourcompany.com'}';

-- 2. Kiểm tra lại thông tin sau khi nâng quyền:
SELECT id, email, name, role, "workspaceId", "createdAt"
FROM "User"
WHERE email = '${sqlEmail.trim() || 'admin@yourcompany.com'}';`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <p className="font-semibold">📌 Các bước thực hiện trên Supabase Console:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90">
                <li>Đăng nhập vào <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold">Supabase Dashboard</a> và chọn project của bạn.</li>
                <li>Vào mục <strong>SQL Editor</strong> ở thanh menu bên trái.</li>
                <li>Dán đoạn lệnh trên và nhấn <strong>Run</strong> (hoặc Cmd + Enter).</li>
                <li>Sau đó đăng nhập lại hoặc F5 tải lại trang để truy cập toàn quyền Super Admin!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-foreground)]">Chỉnh sửa người dùng</h3>
              <button onClick={() => setEditingUser(null)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Email</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Nhập tên người dùng..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Vai trò (Role)</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STAFF">STAFF (Nhân viên thông thường)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên Workspace)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Toàn quyền hệ thống)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Gán vào Workspace</label>
                <select
                  value={editingUser.workspaceId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, workspaceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chưa gán Workspace --</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.plan})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">License Key (Bản quyền)</label>
                <input
                  type="text"
                  value={editingUser.licenseKey || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, licenseKey: e.target.value })}
                  placeholder="Ví dụ: TOPIFY-PRO-XXXX"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] font-medium text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-foreground)]">Thêm người dùng mới</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Vai trò</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STAFF">STAFF (Nhân viên)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên Workspace)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Toàn quyền hệ thống)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Gán vào Workspace</label>
                <select
                  value={userForm.workspaceId}
                  onChange={(e) => setUserForm({ ...userForm, workspaceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn Workspace --</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.plan})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">License Key (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="TOPIFY-XXXX-XXXX"
                  value={userForm.licenseKey}
                  onChange={(e) => setUserForm({ ...userForm, licenseKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] font-medium text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Thêm người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORKSPACE MODAL */}
      {showAddWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-foreground)]">Tạo Workspace Mới</h3>
              <button onClick={() => setShowAddWsModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Tên Workspace *</label>
                <input
                  type="text"
                  required
                  placeholder="Tên công ty hoặc thương hiệu..."
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-foreground)] mb-1">Email Quản trị viên (Admin) *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@clientcompany.com"
                  value={wsAdminEmail}
                  onChange={(e) => setWsAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                  Hệ thống sẽ cấp quyền Admin cho email này trong workspace mới tạo.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddWsModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] font-medium text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Tạo Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
