import { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Bot, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../../lib/axios';

interface ConnectChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConnectChannelsModal({ isOpen, onClose, onSuccess }: ConnectChannelsModalProps) {
  const [activeTab, setActiveTab] = useState<'TELEGRAM' | 'META' | 'ZALO'>('TELEGRAM');
  const [telegramToken, setTelegramToken] = useState('');
  const [connectingTg, setConnectingTg] = useState(false);
  const [connectedBot, setConnectedBot] = useState<any>(null);

  if (!isOpen) return null;

  const baseUrl = getApiBaseUrl().replace('/api', '') || window.location.origin;
  const metaWebhookUrl = `${baseUrl}/api/webhooks/meta`;
  const tgWebhookUrl = `${baseUrl}/api/webhooks/telegram`;
  const zaloWebhookUrl = `${baseUrl}/api/webhooks/zalo`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

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
        setConnectedBot(res.data.bot);
        toast.success(`Kết nối thành công Bot @${res.data.bot?.username}!`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
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
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: TELEGRAM */}
          {activeTab === 'TELEGRAM' && (
            <div className="space-y-4">
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-800 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Hướng dẫn tạo Bot Telegram trong 1 phút:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sky-900/80 text-[11px]">
                  <li>Mở ứng dụng Telegram, tìm tài khoản <strong>@BotFather</strong>.</li>
                  <li>Gõ lệnh <code>/newbot</code> và làm theo hướng dẫn để đặt tên bot.</li>
                  <li>Sao chép chuỗi <strong>HTTP API Token</strong> (dạng <code>123456789:ABCdef...</code>) và dán vào ô bên dưới.</li>
                </ol>
              </div>

              {connectedBot && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">{connectedBot.name}</p>
                      <p className="text-[11px] text-emerald-600">@{connectedBot.username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Webhook Đang Hoạt Động
                  </span>
                </div>
              )}

              <form onSubmit={handleConnectTelegram} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Telegram Bot Token:
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
                    <span className="text-[11px] font-medium text-gray-500">Webhook URL hệ thống tự đăng ký:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tgWebhookUrl, 'Telegram Webhook URL')}
                      className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-1"
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
                  disabled={connectingTg}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${connectingTg ? 'animate-spin' : ''}`} />
                  <span>{connectingTg ? 'Đang xác thực & đăng ký Webhook...' : 'Lưu Token & Kích Hoạt Tự Động (1-Click)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: META */}
          {activeTab === 'META' && (
            <div className="space-y-3 text-xs">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-blue-900 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Cấu hình Webhook trên Meta Developers:
                </p>
                <p className="text-[11px] text-blue-800/80">
                  Vào trang <strong>developers.facebook.com &gt; Ứng dụng &gt; Webhooks &gt; Chọn Page</strong> và dán các thông số sau:
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600 font-medium">Callback URL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metaWebhookUrl, 'Callback URL')}
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <code className="block bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-800 truncate">
                    {metaWebhookUrl}
                  </code>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600 font-medium">Verify Token (Mã xác minh):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('topify_meta_verify_token', 'Verify Token')}
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <code className="block bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-gray-800">
                    topify_meta_verify_token
                  </code>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-medium text-gray-500 mb-1">Các sự kiện (Subscription Fields) cần tích chọn:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['messages', 'messaging_postbacks', 'message_reads', 'message_deliveries'].map((field) => (
                      <span key={field} className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ZALO */}
          {activeTab === 'ZALO' && (
            <div className="space-y-3 text-xs">
              <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-3.5 text-cyan-900 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-600" />
                  Cấu hình Webhook trên Zalo for Developers:
                </p>
                <p className="text-[11px] text-cyan-800/80">
                  Vào <strong>developers.zalo.me &gt; Ứng dụng &gt; Official Account &gt; Webhook</strong> và thiết lập:
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 font-medium">Webhook URL Zalo OA:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(zaloWebhookUrl, 'Zalo Webhook URL')}
                    className="text-cyan-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <code className="block bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-800 truncate">
                  {zaloWebhookUrl}
                </code>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-medium text-gray-500 mb-1">Sự kiện kích hoạt (Events):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['user_send_text', 'user_send_image', 'user_send_link'].map((field) => (
                    <span key={field} className="text-[10px] font-mono bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md border border-cyan-200">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
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
