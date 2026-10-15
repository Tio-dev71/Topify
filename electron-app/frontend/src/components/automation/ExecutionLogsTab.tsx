import { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  Zap, 
  AlertCircle,
  Copy,
  Check,
  X
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'SKIPPED';
  inputPayload: any;
  outputPayload: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  executionDurationMs: number;
  executedAt: string;
}

export function ExecutionLogsTab() {
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [inspectingLog, setInspectingLog] = useState<AutomationExecutionLog | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/automations/logs?status=${statusFilter}`);
      if (res.data?.logs) {
        setLogs(res.data.logs);
      }
    } catch (e: any) {
      console.error('Error fetching logs', e);
      toast.error('Không thể tải nhật ký thực thi');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (log: AutomationExecutionLog) => {
    try {
      setRetryingLogId(log.id);
      const res = await api.post('/automations/logs', { logId: log.id });
      if (res.data?.success) {
        toast.success(res.data.message || 'Thử lại lượt chạy thành công!');
        fetchLogs();
        if (inspectingLog?.id === log.id) {
          setInspectingLog(res.data.log);
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi thực hiện thử lại');
    } finally {
      setRetryingLogId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success('Đã sao chép mã Idempotency Key');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return l.ruleName.toLowerCase().includes(q) || 
      l.idempotencyKey.toLowerCase().includes(q) ||
      (l.error && l.error.toLowerCase().includes(q)) ||
      l.id.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Thất bại
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <MinusCircle className="w-3 h-3 text-gray-500" /> Đã bỏ qua
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600 animate-spin" /> Đang thử lại
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{status}</span>;
    }
  };

  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;
  const skippedCount = logs.filter(l => l.status === 'SKIPPED').length;

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Tổng lượt ghi nhận</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{logs.length}</span>
            <span className="text-xs text-gray-400">lần thực thi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <span className="text-xs font-medium text-emerald-600">Thành công (200 OK)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{successCount}</span>
            <span className="text-xs text-gray-400">
              {logs.length > 0 ? `${((successCount / logs.length) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <span className="text-xs font-medium text-rose-600">Thất bại (Cần Retry)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{failedCount}</span>
            <span className="text-xs text-rose-500">lỗi API/Rate Limit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Bỏ qua (Không khớp điều kiện)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-700">{skippedCount}</span>
            <span className="text-xs text-gray-400">lượt lọc</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo kịch bản, Idempotency key, lỗi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            {(['ALL', 'SUCCESS', 'FAILED', 'SKIPPED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st === 'ALL' ? 'Tất cả' : st === 'SUCCESS' ? 'Thành công' : st === 'FAILED' ? 'Thất bại' : 'Bỏ qua'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            title="Làm mới danh sách log"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Kịch bản (Rule)</th>
                <th className="py-3.5 px-4">Trigger</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Idempotency Key</th>
                <th className="py-3.5 px-4">Thời gian xử lý</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Đang tải nhật ký thực thi...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Không tìm thấy lượt thực thi nào phù hợp bộ lọc
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.executedAt).toLocaleString('vi-VN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 max-w-[220px] truncate">
                        {log.ruleName}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400">
                        {log.id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-gray-100 text-gray-700">
                        {log.triggerType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-600">
                        <span className="max-w-[140px] truncate">{log.idempotencyKey}</span>
                        <button
                          onClick={() => copyToClipboard(log.idempotencyKey, log.id)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 transition-colors"
                          title="Sao chép Idempotency Key"
                        >
                          {copiedKey === log.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {log.executionDurationMs}ms
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(log)}
                            disabled={retryingLogId === log.id || log.retryCount >= log.maxRetries}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Thử lại lượt chạy lỗi này"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingLogId === log.id ? 'animate-spin' : ''}`} />
                            Thử lại ({log.retryCount}/{log.maxRetries})
                          </button>
                        )}

                        <button
                          onClick={() => setInspectingLog(log)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Xem chi tiết Payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Payload Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">#{inspectingLog.id}</span>
                  {getStatusBadge(inspectingLog.status)}
                </div>
                <h3 className="text-base font-bold text-gray-900">{inspectingLog.ruleName}</h3>
              </div>
              <button 
                onClick={() => setInspectingLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Idempotency & Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-gray-500 block text-[11px]">Idempotency Key:</span>
                  <span className="font-mono font-medium text-gray-800 break-all">{inspectingLog.idempotencyKey}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Thời gian & Độ trễ:</span>
                  <span className="font-medium text-gray-800">
                    {inspectingLog.executionDurationMs}ms • {new Date(inspectingLog.executedAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Error Alert if any */}
              {inspectingLog.error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Chi tiết lỗi thực thi (Execution Error):
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed break-words">{inspectingLog.error}</p>
                </div>
              )}

              {/* Input Trigger Payload */}
              <div>
                <span className="font-semibold text-gray-700 block mb-1.5">1. Dữ liệu kích hoạt (Input Trigger Payload):</span>
                <pre className="p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingLog.inputPayload, null, 2)}
                </pre>
              </div>

              {/* Output Actions Executed */}
              <div>
                <span className="font-semibold text-gray-700 block mb-1.5">2. Kết quả hành động (Output Executed Result):</span>
                <pre className="p-3 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingLog.outputPayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              {inspectingLog.status === 'FAILED' && (
                <button
                  onClick={() => handleRetry(inspectingLog)}
                  disabled={retryingLogId === inspectingLog.id || inspectingLog.retryCount >= inspectingLog.maxRetries}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${retryingLogId === inspectingLog.id ? 'animate-spin' : ''}`} />
                  Thử lại lượt chạy này
                </button>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => setInspectingLog(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
