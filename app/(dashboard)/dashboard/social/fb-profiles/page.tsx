'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Search, Users, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type FbAccount = {
  id: string;
  name: string;
  uid: string | null;
  profileId: string;
  status: string;
  createdAt: string;
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

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fb-profiles');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
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
    } catch (err) {
      toast.error('Lỗi khi lưu tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tài khoản này?')) return;
    
    try {
      const res = await fetch(`/api/fb-profiles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá tài khoản');
        fetchAccounts();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
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
            onClick={fetchAccounts} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
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
                  <th className="px-6 py-4 rounded-tl-2xl">Tên Gợi Nhớ</th>
                  <th className="px-6 py-4">UID</th>
                  <th className="px-6 py-4">Profile ID (Local)</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right">Thao Tác</th>
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
                          <p className="text-zinc-500">Nhấp vào "Thêm Tài Khoản" để kết nối tài khoản Facebook.</p>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/20 transition-colors">
                              <Users className="w-4 h-4 text-sky-400" />
                            </div>
                            <span className="font-medium text-zinc-200">{acc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-zinc-400">{acc.uid || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-zinc-500">{acc.profileId}</span>
                        </td>
                        <td className="px-6 py-4">
                          {acc.status === 'ACTIVE' || acc.status === 'ALIVE' ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-400/20">
                              <ShieldCheck className="w-3.5 h-3.5" /> Đang hoạt động
                            </span>
                          ) : acc.status === 'CHECKPOINT' || acc.status === 'ERROR' ? (
                            <span className="flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-400/10 px-2.5 py-1 rounded-lg w-fit border border-rose-400/20">
                              <XCircle className="w-3.5 h-3.5" /> Lỗi / Checkpoint
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-xs bg-zinc-800 px-2.5 py-1 rounded-lg w-fit border border-zinc-700">
                              <AlertCircle className="w-3.5 h-3.5" /> {acc.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleDelete(acc.id)}
                              className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
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
              <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1877F2]" />
                  Thêm Tài Khoản Facebook
                </h3>
                <p className="text-sm text-zinc-400 mt-1">Cung cấp thông tin để kết nối tài khoản an toàn.</p>
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
    </div>
  );
}
