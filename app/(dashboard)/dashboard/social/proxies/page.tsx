'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Globe, Search, Eye, Edit2, X, Lock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type Proxy = {
  id: string;
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  status: string;
  createdAt: string;
};

export default function ProxiesPage() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View & Edit States
  const [viewingProxy, setViewingProxy] = useState<Proxy | null>(null);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [editFormData, setEditFormData] = useState({
    protocol: 'http',
    host: '',
    port: '',
    username: '',
    password: '',
    status: 'ACTIVE'
  });
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    protocol: 'http',
    host: '',
    port: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    let ignore = false;
    fetch('/api/proxies')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setProxies(data.proxies || []);
          setLoading(false);
        }
      })
      .catch((_err) => {
        if (!ignore) {
          toast.error('Lỗi khi tải danh sách Proxy');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const fetchProxies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proxies');
      if (res.ok) {
        const data = await res.json();
        setProxies(data.proxies || []);
      }
    } catch (_err) {
      toast.error('Lỗi khi tải danh sách Proxy');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (proxy: Proxy) => {
    setEditingProxy(proxy);
    setEditFormData({
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port.toString(),
      username: proxy.username || '',
      password: proxy.password || '',
      status: proxy.status || 'ACTIVE'
    });
  };

  const handleUpdateProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProxy) return;
    if (!editFormData.host || !editFormData.port) {
      toast.error('Vui lòng nhập IP và Port');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/proxies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProxy.id,
          protocol: editFormData.protocol,
          host: editFormData.host,
          port: parseInt(editFormData.port),
          username: editFormData.username,
          password: editFormData.password,
          status: editFormData.status
        })
      });

      if (res.ok) {
        toast.success('Cập nhật Proxy thành công');
        setEditingProxy(null);
        fetchProxies();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi cập nhật Proxy');
      }
    } catch (_err) {
      toast.error('Lỗi khi lưu Proxy');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.host || !formData.port) {
      toast.error('Vui lòng nhập IP và Port');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: formData.protocol,
          host: formData.host,
          port: parseInt(formData.port),
          username: formData.username,
          password: formData.password
        })
      });

      if (res.ok) {
        toast.success('Thêm Proxy thành công');
        setShowAddModal(false);
        setFormData({ protocol: 'http', host: '', port: '', username: '', password: '' });
        fetchProxies();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm Proxy');
      }
    } catch (_err) {
      toast.error('Lỗi khi lưu Proxy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá Proxy này?')) return;
    
    try {
      const res = await fetch(`/api/proxies?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá Proxy');
        fetchProxies();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (_err) {
      toast.error('Xoá thất bại');
    }
  };

  const filteredProxies = proxies.filter(p => 
    p.host.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.protocol.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Globe className="w-4 h-4" />
            Proxy Manager
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
            Quản Lý Proxy
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Cấu hình và quản lý danh sách Proxy tĩnh, xoay cho các tác vụ tự động hóa một cách an toàn.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
        >
          <button 
            onClick={fetchProxies} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] group"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Proxy</span>
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
            placeholder="Tìm kiếm IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-xl"
          />
        </div>
      </motion.div>

      {/* Proxy List */}
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
                  <th className="px-6 py-4 rounded-tl-2xl whitespace-nowrap w-[140px]">Giao Thức</th>
                  <th className="px-6 py-4 whitespace-nowrap min-w-[220px]">IP:Port</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[180px]">Xác Thực</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[160px]">Trạng Thái</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right whitespace-nowrap w-[150px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <AnimatePresence>
                  {loading && proxies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                          <p className="text-zinc-500">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProxies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                            <Globe className="w-8 h-8 text-zinc-500" />
                          </div>
                          <p className="text-lg font-medium text-white mb-1">Chưa có Proxy nào</p>
                          <p className="text-zinc-500">Nhấp vào &quot;Thêm Proxy&quot; để bắt đầu cấu hình.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProxies.map((proxy, index) => (
                      <motion.tr 
                        key={proxy.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-zinc-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap w-[140px]">
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 uppercase tracking-wider whitespace-nowrap inline-block">
                            {proxy.protocol}
                          </span>
                        </td>
                        <td className="px-6 py-4 min-w-[220px] max-w-[300px]">
                          <div 
                            className="font-mono font-medium text-zinc-200 truncate"
                            title={`${proxy.host}:${proxy.port}`}
                          >
                            {proxy.host}:{proxy.port}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[180px]">
                          <div className="text-zinc-400 whitespace-nowrap">
                            {proxy.username ? 'Có (User/Pass)' : 'Không (IP Auth)'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[160px]">
                          {proxy.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20 whitespace-nowrap">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Lỗi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap w-[150px]">
                          <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setViewingProxy(proxy)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(proxy)}
                              className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                              title="Chỉnh sửa Proxy"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(proxy.id)}
                              className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="Xoá Proxy"
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
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white">Thêm Proxy Mới</h3>
                <p className="text-sm text-zinc-400 mt-1">Cấu hình thông tin Proxy cho tự động hóa</p>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="add-proxy-form" onSubmit={handleAddProxy} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Giao thức</label>
                    <select 
                      value={formData.protocol}
                      onChange={e => setFormData({...formData, protocol: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="http">HTTP/HTTPS</option>
                      <option value="socks4">SOCKS4</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2 text-zinc-300">IP / Host</label>
                      <input 
                        type="text" 
                        value={formData.host}
                        onChange={e => setFormData({...formData, host: e.target.value})}
                        placeholder="192.168.1.1"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Port</label>
                      <input 
                        type="number" 
                        value={formData.port}
                        onChange={e => setFormData({...formData, port: e.target.value})}
                        placeholder="8080"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Username <span className="text-zinc-500 font-normal">(Tuỳ chọn)</span></label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Password <span className="text-zinc-500 font-normal">(Tuỳ chọn)</span></label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                    />
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
                  form="add-proxy-form"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang lưu...' : 'Lưu Proxy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {viewingProxy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewingProxy(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Chi Tiết Proxy
                  </h3>
                  <p className="text-sm text-zinc-400 mt-0.5">Thông tin cấu hình kết nối proxy</p>
                </div>
                <button
                  onClick={() => setViewingProxy(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                    <p className="text-xs text-zinc-500 mb-1">Giao thức</p>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 uppercase tracking-wider">
                      {viewingProxy.protocol}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                    <p className="text-xs text-zinc-500 mb-1">Trạng thái</p>
                    {viewingProxy.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg border border-rose-400/20">
                        <AlertCircle className="w-3.5 h-3.5" /> {viewingProxy.status || 'Lỗi'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Địa chỉ IP : Cổng (Host : Port)</p>
                    <div className="font-mono text-base font-semibold text-zinc-200 select-all">
                      {viewingProxy.host}:{viewingProxy.port}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" /> Thông tin Xác thực
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Tài khoản (Username)</p>
                      <p className="font-mono text-sm text-zinc-300">
                        {viewingProxy.username || <span className="text-zinc-600 italic">Không có</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Mật khẩu (Password)</p>
                      <p className="font-mono text-sm text-zinc-300">
                        {viewingProxy.password ? '••••••••' : <span className="text-zinc-600 italic">Không có</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Ngày tạo: {new Date(viewingProxy.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setViewingProxy(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(viewingProxy);
                    setViewingProxy(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProxy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingProxy(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-indigo-400" />
                    Chỉnh Sửa Proxy
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Cập nhật thông tin Proxy và trạng thái hoạt động</p>
                </div>
                <button
                  onClick={() => setEditingProxy(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="edit-proxy-form" onSubmit={handleUpdateProxy} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Giao thức</label>
                      <select 
                        value={editFormData.protocol}
                        onChange={e => setEditFormData({...editFormData, protocol: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="http">HTTP/HTTPS</option>
                        <option value="socks4">SOCKS4</option>
                        <option value="socks5">SOCKS5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Trạng thái</label>
                      <select 
                        value={editFormData.status}
                        onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                        <option value="ERROR">Bị lỗi (ERROR)</option>
                        <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2 text-zinc-300">IP / Host</label>
                      <input 
                        type="text" 
                        value={editFormData.host}
                        onChange={e => setEditFormData({...editFormData, host: e.target.value})}
                        placeholder="192.168.1.1"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Port</label>
                      <input 
                        type="number" 
                        value={editFormData.port}
                        onChange={e => setEditFormData({...editFormData, port: e.target.value})}
                        placeholder="8080"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Username <span className="text-zinc-500 font-normal">(Tuỳ chọn)</span></label>
                    <input 
                      type="text" 
                      value={editFormData.username}
                      onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Password <span className="text-zinc-500 font-normal">(Tuỳ chọn)</span></label>
                    <input 
                      type="password" 
                      value={editFormData.password}
                      onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                      placeholder="Để trống nếu không đổi mật khẩu"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setEditingProxy(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="edit-proxy-form"
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang cập nhật...' : 'Cập Nhật Proxy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
