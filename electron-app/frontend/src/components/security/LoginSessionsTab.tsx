import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Globe
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface UserSessionItem {
  id: string;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  lastActiveAt: string;
}

interface LoginHistoryItem {
  id: string;
  actorEmail: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  timestamp: string;
}

interface TrustedIpItem {
  id: string;
  ipAddressOrCidr: string;
  label: string;
  addedBy: string;
  createdAt: string;
}

const STORAGE_KEY = 'topify_sec_sessions_cache';

export const LoginSessionsTab: React.FC = () => {
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [trustedIps, setTrustedIps] = useState<TrustedIpItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newIpInput, setNewIpInput] = useState<string>('');
  const [newIpLabel, setNewIpLabel] = useState<string>('');

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/sessions-ip');
      if (res.data) {
        setSessions(res.data.sessions || []);
        setHistory(res.data.loginHistory || []);
        setTrustedIps(res.data.trustedIps || []);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Fallback loading sessions from cache:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSessions(parsed.sessions || []);
          setHistory(parsed.loginHistory || []);
          setTrustedIps(parsed.trustedIps || []);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'revoke_session',
        sessionId,
      });
      if (res.data?.success) {
        toast.success('Đã thu hồi phiên đăng nhập thiết bị thành công');
        fetchSessionData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thu hồi phiên');
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'revoke_all_others',
      });
      if (res.data?.success) {
        toast.success(`Đã đăng xuất ${res.data.revokedCount || 0} phiên trên tất cả thiết bị khác`);
        fetchSessionData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi đăng xuất các thiết bị');
    }
  };

  const handleAddTrustedIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpInput.trim() || !newIpLabel.trim()) {
      toast.error('Vui lòng nhập địa chỉ IP/CIDR và tên nhãn');
      return;
    }

    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'add_trusted_ip',
        ipAddressOrCidr: newIpInput.trim(),
        label: newIpLabel.trim(),
      });
      if (res.data?.success) {
        toast.success('Đã thêm IP tin cậy thành công');
        setNewIpInput('');
        setNewIpLabel('');
        fetchSessionData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm IP tin cậy');
    }
  };

  const handleRemoveTrustedIp = async (trustedIpId: string) => {
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'remove_trusted_ip',
        trustedIpId,
      });
      if (res.data?.success) {
        toast.success('Đã xóa IP khỏi danh sách tin cậy');
        fetchSessionData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa IP');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                PHÂN HỆ M15 • F164
              </span>
              <span className="text-xs text-blue-200">Login History & Active Sessions</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Laptop className="w-6 h-6 text-blue-400" />
              Quản Lý Phiên Hoạt Động & Lịch Sử Đăng Nhập
            </h2>
            <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
              Kiểm tra tất cả thiết bị đang đăng nhập vào Workspace, định vị địa chỉ IP, và chủ động thu hồi quyền truy cập từ xa để ngăn chặn rủi ro rò rỉ dữ liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRevokeAllOthers}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Đăng Xuất Thiết Bị Khác
            </button>
            <button
              onClick={fetchSessionData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới phiên"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Active Sessions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" />
            Các Phiên Đang Hoạt Động ({sessions.length})
          </h3>
          <span className="text-xs text-gray-500">Tự động cập nhật mỗi khi có kết nối mới</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                sess.isCurrent
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {sess.deviceType === 'MOBILE' ? (
                      <Smartphone className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Laptop className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-bold text-xs text-gray-900">{sess.deviceName}</span>
                  </div>
                  {sess.isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Hiện Tại
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">{sess.lastActiveAt}</span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span>{sess.browser}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{sess.location} • <strong className="font-mono text-[11px]">{sess.ipAddress}</strong></span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Trạng thái: Hoạt động</span>
                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Thu hồi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Login History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Lịch Sử Đăng Nhập Gần Đây (Login History Audit)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                <th className="py-2.5 px-3">Thời Gian</th>
                <th className="py-2.5 px-3">Tài Khoản</th>
                <th className="py-2.5 px-3">Thiết Bị & Trình Duyệt</th>
                <th className="py-2.5 px-3">Địa Chỉ IP</th>
                <th className="py-2.5 px-3">Vị Trí</th>
                <th className="py-2.5 px-3">Kết Quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                    {new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                    {new Date(h.timestamp).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{h.actorEmail}</td>
                  <td className="py-2.5 px-3 text-gray-700">
                    {h.deviceName} ({h.browser})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">{h.ipAddress}</td>
                  <td className="py-2.5 px-3 text-gray-600">{h.location}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {h.status === 'SUCCESS' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Thành công
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit"
                        title={h.failureReason || 'Đăng nhập thất bại'}
                      >
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Bị chặn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Trusted IPs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Danh Sách Địa Chỉ IP Tin Cậy (Whitelist IP)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Các IP được đánh dấu tin cậy sẽ được miễn giảm kiểm tra cảnh báo vị trí bất thường khi đăng nhập.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTrustedIp} className="flex flex-wrap items-center gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <input
            type="text"
            value={newIpInput}
            onChange={(e) => setNewIpInput(e.target.value)}
            placeholder="Địa chỉ IP (VD: 14.232.208.12 hoặc dải 118.69.182.0/24)"
            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden"
          />
          <input
            type="text"
            value={newIpLabel}
            onChange={(e) => setNewIpLabel(e.target.value)}
            placeholder="Tên nhãn (VD: Trụ sở văn phòng)"
            className="w-48 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm IP
          </button>
        </form>

        <div className="space-y-2">
          {trustedIps.map((tip) => (
            <div key={tip.id} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {tip.ipAddressOrCidr}
                </span>
                <span className="font-medium text-gray-700">{tip.label}</span>
                <span className="text-[10px] text-gray-400">Thêm bởi {tip.addedBy}</span>
              </div>
              <button
                onClick={() => handleRemoveTrustedIp(tip.id)}
                className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                title="Xóa IP"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginSessionsTab;
