'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, PlayCircle, Zap, CheckCircle2, Clock, AlertCircle, Search, Settings } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
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
            onClick={fetchTasks} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
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
                  <th className="px-6 py-4 rounded-tl-2xl">Tên Tác Vụ</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Số Tài Khoản</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right">Thao Tác</th>
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
                          <p className="text-zinc-500">Nhấp vào "Tạo Tác Vụ" để bắt đầu thiết lập tự động hóa.</p>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                              <Settings className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="font-medium text-zinc-200">{task.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-lg border border-purple-500/20">
                            {task.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <div className="w-2 h-2 rounded-full bg-zinc-600" />
                            <span>{task.profileIds?.length || 0} tài khoản</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.status === 'RUNNING' ? (
                            <span className="flex items-center gap-1.5 text-blue-400 font-medium text-xs bg-blue-400/10 px-2.5 py-1 rounded-lg w-fit border border-blue-400/20">
                              <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                            </span>
                          ) : task.status === 'DONE' ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                            </span>
                          ) : task.status === 'FAILED' ? (
                            <span className="flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20">
                              <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-xs bg-zinc-800 px-2.5 py-1 rounded-lg w-fit border border-zinc-700">
                              <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                              title="Bắt đầu chạy"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(task.id)}
                              className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
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
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white">Tạo Tác Vụ Mới</h3>
                <p className="text-sm text-zinc-400 mt-1">Cấu hình luồng tự động hóa</p>
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
    </div>
  );
}
