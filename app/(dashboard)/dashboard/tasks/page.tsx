'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical,
  Calendar,
  RefreshCw,
  Trash2,
  X,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  dueDate?: string | null;
  assignee?: { name: string; image?: string } | null;
  createdBy?: { name: string } | null;
  createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        let list: Task[] = data.tasks || [];

        // Auto seed default tasks if empty
        if (list.length === 0) {
          const starterTasks = [
            { title: 'Viết kịch bản video TikTok tuần này', priority: 'HIGH', dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
            { title: 'Gọi lại tư vấn cho khách hàng quan tâm', priority: 'MEDIUM', dueDate: new Date(Date.now() + 86400000).toISOString() },
            { title: 'Kiểm tra báo cáo chiến dịch quảng cáo', priority: 'LOW', dueDate: new Date(Date.now() + 86400000 * 4).toISOString() },
          ];

          for (const item of starterTasks) {
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          }

          const retryRes = await fetch('/api/tasks');
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            list = retryData.tasks || [];
          }
        }

        setTasks(list);
      } else {
        toast.error('Không thể tải danh sách công việc');
      }
    } catch (err) {
      toast.error('Lỗi khi tải công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error('Vui lòng nhập tên công việc');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Đã thêm công việc mới');
        setShowAddModal(false);
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
        fetchTasks();
      } else {
        toast.error('Thêm công việc thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCycleStatus = async (task: Task) => {
    const statusCycle: Record<string, 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      IN_REVIEW: 'DONE',
      DONE: 'TODO',
    };

    const nextStatus = statusCycle[task.status] || 'TODO';

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
        toast.success(`Đã cập nhật trạng thái sang ${nextStatus}`);
      } else {
        toast.error('Không thể đổi trạng thái');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;

    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa công việc');
        setTasks(prev => prev.filter(t => t.id !== id));
      } else {
        toast.error('Xóa thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-red-500 bg-red-500/10 border-red-500/20 uppercase">{priority}</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-yellow-500 bg-yellow-500/10 border-yellow-500/20 uppercase">{priority}</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-blue-500 bg-blue-500/10 border-blue-500/20 uppercase">{priority}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-zinc-500 bg-zinc-500/10 border-zinc-500/20 uppercase">{priority}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'IN_REVIEW': return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'TODO': default: return <Circle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && t.status === filterStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2 flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-[#5B3DF5]" />
            Công việc (Tasks)
          </h1>
          <p className="text-[var(--color-muted-foreground)]">Quản lý và giao việc cho đội ngũ nội bộ</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTasks}
            className="p-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm công việc
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-[var(--color-muted)]/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm công việc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto text-xs">
            <button 
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterStatus === 'ALL' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}
            >
              Tất cả ({tasks.length})
            </button>
            <button 
              onClick={() => setFilterStatus('TODO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterStatus === 'TODO' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}
            >
              Cần làm
            </button>
            <button 
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterStatus === 'IN_PROGRESS' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}
            >
              Đang làm
            </button>
            <button 
              onClick={() => setFilterStatus('DONE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterStatus === 'DONE' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}
            >
              Đã xong
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold w-12">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Tên công việc</th>
                <th className="px-6 py-4 font-semibold">Độ ưu tiên</th>
                <th className="px-6 py-4 font-semibold">Hạn chót</th>
                <th className="px-6 py-4 font-semibold">Người giao</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Đang tải danh sách công việc...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Không tìm thấy công việc nào.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-[var(--color-muted)]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleCycleStatus(task)}
                        className="hover:scale-110 transition-transform"
                        title="Bấm để chuyển trạng thái"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`font-semibold text-sm ${task.status === 'DONE' ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-muted-foreground)]">Không thời hạn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--color-muted-foreground)]">
                      {task.createdBy?.name || 'Hệ thống'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa công việc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Thêm công việc mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên công việc *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lên nội dung bài viết Fanpage..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú chi tiết yêu cầu công việc..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="LOW">Thấp (LOW)</option>
                    <option value="MEDIUM">Vừa (MEDIUM)</option>
                    <option value="HIGH">Cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Hạn chót (Deadline)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm công việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
