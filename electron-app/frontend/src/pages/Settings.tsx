import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, Cpu, Zap, Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../lib/axios';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
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
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('topify_token');
                  const baseUrl = getApiBaseUrl();
                  window.open(`${baseUrl}/api/social/meta?token=${token}`, '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Kết nối Meta (Facebook/Instagram)
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('topify_token');
                  const baseUrl = getApiBaseUrl();
                  window.open(`${baseUrl}/api/social/google?token=${token}`, '_blank');
                }}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
              >
                Kết nối YouTube
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('topify_token');
                  const baseUrl = getApiBaseUrl();
                  window.open(`${baseUrl}/api/social/tiktok?token=${token}`, '_blank');
                }}
                className="bg-black text-white hover:bg-gray-800 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
              >
                Kết nối TikTok
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('topify_token');
                  const baseUrl = getApiBaseUrl();
                  window.open(`${baseUrl}/api/social/zalo?token=${token}`, '_blank');
                }}
                className="bg-[#0068ff] text-white hover:bg-blue-600 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
              >
                Kết nối Zalo
              </button>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-4 pt-4 border-t border-gray-100">Tài khoản đã kết nối</h3>
            {socialAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                Chưa có tài khoản mạng xã hội nào được kết nối.
              </div>
            ) : (
              <div className="space-y-4">
                {socialAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[15px] capitalize text-gray-900">{account.provider.toLowerCase()}</p>
                        <p className="text-[13px] text-gray-500">
                          {account.accountName || 'Tài khoản không xác định'} • <span className={account.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}>{account.status}</span>
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-[12px] font-medium transition-colors">
                      Quản lý
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
