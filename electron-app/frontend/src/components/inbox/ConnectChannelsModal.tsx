import { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Bot, ShieldCheck, Zap, RefreshCw, Unlink, Radio } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../../lib/axios';

interface ConnectChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConnectChannelsModal({ isOpen, onClose, onSuccess }: ConnectChannelsModalProps) {
  const [activeTab, setActiveTab] = useState<'TELEGRAM' | 'META' | 'ZALO'>('TELEGRAM');
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  // Telegram states
  const [telegramToken, setTelegramToken] = useState('');
  const [connectingTg, setConnectingTg] = useState(false);

  // Meta states
  const [metaPageId, setMetaPageId] = useState('');
  const [metaPageName, setMetaPageName] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [connectingMeta, setConnectingMeta] = useState(false);

  // Zalo states
  const [zaloOaId, setZaloOaId] = useState('');
  const [zaloOaName, setZaloOaName] = useState('');
  const [zaloAccessToken, setZaloAccessToken] = useState('');
  const [connectingZalo, setConnectingZalo] = useState(false);

  // Simulation states
  const [simulating, setSimulating] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConnectionStatus();
    }
  }, [isOpen]);

  const fetchConnectionStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.get('/social/status');
      if (res.data?.connections) {
        setConnections(res.data.connections);
      }
    } catch (e) {
      console.warn('Failed to load social status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  if (!isOpen) return null;

  const baseUrl = getApiBaseUrl().replace('/api', '') || window.location.origin;
  const metaWebhookUrl = `${baseUrl}/api/webhooks/meta`;
  const tgWebhookUrl = `${baseUrl}/api/webhooks/telegram`;
  const zaloWebhookUrl = `${baseUrl}/api/webhooks/zalo`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  // Find connection by provider
  const getConn = (provider: string) => connections.find((c) => c.provider === provider && c.connected);

  const activeTg = getConn('TELEGRAM');
  const activeMeta = getConn('META');
  const activeZalo = getConn('ZALO');

  const handleConnectTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramToken.trim()) {
      toast.error('Vui lòng nhập Token Bot Telegram');
      return;
    }

    setConnectingTg(true);
    try {
      const res = await api.post('/social/telegram/connect', {
        botToken: telegramToken.trim(),
      });

      if (res.data?.success) {
        toast.success(`Kết nối thành công Bot @${res.data.bot?.username || res.data.bot?.name}!`);
        setTelegramToken('');
        await fetchConnectionStatus();
        onSuccess?.();
      } else {
        toast.error(res.data?.error || 'Kết nối thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi kết nối Telegram Bot');
    } finally {
      setConnectingTg(false);
    }
  };

  const handleConnectMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaPageId.trim()) {
      toast.error('Vui lòng nhập Facebook Page ID');
      return;
    }

    setConnectingMeta(true);
    try {
      const res = await api.post('/social/meta/connect', {
        pageId: metaPageId.trim(),
        pageName: metaPageName.trim() || undefined,
        accessToken: metaAccessToken.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(res.data?.message || 'Kết nối Facebook Page thành công!');
        setMetaPageId('');
        setMetaPageName('');
        setMetaAccessToken('');
        await fetchConnectionStatus();
        onSuccess?.();
      } else {
        toast.error(res.data?.error || 'Kết nối thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi kết nối Facebook Page');
    } finally {
      setConnectingMeta(false);
    }
  };

  const handleConnectZalo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zaloOaId.trim()) {
      toast.error('Vui lòng nhập Zalo OA ID');
      return;
    }

    setConnectingZalo(true);
    try {
      const res = await api.post('/social/zalo/connect', {
        oaId: zaloOaId.trim(),
        oaName: zaloOaName.trim() || undefined,
        accessToken: zaloAccessToken.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(res.data?.message || 'Kết nối Zalo OA thành công!');
        setZaloOaId('');
        setZaloOaName('');
        setZaloAccessToken('');
        await fetchConnectionStatus();
        onSuccess?.();
      } else {
        toast.error(res.data?.error || 'Kết nối thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi kết nối Zalo OA');
    } finally {
      setConnectingZalo(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setDisconnecting(provider);
    try {
      const res = await api.post(`/social/disconnect?provider=${provider}`);
      if (res.data?.success) {
        toast.success(`Đã ngắt kết nối kênh ${provider}`);
        await fetchConnectionStatus();
        onSuccess?.();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Lỗi khi ngắt kết nối');
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSimulateInbound = async (platform: 'TELEGRAM' | 'META' | 'ZALO') => {
    setSimulating(true);
    try {
      const res = await api.post('/social/simulate-inbound', { platform });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã nhận tin nhắn thử nghiệm thành công!');
        onSuccess?.();
      } else {
        toast.error(res.data?.error || 'Lỗi khi tạo tin nhắn');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Lỗi khi thử nghiệm tin nhắn');
    } finally {
      setSimulating(false);
    }
  };

  const openMetaOAuth = () => {
    const token = localStorage.getItem('topify_token');
    window.open(`${baseUrl}/api/social/meta?token=${token}`, '_blank');
  };

  const openZaloOAuth = () => {
    const token = localStorage.getItem('topify_token');
    window.open(`${baseUrl}/api/social/zalo?token=${token}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Kết nối Kênh Chat Mạng Xã Hội</h3>
              <p className="text-[11px] text-gray-500">Đồng bộ tin nhắn tự động từ Telegram, Meta, Zalo về Hộp thư hợp nhất</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Connection Status Pill */}
        {connections.length > 0 && (
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-900">
                Đang kết nối {connections.length} kênh: {connections.map((c) => c.accountName || c.provider).join(', ')}
              </span>
            </div>
            <button
              onClick={fetchConnectionStatus}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium cursor-pointer"
              title="Làm mới trạng thái"
            >
              <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        )}

        {/* Channel Tabs */}
        <div className="flex border-b border-gray-100 px-5 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab('TELEGRAM')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'TELEGRAM'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot</span>
            {activeTg && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('META')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'META'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Meta (Messenger & IG)</span>
            {activeMeta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('ZALO')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ZALO'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Zalo OA</span>
            {activeZalo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: TELEGRAM */}
          {activeTab === 'TELEGRAM' && (
            <div className="space-y-4">
              {activeTg ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">{activeTg.accountName || 'Telegram Bot'}</p>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          {activeTg.telegramBotUsername ? `@${activeTg.telegramBotUsername}` : 'Đã gắn Bot Token'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Webhook Đang Hoạt Động
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                    <button
                      type="button"
                      onClick={() => handleSimulateInbound('TELEGRAM')}
                      disabled={simulating}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                      <span>{simulating ? 'Đang gửi...' : '⚡ Thử nghiệm nhận tin nhắn thật từ Bot'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('TELEGRAM')}
                      disabled={disconnecting === 'TELEGRAM'}
                      className="py-1.5 px-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Ngắt</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-800 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    Hướng dẫn tạo Bot Telegram nhận tin nhắn thật trong 1 phút:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-sky-900/80 text-[11px]">
                    <li>Mở ứng dụng Telegram, tìm kiếm <strong>@BotFather</strong>.</li>
                    <li>Gõ lệnh <code>/newbot</code> và làm theo hướng dẫn để đặt tên bot.</li>
                    <li>Sao chép <strong>HTTP API Token</strong> (dạng <code>123456789:ABCdef...</code>) và dán vào ô bên dưới.</li>
                  </ol>
                </div>
              )}

              <form onSubmit={handleConnectTelegram} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {activeTg ? 'Cập nhật lại Telegram Bot Token mới:' : 'Nhập Telegram Bot Token:'}
                  </label>
                  <input
                    type="password"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="Ví dụ: 7891234567:AAFn_k..."
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">Webhook URL tự động đăng ký:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tgWebhookUrl, 'Telegram Webhook URL')}
                      className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <code className="text-[11px] text-gray-700 block bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 truncate">
                    {tgWebhookUrl}
                  </code>
                </div>

                <button
                  type="submit"
                  disabled={connectingTg || !telegramToken.trim()}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${connectingTg ? 'animate-spin' : ''}`} />
                  <span>{connectingTg ? 'Đang xác thực & đăng ký Webhook...' : 'Lưu Token & Kích Hoạt Tự Động (1-Click)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: META */}
          {activeTab === 'META' && (
            <div className="space-y-4 text-xs">
              {activeMeta ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">{activeMeta.accountName || 'Facebook Fanpage'}</p>
                        <p className="text-[11px] text-emerald-700 font-mono">Page ID: {activeMeta.pageId || 'Đã liên kết'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sẵn Sàng Nhận Tin Nhắn
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                    <button
                      type="button"
                      onClick={() => handleSimulateInbound('META')}
                      disabled={simulating}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                      <span>{simulating ? 'Đang gửi...' : '⚡ Thử nghiệm nhận tin nhắn thật từ Facebook'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('META')}
                      disabled={disconnecting === 'META'}
                      className="py-1.5 px-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Ngắt</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Direct Form Connection */}
              <form onSubmit={handleConnectMeta} className="space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80">
                <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Kết nối trực tiếp Facebook Fanpage & Messenger:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Facebook Page ID (*):</label>
                    <input
                      type="text"
                      value={metaPageId}
                      onChange={(e) => setMetaPageId(e.target.value)}
                      placeholder="VD: 108294719283"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Tên Page hiển thị:</label>
                    <input
                      type="text"
                      value={metaPageName}
                      onChange={(e) => setMetaPageName(e.target.value)}
                      placeholder="VD: Topify Fashion Official"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Page Access Token:</label>
                  <input
                    type="password"
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                    placeholder="Nhập Page Access Token từ Meta Developers"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={connectingMeta || !metaPageId.trim()}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{connectingMeta ? 'Đang lưu...' : 'Lưu & Kích Hoạt Page (Nhận tin nhắn thật)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openMetaOAuth}
                    className="py-2 px-3 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Đăng nhập qua Facebook Login"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>OAuth</span>
                  </button>
                </div>
              </form>

              {/* Webhook Configuration Guide */}
              <div className="space-y-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <p className="font-semibold text-blue-900 text-[11px]">Thông số Webhook Meta Developers (Nhận tin nhắn thời gian thực):</p>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-gray-600 text-[11px]">Callback URL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metaWebhookUrl, 'Callback URL')}
                      className="text-blue-600 font-semibold text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </button>
                  </div>
                  <code className="block bg-white border border-gray-200 px-2 py-1 rounded text-[10px] text-gray-800 truncate font-mono">
                    {metaWebhookUrl}
                  </code>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-gray-600 text-[11px]">Verify Token (Mã xác minh):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('topify_meta_verify_token', 'Verify Token')}
                      className="text-blue-600 font-semibold text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </button>
                  </div>
                  <code className="block bg-white border border-gray-200 px-2 py-1 rounded text-[10px] font-mono text-gray-800">
                    topify_meta_verify_token
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ZALO */}
          {activeTab === 'ZALO' && (
            <div className="space-y-4 text-xs">
              {activeZalo ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">{activeZalo.accountName || 'Zalo Official Account'}</p>
                        <p className="text-[11px] text-emerald-700 font-mono">OA ID: {activeZalo.zaloOaId || 'Đã liên kết'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sẵn Sàng Nhận Tin Nhắn
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                    <button
                      type="button"
                      onClick={() => handleSimulateInbound('ZALO')}
                      disabled={simulating}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                      <span>{simulating ? 'Đang gửi...' : '⚡ Thử nghiệm nhận tin nhắn thật từ Zalo OA'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('ZALO')}
                      disabled={disconnecting === 'ZALO'}
                      className="py-1.5 px-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Ngắt</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Direct Form Connection */}
              <form onSubmit={handleConnectZalo} className="space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80">
                <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-600" />
                  Kết nối Zalo Official Account (Zalo OA):
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Zalo OA ID (*):</label>
                    <input
                      type="text"
                      value={zaloOaId}
                      onChange={(e) => setZaloOaId(e.target.value)}
                      placeholder="VD: 3456789102"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Tên OA hiển thị:</label>
                    <input
                      type="text"
                      value={zaloOaName}
                      onChange={(e) => setZaloOaName(e.target.value)}
                      placeholder="VD: CSKH Topify Official"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">OA Access Token:</label>
                  <input
                    type="password"
                    value={zaloAccessToken}
                    onChange={(e) => setZaloAccessToken(e.target.value)}
                    placeholder="Nhập Access Token từ Zalo Developers"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={connectingZalo || !zaloOaId.trim()}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{connectingZalo ? 'Đang lưu...' : 'Lưu & Kích Hoạt Zalo OA (Nhận tin nhắn thật)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openZaloOAuth}
                    className="py-2 px-3 rounded-xl border border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Đăng nhập qua Zalo Login"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>OAuth</span>
                  </button>
                </div>
              </form>

              {/* Webhook Guide */}
              <div className="space-y-2 p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl">
                <p className="font-semibold text-cyan-900 text-[11px]">Webhook URL Zalo Developers:</p>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-gray-600 text-[11px]">Webhook Callback:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(zaloWebhookUrl, 'Zalo Webhook URL')}
                      className="text-cyan-600 font-semibold text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </button>
                  </div>
                  <code className="block bg-white border border-gray-200 px-2 py-1 rounded text-[10px] text-gray-800 truncate font-mono">
                    {zaloWebhookUrl}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <p className="text-[11px] text-gray-500">
            Kênh sau khi kết nối sẽ tự động nhận và đồng bộ tin nhắn khách hàng vào Hộp thư hợp nhất.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
