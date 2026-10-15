import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Webhook,
  HardDrive,
  Users,
  FileText,
  Smartphone,
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Laptop,
  LogOut,
  Send,
  Zap,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'sonner';

export default function SecurityIntegrations() {
  const [activeTab, setActiveTab] = useState<'2fa_rbac' | 'api_keys' | 'webhooks' | 'storage' | 'crm' | 'audit_sessions'>('2fa_rbac');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ==========================================
  // TAB 1: 2FA & RBAC (F163, F164)
  // ==========================================
  const [twoFactor, setTwoFactor] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [rbacMatrix, setRbacMatrix] = useState<any[]>([]);

  // ==========================================
  // TAB 2: API KEYS (F165)
  // ==========================================
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'READ_ONLY' | 'READ_WRITE' | 'FULL_ADMIN'>('READ_WRITE');
  const [newKeyIp, setNewKeyIp] = useState('');
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);

  // ==========================================
  // TAB 3: WEBHOOKS (F166)
  // ==========================================
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['post.published']);

  // ==========================================
  // TAB 4: CLOUD STORAGE (F167)
  // ==========================================
  const [storageConfigs, setStorageConfigs] = useState<any[]>([]);

  // ==========================================
  // TAB 5: CRM INTEGRATIONS (F168)
  // ==========================================
  const [crmIntegrations, setCrmIntegrations] = useState<any[]>([]);

  // ==========================================
  // TAB 6: AUDIT LOGS & SESSIONS (F169, F170)
  // ==========================================
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [trustedIps, setTrustedIps] = useState<any[]>([]);
  const [newIpInput, setNewIpInput] = useState('');
  const [newIpLabel, setNewIpLabel] = useState('');

  // ==========================================
  // INITIAL FETCH
  // ==========================================
  useEffect(() => {
    fetch2FA();
    fetchRbac();
    fetchApiKeys();
    fetchWebhooks();
    fetchStorage();
    fetchCrm();
    fetchAuditLogs();
    fetchSessionsAndIps();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 2FA Fetch & Action
  const fetch2FA = async () => {
    try {
      const res = await api.get('/security/2fa');
      if (res.data?.twoFactor) setTwoFactor(res.data.twoFactor);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle2FA = async (enable: boolean) => {
    if (enable && !verificationCode.trim()) {
      toast.error('Vui lòng nhập mã xác thực 6 chữ số từ ứng dụng Authenticator');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/2fa', {
        code: verificationCode || '123456',
        enable,
      });
      if (res.data?.success) {
        setTwoFactor(res.data.twoFactor);
        setShowQrModal(false);
        setVerificationCode('');
        toast.success(res.data.message);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi xử lý xác thực 2FA');
    } finally {
      setLoading(false);
    }
  };

  // RBAC Fetch & Action
  const fetchRbac = async () => {
    try {
      const res = await api.get('/security/rbac');
      if (res.data?.permissions) setRbacMatrix(res.data.permissions);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePermission = async (permissionKey: string, role: string, value: boolean) => {
    try {
      const res = await api.post('/security/rbac', {
        permissionKey,
        role,
        value,
      });
      if (res.data?.success) {
        setRbacMatrix(res.data.permissions);
        toast.success(`Đã cập nhật quyền hạn cho vai trò ${role.toUpperCase()}`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Không thể sửa quyền');
    }
  };

  // API Keys Fetch & Action
  const fetchApiKeys = async () => {
    try {
      const res = await api.get('/security/api-keys');
      if (res.data?.apiKeys) setApiKeys(res.data.apiKeys);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Vui lòng nhập tên nhận diện cho API Key');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/api-keys', {
        action: 'create',
        name: newKeyName,
        roleScope: newKeyScope,
        ipWhitelist: newKeyIp,
      });
      if (res.data?.success) {
        setApiKeys([res.data.key, ...apiKeys]);
        setCreatedSecretKey(res.data.fullSecret);
        setNewKeyName('');
        setNewKeyIp('');
        toast.success('Đã tạo API Key thành công!');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi tạo API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi API Key này? Các ứng dụng tích hợp sẽ lập tức mất quyền truy cập.')) return;
    try {
      const res = await api.post('/security/api-keys', {
        action: 'revoke',
        keyId,
      });
      if (res.data?.success) {
        setApiKeys(res.data.apiKeys);
        toast.success('Đã thu hồi API Key thành công');
      }
    } catch (e) {
      toast.error('Lỗi khi thu hồi API Key');
    }
  };

  // Webhooks Fetch & Action
  const fetchWebhooks = async () => {
    try {
      const res = await api.get('/security/webhooks');
      if (res.data?.webhooks) setWebhooks(res.data.webhooks);
      if (res.data?.logs) setWebhookLogs(res.data.logs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error('Vui lòng nhập tên và Endpoint URL');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/webhooks', {
        action: 'create',
        name: newWebhookName,
        endpointUrl: newWebhookUrl,
        subscribedEvents: selectedEvents,
      });
      if (res.data?.success) {
        setWebhooks([res.data.webhook, ...webhooks]);
        setShowNewWebhookModal(false);
        setNewWebhookName('');
        setNewWebhookUrl('');
        toast.success('Đăng ký Webhook thành công!');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi tạo Webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhookPing = async (webhookId: string) => {
    try {
      const res = await api.post('/security/webhooks', {
        action: 'test_ping',
        webhookId,
      });
      if (res.data?.success) {
        setWebhooks(res.data.webhooks);
        setWebhookLogs(res.data.logs);
        toast.success(`Đã gửi gói tin thử nghiệm: Nhận phản hồi HTTP ${res.data.pingResult.statusCode} (${res.data.pingResult.durationMs}ms)!`);
      }
    } catch (e) {
      toast.error('Lỗi khi gửi test ping');
    }
  };

  // Storage Fetch & Action
  const fetchStorage = async () => {
    try {
      const res = await api.get('/security/integrations/storage');
      if (res.data?.storageConfigs) setStorageConfigs(res.data.storageConfigs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestStorageConnection = async (provider: string) => {
    try {
      const res = await api.post('/security/integrations/storage', {
        action: 'test_connection',
        provider,
      });
      if (res.data?.success) {
        setStorageConfigs(res.data.storageConfigs);
        toast.success(`Kiểm tra kết nối thành công: Dịch vụ lưu trữ ${provider} hoạt động bình thường!`);
      }
    } catch (e) {
      toast.error('Kiểm tra kết nối thất bại');
    }
  };

  const handleSetDefaultStorage = async (provider: string) => {
    try {
      const res = await api.post('/security/integrations/storage', {
        action: 'set_default',
        provider,
      });
      if (res.data?.success) {
        setStorageConfigs(res.data.storageConfigs);
        toast.success(`Đã đặt ${provider} làm bộ lưu trữ đám mây mặc định`);
      }
    } catch (e) {
      toast.error('Lỗi đổi bộ lưu trữ mặc định');
    }
  };

  // CRM Fetch & Action
  const fetchCrm = async () => {
    try {
      const res = await api.get('/security/integrations/crm');
      if (res.data?.crmIntegrations) setCrmIntegrations(res.data.crmIntegrations);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCrmSync = async (serviceId: string, syncType: 'leads' | 'orders', value: boolean) => {
    try {
      const res = await api.post('/security/integrations/crm', {
        action: 'toggle_sync',
        serviceId,
        syncType,
        value,
      });
      if (res.data?.success) {
        setCrmIntegrations(res.data.crmIntegrations);
        toast.success(`Đã ${value ? 'bật' : 'tắt'} tự động đồng bộ ${syncType}`);
      }
    } catch (e) {
      toast.error('Lỗi cập nhật cấu hình CRM');
    }
  };

  // Audit Log & Sessions Fetch & Action
  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/security/audit-log');
      if (res.data?.logs) setAuditLogs(res.data.logs);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSessionsAndIps = async () => {
    try {
      const res = await api.get('/security/sessions-ip');
      if (res.data?.sessions) setActiveSessions(res.data.sessions);
      if (res.data?.trustedIps) setTrustedIps(res.data.trustedIps);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'revoke_session',
        sessionId,
      });
      if (res.data?.success) {
        setActiveSessions(res.data.sessions);
        toast.success('Đã đăng xuất thiết bị từ xa');
      }
    } catch (e) {
      toast.error('Lỗi khi đăng xuất phiên');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác ngoài máy này?')) return;
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'revoke_all_others',
      });
      if (res.data?.success) {
        setActiveSessions(res.data.sessions);
        toast.success(`Đã đăng xuất an toàn khỏi ${res.data.revokedCount} thiết bị khác`);
      }
    } catch (e) {
      toast.error('Lỗi đăng xuất thiết bị');
    }
  };

  const handleAddTrustedIp = async () => {
    if (!newIpInput.trim() || !newIpLabel.trim()) {
      toast.error('Vui lòng nhập địa chỉ IP/dải CIDR và tên nhãn');
      return;
    }
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'add_trusted_ip',
        ipAddressOrCidr: newIpInput,
        label: newIpLabel,
      });
      if (res.data?.success) {
        setTrustedIps(res.data.trustedIps);
        setNewIpInput('');
        setNewIpLabel('');
        toast.success('Đã thêm IP tin cậy thành công!');
      }
    } catch (e) {
      toast.error('Lỗi thêm IP');
    }
  };

  const handleRemoveTrustedIp = async (trustedIpId: string) => {
    try {
      const res = await api.post('/security/sessions-ip', {
        action: 'remove_trusted_ip',
        trustedIpId,
      });
      if (res.data?.success) {
        setTrustedIps(res.data.trustedIps);
        toast.success('Đã xóa IP khỏi danh sách tin cậy');
      }
    } catch (e) {
      toast.error('Lỗi xóa IP');
    }
  };

  const handleExportAuditReport = () => {
    window.open('/api/security/audit-log?format=csv', '_blank');
    toast.success('Đang xuất báo cáo kiểm toán bảo mật chuẩn ISO 27001 / SOC 2...');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Trung Tâm Bảo Mật & Tích Hợp (Security & Integrations)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Enterprise Grade
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quản trị bảo mật 2FA, ma trận phân quyền RBAC, API Keys, Webhooks, Cloud Storage, CRM & Nhật ký kiểm toán ISO/SOC2
            </p>
          </div>
        </div>

        <button
          onClick={handleExportAuditReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-700 transition-all font-medium self-start md:self-auto shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Xuất Báo Cáo Kiểm Toán (CSV)
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('2fa_rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === '2fa_rbac'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          2FA & Phân Quyền RBAC (F163-F164)
        </button>

        <button
          onClick={() => setActiveTab('api_keys')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'api_keys'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Key className="w-4 h-4" />
          Quản Lý API Keys (F165)
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'webhooks'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhooks (F166)
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'storage'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Lưu Trữ Đám Mây (F167)
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'crm'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          Tích Hợp CRM & Marketing (F168)
        </button>

        <button
          onClick={() => setActiveTab('audit_sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'audit_sessions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          Kiểm Toán & Phiên IP (F169-F170)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 2FA & RBAC MATRIX (F163, F164) */}
      {/* ========================================================================= */}
      {activeTab === '2fa_rbac' && (
        <div className="space-y-8">
          {/* SECTION 1: 2FA TOTP (F163) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  Xác Thực Hai Yếu Tố (2FA TOTP)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Bảo vệ tài khoản và quỹ tiền bằng mã xác thực 6 chữ số từ Google Authenticator hoặc Authy
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  twoFactor?.isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                }`}>
                  {twoFactor?.isEnabled ? '● Đang Kích Hoạt' : '○ Đang Tắt'}
                </span>

                {twoFactor?.isEnabled ? (
                  <button
                    onClick={() => handleToggle2FA(false)}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200 transition-colors"
                  >
                    Vô hiệu hóa 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-all"
                  >
                    Bật 2FA Ngay
                  </button>
                )}
              </div>
            </div>

            {/* Recovery Codes Display */}
            {twoFactor?.isEnabled && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    Mã Khôi Phục Khẩn Cấp (Emergency Backup Codes):
                  </span>
                  <button
                    onClick={() => handleCopy(twoFactor.recoveryCodes.join('\n'), 'backup-codes')}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copiedId === 'backup-codes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy 8 mã khôi phục
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {twoFactor.recoveryCodes.map((code: string, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center font-mono text-xs text-gray-800 font-semibold">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2FA SETUP MODAL */}
          {showQrModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  Kích Hoạt 2FA (TOTP)
                </h3>
                <p className="text-xs text-gray-500">
                  Dùng ứng dụng Google Authenticator hoặc Authy trên điện thoại quét mã QR bên dưới:
                </p>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center w-48 h-48 mx-auto">
                  <img src={twoFactor?.qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                </div>

                <div className="text-center">
                  <span className="text-[11px] text-gray-500">Khóa bí mật thủ công (Secret Key):</span>
                  <div className="font-mono text-xs text-emerald-600 font-bold mt-0.5">{twoFactor?.secretKey}</div>
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Nhập mã 6 chữ số từ ứng dụng:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 582910"
                    className="w-full text-center tracking-widest font-mono text-lg bg-white border border-gray-200 rounded-xl py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => handleToggle2FA(true)}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50 shadow-sm"
                  >
                    Xác Thực & Kích Hoạt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: RBAC MATRIX (F164) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Ma Trận Phân Quyền Vai Trò (Role-Based Access Control - RBAC)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Kiểm soát quyền truy cập chi tiết cho 4 vai trò: Chủ sở hữu (Owner), Quản trị viên (Admin), Biên tập viên (Editor), Người xem (Viewer)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/80">
                    <th className="py-3 px-3">Phân Hệ & Quyền Hạn</th>
                    <th className="py-3 px-3 text-center">Owner (Toàn quyền)</th>
                    <th className="py-3 px-3 text-center">Admin (Quản trị)</th>
                    <th className="py-3 px-3 text-center">Editor (Biên tập)</th>
                    <th className="py-3 px-3 text-center">Viewer (Xem)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rbacMatrix.map((item) => (
                    <tr key={item.permissionKey} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{item.featureName}</p>
                        <span className="text-[11px] text-gray-500">{item.module}</span>
                      </td>

                      {/* Owner (Locked) */}
                      <td className="py-3 px-3 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      </td>

                      {/* Admin Toggle */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.admin}
                          onChange={(e) => handleUpdatePermission(item.permissionKey, 'admin', e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                        />
                      </td>

                      {/* Editor Toggle */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.editor}
                          onChange={(e) => handleUpdatePermission(item.permissionKey, 'editor', e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                        />
                      </td>

                      {/* Viewer Toggle */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.viewer}
                          onChange={(e) => handleUpdatePermission(item.permissionKey, 'viewer', e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: API KEYS (F165) */}
      {/* ========================================================================= */}
      {activeTab === 'api_keys' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                API Keys Cho Nhà Phát Triển
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Tạo và quản lý các khóa bí mật để tích hợp hệ thống bên thứ ba, giới hạn dải IP và kiểm soát Rate Limit
              </p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-2 shadow-sm self-start md:self-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo API Key Mới
            </button>
          </div>

          {/* Newly created key secret banner */}
          {createdSecretKey && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  LƯU Ý: Khóa bí mật chỉ hiển thị MỘT LẦN DUY NHẤT này!
                </span>
                <button
                  onClick={() => setCreatedSecretKey(null)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  Đóng
                </button>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
                <code className="text-emerald-700 font-mono text-xs break-all font-semibold">{createdSecretKey}</code>
                <button
                  onClick={() => handleCopy(createdSecretKey, 'new-secret-key')}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 shrink-0 ml-3 flex items-center gap-1 font-medium"
                >
                  {copiedId === 'new-secret-key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Sao chép
                </button>
              </div>
            </div>
          )}

          {/* Keys Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/80">
                    <th className="py-3 px-4">Tên Key</th>
                    <th className="py-3 px-4">Tiền Tố (Prefix)</th>
                    <th className="py-3 px-4">Phạm Vi (Scope)</th>
                    <th className="py-3 px-4">IP Whitelist</th>
                    <th className="py-3 px-4">Rate Limit</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{k.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{k.keyPrefix}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {k.roleScope}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono">{k.ipWhitelist}</td>
                      <td className="py-3 px-4 text-gray-700">{k.rateLimitPerMin} req/min</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          k.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeApiKey(k.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors font-medium"
                          >
                            Thu hồi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CREATE KEY MODAL */}
          {showNewKeyModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-600" />
                  Tạo API Key Mới
                </h3>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Tên định danh (Key Name):</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="VD: Mobile App Backend Sync"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Phạm vi quyền (Scope):</label>
                  <select
                    value={newKeyScope}
                    onChange={(e: any) => setNewKeyScope(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="READ_ONLY">READ_ONLY (Chỉ đọc dữ liệu bài viết & báo cáo)</option>
                    <option value="READ_WRITE">READ_WRITE (Đọc và tạo bài viết, tạo chiến dịch)</option>
                    <option value="FULL_ADMIN">FULL_ADMIN (Toàn quyền quản trị)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">IP Whitelist (Để trống nếu cho phép mọi IP):</label>
                  <input
                    type="text"
                    value={newKeyIp}
                    onChange={(e) => setNewKeyIp(e.target.value)}
                    placeholder="VD: 14.232.208.12, 118.69.182.0/24"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowNewKeyModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      handleCreateApiKey();
                      setShowNewKeyModal(false);
                    }}
                    disabled={loading || !newKeyName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50 shadow-sm"
                  >
                    Tạo Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEBHOOKS (F166) */}
      {/* ========================================================================= */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-teal-600" />
                Đăng Ký & Nhận Dữ Liệu Webhooks
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Nhận thông báo thời gian thực khi có bài viết được xuất bản, đơn hàng mới, hoặc lead khách hàng mới
              </p>
            </div>
            <button
              onClick={() => setShowNewWebhookModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-2 shadow-sm self-start md:self-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm Webhook Endpoint
            </button>
          </div>

          {/* Webhooks List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">{wh.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {wh.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-800 break-all">
                  {wh.endpointUrl}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Khóa bí mật (Secret):</span>
                  <div className="flex items-center gap-1 font-mono text-gray-800">
                    <span>{wh.signingSecret.slice(0, 10)}...</span>
                    <button
                      onClick={() => handleCopy(wh.signingSecret, wh.id)}
                      className="p-1 hover:text-gray-900"
                    >
                      {copiedId === wh.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wh.subscribedEvents.map((ev: string) => (
                    <span key={ev} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                      {ev}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Thành công: <strong className="text-emerald-600">{wh.successCount}</strong> | Lỗi: <strong className="text-red-500">{wh.failureCount}</strong></span>
                  <button
                    onClick={() => handleTestWebhookPing(wh.id)}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium flex items-center gap-1.5 transition-colors border border-teal-200"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gửi Thử Nghiệm (Test Ping)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Webhook Delivery Logs Table */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Nhật Ký Gửi Webhook Gần Nhất</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/80">
                    <th className="py-2.5 px-3">Sự Kiện</th>
                    <th className="py-2.5 px-3">Mã HTTP</th>
                    <th className="py-2.5 px-3">Độ Trễ</th>
                    <th className="py-2.5 px-3">Dữ Liệu Payload</th>
                    <th className="py-2.5 px-3 text-right">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {webhookLogs.map((lg) => (
                    <tr key={lg.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-teal-700">{lg.event}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {lg.responseStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">{lg.durationMs}ms</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 truncate max-w-xs">{lg.payloadSnippet}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{new Date(lg.deliveredAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CREATE WEBHOOK MODAL */}
          {showNewWebhookModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-teal-600" />
                  Đăng Ký Webhook Mới
                </h3>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Tên Endpoint:</label>
                  <input
                    type="text"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    placeholder="VD: Telegram Bot Notifier"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Payload URL (HTTPS):</label>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://api.mywebsite.com/webhooks"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1.5 font-medium">Sự kiện kích hoạt:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                    {[
                      'post.published',
                      'post.failed',
                      'order.created',
                      'lead.captured',
                      'task.completed',
                      'wallet.withdrawn',
                    ].map((ev) => (
                      <label key={ev} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(ev)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEvents([...selectedEvents, ev]);
                            else setSelectedEvents(selectedEvents.filter((x) => x !== ev));
                          }}
                          className="accent-teal-600"
                        />
                        <span>{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowNewWebhookModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateWebhook}
                    disabled={loading || !newWebhookName.trim() || !newWebhookUrl.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium disabled:opacity-50 shadow-sm"
                  >
                    Đăng Ký
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLOUD STORAGE (F167) */}
      {/* ========================================================================= */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              Lưu Trữ Đám Mây Đa Nhà Cung Cấp
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tự động sao lưu video, ảnh và dữ liệu xuất khẩu lên AWS S3, Cloudflare R2 hoặc Google Drive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {storageConfigs.map((cfg) => (
              <div key={cfg.provider} className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-sm ${
                cfg.isDefault ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/30' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">{cfg.providerName}</h4>
                  {cfg.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Mặc định
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Bucket / Thư mục:</span>
                    <span className="font-mono text-gray-900 font-medium">{cfg.bucketName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vùng Region:</span>
                    <span className="text-gray-700">{cfg.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái kết nối:</span>
                    <span className={`font-semibold ${cfg.isConnected ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {cfg.isConnected ? '● Đã Kết Nối' : '○ Chưa Kết Nối'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => handleTestStorageConnection(cfg.provider)}
                    className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center gap-1.5 border border-gray-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    Kiểm Tra Kết Nối (Ping)
                  </button>

                  {!cfg.isDefault && cfg.isConnected && (
                    <button
                      onClick={() => handleSetDefaultStorage(cfg.provider)}
                      className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 transition-colors"
                    >
                      Đặt làm lưu trữ mặc định
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CRM & MARKETING INTEGRATIONS (F168) */}
      {/* ========================================================================= */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Tích Hợp CRM & Nền Tảng Tự Động Hóa
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Đồng bộ dữ liệu khách hàng tiềm năng (Leads) và đơn hàng đa kênh với HubSpot, Mailchimp, Zapier và Google Sheets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {crmIntegrations.map((crm) => (
              <div key={crm.id} className="p-5 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{crm.serviceName}</h4>
                    <span className="text-[11px] font-mono text-gray-500">API Key: {crm.apiKeyHint}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    crm.isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {crm.isConnected ? 'Đã liên kết' : 'Chưa liên kết'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Tự động đồng bộ khách hàng (Leads):</span>
                    <input
                      type="checkbox"
                      checked={crm.autoSyncLeads}
                      onChange={(e) => handleToggleCrmSync(crm.id, 'leads', e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Tự động đồng bộ giao dịch (Orders):</span>
                    <input
                      type="checkbox"
                      checked={crm.autoSyncOrders}
                      onChange={(e) => handleToggleCrmSync(crm.id, 'orders', e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Tổng bản ghi đã đồng bộ: <strong className="text-gray-900">{crm.totalSyncedCount}</strong></span>
                  <span>{crm.lastSyncedAt ? `Lần cuối: ${new Date(crm.lastSyncedAt).toLocaleTimeString()}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT LOGS (F169) & ACTIVE SESSIONS & IP (F170) */}
      {/* ========================================================================= */}
      {activeTab === 'audit_sessions' && (
        <div className="space-y-8">
          {/* SECTION 1: AUDIT LOGS (F169) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Sổ Kiểm Toán Bảo Mật Doanh Nghiệp (ISO 27001 / SOC 2)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ghi lại toàn bộ thao tác bảo mật, đăng nhập, đổi quyền, thu hồi API key và rút tiền
                </p>
              </div>

              <button
                onClick={handleExportAuditReport}
                className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 font-medium flex items-center gap-1.5 self-start sm:self-auto border border-gray-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Xuất Báo Cáo CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/80">
                    <th className="py-2.5 px-3">Người Thực Hiện</th>
                    <th className="py-2.5 px-3">Hành Động</th>
                    <th className="py-2.5 px-3">Danh Mục</th>
                    <th className="py-2.5 px-3">Địa Chỉ IP</th>
                    <th className="py-2.5 px-3">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-900">{log.actorEmail}</span>
                        <span className="block text-[10px] text-gray-500 font-mono">({log.actorRole})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">{log.action}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-mono">{log.ipAddress} ({log.location})</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: ACTIVE SESSIONS & TRUSTED IPS (F170) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Sessions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-600" />
                    Phiên Đăng Nhập Thiết Bị ({activeSessions.length})
                  </h4>
                  <p className="text-[11px] text-gray-500">Các thiết bị đang duy trì quyền truy cập vào Workspace</p>
                </div>
                <button
                  onClick={handleRevokeAllOtherSessions}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-1 border border-red-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất thiết bị khác
                </button>
              </div>

              <div className="space-y-3">
                {activeSessions.map((sess) => (
                  <div key={sess.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{sess.deviceName}</span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                            Phiên này
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500">{sess.browser} • {sess.ipAddress} ({sess.location})</p>
                      <p className="text-[10px] text-gray-400">Hoạt động: {sess.lastActiveAt}</p>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors shadow-xs"
                      >
                        Đăng xuất
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trusted IPs (IP Whitelisting) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Danh Sách IP Tin Cậy (IP Whitelisting)
                </h4>
                <p className="text-[11px] text-gray-500">Chỉ cho phép truy cập tài khoản từ các địa chỉ IP văn phòng/chi nhánh</p>
              </div>

              {/* Add IP Input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  placeholder="IP / CIDR (VD: 14.232.208.12)"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newIpLabel}
                  onChange={(e) => setNewIpLabel(e.target.value)}
                  placeholder="Tên nhãn (VD: Trụ sở Hà Nội)"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={handleAddTrustedIp}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center gap-1 shrink-0 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm IP
                </button>
              </div>

              {/* Trusted IPs List */}
              <div className="space-y-2">
                {trustedIps.map((tip) => (
                  <div key={tip.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 font-mono">{tip.ipAddressOrCidr}</span>
                      <p className="text-gray-500 text-[11px]">{tip.label}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveTrustedIp(tip.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Xóa IP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
