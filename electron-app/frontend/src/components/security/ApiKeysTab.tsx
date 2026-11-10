import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Edit2,
  Shield,
  Clock,
  AlertTriangle,
  Lock,
  Globe,
  Sliders,
  X,
  Zap,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  roleScope: 'READ_ONLY' | 'READ_WRITE' | 'FULL_ADMIN';
  ipWhitelist: string;
  status: 'ACTIVE' | 'REVOKED';
  rateLimitPerMin: number;
  lastUsedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export default function ApiKeysTab() {
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'Production Ecommerce Sync Key',
      keyPrefix: 'topify_sec_live_9a8f...',
      roleScope: 'READ_WRITE',
      ipWhitelist: '14.232.208.12, 118.69.182.0/24',
      status: 'ACTIVE',
      rateLimitPerMin: 120,
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'key-2',
      name: 'Zapier Webhook Relay Key',
      keyPrefix: 'topify_sec_live_3c2e...',
      roleScope: 'FULL_ADMIN',
      ipWhitelist: '*',
      status: 'ACTIVE',
      rateLimitPerMin: 300,
      lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Key Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [roleScope, setRoleScope] = useState<'READ_ONLY' | 'READ_WRITE' | 'FULL_ADMIN'>('READ_WRITE');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [daysValid, setDaysValid] = useState(90);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Edit Key Modal
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editScope, setEditScope] = useState<'READ_ONLY' | 'READ_WRITE' | 'FULL_ADMIN'>('READ_WRITE');
  const [editIp, setEditIp] = useState('');
  const [editRateLimit, setEditRateLimit] = useState(120);

  // Rotate Key Modal
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('topify_sec_api_keys');
    if (cached) {
      try {
        setApiKeys(JSON.parse(cached));
      } catch {}
    }
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/api-keys');
      if (res.data?.apiKeys) {
        setApiKeys(res.data.apiKeys);
        localStorage.setItem('topify_sec_api_keys', JSON.stringify(res.data.apiKeys));
      }
    } catch (e) {
      console.warn('Using cached api keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error('Vui lòng nhập tên nhận diện cho API Key');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/api-keys', {
        action: 'create',
        name: keyName.trim(),
        roleScope,
        ipWhitelist: ipWhitelist.trim() || '*',
        daysValid,
        rateLimitPerMin: roleScope === 'FULL_ADMIN' ? 300 : 120,
      });

      if (res.data?.success) {
        setCreatedSecret(res.data.fullSecret);
        fetchApiKeys();
        toast.success('Đã tạo API Key mới thành công!');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi API Key này? Tất cả tích hợp đang dùng sẽ bị ngắt kết nối ngay lập tức!')) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/api-keys', {
        action: 'revoke',
        keyId,
      });
      if (res.data?.success) {
        toast.success('Đã thu hồi API Key thành công!');
        fetchApiKeys();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi thu hồi API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (!window.confirm('Hành động này sẽ sinh ra khóa bí mật mới và kích hoạt thời gian ân hạn 24 giờ cho khóa cũ. Bạn có muốn tiếp tục?')) {
      return;
    }
    try {
      setRotatingKeyId(keyId);
      const res = await api.post('/security/api-keys', {
        action: 'rotate',
        keyId,
      });
      if (res.data?.success) {
        setRotatedSecret(res.data.newSecret);
        toast.success('Đã xoay vòng (rotate) API Key thành công!');
        fetchApiKeys();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi xoay vòng API Key');
    } finally {
      setRotatingKeyId(null);
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    try {
      setLoading(true);
      const res = await api.post('/security/api-keys', {
        action: 'update',
        keyId: editingKey.id,
        name: editName.trim(),
        roleScope: editScope,
        ipWhitelist: editIp.trim() || '*',
        rateLimitPerMin: editRateLimit,
      });
      if (res.data?.success) {
        toast.success('Đã cập nhật thông tin API Key!');
        setEditingKey(null);
        fetchApiKeys();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi cập nhật API Key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Quản Lý Khóa Tích Hợp API (API Key Management)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cấp phép và kiểm soát quyền truy cập API cho hệ thống CRM, POS, ERP và webhook bên thứ ba.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApiKeys}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setKeyName('');
              setRoleScope('READ_WRITE');
              setIpWhitelist('');
              setCreatedSecret(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm hover:shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Tạo API Key Mới
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tên & Tiền tố Key</th>
                <th className="py-3 px-4">Quyền Hạn (Scope)</th>
                <th className="py-3 px-4">IP Whitelist</th>
                <th className="py-3 px-4">Giới Hạn Tốc Độ</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Hạn Sử Dụng</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{k.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <code className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
                        {k.keyPrefix}
                      </code>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.roleScope === 'FULL_ADMIN'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200'
                          : k.roleScope === 'READ_WRITE'
                          ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
                      }`}
                    >
                      {k.roleScope}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {k.ipWhitelist === '*' ? 'Tất cả IP (*)' : k.ipWhitelist}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-xs">{k.rateLimitPerMin} req/phút</span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {k.status === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ THU HỒI'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    <div>{new Date(k.expiresAt).toLocaleDateString('vi-VN')}</div>
                    <div className="text-[10px]">
                      {k.lastUsedAt ? `Dùng: ${new Date(k.lastUsedAt).toLocaleTimeString('vi-VN')}` : 'Chưa sử dụng'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {k.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleRotateKey(k.id)}
                            disabled={rotatingKeyId === k.id}
                            className="p-1.5 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Xoay vòng khóa (Rotate Key - 24h grace)"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${rotatingKeyId === k.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingKey(k);
                              setEditName(k.name);
                              setEditScope(k.roleScope);
                              setEditIp(k.ipWhitelist);
                              setEditRateLimit(k.rateLimitPerMin);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Sửa cấu hình"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Thu hồi khóa (Revoke)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Khởi Tạo API Key Mới</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSecret ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Chú ý quan trọng:</strong> Đây là lần duy nhất khóa bí mật đầy đủ được hiển thị. Vui lòng sao chép và lưu trữ an toàn ngay bây giờ!
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Khóa Bí Mật Hoàn Chỉnh (Full Secret Key):
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex-1 break-all">
                      {createdSecret}
                    </code>
                    <button
                      onClick={() => handleCopy(createdSecret, 'secret_created')}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition"
                      title="Sao chép"
                    >
                      {copiedId === 'secret_created' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setCreatedSecret(null);
                      setShowCreateModal(false);
                    }}
                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 font-semibold text-xs rounded-xl"
                  >
                    Tôi đã lưu khóa an toàn
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên Nhận Diện Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="VD: Mobile App Backend Sync"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Quyền Hạn (Role Scope)
                    </label>
                    <select
                      value={roleScope}
                      onChange={(e) => setRoleScope(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="READ_ONLY">READ_ONLY (Chỉ đọc dữ liệu)</option>
                      <option value="READ_WRITE">READ_WRITE (Đọc và ghi bài/lead)</option>
                      <option value="FULL_ADMIN">FULL_ADMIN (Toàn quyền quản trị)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Thời Hạn Hiệu Lực
                    </label>
                    <select
                      value={daysValid}
                      onChange={(e) => setDaysValid(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value={30}>30 ngày</option>
                      <option value={90}>90 ngày (Khuyên dùng)</option>
                      <option value={180}>180 ngày</option>
                      <option value={365}>365 ngày (1 năm)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Danh Sách Trắng IP (IP Whitelist)
                  </label>
                  <input
                    type="text"
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    placeholder="VD: 14.232.208.12, 118.69.182.0/24 (để trống hoặc * nếu chấp nhận mọi IP)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">
                    Phân tách nhiều địa chỉ IP hoặc dải CIDR bằng dấu phẩy.
                  </span>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {loading ? 'Đang tạo...' : 'Tạo Khóa Bí Mật'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ROTATE SECRET DISPLAY MODAL */}
      {rotatedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Zap className="w-5 h-5" />
              <span>Khóa API Đã Được Xoay Vòng (Rotated)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Khóa cũ vẫn tiếp tục hoạt động trong vòng <strong>24 giờ</strong> để bạn cập nhật cấu hình ở máy chủ ứng dụng mà không gây gián đoạn dịch vụ (Zero downtime).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Khóa Bí Mật Mới:
              </label>
              <div className="flex items-center gap-2">
                <code className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-1 break-all">
                  {rotatedSecret}
                </code>
                <button
                  onClick={() => handleCopy(rotatedSecret, 'rotated_key')}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                >
                  {copiedId === 'rotated_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRotatedSecret(null)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-xl"
              >
                Đã sao chép khóa mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT KEY MODAL */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Cập Nhật Cấu Hình API Key</h3>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKey} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tên Nhận Diện</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quyền Hạn</label>
                  <select
                    value={editScope}
                    onChange={(e) => setEditScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="READ_ONLY">READ_ONLY</option>
                    <option value="READ_WRITE">READ_WRITE</option>
                    <option value="FULL_ADMIN">FULL_ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Giới hạn (Req/phút)
                  </label>
                  <input
                    type="number"
                    value={editRateLimit}
                    onChange={(e) => setEditRateLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">IP Whitelist</label>
                <input
                  type="text"
                  value={editIp}
                  onChange={(e) => setEditIp(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

