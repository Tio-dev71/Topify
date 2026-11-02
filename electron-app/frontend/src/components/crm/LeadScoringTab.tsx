import { useState } from 'react';
import {
  Flame,
  Zap,
  Snowflake,
  RefreshCw,
  User,
  Info,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  Filter,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerItem } from '../../pages/Customers';

export default function LeadScoringTab({
  customers = [],
  onRecalculate,
  onSeedDemo,
  onViewDetail,
  seeding = false,
}: {
  customers: CustomerItem[];
  onRecalculate: () => void;
  onSeedDemo: () => void;
  onViewDetail: (c: CustomerItem) => void;
  seeding?: boolean;
}) {
  const [filterTemp, setFilterTemp] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL');
  const [selectedScoreCust, setSelectedScoreCust] = useState<CustomerItem | null>(null);

  const hotCustomers = customers.filter(c => c.temperature === 'HOT');
  const warmCustomers = customers.filter(c => c.temperature === 'WARM');
  const coldCustomers = customers.filter(c => c.temperature === 'COLD');

  const filteredList = customers.filter(c => {
    if (filterTemp === 'ALL') return true;
    return c.temperature === filterTemp;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono">
              Tính năng F100
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Chấm Điểm Khách Hàng Tiềm Năng (Lead Scoring)</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Tự động đánh giá tiềm năng (0 - 100đ) và phân loại độ nóng theo 3 tiêu chuẩn: Hồ sơ đầy đủ (30đ), Tương tác thực tế (30đ), và Lịch sử mua hàng (40đ).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-2xs"
            title="Nạp 5 khách hàng mẫu để kiểm tra thuật toán chấm điểm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Nạp mẫu test F100/F101</span>
          </button>

          <button
            onClick={onRecalculate}
            className="btn-primary h-9 flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Chấm điểm lại toàn bộ</span>
          </button>
        </div>
      </div>

      {/* 3 Core Scoring Criteria Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-100/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">1. Hồ sơ đầy đủ</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
              Tối đa 30đ
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Họ và tên (+10đ), Số điện thoại chuẩn (+10đ), Email hợp lệ (+10đ). Khách có đủ liên hệ dễ dàng chăm sóc.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-100/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">2. Tương tác thực tế</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
              Tối đa 30đ
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Có tin nhắn hỏi mua, hỏi giá sỉ, tư vấn sản phẩm qua Hộp thư hợp nhất hoặc ghi chú nhu cầu rõ ràng (+30đ).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">3. Lịch sử mua hàng</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              Tối đa 40đ
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Đã có giao dịch hoặc đơn hàng thành công trong hệ thống CRM (+40đ). Khách hàng trả tiền là lead uy tín nhất.
          </p>
        </div>
      </div>

      {/* Temperature Stats & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterTemp(filterTemp === 'HOT' ? 'ALL' : 'HOT')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all shadow-2xs ${
            filterTemp === 'HOT' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              HOT Leads (≥ 70đ)
            </span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Ưu tiên chốt ngay
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{hotCustomers.length}</div>
        </div>

        <div
          onClick={() => setFilterTemp(filterTemp === 'WARM' ? 'ALL' : 'WARM')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all shadow-2xs ${
            filterTemp === 'WARM' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              WARM Leads (40 - 69đ)
            </span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Tiềm năng, chăm sóc
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{warmCustomers.length}</div>
        </div>

        <div
          onClick={() => setFilterTemp(filterTemp === 'COLD' ? 'ALL' : 'COLD')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all shadow-2xs ${
            filterTemp === 'COLD' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-blue-500" />
              COLD Leads (&lt; 40đ)
            </span>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Mới / Cần nuôi dưỡng
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{coldCustomers.length}</div>
        </div>
      </div>

      {/* Scoring Ranking Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-xs text-gray-900">
              Bảng Xếp Hạng Tiềm Năng Khách Hàng (Tổng {filteredList.length} hồ sơ)
            </h3>
          </div>

          <div className="text-[11px] text-gray-500">
            {filterTemp !== 'ALL' && (
              <button onClick={() => setFilterTemp('ALL')} className="text-indigo-600 font-semibold hover:underline">
                Bỏ lọc ({filterTemp})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Khách hàng / Kênh</th>
                <th className="py-3 px-4 text-center">Hồ sơ (Max 30)</th>
                <th className="py-3 px-4 text-center">Tương tác (Max 30)</th>
                <th className="py-3 px-4 text-center">Đơn hàng (Max 40)</th>
                <th className="py-3 px-4 text-center">Điểm F100</th>
                <th className="py-3 px-4 text-center">Xếp loại</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map((c) => {
                const profileScore = c.breakdown?.profileScore ?? ((c.name ? 10 : 0) + (c.phone ? 10 : 0) + (c.email ? 10 : 0));
                const engagementScore = c.breakdown?.engagementScore ?? 0;
                const dealScore = c.dealsCount > 0 ? 40 : 0;

                return (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{c.name || 'Khách chưa đặt tên'}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase text-[9px] px-1 bg-gray-100 text-gray-600 rounded font-mono">
                          {c.source || 'MANUAL'}
                        </span>
                        {c.phone && <span>• {c.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-blue-700">
                      {profileScore}/30
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-amber-700">
                      {engagementScore}/30
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-700">
                      {dealScore}/40
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-bold font-mono text-sm text-gray-900">
                        {c.leadScore}/100
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {c.temperature === 'HOT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          HOT 🔥
                        </span>
                      )}
                      {c.temperature === 'WARM' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          WARM ⚡
                        </span>
                      )}
                      {c.temperature === 'COLD' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          COLD ❄️
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewDetail(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition inline-flex items-center gap-1"
                        title="Xem chi tiết phân tích điểm F100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
