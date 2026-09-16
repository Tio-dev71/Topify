'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, PlayCircle, Settings, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type AutomationTask = {
  id: string;
  name: string;
  type: string;
  profileIds: string[];
  status: string;
  createdAt: string;
};

type FbAccount = {
  id: string;
  name: string;
  profileId: string;
};

export default function AutomationPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    profileIds: string[];
    config: any;
  }>({
    name: '',
    type: 'COMMENT',
    profileIds: [],
    config: {}
  });

  useEffect(() => {
    fetchTasks();
    fetchAccounts();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách tác vụ');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/fb-profiles');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập tên tác vụ');
      return;
    }
    if (formData.profileIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 tài khoản');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/automation/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Thêm tác vụ thành công');
        setShowAddModal(false);
        setFormData({ name: '', type: 'COMMENT', profileIds: [], config: {} });
        fetchTasks();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm tác vụ');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu tác vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tác vụ này?')) return;
    
    try {
      const res = await fetch(`/api/automation/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá tác vụ');
        fetchTasks();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  const toggleProfileSelect = (profileId: string) => {
    setFormData(prev => {
      const isSelected = prev.profileIds.includes(profileId);
      if (isSelected) {
        return { ...prev, profileIds: prev.profileIds.filter(id => id !== profileId) };
      } else {
        return { ...prev, profileIds: [...prev.profileIds, profileId] };
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#5B3DF5]" />
            Tác vụ tự động
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý và theo dõi các chiến dịch tự động hoá</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Tạo tác vụ mới
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên tác vụ</th>
                <th className="px-6 py-4 font-semibold">Loại tác vụ</th>
                <th className="px-6 py-4 font-semibold">Số tài khoản</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-muted-foreground)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <FileText className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3" />
                    <p className="text-base font-medium">Chưa có tác vụ nào</p>
                    <p className="text-sm mt-1">Tạo tác vụ đầu tiên để bắt đầu tự động hoá</p>
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-[var(--color-muted)]/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                      {task.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold rounded-lg">
                        {task.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                      {task.profileIds?.length || 0} accounts
                    </td>
                    <td className="px-6 py-4">
                      {task.status === 'RUNNING' ? (
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium text-xs">
                          <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                        </span>
                      ) : task.status === 'DONE' ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                        </span>
                      ) : task.status === 'FAILED' ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium text-xs">
                          <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Bắt đầu chạy"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xoá tác vụ"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-lg border border-[var(--color-border)] flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-border)] shrink-0">
              <h3 className="text-lg font-bold">Tạo tác vụ mới</h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-task-form" onSubmit={handleAddTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tên tác vụ</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Kéo tương tác fanpage tháng 10"
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Loại tác vụ</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                  >
                    <option value="COMMENT">Bình luận dạo (Nuôi nick)</option>
                    <option value="ADD_FRIEND">Kết bạn theo tệp UID</option>
                    <option value="INVITE_GROUP">Mời bạn bè vào nhóm</option>
                    <option value="POST_REEL">Đăng Reels hàng loạt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex justify-between items-center">
                    <span>Chọn tài khoản chạy ({formData.profileIds.length}/{accounts.length})</span>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, profileIds: accounts.map(a => a.profileId)})}
                      className="text-xs text-[#5B3DF5] hover:underline"
                    >
                      Chọn tất cả
                    </button>
                  </label>
                  
                  {accounts.length === 0 ? (
                    <div className="p-4 bg-[var(--color-muted)]/20 rounded-xl text-center text-sm text-[var(--color-muted-foreground)]">
                      Chưa có tài khoản Facebook nào. Hãy thêm tài khoản trước.
                    </div>
                  ) : (
                    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <div className="divide-y divide-[var(--color-border)]">
                        {accounts.map(acc => (
                          <label key={acc.id} className="flex items-center gap-3 p-3 hover:bg-[var(--color-muted)]/10 cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={formData.profileIds.includes(acc.profileId)}
                              onChange={() => toggleProfileSelect(acc.profileId)}
                              className="rounded border-[var(--color-border)] text-[#5B3DF5] focus:ring-[#5B3DF5]"
                            />
                            <div>
                              <p className="text-sm font-medium leading-none">{acc.name}</p>
                              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{acc.profileId}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[var(--color-border)] shrink-0 flex gap-3 justify-end bg-[var(--color-background)]">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                form="add-task-form"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu Tác Vụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
