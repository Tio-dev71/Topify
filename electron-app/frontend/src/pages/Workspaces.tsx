import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  Mail, 
  Loader2, 
  Link2, 
  Trash2, 
  Eye, 
  Edit2, 
  X, 
  Calendar, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface Workspace {
  id: string;
  name: string;
  plan?: string;
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

  // View & Edit States
  const [viewingWs, setViewingWs] = useState<Workspace | null>(null);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('PRO');
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const handleOpenEdit = (ws: Workspace) => {
    setEditingWs(ws);
    setEditName(ws.name);
    setEditPlan(ws.plan || 'PRO');
    setEditIsActive(ws.isActive !== false);
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWs) return;
    if (!editName.trim()) {
      toast.error('Vui lòng nhập tên workspace');
      return;
    }

    setUpdating(true);
    try {
      await api.patch('/super-admin/workspaces', {
        id: editingWs.id,
        name: editName.trim(),
        plan: editPlan,
        isActive: editIsActive,
      });
      toast.success('Cập nhật Workspace thành công');
      setEditingWs(null);
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật workspace');
    } finally {
      setUpdating(false);
    }
  };

  async function deleteWorkspace(id: string, wsName: string) {
    if (!confirm(`Bạn có chắc chắn muốn xoá hoàn toàn workspace "${wsName}" cùng toàn bộ dữ liệu người dùng, bài viết không? Hành động này không thể hoàn tác.`)) return;

    setDeleting(id);
    try {
      await api.delete(`/super-admin/workspaces?id=${id}`);
      toast.success(`Đã xoá workspace ${wsName}`);
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi xoá workspace');
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
        toast.success(`Đã sao chép link đăng nhập của ${memberEmail}!`);
      } else {
        toast.error('Không thể tạo liên kết đăng nhập');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi tạo liên kết');
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
      toast.success(`Đã tạo workspace ${name}`);
      setName('');
      setAdminEmail('');
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo workspace');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            Quản Trị Workspaces (Tenants)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý không gian làm việc đa khách hàng và phân quyền truy cập hệ thống.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-1 text-gray-900">Tạo Workspace Khách Hàng Mới</h2>
        <p className="text-sm text-gray-500 mb-4">
          Khởi tạo không gian làm việc cô lập mới và gán email Quản trị viên (Admin).
        </p>
        <form onSubmit={createWorkspace} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên công ty / Workspace"
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
            Tạo Workspace
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Danh Sách Workspaces</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              Đang tải danh sách...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Chưa có workspace nào.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[15px] text-gray-900">{ws.name}</h3>
                      {ws.isActive === false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          TẠM DỪNG
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          HOẠT ĐỘNG
                        </span>
                      )}
                      {ws.plan && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          {ws.plan}
                        </span>
                      )}
                    </div>
                    {ws.allowedEmails?.[0]?.email && (
                      <p className="text-sm text-purple-600 font-medium mt-0.5">
                        {ws.allowedEmails[0].email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Tạo ngày {new Date(ws.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-4 text-sm text-gray-500 mr-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {ws._count?.users || 0} Người dùng
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {ws._count?.socialAccounts || 0} Tài khoản
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingWs(ws)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Xem chi tiết Workspace"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(ws)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Chỉnh sửa Workspace"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {ws.allowedEmails?.[0]?.email && (
                      <button
                        onClick={() => generateMagicLink(ws.allowedEmails[0].email)}
                        disabled={generating === ws.allowedEmails[0].email}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                        title="Sao chép link đăng nhập Admin"
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
                        title="Xoá Workspace"
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

      {/* View Detail Modal */}
      {viewingWs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Chi Tiết Workspace</h3>
                  <p className="text-xs text-gray-500">{viewingWs.name}</p>
                </div>
              </div>
              <button onClick={() => setViewingWs(null)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Gói dịch vụ</span>
                  <span className="font-bold text-xs text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {viewingWs.plan || 'PRO'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Trạng thái</span>
                  {viewingWs.isActive !== false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> HOẠT ĐỘNG
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" /> TẠM DỪNG
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  Thống kê tài nguyên
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-gray-900">{viewingWs._count?.users || 0}</p>
                    <p className="text-[11px] text-gray-500">Thành viên</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-gray-900">{viewingWs._count?.socialAccounts || 0}</p>
                    <p className="text-[11px] text-gray-500">Kênh kết nối</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-gray-900">{viewingWs._count?.posts || 0}</p>
                    <p className="text-[11px] text-gray-500">Bài viết</p>
                  </div>
                </div>
              </div>

              {viewingWs.allowedEmails && viewingWs.allowedEmails.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    Quản trị viên được phân quyền
                  </span>
                  <div className="space-y-1">
                    {viewingWs.allowedEmails.map((item, idx) => (
                      <div key={idx} className="font-mono text-xs text-gray-800 bg-white p-2 rounded border border-gray-200">
                        {item.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ngày tạo: {new Date(viewingWs.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const wsToEdit = viewingWs;
                  setViewingWs(null);
                  handleOpenEdit(wsToEdit);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa workspace
              </button>
              <button
                type="button"
                onClick={() => setViewingWs(null)}
                className="px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingWs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Chỉnh Sửa Workspace</h3>
                  <p className="text-xs text-gray-500">Cập nhật thông tin và gói dịch vụ</p>
                </div>
              </div>
              <button onClick={() => setEditingWs(null)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tên Workspace *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Gói dịch vụ (Plan)</label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái hoạt động</label>
                    <select
                      value={editIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditIsActive(e.target.value === 'active')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Tạm dừng</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingWs(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-[14px] font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
