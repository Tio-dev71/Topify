import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  MapPin,
  RefreshCw,
  Sliders,
  Mail,
  ShieldCheck,
  Smartphone,
  EyeOff
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface SuspiciousLoginAlert {
  id: string;
  actorEmail: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  alertType: 'NEW_DEVICE' | 'GEO_VELOCITY' | 'BRUTE_FORCE_OTP' | 'TOR_VPN_PROXY';
  description: string;
  deviceInfo: string;
  ipAddress: string;
  location: string;
  status: 'ACTIVE' | 'RESOLVED' | 'BLOCKED';
  timestamp: string;
}

interface SuspiciousAlertConfig {
  notifyNewDevice: boolean;
  notifyUnusualLocation: boolean;
  notifyBruteForce: boolean;
  autoBlockCriticalRisk: boolean;
  alertEmailRecipient: string;
}

const STORAGE_KEY = 'topify_sec_alerts_cache';

export const SuspiciousAlertsTab: React.FC = () => {
  const [alerts, setAlerts] = useState<SuspiciousLoginAlert[]>([]);
  const [config, setConfig] = useState<SuspiciousAlertConfig>({
    notifyNewDevice: true,
    notifyUnusualLocation: true,
    notifyBruteForce: true,
    autoBlockCriticalRisk: true,
    alertEmailRecipient: 'admin@topify.app',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/suspicious-alerts');
      if (res.data?.success && res.data.data) {
        setAlerts(res.data.data.alerts || []);
        if (res.data.data.config) {
          setConfig(res.data.data.config);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.warn('Fallback loading alerts from cache:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setAlerts(parsed.alerts || []);
          if (parsed.config) setConfig(parsed.config);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolveAlert = async (alertId: string, resolution: 'block' | 'dismiss') => {
    try {
      const res = await api.post('/security/suspicious-alerts', {
        action: 'resolve',
        alertId,
        resolution,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã xử lý cảnh báo bảo mật');
        fetchAlerts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi xử lý cảnh báo');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await api.post('/security/suspicious-alerts', {
        action: 'update_config',
        config,
      });
      if (res.data?.success) {
        toast.success('Đã lưu cấu hình cảnh báo đăng nhập bất thường thành công');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-300 border border-rose-400/30">
                PHÂN HỆ M15 • F165
              </span>
              <span className="text-xs text-rose-200">Suspicious Login Alert</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              Cảnh Báo Đăng Nhập Bất Thường (Geo-Velocity & Device Risk)
            </h2>
            <p className="text-sm text-rose-100/90 mt-1 max-w-2xl">
              Tự động phát hiện các hành vi đăng nhập khả nghi: thiết bị lạ, đột biến vị trí địa lý bất thường (Geo-velocity), dải IP Tor/Proxy và nhiều lần nhập sai mật khẩu để bảo vệ an toàn tài khoản.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới cảnh báo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Alerts List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cảnh Báo Đang Hoạt Động ({activeAlerts.length})
              </h3>
              <span className="text-xs text-gray-500">Giám sát 24/7 theo thời gian thực</span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Không có cảnh báo đăng nhập bất thường nào</p>
                <p className="text-[11px] text-gray-400 mt-1">Tất cả phiên đăng nhập đều được xác minh danh tính an toàn.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                      alert.status === 'BLOCKED'
                        ? 'bg-gray-100/70 border-gray-300 opacity-60'
                        : alert.status === 'RESOLVED'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : alert.riskLevel === 'CRITICAL'
                        ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                        : 'bg-amber-50/80 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            alert.riskLevel === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900'
                              : alert.riskLevel === 'HIGH'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          Mức Nguy Hiểm: {alert.riskLevel}
                        </span>
                        <span className="font-semibold text-gray-900">{alert.actorEmail}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString('vi-VN')} {new Date(alert.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-800 font-medium leading-relaxed">{alert.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-white/70 p-2.5 rounded-lg border border-gray-200/50">
                      <div>
                        <span className="text-gray-400 block">Thiết bị:</span>
                        <span className="font-medium text-gray-800">{alert.deviceInfo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Vị trí & IP:</span>
                        <span className="font-medium text-gray-800">
                          {alert.location} ({alert.ipAddress})
                        </span>
                      </div>
                    </div>

                    {alert.status === 'ACTIVE' ? (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/50">
                        <button
                          onClick={() => handleResolveAlert(alert.id, 'dismiss')}
                          className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 cursor-pointer"
                        >
                          Tôi Đã Đăng Nhập (Bỏ Qua)
                        </button>
                        <button
                          onClick={() => handleResolveAlert(alert.id, 'block')}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Khóa Phiên Ngay
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] font-semibold text-gray-500 pt-1">
                        Trạng thái: {alert.status === 'BLOCKED' ? 'Đã bị khóa phiên bảo vệ' : 'Đã xác nhận an toàn'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Security Thresholds & Config (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Cấu Hình Quy Tắc Phát Hiện Bất Thường
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Tùy chỉnh điều kiện kích hoạt cảnh báo đăng nhập và phương thức phản ứng tức thì.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyNewDevice}
                  onChange={(e) => setConfig({ ...config, notifyNewDevice: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Cảnh báo thiết bị mới chưa nhận diện</span>
                  <span className="text-[11px] text-gray-500">Gửi cảnh báo khi tài khoản đăng nhập từ trình duyệt hoặc thiết bị lạ.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyUnusualLocation}
                  onChange={(e) => setConfig({ ...config, notifyUnusualLocation: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Cảnh báo đột biến địa lý (Geo-Velocity)</span>
                  <span className="text-[11px] text-gray-500">Phát hiện đăng nhập cách xa bất thường trong khoảng thời gian ngắn hoặc dải IP Tor/VPN.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyBruteForce}
                  onChange={(e) => setConfig({ ...config, notifyBruteForce: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Cảnh báo dò mã OTP / Brute Force</span>
                  <span className="text-[11px] text-gray-500">Cảnh báo khi có hơn 3 lần nhập sai mật khẩu hoặc OTP 2FA liên tiếp.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoBlockCriticalRisk}
                  onChange={(e) => setConfig({ ...config, autoBlockCriticalRisk: e.target.checked })}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Tự động khóa phiên khi rủi ro CRITICAL</span>
                  <span className="text-[11px] text-gray-500">Ngắt kết nối tức thì và yêu cầu đổi mật khẩu đối với đăng nhập khả nghi nguy hiểm.</span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email nhận cảnh báo bảo mật khẩn cấp</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={config.alertEmailRecipient}
                    onChange={(e) => setConfig({ ...config, alertEmailRecipient: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {savingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình Cảnh Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspiciousAlertsTab;
