import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  UserPlus,
  Trash2,
  Eye,
  Edit2,
  X,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

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

interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
}

interface SeatQuotaInfo {
  maxSeats: number;
  seatsUsed: number;
  seatsAvailable: number;
  invites: PendingInvite[];
}

export default function Team() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<SeatQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite Modal States
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [adding, setAdding] = useState(false);

  // View & Edit States
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState('STAFF');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchTeam(), fetchSeatsQuota()]);
    setLoading(false);
  };

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
    }
  };

  const fetchSeatsQuota = async () => {
    try {
      const res = await api.get('/workspace/seats');
      if (res.data?.success) {
        setQuotaInfo({
          maxSeats: res.data.maxSeats,
          seatsUsed: res.data.seatsUsed,
          seatsAvailable: res.data.seatsAvailable,
          invites: res.data.invites || [],
        });
      }
    } catch (e: any) {
      console.error('Failed to load seat quota', e);
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
      // Use seat-controlled invite endpoint
      const res = await api.post('/workspace/seats', {
        action: 'invite',
        email: newEmail.trim(),
        role: newRole,
      });

      if (res.data?.success) {
        toast.success(`Đã gửi lời mời tham gia tới ${newEmail}`);
        setNewEmail('');
        setShowModal(false);
        await Promise.all([fetchTeam(), fetchSeatsQuota()]);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.isOverQuota) {
        toast.error(e.response.data.error, {
          action: {
            label: 'Nâng cấp ngay',
            onClick: () => navigate('/settings?tab=quota'),
          },
        });
      } else {
        // Fallback to legacy team route if seats API is unavailable
        try {
          await api.post('/team', { email: newEmail });
          toast.success('Đã thêm nhân sự mới');
          setNewEmail('');
          setShowModal(false);
          fetchTeam();
        } catch (fallbackErr: any) {
          toast.error(fallbackErr.response?.data?.error || 'Lỗi khi thêm nhân sự');
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi lời mời này?')) return;
    try {
      const res = await api.post('/workspace/seats', {
        action: 'revoke',
        inviteId,
      });
      if (res.data?.success) {
        toast.success('Đã thu hồi lời mời thành công');
        fetchSeatsQuota();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi thu hồi lời mời');
    }
  };

  const handleCopyInviteLink = (inviteId: string) => {
    const inviteUrl = `${window.location.origin}/#/invite?token=${inviteId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Đã sao chép liên kết tham gia vào bộ nhớ tạm!');
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
      await Promise.all([fetchTeam(), fetchSeatsQuota()]);
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

  const seatsUsed = quotaInfo?.seatsUsed ?? members.length;
  const maxSeats = quotaInfo?.maxSeats ?? 5;
  const seatsAvailable = Math.max(0, maxSeats - seatsUsed);
  const seatPercentage = Math.min(100, Math.round((seatsUsed / maxSeats) * 100));

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Quản lý Nhân sự & Ghế ngồi (Seats)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý quyền hạn thành viên, theo dõi hạn mức ghế ngồi (F117) và cấp phát lời mời cộng tác
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={seatsAvailable <= 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm font-medium disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" /> Mời thành viên mới
        </button>
      </div>

      {/* SEAT QUOTA BANNER (F117) */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 rounded-2xl shadow-md border border-purple-400/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Định Mức Ghế Ngồi (Seat Quota)
              </span>
              {seatsAvailable === 0 ? (
                <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                  Đã hết ghế
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Còn trống {seatsAvailable} ghế
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Đã sử dụng {seatsUsed} trên tổng số {maxSeats} ghế
            </h2>
            <p className="text-xs text-purple-200">
              Mỗi thành viên chính thức và lời mời đang chờ được tính vào 1 ghế (Seat) trong Workspace.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden pt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatPercentage >= 100
                    ? 'bg-rose-500'
                    : seatPercentage > 75
                    ? 'bg-amber-400'
                    : 'bg-purple-400'
                }`}
                style={{ width: `${seatPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start md:items-center gap-3">
            <button
              onClick={() => navigate('/settings?tab=quota')}
              className="px-4 py-2.5 text-xs font-semibold bg-white text-purple-950 rounded-xl hover:bg-purple-50 transition-colors shadow flex items-center gap-1.5"
            >
              Nâng cấp thêm ghế
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE TEAM MEMBERS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">Thành Viên Chính Thức ({members.length})</h3>
          </div>
          <button
            onClick={fetchTeam}
            className="text-xs text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
              <tr>
                <th className="px-6 py-3.5 font-medium">Thành viên</th>
                <th className="px-6 py-3.5 font-medium">Quyền hạn (Role)</th>
                <th className="px-6 py-3.5 font-medium">Người thêm</th>
                <th className="px-6 py-3.5 font-medium">Ngày tham gia</th>
                <th className="px-6 py-3.5 font-medium text-right">Thao tác</th>
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
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full outline-none cursor-pointer ${
                          member.role === 'ADMIN'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="ADMIN">Quản trị viên (Admin)</option>
                        <option value="STAFF">Nhân viên (Staff)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {member.invitedBy?.email || 'Hệ thống'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingMember(member)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Chỉnh sửa quyền"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa khỏi nhóm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PENDING INVITATIONS TABLE (F117) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-sm">
              Lời Mời Đang Chờ Phê Duyệt ({quotaInfo?.invites?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-gray-400">Lời mời có hiệu lực trong 7 ngày</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-900">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
              <tr>
                <th className="px-6 py-3.5 font-medium">Email Người Nhận</th>
                <th className="px-6 py-3.5 font-medium">Quyền Dự Kiến</th>
                <th className="px-6 py-3.5 font-medium">Trạng Thái</th>
                <th className="px-6 py-3.5 font-medium">Ngày Mời</th>
                <th className="px-6 py-3.5 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!quotaInfo?.invites || quotaInfo.invites.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-500">
                    Không có lời mời nào đang chờ xử lý.
                  </td>
                </tr>
              ) : (
                quotaInfo.invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{invite.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {invite.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invite.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Đang chờ chấp nhận
                        </span>
                      )}
                      {invite.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã tham gia
                        </span>
                      )}
                      {invite.status === 'REVOKED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          <Ban className="w-3 h-3" /> Đã thu hồi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(invite.invitedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleCopyInviteLink(invite.id)}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                              title="Sao chép link mời"
                            >
                              <Copy className="w-3 h-3" /> Link
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                              title="Thu hồi lời mời"
                            >
                              <Ban className="w-3 h-3" /> Thu hồi
                            </button>
                          </>
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

      {/* INVITE MODAL (F117 Quota Guarded) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Mời Thành Viên Mới</h3>
                  <p className="text-xs text-gray-500">Còn trống {seatsAvailable} ghế trong Workspace</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Vai trò & Quyền hạn</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="STAFF">Nhân viên (Staff) - Đăng bài, trả lời tin nhắn, CRM</option>
                    <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền cấu hình</option>
                  </select>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Lời mời sẽ được tạo kèm mã định danh bảo mật. Người nhận có thể nhấn vào liên kết được cấp để tham gia.
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adding && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {adding ? 'Đang gửi...' : 'Gửi Lời Mời'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MEMBER MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
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

      {/* EDIT ROLE MODAL */}
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
