import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  Edit2, 
  Lock, 
  Calendar, 
  Server, 
  Copy, 
  Check, 
  RefreshCw,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface Proxy {
  id: string;
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  status: string;
  createdAt: string;
}

export default function Proxies() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [adding, setAdding] = useState(false);

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
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const res = await api.get('/proxies');
      const list = Array.isArray(res.data) ? res.data : (res.data?.proxies || []);
      setProxies(list);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách proxy');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (proxy: Proxy) => {
    setEditingProxy(proxy);
    setEditFormData({
      protocol: proxy.protocol || 'http',
      host: proxy.host || '',
      port: String(proxy.port || ''),
      username: proxy.username || '',
      password: proxy.password || '',
      status: proxy.status || 'ACTIVE'
    });
  };

  const handleUpdateProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProxy) return;
    if (!editFormData.host.trim() || !editFormData.port) {
      toast.error('Vui lòng nhập IP/Host và Port');
      return;
    }

    setUpdating(true);
    try {
      await api.patch('/proxies', {
        id: editingProxy.id,
        protocol: editFormData.protocol,
        host: editFormData.host.trim(),
        port: parseInt(editFormData.port),
        username: editFormData.username.trim() || null,
        password: editFormData.password || null,
        status: editFormData.status
      });

      toast.success('Cập nhật Proxy thành công');
      setEditingProxy(null);
      fetchProxies();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật proxy');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddProxies = async () => {
    if (!rawInput.trim()) return;
    setAdding(true);
    try {
      const lines = rawInput.split('\n').filter(l => l.trim());
      const proxiesToCreate = lines.map(line => {
        let protocol = 'http';
        let host = '';
        let port = '';
        let username = '';
        let password = '';

        if (line.includes('://')) {
          const parts = line.split('://');
          protocol = parts[0];
          const rest = parts[1];
          if (rest.includes('@')) {
            const [auth, target] = rest.split('@');
            const [u, p] = auth.split(':');
            const [h, po] = target.split(':');
            username = u;
            password = p;
            host = h;
            port = po;
          } else {
            const [h, po] = rest.split(':');
            host = h;
            port = po;
          }
        } else {
          const parts = line.split(':');
          if (parts.length >= 2) {
            host = parts[0];
            port = parts[1];
          }
          if (parts.length >= 4) {
            username = parts[2];
            password = parts[3];
          }
        }

        return { protocol, host, port, username, password };
      }).filter(p => p.host && p.port);

      if (proxiesToCreate.length === 0) {
        toast.error('Không tìm thấy proxy hợp lệ trong dữ liệu nhập');
        setAdding(false);
        return;
      }

      const res = await api.post('/proxies', proxiesToCreate);
      setRawInput('');
      setShowAddModal(false);
      toast.success(`Thêm thành công ${res.data.count || 1} proxy`);
      fetchProxies();
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi: ${e.response?.data?.error || 'Không thể thêm proxy'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá proxy này không?')) return;
    try {
      await api.delete(`/proxies?id=${id}`);
      fetchProxies();
      toast.success('Đã xoá proxy');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xoá proxy');
    }
  };

  const testProxy = async (proxy: Proxy) => {
    try {
      toast.loading('Đang kiểm tra proxy...', { id: `test-${proxy.id}` });
      const res = await api.post('/proxies/test', {
        protocol: proxy.protocol,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password
      });

      if (res.data.success) {
        toast.success(`Proxy hoạt động tốt (Ping: ${res.data.ping}ms)`, { id: `test-${proxy.id}` });
      } else {
        toast.error(`Lỗi: ${res.data.error}`, { id: `test-${proxy.id}` });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Proxy không phản hồi', { id: `test-${proxy.id}` });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatProxyString = (p: Proxy) => {
    if (p.username && p.password) {
      return `${p.protocol}://${p.username}:***@${p.host}:${p.port}`;
    }
    return `${p.protocol}://${p.host}:${p.port}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-[var(--color-primary)]" />
            Quản Lý Proxies
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý cấu hình proxy để gán cho các tài khoản Facebook và tự động hóa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProxies}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Proxy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card-apple overflow-hidden">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">Chuỗi Proxy</th>
                <th className="px-6 py-4 font-medium text-gray-500">Giao thức & IP</th>
                <th className="px-6 py-4 font-medium text-gray-500">Port</th>
                <th className="px-6 py-4 font-medium text-gray-500">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proxies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có proxy nào. Vui lòng thêm proxy để bắt đầu.
                  </td>
                </tr>
              ) : (
                proxies.map((proxy) => (
                  <tr key={proxy.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs truncate max-w-[220px]">
                      {formatProxyString(proxy)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">
                          {proxy.protocol}
                        </span>
                        <span className="font-medium text-gray-900 font-mono text-xs">{proxy.host}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{proxy.port}</td>
                    <td className="px-6 py-4">
                      {proxy.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> HOẠT ĐỘNG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3.5 h-3.5" /> {proxy.status || 'KHÔNG KHẢ DỤNG'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingProxy(proxy)}
                          className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(proxy)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa Proxy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => testProxy(proxy)}
                          className="px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg transition-colors"
                          title="Kiểm tra kết nối"
                        >
                          Kiểm tra
                        </button>
                        <button
                          onClick={() => handleDelete(proxy.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
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
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                Nhập Proxy Hàng Loạt
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-gray-500 mb-3">
                Dán danh sách proxy, mỗi proxy một dòng.<br />
                Định dạng hỗ trợ: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[var(--color-primary)] font-mono text-[12px]">host:port:user:pass</code> hoặc <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[var(--color-primary)] font-mono text-[12px]">http://user:pass@host:port</code>
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="192.168.1.1:8080:username:password&#10;192.168.1.2:8080"
                className="w-full h-48 resize-none font-mono text-[13px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-[14px] font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProxies}
                disabled={adding || !rawInput.trim()}
                className="px-4 py-2 text-white bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2"
              >
                {adding && <RefreshCw className="w-4 h-4 animate-spin" />}
                {adding ? 'Đang thêm...' : 'Thêm Proxy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingProxy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Chi Tiết Proxy</h3>
                  <p className="text-xs text-gray-500">Thông tin kết nối và xác thực mạng</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setViewingProxy(null);
                  setShowPassword(false);
                }} 
                className="text-gray-400 hover:text-gray-900 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Badges row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Giao thức</span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">
                    {viewingProxy.protocol}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Trạng thái</span>
                  {viewingProxy.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> HOẠT ĐỘNG
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5" /> {viewingProxy.status || 'LỖI'}
                    </span>
                  )}
                </div>
              </div>

              {/* Host & Port */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-gray-400" />
                    Địa chỉ IP / Host : Port
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${viewingProxy.host}:${viewingProxy.port}`)}
                    className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-semibold text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200">
                  {viewingProxy.host}:{viewingProxy.port}
                </div>
              </div>

              {/* Auth Details */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    Thông tin Xác thực (User / Pass)
                  </span>
                  {viewingProxy.password && (
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Tài khoản</span>
                    <span className="font-mono text-xs text-gray-800 font-medium">
                      {viewingProxy.username || <span className="text-gray-400 italic">Không có</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Mật khẩu</span>
                    <span className="font-mono text-xs text-gray-800 font-medium">
                      {viewingProxy.password ? (showPassword ? viewingProxy.password : '••••••••••••') : <span className="text-gray-400 italic">Không có</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date */}
              {viewingProxy.createdAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ngày khởi tạo: {new Date(viewingProxy.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => testProxy(viewingProxy)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Kiểm tra kết nối
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingProxy(null);
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-[14px] font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(viewingProxy);
                    setViewingProxy(null);
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProxy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Chỉnh Sửa Proxy</h3>
                  <p className="text-xs text-gray-500">Cập nhật thông số kết nối và trạng thái</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingProxy(null)} 
                className="text-gray-400 hover:text-gray-900 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProxy}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Giao thức</label>
                    <select
                      value={editFormData.protocol}
                      onChange={(e) => setEditFormData({ ...editFormData, protocol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    >
                      <option value="http">HTTP/HTTPS</option>
                      <option value="socks4">SOCKS4</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                      <option value="ERROR">Bị lỗi (ERROR)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">IP / Host *</label>
                    <input
                      type="text"
                      value={editFormData.host}
                      onChange={(e) => setEditFormData({ ...editFormData, host: e.target.value })}
                      placeholder="192.168.1.1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Port *</label>
                    <input
                      type="number"
                      value={editFormData.port}
                      onChange={(e) => setEditFormData({ ...editFormData, port: e.target.value })}
                      placeholder="8080"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tài khoản xác thực (Username) <span className="text-gray-400 font-normal">(Tuỳ chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    placeholder="user123"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mật khẩu xác thực (Password) <span className="text-gray-400 font-normal">(Tuỳ chọn)</span>
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Để trống nếu không đổi"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProxy(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-[14px] font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating || !editFormData.host.trim() || !editFormData.port}
                  className="px-4 py-2 text-white bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
