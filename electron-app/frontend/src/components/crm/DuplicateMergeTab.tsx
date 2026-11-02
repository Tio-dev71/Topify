import { useState } from 'react';
import {
  GitMerge,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export interface DuplicateGroupItem {
  groupId: string;
  matchType: 'PHONE' | 'EMAIL' | 'FUZZY_NAME';
  matchKey: string;
  confidence: number;
  customerIds: string[];
  customers: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    source: string | null;
    createdAt: string;
    dealsCount: number;
  }>;
}

export default function DuplicateMergeTab({
  duplicateGroups = [],
  loading = false,
  onScanDuplicates,
  onOpenMergeModal,
  onSeedDemo,
  seeding = false,
}: {
  duplicateGroups: DuplicateGroupItem[];
  loading?: boolean;
  onScanDuplicates: () => void;
  onOpenMergeModal: (group: DuplicateGroupItem) => void;
  onSeedDemo: () => void;
  seeding?: boolean;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono">
              Tính năng F101
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-amber-600" />
              <span>Phát Hiện Trùng & Hợp Nhất Hồ Sơ Có Kiểm Soát (F101)</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Tự động rà quét các hồ sơ bị trùng lặp do nhắn tin từ nhiều kênh khác nhau (TikTok, Facebook, Zalo); cung cấp giao diện đối chiếu 2 cột và gộp dữ liệu Deals, Tin nhắn an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-2xs"
            title="Nạp mẫu khách hàng trùng SĐT để kiểm thử"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Nạp mẫu test F101</span>
          </button>

          <button
            onClick={onScanDuplicates}
            disabled={loading}
            className="btn-primary h-9 flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Quét hồ sơ trùng ngay</span>
          </button>
        </div>
      </div>

      {/* Rules Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 shadow-2xs space-y-1.5">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Trùng lặp tuyệt đối (100% Khớp)
          </span>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Phát hiện khi hai hồ sơ có <strong>cùng số điện thoại</strong> (đã chuẩn hóa bỏ tiền tố +84/0) hoặc <strong>cùng địa chỉ Email</strong>. Cảnh báo tự động ngăn tạo rác ngay khi thêm mới.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 shadow-2xs space-y-1.5">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Trùng lặp tương đối (Fuzzy Matching &gt; 80%)
          </span>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Phát hiện khi trùng họ tên (chuẩn hóa không dấu tiếng Việt) kết hợp với cùng social handle hoặc cùng địa chỉ nhằm tránh bỏ sót khách đổi số điện thoại.
          </p>
        </div>
      </div>

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
            Danh Sách Nhóm Nghi Ngờ Trùng Lặp ({duplicateGroups.length} nhóm)
          </h3>
          <span className="text-[11px] text-gray-400">
            Dữ liệu được cô lập an toàn trong phạm vi Workspace
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Đang rà quét toàn bộ cơ sở dữ liệu CRM...</div>
        ) : duplicateGroups.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl p-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-gray-800 text-sm">Cơ sở dữ liệu sạch, không phát hiện trùng lặp!</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Tất cả các hồ sơ khách hàng trong workspace đều có SĐT và Email độc bản. Bạn có thể bấm "Nạp mẫu test F101" để kiểm thử luồng hợp nhất.
            </p>
            <button
              onClick={onSeedDemo}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <span>Nạp 5 mẫu test có hồ sơ trùng</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {duplicateGroups.map((group, idx) => (
              <div
                key={group.groupId || idx}
                className="bg-white rounded-2xl border border-amber-200 shadow-2xs p-5 space-y-3.5 hover:border-amber-400 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⚠️ Nhóm trùng #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-gray-900">
                      {group.matchType === 'PHONE' && `Trùng Số điện thoại: ${group.matchKey}`}
                      {group.matchType === 'EMAIL' && `Trùng Email: ${group.matchKey}`}
                      {group.matchType === 'FUZZY_NAME' && `Tên tương đồng: ${group.matchKey}`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono">
                      Độ tin cậy: {group.confidence}%
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenMergeModal(group)}
                    className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Đối chiếu &amp; Hợp nhất hồ sơ</span>
                  </button>
                </div>

                {/* Candidate Customer Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.customers.map((c, cIdx) => (
                    <div
                      key={c.id || cIdx}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{c.name || 'Khách chưa đặt tên'}</span>
                        <span className="text-[9px] px-1.5 py-0.2 uppercase rounded bg-gray-200 text-gray-700 font-mono">
                          {c.source || 'MANUAL'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 space-y-0.5">
                        {c.phone && <div className="font-mono">SĐT: {c.phone}</div>}
                        {c.email && <div>Email: {c.email}</div>}
                        <div>Đơn hàng / Deals: <strong>{c.dealsCount || 0}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
