import React, { useState, useEffect } from 'react';
import {
  Webhook as WebhookIcon,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Edit2,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  X,
  RotateCcw,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface WebhookItem {
  id: string;
  name: string;
  endpointUrl: string;
  secret: string;
  subscribedEvents: string[];
  status: 'ACTIVE' | 'DISABLED';
  lastDeliveredAt?: string;
  successRate: number;
  totalDelivered: number;
  createdAt: string;
}

interface WebhookLogItem {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  statusCode: number;
  responseBody: string;
  attemptCount: number;
  deliveredAt: string;
  durationMs: number;
}

export default function WebhooksTab() {
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh-1',
      name: 'N8N Automation Event Pipeline',
      endpointUrl: 'https://webhook.n8n.cloud/webhook/topify-lead-listener',
      secret: 'whsec_a89f28bc91024e837190adce81938b81',
      subscribedEvents: ['lead.created', 'post.published'],
      status: 'ACTIVE',
      lastDeliveredAt: new Date(Date.now() - 1200000).toISOString(),
      successRate: 99.4,
      totalDelivered: 1240,
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'wh-2',
      name: 'Telegram Emergency Alert Bot',
      endpointUrl: 'https://api.telegram.org/bot7281928:AAH9281/sendMessage',
      secret: 'whsec_99182371892019481726354182903847',
      subscribedEvents: ['order.paid', 'alert.critical'],
      status: 'ACTIVE',
      lastDeliveredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      successRate: 100,
      totalDelivered: 580,
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    },
  ]);

  const [logs, setLogs] = useState<WebhookLogItem[]>([
    {
      id: 'log-1',
      webhookId: 'wh-1',
      event: 'lead.created',
      payload: '{"id":"lead_102","name":"Nguyễn Anh Tuấn","source":"LANDING_PAGE"}',
      statusCode: 200,
      responseBody: '{"ok":true,"received":true}',
      attemptCount: 1,
      deliveredAt: new Date(Date.now() - 1200000).toISOString(),
      durationMs: 42,
    },
    {
      id: 'log-2',
      webhookId: 'wh-1',
      event: 'post.published',
      payload: '{"id":"post_98","channels":["FACEBOOK","TIKTOK"]}',
      statusCode: 504,
      responseBody: '{"error":"Gateway Timeout after 30s"}',
      attemptCount: 1,
      deliveredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      durationMs: 30000,
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['lead.created', 'post.published']);

  // Edit Modal
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editEvents, setEditEvents] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');

  const availableEvents = [
    { id: 'lead.created', label: 'Lead CRM mới được thu thập' },
    { id: 'lead.updated', label: 'Trạng thái lead CRM thay đổi' },
    { id: 'post.published', label: 'Bài viết đăng thành công đa kênh' },
    { id: 'post.failed', label: 'Đăng bài gặp lỗi hoặc hết hạn token' },
    { id: 'order.paid', label: 'Đơn hàng phát sinh thanh toán' },
    { id: 'task.completed', label: 'Nhiệm vụ công việc hoàn thành' },
    { id: 'alert.critical', label: 'Cảnh báo đăng nhập & bảo mật nghiêm trọng' },
  ];

  useEffect(() => {
    const cached = localStorage.getItem('topify_sec_webhooks');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.webhooks) setWebhooks(parsed.webhooks);
        if (parsed.logs) setLogs(parsed.logs);
      } catch {}
    }
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/webhooks');
      if (res.data?.webhooks) {
        setWebhooks(res.data.webhooks);
        if (res.data.logs) setLogs(res.data.logs);
        localStorage.setItem(
          'topify_sec_webhooks',
          JSON.stringify({ webhooks: res.data.webhooks, logs: res.data.logs })
        );
      }
    } catch (e) {
      console.warn('Using cached webhooks');
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

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpointUrl.trim()) {
      toast.error('Vui lòng nhập tên và Endpoint URL');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sự kiện để lắng nghe');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/security/webhooks', {
        action: 'create',
        name: name.trim(),
        endpointUrl: endpointUrl.trim(),
        subscribedEvents: selectedEvents,
      });

      if (res.data?.success) {
        toast.success('Đã tạo Webhook mới với chữ ký HMAC-SHA256!');
        setShowCreateModal(false);
        setName('');
        setEndpointUrl('');
        fetchWebhooks();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo Webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setTestingId(webhookId);
      const res = await api.post('/security/webhooks', {
        action: 'test_ping',
        webhookId,
      });
      if (res.data?.success) {
        toast.success(`Đã gửi sự kiện test ping! Mã HTTP trả về: ${res.data.pingResult?.statusCode || 200}`);
        fetchWebhooks();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi gửi test webhook');
    } finally {
      setTestingId(null);
    }
  };

  const handleRetryLog = async (logId: string) => {
    try {
      setRetryingId(logId);
      const res = await api.post('/security/webhooks', {
        action: 'retry',
        logId,
      });
      if (res.data?.success) {
        toast.success('Đã gửi lại gói tin thành công!');
        fetchWebhooks();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi gửi lại gói tin');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Webhook này không?')) return;
    try {
      setLoading(true);
      const res = await api.post('/security/webhooks', {
        action: 'delete',
        webhookId,
      });
      if (res.data?.success) {
        toast.success('Đã xóa Webhook thành công!');
        fetchWebhooks();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi xóa Webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebhook) return;
    try {
      setLoading(true);
      const res = await api.post('/security/webhooks', {
        action: 'update',
        webhookId: editingWebhook.id,
        name: editName.trim(),
        endpointUrl: editUrl.trim(),
        subscribedEvents: editEvents,
        status: editStatus,
      });
      if (res.data?.success) {
        toast.success('Đã cập nhật Webhook thành công!');
        setEditingWebhook(null);
        fetchWebhooks();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi cập nhật Webhook');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditEvents((prev) =>
        prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );
    } else {
      setSelectedEvents((prev) =>
        prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <WebhookIcon className="w-5 h-5 text-purple-600" />
            Cấu Hình Webhook Đẩy Dữ Liệu (Webhook Delivery)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bắn sự kiện real-time sang N8N, Zapier, Make hoặc máy chủ riêng của bạn kèm chữ ký HMAC-SHA256 bảo vệ dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWebhooks}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setName('');
              setEndpointUrl('');
              setSelectedEvents(['lead.created', 'post.published']);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Webhook Mới
          </button>
        </div>
      </div>

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 gap-4">
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-purple-300 dark:hover:border-purple-800/60 transition"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{wh.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      wh.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {wh.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM TẮT'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono">Endpoint:</span>
                  <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200">
                    {wh.endpointUrl}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestWebhook(wh.id)}
                  disabled={testingId === wh.id}
                  className="px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testingId === wh.id ? 'animate-pulse' : ''}`} />
                  {testingId === wh.id ? 'Đang gửi...' : 'Gửi Test Payload'}
                </button>
                <button
                  onClick={() => {
                    setEditingWebhook(wh);
                    setEditName(wh.name);
                    setEditUrl(wh.endpointUrl);
                    setEditEvents([...wh.subscribedEvents]);
                    setEditStatus(wh.status);
                  }}
                  className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Sửa webhook"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Xóa webhook"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Signing Secret & Events */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Khóa Ký Chữ Ký HMAC-SHA256 (Signing Secret):
                </span>
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold flex-1 truncate">
                    {wh.secret}
                  </code>
                  <button
                    onClick={() => handleCopy(wh.secret, wh.id)}
                    className="p-1.5 text-slate-500 hover:text-purple-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Sao chép Secret"
                  >
                    {copiedId === wh.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Header kèm theo: <code>X-Topify-Signature</code> để phía nhận xác minh tính toàn vẹn gói tin.
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Sự Kiện Đăng Ký ({wh.subscribedEvents.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {wh.subscribedEvents.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[11px] font-mono"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>Tỉ lệ gửi thành công: <strong className="text-emerald-600">{wh.successRate}%</strong></span>
                  <span>•</span>
                  <span>Tổng: <strong>{wh.totalDelivered}</strong> lần gửi</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DELIVERY LOGS & RETRY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Nhật Ký Bắn Webhook & Cơ Chế Thử Lại (Delivery Logs & Retry)
            </h4>
          </div>
          <span className="text-xs text-slate-500">Tự động retry 3 lần theo thuật toán Exponential Backoff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Sự kiện</th>
                <th className="py-2.5 px-3">Mã HTTP</th>
                <th className="py-2.5 px-3">Thời gian phản hồi</th>
                <th className="py-2.5 px-3">Payload gửi đi</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {logs.map((lg) => {
                const isSuccess = lg.statusCode >= 200 && lg.statusCode < 300;
                return (
                  <tr key={lg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(lg.deliveredAt).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                        {lg.event}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {lg.statusCode} {isSuccess ? 'OK' : 'ERROR'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {lg.durationMs}ms
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {lg.payload}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {!isSuccess && (
                        <button
                          onClick={() => handleRetryLog(lg.id)}
                          disabled={retryingId === lg.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/40 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === lg.id ? 'animate-spin' : ''}`} />
                          {retryingId === lg.id ? 'Đang gửi...' : 'Thử lại ngay'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <WebhookIcon className="w-5 h-5 text-purple-600" />
                Đăng Ký Webhook Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tên Webhook *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: N8N Sync CRM Lead"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Endpoint URL (HTTPS) *</label>
                <input
                  type="url"
                  required
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn Sự Kiện Lắng Nghe:
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id, false)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{ev.id}</span>
                      <span className="text-slate-500 dark:text-slate-400">({ev.label})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Tạo Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Cập Nhật Webhook</h3>
              <button onClick={() => setEditingWebhook(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateWebhook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tên Webhook</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng Thái</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">ACTIVE (Đang bật nhận tin)</option>
                  <option value="DISABLED">DISABLED (Tạm tắt)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sự Kiện Lắng Nghe:</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-1">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={editEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id, true)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{ev.id}</span>
                      <span className="text-slate-500">({ev.label})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWebhook(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm"
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

