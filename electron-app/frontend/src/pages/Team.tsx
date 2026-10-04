import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  UserPlus, 
  Trash2, 
  Eye, 
  Edit2, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  invitedBy?: {
    name: string | null;
    email: string;
  };
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // View & Edit States
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState('STAFF');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      if (res.data?.members) {
        setMembers(res.data.members);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập trang Nhân sự (Yêu cầu Admin)');
      } else {
        toast.error('Không thể tải danh sách nhân sự');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setAdding(true);
    try {
      await api.post('/team', { email: newEmail });
      toast.success('Đã thêm nhân sự mới');
      setNewEmail('');
      setShowModal(false);
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi thêm nhân sự');
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleUpdateMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setUpdating(true);
    try {
      await api.patch('/team', { id: editingMember.id, role: editRole });
      toast.success('Cập nhật quyền thành công');
      setEditingMember(null);
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi cập nhật quyền');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (id: string, email: string) => {
    if (!confirm(`Bạn có chắc muốn xoá ${email} khỏi đội ngũ?`)) return;

    try {
      await api.delete(`/team?id=${id}`);
      toast.success('Đã xoá nhân sự');
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi xoá nhân sự');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch('/team', { id, role: newRole });
      toast.success('Đã cập nhật quyền');
      fetchTeam();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi cập nhật quyền');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Quản lý Nhân sự
          </h1>
          <p className="text-sm text-gray-500 mt-1">Thêm và quản lý quyền truy cập của các thành viên trong đội ngũ</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm font-medium"
        >
          <UserPlus className="w-4 h-4" /> Thêm thành viên
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Thành viên</th>
                <th className="px-6 py-4 font-medium">Quyền hạn (Role)</th>
                <th className="px-6 py-4 font-medium">Người thêm</th>
                <th className="px-6 py-4 font-medium">Ngày thêm</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có thành viên nào.
                  </td>
                </tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {member.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full outline-none cursor-pointer ${
                          member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="ADMIN">Quản trị viên (Admin)</option>
                        <option value="STAFF">Nhân viên (Staff)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {member.invitedBy ? member.invitedBy.email : 'Hệ thống'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingMember(member)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa quyền"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {member.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xoá thành viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Thêm nhân sự mới</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email nhân viên
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nhanvien@congty.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">Người này sẽ có thể đăng nhập bằng email này với quyền Nhân viên (Staff).</p>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adding && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {adding ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Detail Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base">
                  {viewingMember.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Chi Tiết Thành Viên</h3>
                  <p className="text-xs text-gray-500">{viewingMember.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Quyền hạn (Role)</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    viewingMember.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingMember.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Người mời / Thêm</span>
                  <span className="text-xs font-medium text-gray-800">
                    {viewingMember.invitedBy?.email || 'Hệ thống'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Ngày tham gia</span>
                  <span className="text-xs font-medium text-gray-800">
                    {new Date(viewingMember.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  handleOpenEdit(m);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa quyền
              </button>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Phân Quyền Thành Viên</h3>
                  <p className="text-xs text-gray-500">{editingMember.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemberRole}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Quyền hạn trong Workspace</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền cấu hình & quản lý</option>
                    <option value="STAFF">Nhân viên (Staff) - Quyền tạo bài, tương tác & xem dữ liệu</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
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
