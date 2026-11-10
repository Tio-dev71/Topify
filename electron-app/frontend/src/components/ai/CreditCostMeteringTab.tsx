import React, { useState, useEffect } from 'react';
import {
  Coins,
  DollarSign,
  TrendingUp,
  Cpu,
  Users,
  RefreshCw,
  Zap,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface ModuleUsageStat {
  moduleId: string;
  moduleName: string;
  tokensUsed: number;
  creditsUsed: number;
  costVnd: number;
  costUsd: number;
  percentage: number;
}

interface UserUsageStat {
  userId: string;
  userName: string;
  email: string;
  role: string;
  tokensUsed: number;
  creditsUsed: number;
  requestsCount: number;
}

interface UsageLogItem {
  id: string;
  timestamp: string;
  userName: string;
  moduleId: string;
  moduleName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  creditsDeducted: number;
  costVnd: number;
  status: 'SUCCESS' | 'RATE_LIMITED' | 'FAILED';
}

interface MeteringData {
  quota: {
    totalAllocatedCredits: number;
    usedCredits: number;
    remainingCredits: number;
    usagePercent: number;
    resetDate: string;
    costSummary: {
      vnd: number;
      usd: number;
    };
  };
  moduleStats: ModuleUsageStat[];
  userStats: UserUsageStat[];
  logs: UsageLogItem[];
}

const STORAGE_KEY = 'topify_ai_credit_cache';

export const CreditCostMeteringTab: React.FC = () => {
  const [data, setData] = useState<MeteringData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);

  const fetchMeteringData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/credit-metering');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      }
    } catch (err: any) {
      console.warn('Fallback loading credit metering from cache:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeteringData();
  }, []);

  const handleTestMetering = async () => {
    try {
      setTesting(true);
      const randomModules = [
        { id: 'F159', name: 'AI Campaign Planner', p: 850, c: 1400 },
        { id: 'F160', name: 'AI Analytics Copilot', p: 620, c: 980 },
        { id: 'F157', name: 'AI Write / Rewrite', p: 450, c: 750 },
        { id: 'F161', name: 'AI Safety & Moderation', p: 300, c: 500 },
      ];
      const selected = randomModules[Math.floor(Math.random() * randomModules.length)];

      const res = await api.post('/ai/credit-metering', {
        moduleId: selected.id,
        moduleName: selected.name,
        promptTokens: selected.p,
        completionTokens: selected.c,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Đã ghi nhận tiêu thụ credit thành công!');
        fetchMeteringData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi ghi nhận kiểm tra tiêu thụ');
    } finally {
      setTesting(false);
    }
  };

  const quota = data?.quota;
  const moduleStats = data?.moduleStats || [];
  const userStats = data?.userStats || [];
  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/30 text-amber-300 border border-amber-400/30">
                PHÂN HỆ M14 • F162
              </span>
              <span className="text-xs text-amber-200">AI Credit & Cost Metering</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              Đo Lường Hạn Mức Tín Dụng & Chi Phí AI (Metering Engine)
            </h2>
            <p className="text-sm text-amber-100/90 mt-1 max-w-2xl">
              Hệ thống giám sát định lượng tokens, số credits tiêu thụ theo từng phân hệ chức năng (F156–F161), phân rã chi phí chi tiết theo tài khoản nhân sự và quy đổi chi phí VNĐ/USD minh bạch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestMetering}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              ⚡ Kiểm Tra Tiêu Thụ Thử
            </button>
            <button
              onClick={fetchMeteringData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới dữ liệu tiêu thụ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Quota Progress & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Quota Progress */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />
              Hạn Mức Tín Dụng Workspace (Monthly Quota)
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Gói Doanh Nghiệp Pro
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {quota ? quota.usedCredits.toLocaleString('vi-VN') : '0'}
            </span>
            <span className="text-sm text-gray-400 font-medium">
              / {quota ? quota.totalAllocatedCredits.toLocaleString('vi-VN') : '500,000'} credits
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (quota?.usagePercent || 0) > 85
                  ? 'bg-rose-500'
                  : (quota?.usagePercent || 0) > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, quota?.usagePercent || 5)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Đã dùng: <strong>{quota?.usagePercent || 1}%</strong></span>
            <span>Còn lại: <strong className="text-emerald-600">{quota ? quota.remainingCredits.toLocaleString('vi-VN') : '495,000'}</strong> credits</span>
            <span className="text-gray-400">{quota?.resetDate || 'Hết hạn vào 30/11/2026'}</span>
          </div>
        </div>

        {/* Card 2: Cost Summary in VND */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-medium">Chi Phí Quy Đổi (VNĐ)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {quota ? `${quota.costSummary.vnd.toLocaleString('vi-VN')} đ` : '0 đ'}
            </div>
          </div>
          <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-2">
            Đơn giá tiêu chuẩn: ~0.05đ / token (~50đ / 1,000 tokens)
          </div>
        </div>

        {/* Card 3: Cost Summary in USD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-medium">Chi Phí Tương Đương (USD)</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${quota ? quota.costSummary.usd.toFixed(4) : '0.0000'}
            </div>
          </div>
          <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-2">
            Mô hình đa tầng: GPT-4o-mini & Claude-3.5
          </div>
        </div>
      </div>

      {/* 2-Section Grid: Module Breakdown & User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              1. Phân Bổ Tiêu Thụ Theo Phân Hệ Tính Năng (By Module)
            </h3>
            <span className="text-xs text-gray-400">5 phân hệ cốt lõi</span>
          </div>

          <div className="space-y-3">
            {moduleStats.map((stat) => (
              <div key={stat.moduleId} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {stat.moduleId}
                    </span>
                    <span className="text-xs font-bold text-gray-800">{stat.moduleName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">
                      {stat.creditsUsed.toLocaleString('vi-VN')} credits
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      ({stat.tokensUsed.toLocaleString('vi-VN')} tokens • {stat.costVnd.toLocaleString('vi-VN')} đ)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, stat.percentage || 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              2. Tiêu Thụ Theo Nhân Sự (By Member)
            </h3>
            <span className="text-xs text-gray-400">{userStats.length} thành viên</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {userStats.map((u, uIdx) => (
              <div key={uIdx} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-gray-900">{u.userName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">{u.email}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-gray-900">
                    {u.creditsUsed.toLocaleString('vi-VN')} credits
                  </div>
                  <div className="text-[10px] text-gray-400">{u.requestsCount} lượt gọi AI</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Real-time Metering Consumption Logs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Nhật Ký Tiêu Thụ Tín Dụng Chi Tiết (Real-time Metering Logs)
          </h3>
          <span className="text-xs text-gray-400">{logs.length} sự kiện gần nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                <th className="py-2.5 px-3">Thời Gian</th>
                <th className="py-2.5 px-3">Nhân Sự</th>
                <th className="py-2.5 px-3">Phân Hệ AI</th>
                <th className="py-2.5 px-3">Prompt Token</th>
                <th className="py-2.5 px-3">Output Token</th>
                <th className="py-2.5 px-3">Tổng Token</th>
                <th className="py-2.5 px-3">Credit Khấu Trừ</th>
                <th className="py-2.5 px-3">Chi Phí (VNĐ)</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                    {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900 whitespace-nowrap">{log.userName}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {log.moduleId} • {log.moduleName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{log.promptTokens.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-gray-600">{log.completionTokens.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{log.totalTokens.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-600">-{log.creditsDeducted} credits</td>
                  <td className="py-2.5 px-3 text-emerald-600">{log.costVnd.toLocaleString('vi-VN')} đ</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
