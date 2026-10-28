import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { auditContent, type AuditResult } from '../../lib/auditEngine';

const INITIAL_CAPTION =
  '🔥 Siêu ưu đãi mừng lễ lớn! Mua 1 tặng 1 toàn bộ sản phẩm công thái học chỉ trong hôm nay. Nhấn vào link bên dưới để nhận mã giảm giá 50% ngay! 👉 https://topify.vn/promo?utm_source=facebook&utm_medium=post #Topify #Sale #Ergonomic';
const INITIAL_LINK = 'https://topify.vn/promo?utm_source=facebook&utm_medium=post';

export function PrePublishChecklistTab() {
  const navigate = useNavigate();
  const [testCaption, setTestCaption] = useState(INITIAL_CAPTION);
  const [testLink, setTestLink] = useState(INITIAL_LINK);
  const [isAuditing, setIsAuditing] = useState(false);

  // Dynamic audit result computed from content
  const [auditResult, setAuditResult] = useState<AuditResult>(() =>
    auditContent(INITIAL_CAPTION, INITIAL_LINK)
  );

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const res = auditContent(testCaption, testLink);
      setAuditResult(res);
      setIsAuditing(false);

      if (res.score >= 80) {
        toast.success(
          `Đã hoàn tất kiểm tra chất lượng trước xuất bản! Điểm số an toàn: ${res.score}/100`
        );
      } else if (res.score >= 50) {
        toast.warning(
          `Hoàn tất kiểm tra: ${res.score}/100 (${res.passCount} Đạt, ${res.warnCount} Lưu ý, ${res.failCount} Lỗi)`
        );
      } else {
        toast.error(
          `Nội dung chưa đạt chuẩn: ${res.score}/100 (${res.failCount} Lỗi, ${res.warnCount} Lưu ý). Vui lòng hoàn thiện trước khi xuất bản.`
        );
      }
    }, 350);
  };

  const handleResetSample = () => {
    setTestCaption(INITIAL_CAPTION);
    setTestLink(INITIAL_LINK);
    const res = auditContent(INITIAL_CAPTION, INITIAL_LINK);
    setAuditResult(res);
    toast.info('Đã tải lại mẫu kiểm duyệt chuẩn.');
  };

  const wordCount = testCaption.trim() ? testCaption.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = testCaption.length;

  const scoreBadgeColor =
    auditResult.score >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : auditResult.score >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white border border-emerald-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Bộ Tiêu Chuẩn Kiểm Tra Trước Xuất Bản (Pre-Publish Checklist - F078)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rà soát toàn diện: Link & UTM tracking, độ dài, chính sách nền tảng (Policy), tỷ lệ asset và lời kêu gọi hành động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Real Score Badge */}
          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs ${scoreBadgeColor}`}
          >
            <span>Điểm an toàn:</span>
            <span className="font-mono text-sm">{auditResult.score}/100</span>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
            <span className="text-emerald-700 font-bold">{auditResult.passCount} Đạt</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-700 font-bold">{auditResult.warnCount} Lưu ý</span>
            <span className="text-gray-300">•</span>
            <span className="text-rose-700 font-bold">{auditResult.failCount} Lỗi</span>
          </div>
        </div>
      </div>

      {/* Interactive Audit Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Content input to test */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Nội dung cần kiểm duyệt
            </span>

            <button
              type="button"
              onClick={handleResetSample}
              className="text-[11px] text-gray-400 hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer font-medium"
              title="Khôi phục nội dung mẫu ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nạp mẫu</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
              <label>Caption bài viết</label>
              <span className="text-[11px] font-mono text-gray-400 font-normal">
                {wordCount} từ • {charCount} ký tự
              </span>
            </div>
            <textarea
              rows={7}
              value={testCaption}
              onChange={(e) => setTestCaption(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none font-sans shadow-2xs"
              placeholder="Dán nội dung caption vào đây để kiểm tra..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Đường dẫn đính kèm (Link & UTM)</label>
            <input
              type="text"
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              placeholder="https://yourwebsite.com/landing?utm_source=facebook"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="btn-primary py-2.5 px-4 text-xs font-semibold flex-1 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuditing ? 'Đang phân tích...' : 'Kiểm Tra Tiêu Chuẩn Ngay'}</span>
            </button>
            <button
              onClick={() => {
                navigate('/create', {
                  state: {
                    prefilledCaption: testCaption,
                    prefilledLink: testLink,
                  },
                });
              }}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Đưa sang Đăng Bài</span>
            </button>
          </div>
        </div>

        {/* Right: Dynamic Checklist Items */}
        <div className="lg:col-span-7 space-y-3">
          {auditResult.items.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-4 rounded-2xl border shadow-2xs transition space-y-2 ${
                item.status === 'FAIL'
                  ? 'border-rose-100 hover:border-rose-200'
                  : item.status === 'WARN'
                  ? 'border-amber-100 hover:border-amber-200'
                  : 'border-gray-100 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === 'PASS' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {item.status === 'WARN' && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  {item.status === 'FAIL' && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <h4 className="font-bold text-xs text-gray-900">{item.title}</h4>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.status === 'PASS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : item.status === 'WARN'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {item.status === 'PASS' ? 'ĐẠT TIÊU CHUẨN' : item.status === 'WARN' ? 'CẦN LƯU Ý' : 'KHÔNG ĐẠT'}
                </span>
              </div>

              <p className="text-xs text-gray-500 pl-6">{item.description}</p>

              <div
                className={`ml-6 p-2.5 rounded-xl border text-xs font-medium ${
                  item.status === 'FAIL'
                    ? 'bg-rose-50/50 border-rose-100 text-rose-900'
                    : item.status === 'WARN'
                    ? 'bg-amber-50/50 border-amber-100 text-amber-900'
                    : 'bg-gray-50/80 border-gray-100 text-gray-700'
                }`}
              >
                💡 <span className="font-bold text-gray-900">Khuyến nghị Topify:</span> {item.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
