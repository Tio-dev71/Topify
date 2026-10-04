'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, PlayCircle, StopCircle, Zap, CheckCircle2, Clock, AlertCircle, Search, Settings, Eye, Edit2, X, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type AutomationTask = {
  id: string;
  name: string;
  type: string;
  profileIds: string[];
  status: string;
  createdAt: string;
  config?: Record<string, unknown>;
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // View & Edit Modal state
  const [viewingTask, setViewingTask] = useState<AutomationTask | null>(null);
  const [editingTask, setEditingTask] = useState<AutomationTask | null>(null);
  const [updatingTask, setUpdatingTask] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    profileIds: string[];
    config: Record<string, unknown>;
  }>({
    name: '',
    type: 'COMMENT',
    profileIds: [],
    config: {}
  });

  const [editFormData, setEditFormData] = useState<{
    id: string;
    name: string;
    type: string;
    profileIds: string[];
    status: string;
    config: Record<string, unknown>;
  }>({
    id: '',
    name: '',
    type: 'COMMENT',
    profileIds: [],
    status: 'IDLE',
    config: {}
  });

  const fetchTasks = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/automation/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (_err) {
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

  useEffect(() => {
    let ignore = false;
    fetch('/api/automation/tasks')
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setTasks(data.tasks || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    fetch('/api/fb-profiles')
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setAccounts(data.accounts || []);
        }
      })
      .catch(console.error);

    return () => {
      ignore = true;
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
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
    } catch (_err) {
      toast.error('Lỗi khi lưu tác vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (task: AutomationTask) => {
    setEditingTask(task);
    setEditFormData({
      id: task.id,
      name: task.name,
      type: task.type,
      profileIds: task.profileIds || [],
      status: task.status || 'IDLE',
      config: task.config || {}
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error('Vui lòng nhập tên tác vụ');
      return;
    }
    if (editFormData.profileIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 tài khoản');
      return;
    }

    setUpdatingTask(true);
    try {
      const res = await fetch('/api/automation/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        toast.success('Cập nhật tác vụ thành công');
        setEditingTask(null);
        fetchTasks();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật tác vụ thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi khi cập nhật tác vụ');
    } finally {
      setUpdatingTask(false);
    }
  };

  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const handleRunTask = async (task: AutomationTask) => {
    if (!task.profileIds || task.profileIds.length === 0) {
      toast.error('Tác vụ chưa chọn tài khoản Facebook nào. Vui lòng bấm Chỉnh sửa để chọn tài khoản.');
      return;
    }

    try {
      setRunningTaskId(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'RUNNING' } : t));
      if (viewingTask && viewingTask.id === task.id) {
        setViewingTask({ ...viewingTask, status: 'RUNNING' });
      }

      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          accountIds: task.profileIds,
          config: {
            type: task.type,
            ...(task.config || {})
          }
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Khởi chạy kịch bản thất bại');
        fetchTasks();
      } else {
        toast.success('Đã kích hoạt kịch bản tự động hóa ngầm thành công!');
        fetchTasks();
      }
    } catch (err: any) {
      toast.error('Lỗi khi kích hoạt tác vụ: ' + (err.message || 'Lỗi kết nối'));
      fetchTasks();
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleStopTask = async (task: AutomationTask) => {
    try {
      const res = await fetch('/api/automation/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Không thể dừng tác vụ');
      } else {
        toast.success('Đã gửi lệnh dừng tác vụ');
        fetchTasks();
        if (viewingTask && viewingTask.id === task.id) {
          setViewingTask({ ...viewingTask, status: 'IDLE' });
        }
      }
    } catch (_err) {
      toast.error('Lỗi khi gửi lệnh dừng tác vụ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tác vụ này?')) return;
    
    try {
      const res = await fetch(`/api/automation/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá tác vụ');
        if (viewingTask?.id === id) setViewingTask(null);
        fetchTasks();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (_err) {
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

  const toggleEditProfileSelect = (profileId: string) => {
    setEditFormData(prev => {
      const isSelected = prev.profileIds.includes(profileId);
      if (isSelected) {
        return { ...prev, profileIds: prev.profileIds.filter(id => id !== profileId) };
      } else {
        return { ...prev, profileIds: [...prev.profileIds, profileId] };
      }
    });
  };

  const filteredTasks = tasks.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium">
            <Zap className="w-4 h-4" />
            Tự động hóa
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
            Tác Vụ Tự Động
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Quản lý và điều phối các chiến dịch tương tác mạng xã hội tự động của bạn với hiệu suất cao nhất.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
        >
          <button 
            onClick={() => { fetchTasks(true); fetchAccounts(); }} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] group"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Tác Vụ</span>
          </button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative group max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tác vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-xl"
          />
        </div>
      </motion.div>

      {/* Task List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent blur-3xl -z-10 rounded-3xl" />
        
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-800/50 text-zinc-300 font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl whitespace-nowrap min-w-[240px]">Tên Tác Vụ</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[150px]">Loại</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[150px]">Số Tài Khoản</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[160px]">Trạng Thái</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right whitespace-nowrap w-[160px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <AnimatePresence>
                  {loading && tasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                          <p className="text-zinc-500">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-zinc-500" />
                          </div>
                          <p className="text-lg font-medium text-white mb-1">Chưa có tác vụ nào</p>
                          <p className="text-zinc-500">Nhấp vào &quot;Tạo Tác Vụ&quot; để bắt đầu thiết lập tự động hóa.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, index) => (
                      <motion.tr 
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-zinc-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 min-w-[240px] max-w-[360px]">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors shrink-0">
                              <Settings className="w-4 h-4 text-indigo-400" />
                            </div>
                            <button
                              onClick={() => setViewingTask(task)}
                              className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors text-left truncate block"
                              title={task.name}
                            >
                              {task.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[150px]">
                          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-lg border border-purple-500/20 whitespace-nowrap inline-block">
                            {task.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[150px]">
                          <div className="flex items-center gap-1.5 text-zinc-400 whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                            <span>{task.profileIds?.length || 0} tài khoản</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[160px]">
                          {task.status === 'RUNNING' ? (
                            <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium text-xs bg-blue-400/10 px-2.5 py-1 rounded-lg w-fit border border-blue-400/20 whitespace-nowrap">
                              <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                            </span>
                          ) : task.status === 'DONE' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                            </span>
                          ) : task.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20 whitespace-nowrap">
                              <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-zinc-400 font-medium text-xs bg-zinc-800 px-2.5 py-1 rounded-lg w-fit border border-zinc-700 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap w-[160px]">
                          <div className="flex justify-end items-center gap-1">
                            <button 
                              onClick={() => setViewingTask(task)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(task)}
                              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Chỉnh sửa tác vụ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {task.status === 'RUNNING' ? (
                              <button 
                                onClick={() => handleStopTask(task)}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Dừng tác vụ"
                              >
                                <StopCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRunTask(task)}
                                disabled={runningTaskId === task.id}
                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Bắt đầu chạy"
                              >
                                {runningTaskId === task.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(task.id)}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Xoá tác vụ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Tạo Tác Vụ Mới</h3>
                  <p className="text-sm text-zinc-400 mt-1">Cấu hình luồng tự động hóa</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="add-task-form" onSubmit={handleAddTask} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Tên tác vụ</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="VD: Kéo tương tác fanpage tháng 10"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Loại tác vụ</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="COMMENT">Bình luận dạo (Nuôi nick)</option>
                      <option value="ADD_FRIEND">Kết bạn theo tệp UID</option>
                      <option value="INVITE_GROUP">Mời bạn bè vào nhóm</option>
                      <option value="POST_REEL">Đăng Reels hàng loạt</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Chọn tài khoản chạy <span className="text-indigo-400 ml-1">({formData.profileIds.length}/{accounts.length})</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, profileIds: accounts.map(a => a.profileId)})}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Chọn tất cả
                      </button>
                    </div>
                    
                    {accounts.length === 0 ? (
                      <div className="p-6 bg-zinc-950 border border-zinc-800 border-dashed rounded-xl text-center text-sm text-zinc-500">
                        Chưa có tài khoản Facebook nào. Hãy thêm tài khoản trước.
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar bg-zinc-950">
                        <div className="divide-y divide-zinc-800/50">
                          {accounts.map(acc => (
                            <label key={acc.id} className="flex items-center gap-3 p-3.5 hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={formData.profileIds.includes(acc.profileId)}
                                  onChange={() => toggleProfileSelect(acc.profileId)}
                                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-zinc-950"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-none">{acc.name}</p>
                                <p className="text-xs text-zinc-500 mt-1 font-mono">{acc.profileId}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="add-task-form"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang lưu...' : 'Lưu Tác Vụ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewingTask(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">Chi Tiết Tác Vụ</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Mã ID: <span className="font-mono text-zinc-300">{viewingTask.id}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingTask(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Tên tác vụ</label>
                  <p className="text-base font-medium text-white">{viewingTask.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Loại tác vụ</label>
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-lg border border-purple-500/20 inline-block">
                      {viewingTask.type}
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Trạng thái</label>
                    {viewingTask.status === 'RUNNING' ? (
                      <span className="flex items-center gap-1.5 text-blue-400 font-medium text-xs bg-blue-400/10 px-2.5 py-1 rounded-lg w-fit border border-blue-400/20">
                        <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                      </span>
                    ) : viewingTask.status === 'DONE' ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                      </span>
                    ) : viewingTask.status === 'FAILED' ? (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20">
                        <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-xs bg-zinc-800 px-2.5 py-1 rounded-lg w-fit border border-zinc-700">
                        <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Tài khoản thực thi ({viewingTask.profileIds?.length || 0})
                    </label>
                  </div>

                  {(!viewingTask.profileIds || viewingTask.profileIds.length === 0) ? (
                    <p className="text-sm text-zinc-500">Chưa gán tài khoản nào</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {viewingTask.profileIds.map((pid) => {
                        const acc = accounts.find(a => a.profileId === pid);
                        return (
                          <div key={pid} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
                            <span className="text-zinc-200 font-medium">{acc ? acc.name : 'Tài khoản UID'}</span>
                            <span className="text-zinc-500 font-mono">{pid}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {viewingTask.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ngày tạo: {new Date(viewingTask.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Đóng
                </button>
                {viewingTask.status === 'RUNNING' ? (
                  <button 
                    type="button"
                    onClick={() => handleStopTask(viewingTask)}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  >
                    <StopCircle className="w-4 h-4" />
                    Dừng Tác Vụ
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => handleRunTask(viewingTask)}
                    disabled={runningTaskId === viewingTask.id}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                  >
                    {runningTaskId === viewingTask.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    Kích Hoạt Chạy
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => {
                    const taskToEdit = viewingTask;
                    setViewingTask(null);
                    handleOpenEdit(taskToEdit);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh Sửa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingTask(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Chỉnh Sửa Tác Vụ</h3>
                  <p className="text-sm text-zinc-400 mt-1">Cập nhật cấu hình và thông tin tác vụ</p>
                </div>
                <button 
                  onClick={() => setEditingTask(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="edit-task-form" onSubmit={handleUpdateTask} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Tên tác vụ</label>
                    <input 
                      type="text" 
                      value={editFormData.name}
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                      placeholder="VD: Kéo tương tác fanpage tháng 10"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Loại tác vụ</label>
                      <select 
                        value={editFormData.type}
                        onChange={e => setEditFormData({...editFormData, type: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all appearance-none"
                      >
                        <option value="COMMENT">Bình luận dạo</option>
                        <option value="ADD_FRIEND">Kết bạn UID</option>
                        <option value="INVITE_GROUP">Mời nhóm</option>
                        <option value="POST_REEL">Đăng Reels</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Trạng thái</label>
                      <select 
                        value={editFormData.status}
                        onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all appearance-none"
                      >
                        <option value="IDLE">Chờ xử lý (IDLE)</option>
                        <option value="RUNNING">Đang chạy (RUNNING)</option>
                        <option value="DONE">Hoàn thành (DONE)</option>
                        <option value="FAILED">Thất bại (FAILED)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Chọn tài khoản chạy <span className="text-amber-400 ml-1">({editFormData.profileIds.length}/{accounts.length})</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => setEditFormData({...editFormData, profileIds: accounts.map(a => a.profileId)})}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Chọn tất cả
                      </button>
                    </div>
                    
                    {accounts.length === 0 ? (
                      <div className="p-6 bg-zinc-950 border border-zinc-800 border-dashed rounded-xl text-center text-sm text-zinc-500">
                        Chưa có tài khoản Facebook nào. Hãy thêm tài khoản trước.
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar bg-zinc-950">
                        <div className="divide-y divide-zinc-800/50">
                          {accounts.map(acc => (
                            <label key={acc.id} className="flex items-center gap-3 p-3.5 hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={editFormData.profileIds.includes(acc.profileId)}
                                  onChange={() => toggleEditProfileSelect(acc.profileId)}
                                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-zinc-950"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-none">{acc.name}</p>
                                <p className="text-xs text-zinc-500 mt-1 font-mono">{acc.profileId}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="edit-task-form"
                  disabled={updatingTask}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updatingTask && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updatingTask ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
