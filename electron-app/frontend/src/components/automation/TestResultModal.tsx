import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Info, 
  Zap, 
  ArrowRight,
  MessageSquare,
  Tag,
  Users,
  CheckSquare,
  Clock,
  Bell,
  RotateCw
} from 'lucide-react';

export interface TestResultData {
  success: boolean;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  matched: boolean;
  message: string;
  purpose: string;
  diagnostic: {
    ruleId: string;
    ruleName: string;
    isActive: boolean;
    triggerType: string;
    testPayload: Record<string, any>;
    isMatched: boolean;
    results: Array<{
      condition: {
        field: string;
        operator: string;
        value: any;
      };
      matched: boolean;
      actualValue: string;
      expectedValue: string;
      reason: string;
    }>;
    failedConditions: Array<{
      condition: {
        field: string;
        operator: string;
        value: any;
      };
      matched: boolean;
      actualValue: string;
      expectedValue: string;
      reason: string;
    }>;
    skipReason?: string;
    howToPass?: string;
    executedActions: Array<{
      type: string;
      timestamp: string;
      sentMessage?: string;
      recipient?: string;
      appliedTag?: string;
      createdLead?: any;
      createdTask?: any;
      notification?: any;
    }>;
  };
  log?: any;
}

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResultData | null;
  onRunAutoMatchTest: () => Promise<void>;
  isReRunning: boolean;
  onViewLogs: () => void;
}

export function TestResultModal({
  isOpen,
  onClose,
  result,
  onRunAutoMatchTest,
  isReRunning,
  onViewLogs,
}: TestResultModalProps) {
  if (!isOpen || !result) return null;

  const isSuccess = result.status === 'SUCCESS';
  const diag = result.diagnostic;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
          isSuccess 
            ? 'bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 border-emerald-100' 
            : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border-amber-100'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isSuccess ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                  isSuccess 
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100/80 text-amber-800 border-amber-300'
                }`}>
                  {isSuccess ? '✅ KÍCH HOẠT THÀNH CÔNG' : '⚠️ ĐÃ BỎ QUA (SKIPPED)'}
                </span>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  #{diag?.ruleId?.length > 14 ? `${diag.ruleId.slice(0, 7)}...${diag.ruleId.slice(-4)}` : diag?.ruleId}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {isSuccess 
                  ? `Kịch bản "${diag?.ruleName}" đã chạy thử thành công` 
                  : `Kịch bản "${diag?.ruleName}" đã bỏ qua (Không thỏa điều kiện)`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Purpose Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80 flex items-start gap-2.5 text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-blue-950">Mục đích kiểm tra kịch bản (Test Trigger):</p>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                {result.purpose}
              </p>
            </div>
          </div>

          {/* Section: Test Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                Dữ liệu mẫu đã dùng để thử nghiệm (Test Payload):
              </span>
              <span className="text-[11px] text-gray-400">Giả lập sự kiện từ MXH</span>
            </div>
            
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px] font-medium">Kênh phát sinh:</span>
                  <span className="font-semibold text-gray-800">{diag?.testPayload?.channel || 'FACEBOOK'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px] font-medium">Người gửi:</span>
                  <span className="font-semibold text-gray-800">{diag?.testPayload?.author || 'Khách hàng thử nghiệm'}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200/60 space-y-1">
                <span className="text-gray-400 block text-[10px] font-medium">Nội dung sự kiện (text):</span>
                <p className="font-mono text-gray-800 bg-gray-50/80 p-2 rounded-lg border border-gray-100 text-[11px] break-words">
                  "{diag?.testPayload?.text || ''}"
                </p>
              </div>
            </div>
          </div>

          {/* Section: Condition Evaluation Results */}
          <div className="space-y-2">
            <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              Chi tiết đối soát điều kiện lọc ({diag?.results?.length || 0} điều kiện):
            </span>

            {(!diag?.results || diag.results.length === 0) ? (
              <div className="p-3 bg-gray-50 rounded-xl text-gray-500 italic text-[11px]">
                Kịch bản không có điều kiện lọc, tự động thỏa mãn mọi sự kiện.
              </div>
            ) : (
              <div className="space-y-2">
                {diag.results.map((r, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                      r.matched 
                        ? 'bg-emerald-50/40 border-emerald-200/80' 
                        : 'bg-amber-50/40 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {r.matched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="text-gray-900">
                          Điều kiện {idx + 1}: [{r.condition.field}] {r.condition.operator} "{r.expectedValue}"
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.matched ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.matched ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </div>

                    <div className="text-gray-600 pl-5 text-[11px] leading-relaxed">
                      {r.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: How to Pass (if skipped) or Executed Actions (if success) */}
          {!isSuccess ? (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                Cách để kịch bản kích hoạt thành công:
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                {diag?.howToPass}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hành động đã được thực thi ({diag?.executedActions?.length || 0}):
              </span>
              <div className="space-y-1.5">
                {(diag?.executedActions || []).map((act, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Hành động {idx + 1}: {act.type}
                    </span>
                    <span className="text-emerald-700 truncate max-w-[280px]">
                      {act.sentMessage || act.appliedTag || act.createdLead?.status || act.createdTask?.title || 'Đã thực thi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={onViewLogs}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Xem nhật ký (Logs)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isSuccess && (
              <button
                onClick={onRunAutoMatchTest}
                disabled={isReRunning}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isReRunning ? 'animate-spin' : ''}`} />
                <span>Chạy Thử Khớp Điều Kiện (100% Pass)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-700 font-semibold text-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
