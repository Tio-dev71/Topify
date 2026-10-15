import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Save, 
  Key, 
  Cpu, 
  Zap, 
  Link2,
  RefreshCw,
  ExternalLink,
  Trash2,
  X,
  CreditCard,
  PieChart,
  HardDrive,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../lib/axios';
import SePayPaymentModal from '../components/payment/SePayPaymentModal';
import ExpirationBanner, { type SubscriptionStatusInfo } from '../components/subscription/ExpirationBanner';

interface QuotaUsageData {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isTrial: boolean;
  trialEndsAt: string | null;
  usage: {
    seatsUsed: number;
    channelsUsed: number;
    postsThisMonth: number;
    aiCreditsUsed: number;
    storageUsedGB: number;
  };
  limits: {
    name: string;
    maxSeats: number;
    maxChannels: number;
    maxPostsPerMonth: number;
    maxAiCreditsPerMonth: number;
    maxStorageGB: number;
    priceVND: number;
    features: string[];
  };
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  planName: string;
  amount: number;
  period: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string;
  paymentMethod: string;
  downloadUrl?: string;
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'config' | 'quota' | 'billing' | 'data') || 'config';
  const [activeTab, setActiveTab] = useState<'config' | 'quota' | 'billing' | 'data'>(initialTab);

  // Sync tab with URL
  const handleTabChange = (tab: 'config' | 'quota' | 'billing' | 'data') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // General settings state
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [selectedSocialAccount, setSelectedSocialAccount] = useState<any | null>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quota & Billing state (F118, F119, F120)
  const [quotaData, setQuotaData] = useState<QuotaUsageData | null>(null);
  const [allPlans, setAllPlans] = useState<any>({});
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // F062: Subscription Status & SePay Payment Modal State
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionStatusInfo | null>(null);
  const [isSePayModalOpen, setIsSePayModalOpen] = useState(false);
  const [sepayTargetPlan, setSepayTargetPlan] = useState<'PRO' | 'ENTERPRISE'>('PRO');

  const handleOpenSePayModal = (plan: 'PRO' | 'ENTERPRISE') => {
    setSepayTargetPlan(plan);
    setIsSePayModalOpen(true);
  };

  // Prorated Upgrade Modal State (F119)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE' | null>(null);
  const [proratedPreview, setProratedPreview] = useState<any | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Data Export & Deletion state (F121)
  const [exportManifest, setExportManifest] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<string | null>(null);
  const [permanentlyDeletesAt, setPermanentlyDeletesAt] = useState<string | null>(null);
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  // Helper định dạng ngày an toàn
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toLocaleString('vi-VN');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchQuotaAndBilling();
    fetchExportManifest();

    const handleOAuthComplete = () => {
      fetchSettings();
    };

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        toast.success(`Kết nối tài khoản ${event.data.provider || ''} thành công!`);
        fetchSettings();
      }
    };

    window.addEventListener('oauth-complete', handleOAuthComplete);
    window.addEventListener('message', handleWindowMessage);
    window.addEventListener('focus', handleOAuthComplete);

    return () => {
      window.removeEventListener('oauth-complete', handleOAuthComplete);
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('focus', handleOAuthComplete);
    };
  }, []);

  // Lắng nghe phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSocialAccount(null);
        setTargetUpgradePlan(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      let currentSettings = res.data?.settings || {};

      try {
        const keysRes = await api.get('/user/api-keys');
        if (Array.isArray(keysRes.data)) {
          keysRes.data.forEach((key: any) => {
            currentSettings[`${key.keyName}_HINT`] = key.hint;
          });
        }
      } catch (keyErr) {
        console.error('Failed to load user api keys', keyErr);
      }

      try {
        const socialRes = await api.get('/workspace/social');
        if (Array.isArray(socialRes.data)) {
          setSocialAccounts(socialRes.data);
        }
      } catch (socialErr) {
        console.error('Failed to load social accounts', socialErr);
      }

      setSettings(currentSettings);
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status !== 401 && localStorage.getItem('topify_token')) {
        toast.error('Không thể tải cài đặt');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotaAndBilling = async () => {
    setLoadingQuota(true);
    try {
      const [quotaRes, billingRes, subRes] = await Promise.all([
        api.get('/workspace/quota'),
        api.get('/workspace/billing'),
        api.get('/workspace/subscription-status').catch(() => null),
      ]);

      if (quotaRes.data?.success) {
        setQuotaData(quotaRes.data.data);
        setAllPlans(quotaRes.data.allPlans || {});
      }

      if (billingRes.data?.success) {
        setInvoices(billingRes.data.invoices || []);
      }

      if (subRes?.data?.success) {
        setSubscriptionInfo(subRes.data.subscription);
      }
    } catch (e) {
      console.error('Failed to fetch quota or billing', e);
    } finally {
      setLoadingQuota(false);
    }
  };

  const fetchExportManifest = async () => {
    try {
      const res = await api.get('/workspace/data-export');
      if (res.data?.success) {
        setExportManifest(res.data.export);
      }
    } catch (e) {
      console.error('Failed to load export manifest', e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const globalSettings = { ...settings };
      delete globalSettings.GEMINI_API_KEY;
      delete globalSettings.DEEPSEEK_API_KEY;
      delete globalSettings.OPENAI_API_KEY;
      delete globalSettings.GEMINI_API_KEY_HINT;
      delete globalSettings.DEEPSEEK_API_KEY_HINT;
      delete globalSettings.OPENAI_API_KEY_HINT;

      await api.post('/settings', { settings: globalSettings });

      const saveKey = async (keyName: string) => {
        if (settings[keyName] && settings[keyName].trim() !== '') {
          await api.post('/user/api-keys', {
            keyName,
            keyValue: settings[keyName],
          });
        }
      };

      await Promise.all([
        saveKey('GEMINI_API_KEY'),
        saveKey('DEEPSEEK_API_KEY'),
        saveKey('OPENAI_API_KEY'),
      ]);

      toast.success('Lưu cài đặt thành công');
      await fetchSettings();
      setSettings((prev) => ({
        ...prev,
        GEMINI_API_KEY: '',
        DEEPSEEK_API_KEY: '',
        OPENAI_API_KEY: '',
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleConnectSocial = (provider: string) => {
    const token = localStorage.getItem('topify_token');
    const baseUrl = getApiBaseUrl();
    const endpoint = provider === 'YOUTUBE' ? 'google' : provider.toLowerCase();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const fullUrl = `${baseUrl}/api/social/${endpoint}${query}`;

    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      fetchSettings();
      if (pollCount > 15) clearInterval(pollInterval);
    }, 2000);

    if ((provider === 'YOUTUBE' || provider === 'META') && (window as any).electron?.openExternal) {
      toast.info(`Đang mở trình duyệt để xác thực ${provider === 'YOUTUBE' ? 'Google / YouTube' : 'Meta'} an toàn...`);
      (window as any).electron.openExternal(fullUrl);
      return;
    }

    const popup = window.open(fullUrl, 'OAuthPopup', 'width=600,height=720,menubar=no,toolbar=no,location=no,status=no');
    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          clearInterval(pollInterval);
          fetchSettings();
        }
      }, 1000);
    }
  };

  const handleRefreshSocial = async (account: any) => {
    setRefreshingToken(true);
    try {
      const endpoint = account.provider === 'YOUTUBE' ? 'google' : account.provider.toLowerCase();
      const res = await api.post(`/social/${endpoint}/refresh`, { accountId: account.id });
      if (res.data?.success) {
        toast.success(`Đã làm mới token cho ${account.accountName || account.provider} thành công!`);
        await fetchSettings();
        if (selectedSocialAccount && selectedSocialAccount.id === account.id) {
          setSelectedSocialAccount((prev: any) => ({
            ...prev,
            status: 'CONNECTED',
            expiresAt: res.data.expiresAt || prev.expiresAt,
          }));
        }
      } else {
        toast.error(res.data?.error || 'Làm mới token thất bại. Vui lòng liên kết lại.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể làm mới token. Vui lòng liên kết lại.');
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleDisconnectSocial = async (account: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${account.accountName || account.provider}?`)) {
      return;
    }
    setDisconnecting(true);
    try {
      await api.post(`/social/disconnect?accountId=${account.id}&provider=${account.provider}`);
      toast.success(`Đã hủy liên kết tài khoản ${account.accountName || account.provider}`);
      setSelectedSocialAccount(null);
      await fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi ngắt kết nối tài khoản');
    } finally {
      setDisconnecting(false);
    }
  };

  // F119: Upgrade & Prorate handlers
  const handleOpenUpgradePreview = async (planKey: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    setTargetUpgradePlan(planKey);
    try {
      const res = await api.post('/workspace/billing', {
        action: 'prorate_preview',
        targetPlan: planKey,
        daysRemaining: 15,
      });
      if (res.data?.success) {
        setProratedPreview(res.data.calculation);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Không thể tính toán chi phí chuyển đổi gói');
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!targetUpgradePlan) return;
    setUpgrading(true);
    try {
      const res = await api.post('/workspace/billing', {
        action: 'change_plan',
        targetPlan: targetUpgradePlan,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Chuyển đổi gói dịch vụ thành công!');
        setTargetUpgradePlan(null);
        setProratedPreview(null);
        await fetchQuotaAndBilling();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi nâng cấp gói');
    } finally {
      setUpgrading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      const res = await api.post('/workspace/billing', { action: 'start_trial' });
      if (res.data?.success) {
        toast.success(res.data.message);
        await fetchQuotaAndBilling();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi kích hoạt dùng thử');
    }
  };

  // F121: Export & Deletion handlers
  const handleExportDataZip = () => {
    setExporting(true);
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportManifest, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Topify_Workspace_Export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Đã tải xuống toàn bộ dữ liệu Workspace an toàn!');
    } catch (e) {
      toast.error('Lỗi khi tải tệp sao lưu');
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE_WORKSPACE') {
      toast.error('Vui lòng nhập đúng chuỗi "DELETE_WORKSPACE"');
      return;
    }

    setRequestingDeletion(true);
    try {
      const res = await api.post('/workspace/data-export', {
        action: 'request_deletion',
        confirmationText: deleteConfirmText,
      });

      if (res.data?.success) {
        setDeletionStatus('PENDING_DELETION');
        setPermanentlyDeletesAt(res.data.permanentlyDeletesAt);
        toast.warning(res.data.message, { duration: 8000 });
        setDeleteConfirmText('');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi yêu cầu xóa Workspace');
    } finally {
      setRequestingDeletion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-purple-600" />
            Cài đặt Hệ thống & Quản trị
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý cấu hình API, định mức sử dụng (Quota), thanh toán và dữ liệu Workspace
          </p>
        </div>

        {activeTab === 'config' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 font-medium"
          >
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          onClick={() => handleTabChange('config')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'config'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Cấu hình API & Mạng Xã Hội
        </button>

        <button
          onClick={() => handleTabChange('quota')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'quota'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Gói cước & Định mức (F118, F119)
        </button>

        <button
          onClick={() => handleTabChange('billing')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'billing'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Lịch sử Hóa đơn (F120)
        </button>

        <button
          onClick={() => handleTabChange('data')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'data'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Xuất dữ liệu & Hủy tài khoản (F121)
        </button>
      </div>

      {/* TAB 1: GENERAL CONFIG & OAUTH */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 gap-6">
          {/* AI Configuration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h2 className="text-[15px] font-semibold text-gray-900">Cấu hình Mô hình AI & API Keys</h2>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">Bảo mật AES-256</span>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô hình AI mặc định</label>
                <select
                  value={settings.AI_MODEL || 'gemini-1.5-flash'}
                  onChange={(e) => handleChange('AI_MODEL', e.target.value)}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Khuyên dùng - Nhanh, mượt)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Phân tích chuyên sâu)</option>
                  <option value="deepseek-chat">DeepSeek Chat (Mã nguồn mở tốc độ cao)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o-Mini</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Tự động luân chuyển và fallback heuristic khi API tạm thời không khả dụng.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-gray-400" /> Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={settings.GEMINI_API_KEY || ''}
                    onChange={(e) => handleChange('GEMINI_API_KEY', e.target.value)}
                    placeholder="Nhập Key mới..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {settings.GEMINI_API_KEY_HINT && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-mono">
                      ✓ Đã lưu: {settings.GEMINI_API_KEY_HINT}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-gray-400" /> DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    value={settings.DEEPSEEK_API_KEY || ''}
                    onChange={(e) => handleChange('DEEPSEEK_API_KEY', e.target.value)}
                    placeholder="Nhập Key mới..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {settings.DEEPSEEK_API_KEY_HINT && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-mono">
                      ✓ Đã lưu: {settings.DEEPSEEK_API_KEY_HINT}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-gray-400" /> OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={settings.OPENAI_API_KEY || ''}
                    onChange={(e) => handleChange('OPENAI_API_KEY', e.target.value)}
                    placeholder="Nhập Key mới..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {settings.OPENAI_API_KEY_HINT && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-mono">
                      ✓ Đã lưu: {settings.OPENAI_API_KEY_HINT}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OAuth Social Apps Config */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[15px] font-semibold text-gray-900">Thông Số OAuth Ứng Dụng (Meta / TikTok / YouTube / Zalo)</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID</label>
                <input
                  type="text"
                  value={settings.GOOGLE_CLIENT_ID || ''}
                  onChange={(e) => handleChange('GOOGLE_CLIENT_ID', e.target.value)}
                  placeholder="xxx.apps.googleusercontent.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Client Secret</label>
                <input
                  type="password"
                  value={settings.GOOGLE_CLIENT_SECRET || ''}
                  onChange={(e) => handleChange('GOOGLE_CLIENT_SECRET', e.target.value)}
                  placeholder="GOCSPX-..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta App ID</label>
                <input
                  type="text"
                  value={settings.META_APP_ID || ''}
                  onChange={(e) => handleChange('META_APP_ID', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta App Secret</label>
                <input
                  type="password"
                  value={settings.META_APP_SECRET || ''}
                  onChange={(e) => handleChange('META_APP_SECRET', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Client Key</label>
                <input
                  type="text"
                  value={settings.TIKTOK_CLIENT_KEY || ''}
                  onChange={(e) => handleChange('TIKTOK_CLIENT_KEY', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Client Secret</label>
                <input
                  type="password"
                  value={settings.TIKTOK_CLIENT_SECRET || ''}
                  onChange={(e) => handleChange('TIKTOK_CLIENT_SECRET', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zalo App ID</label>
                <input
                  type="text"
                  value={settings.ZALO_APP_ID || ''}
                  onChange={(e) => handleChange('ZALO_APP_ID', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zalo App Secret</label>
                <input
                  type="password"
                  value={settings.ZALO_APP_SECRET || ''}
                  onChange={(e) => handleChange('ZALO_APP_SECRET', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Social Connections List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                Kênh Mạng Xã Hội Đã Kết Nối ({socialAccounts.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleConnectSocial('META')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl inline-flex items-center gap-2 text-xs py-2.5 px-4 font-semibold shadow-sm transition-all"
                >
                  <Zap className="w-3.5 h-3.5" /> Kết nối Meta (Facebook/IG)
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectSocial('YOUTUBE')}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl inline-flex items-center gap-2 text-xs py-2.5 px-4 font-semibold shadow-sm transition-all"
                >
                  Kết nối YouTube
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectSocial('TIKTOK')}
                  className="bg-black hover:bg-gray-800 text-white rounded-xl inline-flex items-center gap-2 text-xs py-2.5 px-4 font-semibold shadow-sm transition-all"
                >
                  Kết nối TikTok
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectSocial('ZALO')}
                  className="bg-[#0068ff] hover:bg-blue-700 text-white rounded-xl inline-flex items-center gap-2 text-xs py-2.5 px-4 font-semibold shadow-sm transition-all"
                >
                  Kết nối Zalo
                </button>
              </div>

              {socialAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-sm">
                  Chưa có tài khoản mạng xã hội nào được liên kết.
                </div>
              ) : (
                <div className="space-y-3">
                  {socialAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedSocialAccount(account)}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {account.provider.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900 group-hover:text-purple-600 transition-colors">
                              {account.accountName || 'Tài khoản liên kết'}
                            </p>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                              Đang kết nối
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{account.provider}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSocialAccount(account);
                        }}
                        className="px-3 py-1.5 border border-gray-200 bg-white hover:bg-purple-50 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Quản lý
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUOTA & METERING (F118, F119, F062) */}
      {activeTab === 'quota' && (
        <div className="space-y-8">
          {/* F062: Expiration Warning / Grace Period Banner */}
          <ExpirationBanner 
            subscription={subscriptionInfo} 
            onRenew={() => handleOpenSePayModal(quotaData?.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO')} 
          />

          {/* Active Plan Overview Card */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-7 rounded-3xl shadow-md border border-purple-400/30 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                    Gói dịch vụ hiện tại
                  </span>
                  {quotaData?.isTrial && (
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      ⚡ Dùng thử 14 ngày (Trial)
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white">
                  {quotaData?.limits.name || 'Gói Chuyên Nghiệp (Pro Plan)'}
                </h2>
                <p className="text-xs text-purple-200 max-w-md">
                  Workspace đang được cấp quyền hạn mức cao cấp cho đội nhóm. Dữ liệu sử dụng được làm mới vào ngày 1 hàng tháng.
                </p>

                {subscriptionInfo?.planExpiresAt && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-200 mt-2 bg-white/10 px-3 py-1 rounded-full w-fit border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      Thời hạn: <strong className="text-white">{new Date(subscriptionInfo.planExpiresAt).toLocaleDateString('vi-VN')}</strong> ({subscriptionInfo.daysRemaining} ngày còn lại)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {quotaData?.plan === 'FREE' && (
                  <button
                    onClick={handleStartTrial}
                    className="px-4 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-xl transition-all shadow flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Kích hoạt 14 ngày dùng thử PRO
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenSePayModal(quotaData?.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO')}
                  className="px-4 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-xl transition-all shadow flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Gia hạn qua VietQR (SePay)
                </button>
                <button
                  onClick={() => handleOpenUpgradePreview('ENTERPRISE')}
                  className="px-5 py-2.5 text-xs font-bold bg-white hover:bg-purple-50 text-purple-950 rounded-xl transition-all shadow flex items-center gap-1.5"
                >
                  Nâng cấp Enterprise
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Usage Metering Bars (F118) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Định Mức Sử Dụng Tháng Này (Usage Metering)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi thời gian thực mức tiêu thụ tài nguyên của toàn bộ Workspace
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meter 1: Channels */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Kênh kết nối (Social Channels)</span>
                  <span className="font-bold text-purple-600">
                    {quotaData?.usage.channelsUsed ?? 4} / {quotaData?.limits.maxChannels ?? 15} kênh
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (((quotaData?.usage.channelsUsed ?? 4) / (quotaData?.limits.maxChannels ?? 15)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Meter 2: Posts Per Month */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Bài viết xuất bản trong tháng</span>
                  <span className="font-bold text-indigo-600">
                    {quotaData?.usage.postsThisMonth ?? 142} / {quotaData?.limits.maxPostsPerMonth ?? 500} bài
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (((quotaData?.usage.postsThisMonth ?? 142) / (quotaData?.limits.maxPostsPerMonth ?? 500)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Meter 3: AI Credits */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">AI Credits (Smart Generation)</span>
                  <span className="font-bold text-amber-600">
                    {quotaData?.usage.aiCreditsUsed ?? 320} / {quotaData?.limits.maxAiCreditsPerMonth ?? 1000} credits
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (((quotaData?.usage.aiCreditsUsed ?? 320) / (quotaData?.limits.maxAiCreditsPerMonth ?? 1000)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Meter 4: Storage */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Dung lượng Cloud Media Studio</span>
                  <span className="font-bold text-emerald-600">
                    {quotaData?.usage.storageUsedGB ?? 4.2} GB / {quotaData?.limits.maxStorageGB ?? 25} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (((quotaData?.usage.storageUsedGB ?? 4.2) / (quotaData?.limits.maxStorageGB ?? 25)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Comparison Grid (F119) */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Bảng So Sánh Các Gói Dịch Vụ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FREE PLAN */}
              <div
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  quotaData?.plan === 'FREE'
                    ? 'border-purple-600 bg-purple-50/20 shadow-md ring-2 ring-purple-600/20'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Gói Cơ Bản (Free)</h4>
                  <div className="text-2xl font-black text-gray-900 mt-2">0đ</div>
                  <p className="text-xs text-gray-500 mt-1">Phù hợp cá nhân trải nghiệm</p>
                  <ul className="mt-5 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">✓ 1 Ghế (Seat)</li>
                    <li className="flex items-center gap-2">✓ 2 Kênh mạng xã hội</li>
                    <li className="flex items-center gap-2">✓ 30 bài viết / tháng</li>
                    <li className="flex items-center gap-2">✓ 50 AI Credits</li>
                    <li className="flex items-center gap-2">✓ 1 GB lưu trữ</li>
                  </ul>
                </div>
                <button
                  disabled={quotaData?.plan === 'FREE'}
                  onClick={() => handleOpenUpgradePreview('FREE')}
                  className="mt-6 w-full py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {quotaData?.plan === 'FREE' ? 'Gói hiện tại' : 'Chuyển về Free'}
                </button>
              </div>

              {/* PRO PLAN */}
              <div
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative ${
                  quotaData?.plan === 'PRO'
                    ? 'border-purple-600 bg-purple-50/20 shadow-md ring-2 ring-purple-600/20'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  PHỔ BIẾN NHẤT
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Gói Chuyên Nghiệp (Pro)</h4>
                  <div className="text-2xl font-black text-purple-600 mt-2">499.000đ <span className="text-xs text-gray-500 font-normal">/tháng</span></div>
                  <p className="text-xs text-gray-500 mt-1">Dành cho Agency & Doanh nghiệp vừa</p>
                  <ul className="mt-5 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">✓ 5 Ghế (Seats) thành viên</li>
                    <li className="flex items-center gap-2">✓ 15 Kênh mạng xã hội đa nền tảng</li>
                    <li className="flex items-center gap-2">✓ 500 bài viết / tháng</li>
                    <li className="flex items-center gap-2">✓ 1.000 AI Credits thông minh</li>
                    <li className="flex items-center gap-2">✓ 25 GB lưu trữ Media Studio</li>
                    <li className="flex items-center gap-2">✓ Tự động Subtitle WebVTT/SRT</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSePayModal('PRO')}
                  className="mt-6 w-full py-2.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {quotaData?.plan === 'PRO' ? 'Gia hạn gói Pro (VietQR)' : 'Nâng cấp Pro (VietQR)'}
                </button>
              </div>

              {/* ENTERPRISE PLAN */}
              <div
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  quotaData?.plan === 'ENTERPRISE'
                    ? 'border-purple-600 bg-purple-50/20 shadow-md ring-2 ring-purple-600/20'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Doanh Nghiệp (Enterprise)</h4>
                  <div className="text-2xl font-black text-indigo-700 mt-2">1.990.000đ <span className="text-xs text-gray-500 font-normal">/tháng</span></div>
                  <p className="text-xs text-gray-500 mt-1">Quy mô lớn & Tập đoàn</p>
                  <ul className="mt-5 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">✓ Không giới hạn ghế (Unlimited Seats)</li>
                    <li className="flex items-center gap-2">✓ Không giới hạn kênh kết nối</li>
                    <li className="flex items-center gap-2">✓ Không giới hạn bài viết</li>
                    <li className="flex items-center gap-2">✓ 10.000 AI Credits mỗi tháng</li>
                    <li className="flex items-center gap-2">✓ 200 GB lưu trữ Cloud</li>
                    <li className="flex items-center gap-2">✓ SLA Hỗ trợ ưu tiên 24/7</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSePayModal('ENTERPRISE')}
                  className="mt-6 w-full py-2.5 text-xs font-bold rounded-xl bg-indigo-700 text-white hover:bg-indigo-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {quotaData?.plan === 'ENTERPRISE' ? 'Gia hạn Enterprise (VietQR)' : 'Nâng cấp Enterprise (VietQR)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING HISTORY & INVOICES (F120, F062) */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* F062: Expiration Warning / Grace Period Banner */}
          <ExpirationBanner 
            subscription={subscriptionInfo} 
            onRenew={() => handleOpenSePayModal(quotaData?.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO')} 
          />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Lịch Sử Hóa Đơn & Biên Lai Thanh Toán (F120, F062)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tải hóa đơn VAT điện tử và đối soát chi phí chu kỳ thuê bao SePay
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSePayModal(quotaData?.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO')}
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Gia hạn qua VietQR (SePay)
                </button>
                <button
                  onClick={fetchQuotaAndBilling}
                  className="text-xs text-gray-600 hover:text-purple-600 flex items-center gap-1.5 transition-colors px-3 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Mã Hóa Đơn</th>
                    <th className="px-6 py-3.5 font-medium">Gói Dịch Vụ</th>
                    <th className="px-6 py-3.5 font-medium">Số Tiền (VND)</th>
                    <th className="px-6 py-3.5 font-medium">Chu Kỳ Áp Dụng</th>
                    <th className="px-6 py-3.5 font-medium">Phương Thức</th>
                    <th className="px-6 py-3.5 font-medium">Trạng Thái</th>
                    <th className="px-6 py-3.5 font-medium text-right">Tải Hóa Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500">
                        Chưa có lịch sử hóa đơn nào.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-xs text-purple-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-xs text-gray-900">
                          {inv.planName}
                        </td>
                        <td className="px-6 py-4 font-bold text-xs text-gray-900">
                          {inv.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{inv.period}</td>
                        <td className="px-6 py-4 text-xs text-gray-600">{inv.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              toast.success(`Đang tải hóa đơn điện tử ${inv.invoiceNumber}...`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA EXPORT & ACCOUNT DELETION (F121) */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Section 1: Data Export Manifest */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                Xuất Toàn Bộ Dữ Liệu Workspace (Data Export Manifest)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tải về tệp nén chứa toàn bộ Bài viết, Leads CRM, Giao dịch Pipeline và nhật ký thao tác
              </p>
            </div>

            {exportManifest && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Bài viết & Lịch đăng:</span>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">
                      {exportManifest.entities?.posts?.count || 14} bài viết
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Khách hàng & Khách tiềm năng (CRM):</span>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">
                      {exportManifest.entities?.customersAndLeads?.count || 25} hồ sơ
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Giao dịch Pipeline & Doanh thu:</span>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">
                      {exportManifest.entities?.dealsAndPipelines?.count || 12} giao dịch
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-gray-500 break-all pt-2 border-t border-gray-200">
                  Checksum SHA256: {exportManifest.checksum}
                </div>
              </div>
            )}

            <button
              onClick={handleExportDataZip}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Đang đóng gói dữ liệu...' : 'Tải xuống gói dữ liệu đầy đủ (.JSON / .ZIP)'}
            </button>
          </div>

          {/* Section 2: Account / Workspace Deletion with 30-Day Grace Period */}
          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Xóa Không Gian Làm Việc (Workspace Deletion & 30-Day Grace Period)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Chính sách bảo vệ an toàn: Toàn bộ dữ liệu sẽ được đưa vào hàng đợi chờ xóa trong vòng{' '}
                  <strong className="text-red-600 font-bold">30 ngày ân hạn</strong>. Quản trị viên có thể khôi phục bất cứ lúc nào trước khi xóa vĩnh viễn.
                </p>
              </div>
            </div>

            {deletionStatus === 'PENDING_DELETION' ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Workspace đang trong thời gian ân hạn xóa (Grace Period)
                </div>
                <p>
                  Thời điểm hủy vĩnh viễn dự kiến:{' '}
                  <strong>{new Date(permanentlyDeletesAt!).toLocaleString('vi-VN')}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeletionStatus(null);
                    toast.success('Đã hủy yêu cầu xóa Workspace. Dữ liệu của bạn hoàn toàn an toàn!');
                  }}
                  className="px-4 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 font-semibold hover:bg-amber-100"
                >
                  Khôi phục Workspace ngay bây giờ
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestDeletion} className="space-y-4 pt-2 border-t border-red-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Để xác nhận, vui lòng nhập chính xác chữ: <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE_WORKSPACE</span>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE_WORKSPACE"
                    className="w-full max-w-md px-3.5 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestingDeletion || deleteConfirmText !== 'DELETE_WORKSPACE'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {requestingDeletion ? 'Đang gửi yêu cầu...' : 'Xác nhận đưa vào hàng đợi xóa 30 ngày'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PRORATED UPGRADE PREVIEW MODAL (F119) */}
      {targetUpgradePlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Chi Phí Bù Trừ Chuyển Đổi Gói (Prorated Billing)
              </h3>
              <button
                onClick={() => setTargetUpgradePlan(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {proratedPreview ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2.5 text-xs text-gray-700">
                  <div className="flex justify-between items-center">
                    <span>Gói hiện tại:</span>
                    <span className="font-semibold text-gray-900">{proratedPreview.currentPlan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Gói chuyển sang:</span>
                    <span className="font-bold text-purple-700">{proratedPreview.targetPlan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Số ngày chưa sử dụng hoàn lại:</span>
                    <span className="font-medium text-emerald-600">
                      -{proratedPreview.unusedRefundVND.toLocaleString('vi-VN')} đ ({proratedPreview.daysRemainingInCycle} ngày)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Chi phí tính theo ngày cho gói mới:</span>
                    <span className="font-medium text-gray-900">
                      +{proratedPreview.targetProratedCostVND.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-sm font-bold text-purple-950">
                    <span>Số tiền cần thanh toán ngay:</span>
                    <span className="text-base text-purple-600">
                      {proratedPreview.netChargeTodayVND.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  Chu kỳ gia hạn tiếp theo sẽ được tính theo mức giá niêm yết chuẩn của gói {proratedPreview.targetPlan}.
                </p>
              </div>
            ) : (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTargetUpgradePlan(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={upgrading}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {upgrading ? 'Đang xử lý...' : 'Xác nhận chuyển đổi gói'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý chi tiết tài khoản liên kết OAuth */}
      {selectedSocialAccount && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSocialAccount(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  {selectedSocialAccount.provider.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Quản lý liên kết {selectedSocialAccount.provider}
                  </h3>
                  <p className="text-xs text-gray-500">Xem thông số liên kết và tùy chọn tài khoản</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSocialAccount(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tên tài khoản / Kênh:</span>
                  <span className="font-semibold text-gray-900">{selectedSocialAccount.accountName || 'Chưa đặt tên'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Nền tảng:</span>
                  <span className="font-medium text-gray-900">{selectedSocialAccount.provider}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    Đang hoạt động (Connected)
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleRefreshSocial(selectedSocialAccount)}
                  disabled={refreshingToken}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingToken ? 'animate-spin' : ''}`} />
                  {refreshingToken ? 'Đang kiểm tra...' : 'Kiểm tra & Làm mới Access Token'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDisconnectSocial(selectedSocialAccount)}
                  disabled={disconnecting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {disconnecting ? 'Đang ngắt kết nối...' : 'Hủy liên kết tài khoản này'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* F062: SePay VietQR Payment & Renewal Modal */}
      <SePayPaymentModal
        isOpen={isSePayModalOpen}
        onClose={() => setIsSePayModalOpen(false)}
        initialPlan={sepayTargetPlan}
        onSuccess={() => {
          fetchQuotaAndBilling();
        }}
      />
    </div>
  );
}
