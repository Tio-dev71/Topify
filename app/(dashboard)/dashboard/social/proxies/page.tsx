'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    protocol: 'http',
    host: '',
    port: '',
    username: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proxies');
      if (res.ok) {
        const data = await res.json();
        setProxies(data.proxies || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách Proxy');
    } finally {
      setLoading(false);
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#5B3DF5]" />
            Quản lý Proxy
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý danh sách Proxy dùng cho tự động hoá</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Thêm Proxy
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Giao thức</th>
                <th className="px-6 py-4 font-semibold">IP:Port</th>
                <th className="px-6 py-4 font-semibold">Xác thực</th>
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
              ) : proxies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <Globe className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3" />
                    <p className="text-base font-medium">Chưa có Proxy nào</p>
                    <p className="text-sm mt-1">Hãy thêm proxy để dùng cho các tác vụ tự động</p>
                  </td>
                </tr>
              ) : (
                proxies.map(proxy => (
                  <tr key={proxy.id} className="hover:bg-[var(--color-muted)]/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold rounded">
                        {proxy.protocol.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                      {proxy.host}:{proxy.port}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                      {proxy.username ? 'Có (Username/Password)' : 'Không (IP Auth)'}
                    </td>
                    <td className="px-6 py-4">
                      {proxy.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(proxy.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xoá proxy"
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
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold">Thêm Proxy mới</h3>
            </div>
            
            <form onSubmit={handleAddProxy} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Giao thức</label>
                <select 
                  value={formData.protocol}
                  onChange={e => setFormData({...formData, protocol: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                >
                  <option value="http">HTTP/HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">IP / Host</label>
                  <input 
                    type="text" 
                    value={formData.host}
                    onChange={e => setFormData({...formData, host: e.target.value})}
                    placeholder="192.168.1.1"
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Port</label>
                  <input 
                    type="number" 
                    value={formData.port}
                    onChange={e => setFormData({...formData, port: e.target.value})}
                    placeholder="8080"
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Username (Không bắt buộc)</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password (Không bắt buộc)</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Proxy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
