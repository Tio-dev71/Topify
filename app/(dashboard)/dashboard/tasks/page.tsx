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
  AlertCircle,
  Eye,
  Edit2,
  FileText,
  User,
  Tag
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

  // View Task Modal State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE',
    dueDate: '',
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editFormData.title.trim()) {
      return toast.error('Vui lòng nhập tên công việc');
    }

    setIsEditSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: editingTask.id,
          title: editFormData.title.trim(),
          description: editFormData.description.trim() || null,
          priority: editFormData.priority,
          status: editFormData.status,
          dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTask = data.task || {
          ...editingTask,
          title: editFormData.title.trim(),
          description: editFormData.description.trim() || null,
          priority: editFormData.priority,
          status: editFormData.status,
          dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : null,
        };

        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updatedTask } : t));
        if (viewingTask?.id === editingTask.id) {
          setViewingTask(prev => prev ? { ...prev, ...updatedTask } : null);
        }
        toast.success('Đã cập nhật công việc thành công');
        setEditingTask(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-red-500 bg-red-500/10 border-red-500/20 whitespace-nowrap inline-flex items-center">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-orange-500 bg-orange-500/10 border-orange-500/20 whitespace-nowrap inline-flex items-center">Ưu tiên cao</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-blue-500 bg-blue-500/10 border-blue-500/20 whitespace-nowrap inline-flex items-center">Trung bình</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-zinc-500 bg-zinc-500/10 border-zinc-500/20 whitespace-nowrap inline-flex items-center">Ưu tiên thấp</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-zinc-500 bg-zinc-500/10 border-zinc-500/20 whitespace-nowrap inline-flex items-center">{priority}</span>;
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
                <th className="px-6 py-4 font-semibold w-16 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-semibold min-w-[280px] whitespace-nowrap">Tên công việc</th>
                <th className="px-6 py-4 font-semibold w-32 whitespace-nowrap">Độ ưu tiên</th>
                <th className="px-6 py-4 font-semibold w-40 whitespace-nowrap">Hạn chót</th>
                <th className="px-6 py-4 font-semibold w-40 whitespace-nowrap">Người giao</th>
                <th className="px-6 py-4 text-right w-24 whitespace-nowrap">Thao tác</th>
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
                    <td className="px-6 py-4 whitespace-nowrap w-16">
                      <button 
                        onClick={() => handleCycleStatus(task)}
                        className="hover:scale-110 transition-transform"
                        title="Bấm để chuyển trạng thái"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 min-w-[280px] max-w-[400px]">
                      <div className="truncate">
                        <span 
                          onClick={() => setViewingTask(task)}
                          title={`Xem chi tiết: ${task.title}`}
                          className={`font-semibold text-sm block truncate cursor-pointer hover:text-[var(--color-primary)] transition-colors ${task.status === 'DONE' ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p 
                            onClick={() => setViewingTask(task)}
                            title={task.description}
                            className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5 cursor-pointer hover:text-[var(--color-foreground)] transition-colors"
                          >
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-40">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">Không thời hạn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-40 text-xs text-[var(--color-muted-foreground)]">
                      <div className="truncate max-w-[150px]" title={task.createdBy?.name || 'Hệ thống'}>
                        {task.createdBy?.name || 'Hệ thống'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap w-28">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setViewingTask(task)}
                          className="p-1.5 text-zinc-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(task)}
                          className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Xóa công việc"
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
                    <option value="LOW">Ưu tiên thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Ưu tiên cao</option>
                    <option value="URGENT">Khẩn cấp</option>
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

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--color-border)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    Mã: #{viewingTask.id.slice(0, 8)}
                  </span>
                  {getPriorityBadge(viewingTask.priority)}
                </div>
                <h3 className="text-lg font-bold text-[var(--color-foreground)] mt-2">
                  {viewingTask.title}
                </h3>
              </div>
              <button 
                onClick={() => setViewingTask(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status banner with quick toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  {getStatusIcon(viewingTask.status)}
                  <div>
                    <span className="text-xs text-[var(--color-muted-foreground)] block">Trạng thái</span>
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {viewingTask.status === 'TODO' ? 'Cần làm (TODO)' :
                       viewingTask.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                       viewingTask.status === 'IN_REVIEW' ? 'Đang xem xét' : 'Đã hoàn thành'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleCycleStatus(viewingTask);
                    const nextMap: Record<string, any> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', IN_REVIEW: 'DONE', DONE: 'TODO' };
                    setViewingTask({ ...viewingTask, status: nextMap[viewingTask.status] || 'TODO' });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Chuyển tiếp
                </button>
              </div>

              {/* Description */}
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider block mb-1.5">
                  Mô tả chi tiết
                </span>
                <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] min-h-[80px] whitespace-pre-wrap">
                  {viewingTask.description || <span className="text-[var(--color-muted-foreground)] italic">Không có mô tả nào cho công việc này.</span>}
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                  <span className="text-[var(--color-muted-foreground)] block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Hạn chót
                  </span>
                  <span className="font-semibold text-[var(--color-foreground)] block">
                    {viewingTask.dueDate ? format(new Date(viewingTask.dueDate), 'dd/MM/yyyy') : 'Không thời hạn'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                  <span className="text-[var(--color-muted-foreground)] block flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Người tạo
                  </span>
                  <span className="font-semibold text-[var(--color-foreground)] block truncate">
                    {viewingTask.createdBy?.name || 'Hệ thống'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-muted-foreground)]">
                Ngày tạo: {format(new Date(viewingTask.createdAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingTask;
                  setViewingTask(null);
                  openEditModal(target);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Chỉnh sửa công việc</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">Cập nhật nội dung, tiến độ và hạn chót</p>
              </div>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên công việc *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lên nội dung bài viết Fanpage..."
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
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
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="TODO">Cần làm</option>
                    <option value="IN_PROGRESS">Đang làm</option>
                    <option value="IN_REVIEW">Xem xét</option>
                    <option value="DONE">Hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="LOW">Ưu tiên thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Ưu tiên cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isEditSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
