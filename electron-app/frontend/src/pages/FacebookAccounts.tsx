import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, AlertCircle, CheckCircle2, Play, Users, Key, X, Globe } from 'lucide-react';
import { toast } from 'sonner';
import * as OTPAuth from 'otpauth';
import api from '../lib/axios';

interface FbAccount {
  id: string;
  name: string;
  uid: string | null;
  status: 'LIVE' | 'CHECKPOINT' | 'DEAD';
  profileId: string;
  proxy?: string | null;
  twoFactorCode?: string | null;
  createdAt: string;
}

interface ProxyItem {
  id: string;
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  status: string;
}

export default function FacebookAccounts() {
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRunningMultiple, setIsRunningMultiple] = useState(false);

  // Proxy assignment state
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [proxyPool, setProxyPool] = useState<ProxyItem[]>([]);
  const [assigningProxy, setAssigningProxy] = useState(false);
  
  // Active browsers state
  const [activeBrowserIds, setActiveBrowserIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
    
    // Poll for active browsers
    const interval = setInterval(async () => {
      if (typeof window !== 'undefined' && window.electron && window.electron.getActiveBrowsers) {
        const activeData = await window.electron.getActiveBrowsers();
        if (Array.isArray(activeData)) {
          const ids = activeData.map((b: any) => (typeof b === 'string' ? b : b.profileId)).filter(Boolean);
          setActiveBrowserIds(ids);
        }
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/facebook-accounts');
      if (Array.isArray(res.data)) setAccounts(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccounts = async () => {
    if (!rawInput.trim()) return;
    setAdding(true);
    try {
      await api.post('/facebook-accounts', { rawAccounts: rawInput });
      setRawInput('');
      setShowAddModal(false);
      toast.success('Thêm tài khoản thành công');
      fetchAccounts();
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi: ${e.response?.data?.error || 'Không thể thêm tài khoản'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá tài khoản này không?')) return;
    try {
      await api.delete(`/facebook-accounts?id=${id}`);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      fetchAccounts();
      toast.success('Đã xoá tài khoản');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xoá tài khoản');
    }
  };

  const handleCheckLive = async (id: string) => {
    setProcessingId(id);
    try {
      await api.post('/facebook-accounts/check-live', { id });
      fetchAccounts();
      toast.success('Đã kiểm tra trạng thái');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi kiểm tra trạng thái');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTestLogin = async (id: string) => {
    setProcessingId(id);
    try {
      const accountData = accounts.find((a) => a.id === id);
      if (!accountData) throw new Error('Không tìm thấy dữ liệu tài khoản');

      // @ts-ignore
      if (typeof window !== 'undefined' && window.electron && window.electron.isDesktopApp) {
        // @ts-ignore
        const result = await window.electron.runFacebookLogin(accountData);
        if (result.success) {
          await api.patch('/facebook-accounts/login', {
            id,
            status: 'LIVE',
            ...(result.cookie ? { cookie: result.cookie } : {})
          });
          fetchAccounts();
          toast.success('Đăng nhập qua Desktop App thành công!');
        } else {
          toast.error(`Lỗi: ${result.error || 'Không thể đăng nhập'}`);
        }
      } else {
        toast.error('Tính năng tự động hoá chỉ hỗ trợ trên Desktop App.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi kết nối: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsRunningMultiple(true);

    for (const id of selectedIds) {
      await handleTestLogin(id);
      await new Promise(r => setTimeout(r, 2000)); 
    }

    setIsRunningMultiple(false);
    toast.success('Đã chạy xong danh sách tài khoản được chọn!');
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} tài khoản đã chọn?`)) return;
    
    setIsRunningMultiple(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/facebook-accounts?id=${id}`);
      }
      setSelectedIds([]);
      fetchAccounts();
      toast.success(`Đã xoá ${selectedIds.length} tài khoản`);
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi xoá một số tài khoản');
    } finally {
      setIsRunningMultiple(false);
    }
  };

  const handleCheckLiveSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsRunningMultiple(true);

    for (const id of selectedIds) {
      try {
        await api.post('/facebook-accounts/check-live', { id });
      } catch (e) {
        console.error(e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsRunningMultiple(false);
    fetchAccounts();
    toast.success(`Đã kiểm tra live xong ${selectedIds.length} tài khoản!`);
  };

  const openProxyModal = async () => {
    if (selectedIds.length === 0) return;
    // Fetch proxy pool
    try {
      const res = await api.get('/proxies');
      if (Array.isArray(res.data)) setProxyPool(res.data.filter((p: ProxyItem) => p.status === 'ACTIVE'));
    } catch (e) {
      console.error(e);
    }
    setShowProxyModal(true);
  };

  const handleAssignProxy = async (proxyStr: string) => {
    if (selectedIds.length === 0) return;
    setAssigningProxy(true);
    try {
      await api.patch('/facebook-accounts', {
        ids: selectedIds,
        proxy: proxyStr
      });
      fetchAccounts();
      setShowProxyModal(false);
      setProxyInput('');
      toast.success(`Đã gán proxy cho ${selectedIds.length} tài khoản`);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi gán proxy');
    } finally {
      setAssigningProxy(false);
    }
  };

  const handleRemoveProxy = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Gỡ proxy khỏi các tài khoản đã chọn?')) return;
    setAssigningProxy(true);
    try {
      await api.patch('/facebook-accounts', {
        ids: selectedIds,
        proxy: ''
      });
      fetchAccounts();
      toast.success(`Đã gỡ proxy khỏi ${selectedIds.length} tài khoản`);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi gỡ proxy');
    } finally {
      setAssigningProxy(false);
    }
  };

  const handleRemoveSingleProxy = async (id: string) => {
    try {
      await api.patch('/facebook-accounts', {
        ids: [id],
        proxy: ''
      });
      fetchAccounts();
      toast.success('Đã gỡ proxy khỏi tài khoản');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi gỡ proxy');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length && accounts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

  const toggleSelectAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleGet2FA = async (account: FbAccount) => {
    if (!account.twoFactorCode) {
      toast.error('Không tìm thấy mã 2FA secret cho tài khoản này.');
      return;
    }
    
    try {
      const cleanSecret = account.twoFactorCode
        .toUpperCase()
        .replace(/[^A-Z2-7]/g, (char) => {
          if (char === '0') return 'O';
          if (char === '1') return 'I';
          if (char === '8') return 'B';
          if (char === '9') return 'Q';
          return '';
        });

      const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(cleanSecret)
      });
      const otp = totp.generate();
      navigator.clipboard.writeText(otp);
      toast.success(`Đã copy mã 2FA: ${otp}`);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tạo mã 2FA, kiểm tra lại secret key.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-primary)]" />
            Tài khoản Facebook
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý các profile Facebook dùng để tự động hoá
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || isRunningMultiple}
            className="bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Xóa đã chọn</span>
          </button>

          <button
            onClick={handleCheckLiveSelected}
            disabled={selectedIds.length === 0 || isRunningMultiple}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors"
          >
            {isRunningMultiple ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <Shield className="w-4 h-4 shrink-0" />
            )}
            <span>Check live đã chọn</span>
          </button>

          <button
            onClick={handleRunSelected}
            disabled={selectedIds.length === 0 || isRunningMultiple}
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors"
          >
            {isRunningMultiple ? (
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <Play className="w-4 h-4 fill-current shrink-0" />
            )}
            <span>Chạy đã chọn</span>
          </button>

          <button
            onClick={openProxyModal}
            disabled={selectedIds.length === 0 || isRunningMultiple}
            className="bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Gán Proxy</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-primary)] hover:opacity-90 text-white whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                    checked={selectedIds.length === accounts.length && accounts.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-medium text-gray-500">Tên</th>
                <th className="px-6 py-4 font-medium text-gray-500">UID</th>
                <th className="px-6 py-4 font-medium text-gray-500">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-gray-500">Proxy</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Chưa có tài khoản nào. Vui lòng thêm tài khoản để bắt đầu.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(acc.id)}
                        onChange={() => toggleSelectAccount(acc.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{acc.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{acc.uid || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {acc.status === 'LIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LIVE
                        </span>
                      )}
                      {acc.status === 'CHECKPOINT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" /> CHECKPOINT
                        </span>
                      )}
                      {acc.status === 'DEAD' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <Shield className="w-3.5 h-3.5" /> DEAD
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {acc.proxy ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 max-w-[170px] truncate" title={acc.proxy}>
                            <Globe className="w-3 h-3 flex-shrink-0" />
                            {acc.proxy.replace(/^https?:\/\//, '').replace(/:.+@/, ':***@')}
                          </span>
                          <button
                            onClick={() => handleRemoveSingleProxy(acc.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Gỡ proxy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Trực tiếp</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {processingId === acc.id ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCheckLive(acc.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Check Live"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            {acc.twoFactorCode && (
                              <button
                                onClick={() => handleGet2FA(acc)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Lấy mã 2FA"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}
                            {activeBrowserIds.includes(acc.profileId) ? (
                              <button
                                disabled
                                className="p-2 text-amber-500 rounded-lg transition-colors opacity-70 cursor-not-allowed"
                                title="Đang chạy"
                              >
                                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTestLogin(acc.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mở trình duyệt"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(acc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
              <h3 className="text-[16px] font-semibold">Nhập tài khoản</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-gray-500 mb-3">
                Dán danh sách tài khoản, mỗi tài khoản một dòng.<br />
                Định dạng: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[var(--color-primary)] font-mono text-[12px]">UID|Pass|2FA|Email</code>
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="100012345678|Password123|JBSWY3DPEHPK3PXP"
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
                onClick={handleAddAccounts}
                disabled={adding || !rawInput.trim()}
                className="px-4 py-2 text-white bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 rounded-xl text-[14px] font-medium transition-colors"
              >
                {adding ? 'Đang nhập...' : 'Nhập'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proxy Assignment Modal */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[16px] font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Gán Proxy cho {selectedIds.length} tài khoản
              </h3>
              <button onClick={() => setShowProxyModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Manual input */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nhập proxy thủ công</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proxyInput}
                    onChange={(e) => setProxyInput(e.target.value)}
                    placeholder="http://127.0.0.1:56789"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleAssignProxy(proxyInput)}
                    disabled={!proxyInput.trim() || assigningProxy}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[13px] font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {assigningProxy ? 'Đang gán...' : 'Gán'}
                  </button>
                </div>
              </div>

              {/* Proxy pool */}
              {proxyPool.length > 0 && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Hoặc chọn từ Proxy Pool</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {proxyPool.map((p) => {
                      const proxyStr = p.username && p.password
                        ? `${p.protocol}://${p.username}:${p.password}@${p.host}:${p.port}`
                        : `${p.protocol}://${p.host}:${p.port}`;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleAssignProxy(proxyStr)}
                          disabled={assigningProxy}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-colors text-left disabled:opacity-50"
                        >
                          <span className="font-mono text-[12px] text-gray-700 truncate">{proxyStr}</span>
                          <span className="text-[11px] text-purple-600 font-medium ml-2 whitespace-nowrap">Chọn</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Remove proxy */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleRemoveProxy}
                  disabled={assigningProxy}
                  className="w-full px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                  Gỡ proxy khỏi tài khoản đã chọn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
