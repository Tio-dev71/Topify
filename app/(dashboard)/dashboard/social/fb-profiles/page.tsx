'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, XCircle, Globe } from 'lucide-react';
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#1877F2]" />
            Facebook Profiles
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý các tài khoản Facebook dùng để chạy tự động hoá</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Tài Khoản
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên gợi nhớ</th>
                <th className="px-6 py-4 font-semibold">UID</th>
                <th className="px-6 py-4 font-semibold">Profile ID (Local)</th>
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
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <Globe className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3" />
                    <p className="text-base font-medium">Chưa có tài khoản nào</p>
                    <p className="text-sm mt-1">Hãy thêm tài khoản Facebook để bắt đầu tự động hoá</p>
                  </td>
                </tr>
              ) : (
                accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-[var(--color-muted)]/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                      {acc.name}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                      {acc.uid || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)] font-mono text-xs">
                      {acc.profileId}
                    </td>
                    <td className="px-6 py-4">
                      {acc.status === 'LIVE' ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LIVE
                        </span>
                      ) : acc.status === 'CHECKPOINT' ? (
                        <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> CHECKPOINT
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                          <XCircle className="w-3.5 h-3.5" /> DEAD
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(acc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xoá tài khoản"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-lg border border-[var(--color-border)] flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-border)] shrink-0">
              <h3 className="text-lg font-bold">Thêm tài khoản Facebook</h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-fb-form" onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tên gợi nhớ *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Nick Clone 01"
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">UID</label>
                    <input 
                      type="text" 
                      value={formData.uid}
                      onChange={e => setFormData({...formData, uid: e.target.value})}
                      placeholder="1000..."
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Mã 2FA (Secret Key)</label>
                  <input 
                    type="text" 
                    value={formData.twoFactorCode}
                    onChange={e => setFormData({...formData, twoFactorCode: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Cookie</label>
                  <textarea 
                    value={formData.cookie}
                    onChange={e => setFormData({...formData, cookie: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow h-24 resize-none"
                    placeholder="c_user=...; xs=...;"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Proxy (Tuỳ chọn)</label>
                  <input 
                    type="text" 
                    value={formData.proxy}
                    onChange={e => setFormData({...formData, proxy: e.target.value})}
                    placeholder="http://user:pass@ip:port"
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/50 transition-shadow"
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Định dạng: protocol://user:pass@ip:port hoặc protocol://ip:port</p>
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
                form="add-fb-form"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu Tài Khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
