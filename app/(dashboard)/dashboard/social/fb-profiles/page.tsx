'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, AlertCircle, Search, Users, XCircle, ShieldCheck, Eye, Edit2, X, Globe, Shield, Calendar, Key } from 'lucide-react';
import { toast } from 'sonner';

type FbAccount = {
  id: string;
  name: string;
  uid: string | null;
  profileId: string;
  status: string;
  createdAt: string;
  proxy?: string | null;
  twoFactorCode?: string | null;
  cookie?: string | null;
};

export default function FbProfilesPage() {
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    password: '',
    twoFactorCode: '',
    cookie: '',
    proxy: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // View & Edit Modal state
  const [viewingAccount, setViewingAccount] = useState<FbAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<FbAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    uid: '',
    password: '',
    twoFactorCode: '',
    cookie: '',
    proxy: '',
    status: 'LIVE'
  });
  const [updating, setUpdating] = useState(false);

  const fetchAccounts = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/fb-profiles');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (_err) {
      toast.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/fb-profiles')
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setAccounts(data.accounts || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên gợi nhớ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/fb-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Thêm tài khoản thành công');
        setShowAddModal(false);
        setFormData({ name: '', uid: '', password: '', twoFactorCode: '', cookie: '', proxy: '' });
        fetchAccounts();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm tài khoản');
      }
    } catch (_err) {
      toast.error('Lỗi khi lưu tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (acc: FbAccount) => {
    setEditingAccount(acc);
    setEditFormData({
      id: acc.id,
      name: acc.name || '',
      uid: acc.uid || '',
      password: '',
      twoFactorCode: acc.twoFactorCode || '',
      cookie: acc.cookie || '',
      proxy: acc.proxy || '',
      status: acc.status || 'LIVE'
    });
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error('Vui lòng nhập tên gợi nhớ');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/fb-profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        toast.success('Cập nhật tài khoản thành công');
        setEditingAccount(null);
        fetchAccounts();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật tài khoản thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi khi cập nhật tài khoản');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tài khoản này?')) return;
    
    try {
      const res = await fetch(`/api/fb-profiles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá tài khoản');
        if (viewingAccount?.id === id) setViewingAccount(null);
        fetchAccounts();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (_err) {
      toast.error('Xoá thất bại');
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.uid && a.uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
    a.profileId.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] text-sm font-medium">
            <Users className="w-4 h-4" />
            Social Profiles
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500">
            Tài Khoản Facebook
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Quản lý các tài khoản mạng xã hội để chạy tự động hóa an toàn và bảo mật.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
        >
          <button 
            onClick={() => fetchAccounts(true)} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#1877F2] hover:bg-[#1877F2]/90 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(24,119,242,0.4)] group"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
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
            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản, UID, Profile ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all backdrop-blur-xl"
          />
        </div>
      </motion.div>

      {/* Accounts List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-blue-500/5 to-transparent blur-3xl -z-10 rounded-3xl" />
        
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-800/50 text-zinc-300 font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl whitespace-nowrap min-w-[220px]">Tên Gợi Nhớ</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[180px]">UID</th>
                  <th className="px-6 py-4 whitespace-nowrap min-w-[200px] w-[240px]">Profile ID (Local)</th>
                  <th className="px-6 py-4 whitespace-nowrap w-[180px]">Trạng Thái</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right whitespace-nowrap w-[150px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <AnimatePresence>
                  {loading && accounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mb-4" />
                          <p className="text-zinc-500">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-zinc-500" />
                          </div>
                          <p className="text-lg font-medium text-white mb-1">Chưa có tài khoản nào</p>
                          <p className="text-zinc-500">Nhấp vào &quot;Thêm Tài Khoản&quot; để kết nối tài khoản Facebook.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc, index) => (
                      <motion.tr 
                        key={acc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-zinc-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 min-w-[220px] max-w-[320px]">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/20 transition-colors shrink-0">
                              <Users className="w-4 h-4 text-sky-400" />
                            </div>
                            <button
                              onClick={() => setViewingAccount(acc)}
                              className="font-medium text-zinc-200 hover:text-sky-400 transition-colors text-left truncate block"
                              title={acc.name}
                            >
                              {acc.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[180px]">
                          <span className="font-mono text-zinc-400">{acc.uid || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 min-w-[200px] max-w-[240px]">
                          <span className="font-mono text-zinc-500 truncate block" title={acc.profileId}>
                            {acc.profileId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-[180px]">
                          {acc.status === 'ACTIVE' || acc.status === 'ALIVE' || acc.status === 'LIVE' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20 whitespace-nowrap">
                              <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Đang hoạt động
                            </span>
                          ) : acc.status === 'CHECKPOINT' || acc.status === 'ERROR' ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20 whitespace-nowrap">
                              <XCircle className="w-3.5 h-3.5 shrink-0" /> Lỗi / Checkpoint
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-zinc-400 font-medium text-xs bg-zinc-800 px-2.5 py-1 rounded-lg w-fit border border-zinc-700 whitespace-nowrap">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {acc.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap w-[150px]">
                          <div className="flex justify-end items-center gap-1">
                            <button 
                              onClick={() => setViewingAccount(acc)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(acc)}
                              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Chỉnh sửa tài khoản"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(acc.id)}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Xoá tài khoản"
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
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#1877F2]" />
                    Thêm Tài Khoản Facebook
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Cung cấp thông tin để kết nối tài khoản an toàn.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="add-account-form" onSubmit={handleAddAccount} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Tên gợi nhớ <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="VD: Nick chính, Clone 1..."
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">UID (Tài khoản/Email)</label>
                      <input 
                        type="text" 
                        value={formData.uid}
                        onChange={e => setFormData({...formData, uid: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Mật khẩu</label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Mã 2FA (Bảo mật 2 lớp)</label>
                    <input 
                      type="text" 
                      value={formData.twoFactorCode}
                      onChange={e => setFormData({...formData, twoFactorCode: e.target.value})}
                      placeholder="Mã xác thực từ ứng dụng Authenticator"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Proxy (Tuỳ chọn)</label>
                    <input 
                      type="text" 
                      value={formData.proxy}
                      onChange={e => setFormData({...formData, proxy: e.target.value})}
                      placeholder="ip:port:user:pass"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Cookie (Tuỳ chọn - Nếu có sẽ bỏ qua login)</label>
                    <textarea 
                      value={formData.cookie}
                      onChange={e => setFormData({...formData, cookie: e.target.value})}
                      placeholder="c_user=...; xs=...;"
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-mono text-sm resize-none"
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
                  form="add-account-form"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)] hover:shadow-[0_0_20px_rgba(24,119,242,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang lưu...' : 'Thêm Tài Khoản'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {viewingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewingAccount(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <Users className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">Chi Tiết Tài Khoản</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Profile: <span className="font-mono text-zinc-300">{viewingAccount.profileId}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingAccount(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Tên gợi nhớ</label>
                  <p className="text-base font-semibold text-white">{viewingAccount.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">UID Facebook</label>
                    <p className="text-sm font-mono text-zinc-200">{viewingAccount.uid || 'Chưa cung cấp'}</p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Trạng thái</label>
                    {viewingAccount.status === 'ACTIVE' || viewingAccount.status === 'ALIVE' || viewingAccount.status === 'LIVE' ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                        <ShieldCheck className="w-3.5 h-3.5" /> Hoạt động tốt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium text-xs">
                        <XCircle className="w-3.5 h-3.5" /> {viewingAccount.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-medium text-zinc-300">Proxy</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">{viewingAccount.proxy || 'Không sử dụng proxy'}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-zinc-300">Mã 2FA Secret</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">{viewingAccount.twoFactorCode ? 'Đã lưu secret' : 'Chưa thiết lập'}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-medium text-zinc-300">Cookie phiên</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">{viewingAccount.cookie ? 'Đã lưu cookie' : 'Chưa có cookie'}</span>
                  </div>
                </div>

                {viewingAccount.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ngày thêm: {new Date(viewingAccount.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setViewingAccount(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Đóng
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const accToEdit = viewingAccount;
                    setViewingAccount(null);
                    handleOpenEdit(accToEdit);
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
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingAccount(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-amber-400" />
                    Chỉnh Sửa Tài Khoản Facebook
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Cập nhật thông tin định danh và bảo mật tài khoản.</p>
                </div>
                <button 
                  onClick={() => setEditingAccount(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="edit-account-form" onSubmit={handleUpdateAccount} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Tên gợi nhớ <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        value={editFormData.name}
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Trạng thái</label>
                      <select 
                        value={editFormData.status}
                        onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all appearance-none"
                      >
                        <option value="LIVE">LIVE (Hoạt động)</option>
                        <option value="CHECKPOINT">CHECKPOINT (Bị khóa)</option>
                        <option value="ERROR">ERROR (Lỗi đăng nhập)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">UID (Tài khoản/Email)</label>
                      <input 
                        type="text" 
                        value={editFormData.uid}
                        onChange={e => setEditFormData({...editFormData, uid: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Mật khẩu mới (Để trống nếu không đổi)</label>
                      <input 
                        type="password" 
                        value={editFormData.password}
                        onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Mã 2FA (Secret)</label>
                    <input 
                      type="text" 
                      value={editFormData.twoFactorCode}
                      onChange={e => setEditFormData({...editFormData, twoFactorCode: e.target.value})}
                      placeholder="Mã bí mật 2FA Authenticator"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Proxy</label>
                    <input 
                      type="text" 
                      value={editFormData.proxy}
                      onChange={e => setEditFormData({...editFormData, proxy: e.target.value})}
                      placeholder="ip:port:user:pass"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Cookie Facebook</label>
                    <textarea 
                      value={editFormData.cookie}
                      onChange={e => setEditFormData({...editFormData, cookie: e.target.value})}
                      placeholder="c_user=...; xs=...;"
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono text-sm resize-none"
                    />
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-zinc-800 shrink-0 flex gap-3 justify-end bg-zinc-900/50 backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="edit-account-form"
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
