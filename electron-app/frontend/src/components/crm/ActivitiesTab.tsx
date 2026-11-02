import { useState, useEffect } from 'react';
import {
  PhoneCall,
  Calendar,
  MessageSquare,
  CheckSquare,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Filter,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export interface ActivityItem {
  id: string;
  type: 'CALL' | 'MEETING' | 'MESSAGE' | 'TASK' | 'NOTE';
  title: string;
  description: string | null;
  customerId: string | null;
  dueDate: string | null;
  isDone: boolean;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string; email?: string } | null;
  createdBy?: { id: string; name: string; email?: string } | null;
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export default function ActivitiesTab({ customers = [] }: { customers?: CustomerOption[] }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New activity form
  const [formData, setFormData] = useState({
    type: 'CALL' as 'CALL' | 'MEETING' | 'MESSAGE' | 'TASK' | 'NOTE',
    title: '',
    description: '',
    customerId: '',
    dueDate: '',
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/activities');
      if (res.data?.activities) {
        setActivities(res.data.activities);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách hoạt động CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleToggleDone = async (activity: ActivityItem) => {
    const newStatus = !activity.isDone;
    try {
      await api.patch('/crm/activities', { id: activity.id, isDone: newStatus });
      setActivities(prev =>
        prev.map(a => a.id === activity.id ? { ...a, isDone: newStatus } : a)
      );
      toast.success(newStatus ? 'Đã đánh dấu hoàn thành hoạt động!' : 'Đã chuyển về trạng thái đang chờ.');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa hoạt động "${title}"?`)) return;
    try {
      await api.delete(`/crm/activities?id=${id}`);
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Đã xóa hoạt động');
    } catch {
      toast.error('Lỗi khi xóa hoạt động');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề hoạt động');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        customerId: formData.customerId || undefined,
        dueDate: formData.dueDate || undefined,
      };

      const res = await api.post('/crm/activities', payload);
      if (res.data?.activity) {
        setActivities(prev => [res.data.activity, ...prev]);
        toast.success('Đã tạo hoạt động chăm sóc thành công!');
        setShowCreateModal(false);
        setFormData({
          type: 'CALL',
          title: '',
          description: '',
          customerId: '',
          dueDate: '',
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo hoạt động');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredActivities = activities.filter(a => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (statusFilter === 'PENDING' && a.isDone) return false;
    if (statusFilter === 'DONE' && !a.isDone) return false;
    return true;
  });

  const pendingCount = activities.filter(a => !a.isDone).length;
  const doneCount = activities.filter(a => a.isDone).length;
  const callMeetingCount = activities.filter(a => a.type === 'CALL' || a.type === 'MEETING').length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CALL':
        return { label: 'Cuộc gọi (Call)', icon: PhoneCall, className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'MEETING':
        return { label: 'Lịch hẹn (Meeting)', icon: Calendar, className: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'MESSAGE':
        return { label: 'Tin nhắn (Message)', icon: MessageSquare, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TASK':
        return { label: 'Công việc (Task)', icon: CheckSquare, className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'NOTE':
      default:
        return { label: 'Lời nhắc (Reminder)', icon: FileText, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Quick Add */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
              Tính năng F098
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Hoạt động Chăm sóc & Nhắc việc (Activity & Follow-up)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ghi nhận lịch sử cuộc gọi (Call), lịch hẹn (Meeting), tin nhắn (Message), công việc (Task) và lời nhắc (Reminder) gắn với từng khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchActivities}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo hoạt động mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500">Tổng hoạt động</span>
          <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600">Đang chờ thực hiện</span>
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-600">Cuộc gọi & Lịch hẹn</span>
          <div className="text-2xl font-bold text-blue-600">{callMeetingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600">Đã hoàn thành</span>
          <div className="text-2xl font-bold text-emerald-600">{doneCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'CALL', 'MEETING', 'MESSAGE', 'TASK', 'NOTE'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === t
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'ALL' && 'Tất cả'}
              {t === 'CALL' && '📞 Cuộc gọi'}
              {t === 'MEETING' && '🤝 Lịch hẹn'}
              {t === 'MESSAGE' && '💬 Tin nhắn'}
              {t === 'TASK' && '📝 Công việc'}
              {t === 'NOTE' && '⏰ Lời nhắc'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-lg transition ${statusFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Chưa xong ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('DONE')}
            className={`px-3 py-1 rounded-lg transition ${statusFilter === 'DONE' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Đã xong ({doneCount})
          </button>
        </div>
      </div>

      {/* Activities Timeline / List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Đang tải lịch sử hoạt động CRM...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl p-8 space-y-3">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-800 text-sm">Chưa có hoạt động nào phù hợp</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Ghi nhận các cuộc gọi tư vấn, lịch hẹn ký hợp đồng hoặc lời nhắc chăm sóc khách hàng để không bỏ lỡ cơ hội.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo hoạt động đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const badge = getTypeBadge(activity.type);
            const Icon = badge.icon;
            const isOverdue = activity.dueDate && !activity.isDone && new Date(activity.dueDate) < new Date();

            return (
              <div
                key={activity.id}
                className={`p-4 rounded-2xl bg-white border transition-all shadow-2xs hover:shadow-xs flex items-start justify-between gap-4 group ${
                  activity.isDone
                    ? 'border-gray-100 opacity-60 bg-gray-50/50'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-gray-200/80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleDone(activity)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      activity.isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-300 hover:border-emerald-500 bg-white'
                    }`}
                    title={activity.isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                  >
                    {activity.isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Content */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.className}`}>
                        <Icon className="w-2.5 h-2.5" />
                        <span>{badge.label}</span>
                      </span>

                      <h4 className={`text-xs font-bold text-gray-900 ${activity.isDone ? 'line-through text-gray-400' : ''}`}>
                        {activity.title}
                      </h4>

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Quá hạn</span>
                        </span>
                      )}
                    </div>

                    {activity.description && (
                      <p className="text-[11px] text-gray-600 leading-relaxed max-w-2xl">
                        {activity.description}
                      </p>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap pt-0.5">
                      {activity.customer && (
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <User className="w-3 h-3 text-indigo-500" />
                          <span>{activity.customer.name}</span>
                          {activity.customer.phone && <span className="font-mono text-gray-400">({activity.customer.phone})</span>}
                        </span>
                      )}

                      {activity.dueDate && (
                        <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                          <Clock className="w-3 h-3" />
                          <span>Hạn chót: {new Date(activity.dueDate).toLocaleString('vi-VN')}</span>
                        </span>
                      )}

                      {activity.createdBy && (
                        <span>• Phụ trách: <strong>{activity.createdBy.name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={() => handleDelete(activity.id, activity.title)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Xóa hoạt động"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tạo Hoạt Động Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Tạo Hoạt Động & Lịch Hẹn (F098)</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Lên lịch gọi điện, gặp mặt hoặc ghi nhận công việc chăm sóc khách hàng</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Loại hoạt động *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs bg-white font-medium"
                  >
                    <option value="CALL">📞 Cuộc gọi (Call)</option>
                    <option value="MEETING">🤝 Cuộc hẹn / Gặp mặt (Meeting)</option>
                    <option value="MESSAGE">💬 Tin nhắn tư vấn (Message)</option>
                    <option value="TASK">📝 Công việc chăm sóc (Task)</option>
                    <option value="NOTE">⏰ Lời nhắc / Ghi chú (Reminder)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Thời hạn / Giờ hẹn</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Khách hàng liên quan</label>
                <select
                  value={formData.customerId}
                  onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs bg-white"
                >
                  <option value="">-- Không gắn khách hàng cụ thể --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Khách không tên'} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tiêu đề hoạt động *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hẹn gọi lại tư vấn gói khuyến mãi Q4"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Ghi chú & Nội dung chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú nội dung trao đổi, nhu cầu khách hàng, các điểm cần chốt..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Lưu hoạt động</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

