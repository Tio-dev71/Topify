import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Send,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Layers,
  Sparkles,
  Download,
  ExternalLink,
  Zap,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface PublicApiEndpoint {
  id: string;
  category: 'CHANNELS' | 'CONTENT' | 'CRM' | 'TASKS' | 'ANALYTICS';
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  summary: string;
  rateLimitPerMin: number;
  sampleResponse: string;
}

export default function PublicApiTab() {
  const [loading, setLoading] = useState(false);
  const [endpoints, setEndpoints] = useState<PublicApiEndpoint[]>([
    {
      id: 'api-ch-1',
      category: 'CHANNELS',
      path: '/api/v1/channels',
      method: 'GET',
      summary: 'Lấy danh sách các kênh mạng xã hội đang kết nối và trạng thái token',
      rateLimitPerMin: 120,
      sampleResponse: '{\n  "success": true,\n  "data": [\n    {\n      "id": "ch_fb_01",\n      "platform": "FACEBOOK",\n      "name": "Topify Page"\n    }\n  ]\n}',
    },
    {
      id: 'api-cnt-1',
      category: 'CONTENT',
      path: '/api/v1/posts',
      method: 'GET',
      summary: 'Lấy danh sách bài viết đã lên lịch hoặc đã đăng thành công theo ngày',
      rateLimitPerMin: 120,
      sampleResponse: '{\n  "success": true,\n  "data": [\n    {\n      "id": "post_100",\n      "caption": "Ra mắt tính năng AI mới",\n      "status": "PUBLISHED"\n    }\n  ]\n}',
    },
    {
      id: 'api-crm-1',
      category: 'CRM',
      path: '/api/v1/crm/leads',
      method: 'POST',
      summary: 'Tạo khách hàng tiềm năng mới trực tiếp từ form landing page hoặc app ngoài',
      rateLimitPerMin: 300,
      sampleResponse: '{\n  "success": true,\n  "leadId": "lead_9921",\n  "status": "QUALIFIED"\n}',
    },
    {
      id: 'api-tsk-1',
      category: 'TASKS',
      path: '/api/v1/tasks',
      method: 'GET',
      summary: 'Tra cứu danh sách công việc theo người phụ trách và trạng thái hoàn thành',
      rateLimitPerMin: 120,
      sampleResponse: '{\n  "success": true,\n  "tasks": [\n    {\n      "id": "task_401",\n      "title": "Thiết kế banner campaign",\n      "completed": false\n    }\n  ]\n}',
    },
    {
      id: 'api-ana-1',
      category: 'ANALYTICS',
      path: '/api/v1/analytics/overview',
      method: 'GET',
      summary: 'Trích xuất số liệu tương tác, lượt tiếp cận và chuyển đổi đa kênh',
      rateLimitPerMin: 60,
      sampleResponse: '{\n  "success": true,\n  "metrics": {\n    "impressions": 145000,\n    "engagement": 8.4\n  }\n}',
    },
  ]);

  const [quotaInfo, setQuotaInfo] = useState({
    planName: 'Gói Doanh Nghiệp Pro',
    rateLimitPerMin: 300,
    monthlyQuotaRequests: 200000,
    usedRequestsThisMonth: 14250,
    remainingRequests: 185750,
    usagePercent: 7.1,
    apiBaseUrl: 'https://topify.vn/api/v1',
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEndpoint, setSelectedEndpoint] = useState<PublicApiEndpoint | null>(null);
  const [bearerToken, setBearerToken] = useState('topify_sec_live_9a8f4c2e10...');
  const [executing, setExecuting] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('topify_sec_public_api');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.endpoints) {
          setEndpoints(parsed.endpoints);
          setSelectedEndpoint(parsed.endpoints[0]);
        }
        if (parsed.quotaInfo) setQuotaInfo(parsed.quotaInfo);
      } catch {}
    }
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/public-api');
      if (res.data?.success && res.data.data) {
        setEndpoints(res.data.data.endpoints);
        setQuotaInfo(res.data.data.quotaInfo);
        if (!selectedEndpoint && res.data.data.endpoints.length > 0) {
          setSelectedEndpoint(res.data.data.endpoints[0]);
        }
        localStorage.setItem(
          'topify_sec_public_api',
          JSON.stringify({ endpoints: res.data.data.endpoints, quotaInfo: res.data.data.quotaInfo })
        );
      }
    } catch (e) {
      console.warn('Using cached api catalog');
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

  const handleRunSandbox = async () => {
    if (!selectedEndpoint) return;
    try {
      setExecuting(true);
      const res = await api.post('/security/public-api', {
        endpointPath: selectedEndpoint.path,
        method: selectedEndpoint.method,
      });
      if (res.data?.success) {
        setSandboxResult(res.data.data);
        toast.success(`API 200 OK (${res.data.data.executionTimeMs}ms)`);
      }
    } catch (e: any) {
      toast.error('Lỗi khi chạy thử nghiệm API Sandbox');
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadSpec = () => {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'Topify Public REST API',
        version: '1.0.0',
        description: 'OpenAPI Documentation for Topify Cloud Platform',
      },
      servers: [{ url: 'https://topify.vn/api/v1' }],
      paths: endpoints.reduce((acc: any, ep) => {
        acc[ep.path] = {
          [ep.method.toLowerCase()]: {
            summary: ep.summary,
            responses: {
              '200': {
                description: 'Thành công',
              },
            },
          },
        };
        return acc;
      }, {}),
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topify-openapi-spec-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống tài liệu chuẩn OpenAPI 3.0!');
  };

  const filteredEndpoints =
    selectedCategory === 'ALL'
      ? endpoints
      : endpoints.filter((e) => e.category === selectedCategory);

  const activeEp = selectedEndpoint || endpoints[0];

  return (
    <div className="space-y-6">
      {/* Quota & Usage Overview Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/80 text-xs font-semibold text-purple-200 border border-purple-700/60">
              <Sparkles className="w-3.5 h-3.5" />
              Public REST API & Webhook Gateway
            </div>
            <h2 className="text-xl font-bold">API cho Kênh, Content, CRM Leads, Tasks & Analytics</h2>
            <p className="text-xs text-purple-200 max-w-xl">
              Hệ thống cung cấp API chuẩn RESTful định dạng JSON, xác thực Bearer Token HMAC và kiểm soát Quota theo gói doanh nghiệp.
            </p>
          </div>

          <div className="md:col-span-5 bg-purple-950/60 p-4 rounded-xl border border-purple-700/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-purple-300">Hạn mức tháng ({quotaInfo.planName})</span>
              <span className="text-emerald-400 font-bold">{quotaInfo.usagePercent}% đã dùng</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-purple-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                style={{ width: `${quotaInfo.usagePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-200 font-mono">
              <span>Đã gọi: {quotaInfo.usedRequestsThisMonth.toLocaleString()} req</span>
              <span>Còn lại: {quotaInfo.remainingRequests.toLocaleString()} req</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Directory & Endpoint Selector */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Danh Mục Endpoints ({filteredEndpoints.length})
            </h3>
            <button
              onClick={handleDownloadSpec}
              className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition flex items-center gap-1 border border-purple-200 dark:border-purple-800/40"
            >
              <Download className="w-3.5 h-3.5" />
              OpenAPI JSON
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px]">
            {['ALL', 'CHANNELS', 'CONTENT', 'CRM', 'TASKS', 'ANALYTICS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL'
                  ? 'Tất cả'
                  : cat === 'CHANNELS'
                  ? 'Kênh'
                  : cat === 'CONTENT'
                  ? 'Bài viết'
                  : cat === 'CRM'
                  ? 'CRM Lead'
                  : cat === 'TASKS'
                  ? 'Tasks'
                  : 'Analytics'}
              </button>
            ))}
          </div>

          {/* Endpoint List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredEndpoints.map((ep) => {
              const isSelected = activeEp?.id === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        ep.method === 'GET'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : ep.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {ep.path}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {ep.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Sandbox Runner & Code Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Trình Giả Lập Thử Nghiệm API Trực Tiếp (Sandbox Runner)
                </h3>
              </div>
              <button
                onClick={handleRunSandbox}
                disabled={executing}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${executing ? 'animate-bounce' : ''}`} />
                {executing ? 'Đang gửi...' : '⚡ Bắn Thử Nghiệm'}
              </button>
            </div>

            {/* Request URL & Method bar */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-2 rounded-xl text-xs font-bold font-mono ${
                  activeEp?.method === 'GET'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                }`}
              >
                {activeEp?.method || 'GET'}
              </span>
              <input
                type="text"
                readOnly
                value={`https://topify.vn${activeEp?.path || '/api/v1/channels'}`}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 select-all"
              />
            </div>

            {/* Bearer Token Header */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Authorization Header (Bearer Token):
              </label>
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-purple-600 dark:text-purple-400"
              />
            </div>

            {/* cURL Command Preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>cURL Snippet:</span>
                <button
                  onClick={() =>
                    handleCopy(
                      `curl -X ${activeEp?.method} "https://topify.vn${activeEp?.path}" \\\n  -H "Authorization: Bearer ${bearerToken}" \\\n  -H "Content-Type: application/json"`,
                      'curl_copy'
                    )
                  }
                  className="hover:text-purple-600 flex items-center gap-1"
                >
                  {copiedId === 'curl_copy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Sao chép cURL
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`curl -X ${activeEp?.method || 'GET'} "https://topify.vn${activeEp?.path || '/api/v1/channels'}" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>

            {/* Sandbox Response Viewer */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  Phản hồi từ máy chủ (Response Data):
                  {sandboxResult && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold">
                      200 OK • {sandboxResult.executionTimeMs}ms
                    </span>
                  )}
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(sandboxResult?.responseBody || activeEp?.sampleResponse, null, 2),
                      'res_copy'
                    )
                  }
                  className="hover:text-purple-600 flex items-center gap-1"
                >
                  {copiedId === 'res_copy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Sao chép JSON
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                {sandboxResult
                  ? JSON.stringify(sandboxResult.responseBody, null, 2)
                  : activeEp?.sampleResponse || 'Chưa có dữ liệu'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
