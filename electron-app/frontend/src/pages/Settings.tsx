import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../lib/axios';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [selectedSocialAccount, setSelectedSocialAccount] = useState<any | null>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();

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

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      let currentSettings = res.data?.settings || {};

      // Load per-user API keys
      try {
        const keysRes = await api.get('/user/api-keys');
        if (Array.isArray(keysRes.data)) {
          keysRes.data.forEach((key: any) => {
             currentSettings[`${key.keyName}_HINT`] = key.hint;
             // Don't put actual key in state, just the hint
          });
        }
      } catch (keyErr) {
        console.error('Failed to load user api keys', keyErr);
      }

      // Load social accounts
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
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save global settings (OAuth, AI_MODEL etc)
      const globalSettings = { ...settings };
      // Remove local key fields before sending to global settings
      delete globalSettings.GEMINI_API_KEY;
      delete globalSettings.DEEPSEEK_API_KEY;
      delete globalSettings.OPENAI_API_KEY;
      delete globalSettings.GEMINI_API_KEY_HINT;
      delete globalSettings.DEEPSEEK_API_KEY_HINT;
      delete globalSettings.OPENAI_API_KEY_HINT;

      await api.post('/settings', { settings: globalSettings });

      // 2. Save individual per-user API keys if they were entered
      const saveKey = async (keyName: string) => {
        if (settings[keyName] && settings[keyName].trim() !== '') {
          await api.post('/user/api-keys', {
            keyName,
            keyValue: settings[keyName]
          });
        }
      };

      await Promise.all([
        saveKey('GEMINI_API_KEY'),
        saveKey('DEEPSEEK_API_KEY'),
        saveKey('OPENAI_API_KEY')
      ]);

      toast.success('Lưu cài đặt thành công');
      // Refresh to get new hints
      await fetchSettings();
      // Clear input fields
      setSettings(prev => ({
        ...prev,
        GEMINI_API_KEY: '',
        DEEPSEEK_API_KEY: '',
        OPENAI_API_KEY: ''
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleConnectSocial = (provider: string) => {
    if (provider === 'TIKTOK' && !settings.TIKTOK_CLIENT_KEY) {
      toast.info('Gợi ý: Nếu chưa cấu hình TikTok Client Key/Secret, hệ thống sẽ mở trang hướng dẫn cấu hình.');
    }
    if (provider === 'ZALO' && !settings.ZALO_APP_ID) {
      toast.info('Gợi ý: Nếu chưa cấu hình Zalo App ID/Secret, hệ thống sẽ mở trang hướng dẫn cấu hình.');
    }

    const token = localStorage.getItem('topify_token');
    const baseUrl = getApiBaseUrl();
    const endpoint = provider === 'YOUTUBE' ? 'google' : provider.toLowerCase();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const fullUrl = `${baseUrl}/api/social/${endpoint}${query}`;

    // Mở popup OAuth chuẩn
    const popup = window.open(fullUrl, 'OAuthPopup', 'width=600,height=720,menubar=no,toolbar=no,location=no,status=no');

    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
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
            expiresAt: res.data.expiresAt || prev.expiresAt
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-purple-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý cấu hình API và các thiết lập toàn cục</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 font-medium"
        >
          <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Configuration (Per-User) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-[15px] font-semibold text-gray-900">Cấu hình API Key (Cá nhân)</h2>
            </div>
            <span className="text-xs bg-indigo-50 text-[var(--color-primary)] px-2 py-1 rounded-full font-medium">Bảo mật AES-256</span>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô hình AI mặc định</label>
              <select
                value={settings.AI_MODEL || 'gemini-1.5-flash'}
                onChange={(e) => handleChange('AI_MODEL', e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Khuyên dùng - Nhanh, rẻ)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thông minh hơn)</option>
                <option value="gemini-3.1-pro">Gemini 3.1 Pro (Bản mới nhất)</option>
                <option value="deepseek-chat">DeepSeek Chat (Mã nguồn mở mạnh mẽ)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o-Mini</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">Mô hình này sẽ được dùng để phân tích bài viết và tự động bình luận.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-gray-400" /> Gemini API Key
                </label>
                <input
                  type="password"
                  value={settings.GEMINI_API_KEY || ''}
                  onChange={(e) => handleChange('GEMINI_API_KEY', e.target.value)}
                  placeholder="Nhập API Key mới để lưu..."
                  className="input-apple font-mono"
                />
                {settings.GEMINI_API_KEY_HINT && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    ✓ Đã lưu mã hóa: <span className="font-mono bg-emerald-50 px-1 rounded">{settings.GEMINI_API_KEY_HINT}</span>
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
                  placeholder="Nhập API Key mới để lưu..."
                  className="input-apple font-mono"
                />
                 {settings.DEEPSEEK_API_KEY_HINT && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    ✓ Đã lưu mã hóa: <span className="font-mono bg-emerald-50 px-1 rounded">{settings.DEEPSEEK_API_KEY_HINT}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-gray-400" /> OpenAI API Key (Tùy chọn)
                </label>
                <input
                  type="password"
                  value={settings.OPENAI_API_KEY || ''}
                  onChange={(e) => handleChange('OPENAI_API_KEY', e.target.value)}
                  placeholder="Nhập API Key mới để lưu..."
                  className="input-apple font-mono"
                />
                {settings.OPENAI_API_KEY_HINT && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    ✓ Đã lưu mã hóa: <span className="font-mono bg-emerald-50 px-1 rounded">{settings.OPENAI_API_KEY_HINT}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* OAuth Apps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900">OAuth & Social Apps</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID</label>
              <input
                type="text"
                value={settings.GOOGLE_CLIENT_ID || ''}
                onChange={(e) => handleChange('GOOGLE_CLIENT_ID', e.target.value)}
                placeholder="xxx.apps.googleusercontent.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Client Secret</label>
              <input
                type="password"
                value={settings.GOOGLE_CLIENT_SECRET || ''}
                onChange={(e) => handleChange('GOOGLE_CLIENT_SECRET', e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta App ID</label>
              <input
                type="text"
                value={settings.META_APP_ID || ''}
                onChange={(e) => handleChange('META_APP_ID', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta App Secret</label>
              <input
                type="password"
                value={settings.META_APP_SECRET || ''}
                onChange={(e) => handleChange('META_APP_SECRET', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Client Key</label>
              <input
                type="text"
                value={settings.TIKTOK_CLIENT_KEY || ''}
                onChange={(e) => handleChange('TIKTOK_CLIENT_KEY', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Client Secret</label>
              <input
                type="password"
                value={settings.TIKTOK_CLIENT_SECRET || ''}
                onChange={(e) => handleChange('TIKTOK_CLIENT_SECRET', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zalo App ID</label>
              <input
                type="text"
                value={settings.ZALO_APP_ID || ''}
                onChange={(e) => handleChange('ZALO_APP_ID', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zalo App Secret</label>
              <input
                type="password"
                value={settings.ZALO_APP_SECRET || ''}
                onChange={(e) => handleChange('ZALO_APP_SECRET', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Social Connections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              Kết nối Tài khoản
            </h2>
          </div>
          <div className="p-6">
            <p className="text-[14px] text-gray-500 mb-4">
              Kết nối các nền tảng mạng xã hội để đăng video trực tiếp từ ứng dụng.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleConnectSocial('META')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors font-medium cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4" />
                Kết nối Meta (Facebook/Instagram)
              </button>
              <button
                type="button"
                onClick={() => handleConnectSocial('YOUTUBE')}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors font-medium cursor-pointer shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                Kết nối YouTube
              </button>
              <button
                type="button"
                onClick={() => handleConnectSocial('TIKTOK')}
                className="bg-black text-white hover:bg-gray-800 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors font-medium cursor-pointer shadow-xs"
              >
                Kết nối TikTok
              </button>
              <button
                type="button"
                onClick={() => handleConnectSocial('ZALO')}
                className="bg-[#0068ff] text-white hover:bg-blue-600 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors font-medium cursor-pointer shadow-xs"
              >
                Kết nối Zalo
              </button>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-4 pt-5 border-t border-gray-100 flex items-center justify-between">
              <span>Tài khoản đã kết nối</span>
              <span className="text-xs text-gray-500 font-normal">{socialAccounts.length} tài khoản</span>
            </h3>

            {socialAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                Chưa có tài khoản mạng xã hội nào được kết nối.
              </div>
            ) : (
              <div className="space-y-3">
                {socialAccounts.map((account) => {
                  const isYoutube = account.provider === 'YOUTUBE';
                  const isMeta = account.provider === 'META';
                  const isTiktok = account.provider === 'TIKTOK';
                  const isZalo = account.provider === 'ZALO';

                  const isConnected = account.status === 'CONNECTED' || account.status === 'active';
                  const isExpired = account.status === 'EXPIRED';

                  return (
                    <div 
                      key={account.id} 
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs ${
                          isYoutube ? 'bg-red-50 text-red-600 border border-red-100' :
                          isMeta ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          isTiktok ? 'bg-gray-100 text-black border border-gray-200' :
                          'bg-blue-50 text-[#0068ff] border border-blue-100'
                        }`}>
                          {isYoutube ? 'YT' : isMeta ? 'FB' : isTiktok ? 'TT' : 'ZL'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[15px] text-gray-900">{account.accountName || 'Tài khoản liên kết'}</p>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wider ${
                              isConnected ? 'bg-emerald-100 text-emerald-700' :
                              isExpired ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {isConnected ? 'Đang kết nối' : isExpired ? 'EXPIRED' : account.status}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-500 mt-0.5">
                            {isYoutube && 'Google Account / YouTube'}
                            {isMeta && 'Meta (Facebook / Instagram)'}
                            {isTiktok && 'TikTok Account'}
                            {isZalo && 'Zalo OA'}
                            {account.youtubeChannelId && ` • ID: ${account.youtubeChannelId}`}
                            {account.pageId && ` • Page ID: ${account.pageId}`}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => setSelectedSocialAccount(account)}
                        className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-lg text-[13px] font-medium transition-colors shadow-xs cursor-pointer active:scale-95"
                      >
                        Quản lý
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Quản lý chi tiết tài khoản liên kết */}
      {selectedSocialAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  selectedSocialAccount.provider === 'YOUTUBE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {selectedSocialAccount.provider === 'YOUTUBE' ? 'YT' : 'LK'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Quản lý liên kết {selectedSocialAccount.provider === 'YOUTUBE' ? 'YouTube' : selectedSocialAccount.provider}
                  </h3>
                  <p className="text-xs text-gray-500">Xem thông số liên kết và tùy chọn tài khoản</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSocialAccount(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
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
                {(selectedSocialAccount.youtubeChannelId || selectedSocialAccount.pageId) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Channel / Page ID:</span>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 border border-gray-200 rounded text-gray-700 select-all">
                      {selectedSocialAccount.youtubeChannelId || selectedSocialAccount.pageId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    selectedSocialAccount.status === 'CONNECTED' || selectedSocialAccount.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedSocialAccount.status === 'CONNECTED' || selectedSocialAccount.status === 'active' ? 'Đang hoạt động (Connected)' : 'Hết hạn (EXPIRED)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Thời hạn Access Token:</span>
                  <span className="text-xs text-gray-700 font-mono">
                    {selectedSocialAccount.expiresAt ? new Date(selectedSocialAccount.expiresAt).toLocaleString('vi-VN') : 'Dài hạn (Refresh Token)'}
                  </span>
                </div>
                {selectedSocialAccount.createdAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Ngày kết nối:</span>
                    <span className="text-xs text-gray-700">
                      {new Date(selectedSocialAccount.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleConnectSocial(selectedSocialAccount.provider);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Liên kết với tài khoản {selectedSocialAccount.provider === 'YOUTUBE' ? 'YouTube' : selectedSocialAccount.provider} khác (OAuth)
                </button>

                <button
                  type="button"
                  onClick={() => handleRefreshSocial(selectedSocialAccount)}
                  disabled={refreshingToken}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingToken ? 'animate-spin' : ''}`} />
                  {refreshingToken ? 'Đang kiểm tra...' : 'Kiểm tra & Làm mới Access Token'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDisconnectSocial(selectedSocialAccount)}
                  disabled={disconnecting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {disconnecting ? 'Đang ngắt kết nối...' : 'Hủy liên kết tài khoản này'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
