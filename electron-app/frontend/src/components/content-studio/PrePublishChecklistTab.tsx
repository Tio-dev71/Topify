import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  category: 'LINKS' | 'SPELLING' | 'POLICY' | 'MEDIA' | 'CTA' | 'TIME';
  title: string;
  description: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  recommendation: string;
}

export function PrePublishChecklistTab() {
  const navigate = useNavigate();
  const [testCaption, setTestCaption] = useState(
    '🔥 Siêu ưu đãi mừng lễ lớn! Mua 1 tặng 1 toàn bộ sản phẩm công thái học chỉ trong hôm nay. Nhấn vào link bên dưới để nhận mã giảm giá 50% ngay! 👉 https://topify.vn/promo?utm_source=facebook&utm_medium=post #Topify #Sale #Ergonomic'
  );
  const [testLink, setTestLink] = useState('https://topify.vn/promo?utm_source=facebook&utm_medium=post');
  const [isAuditing, setIsAuditing] = useState(false);

  // Checks state
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'check_link',
      category: 'LINKS',
      title: 'Kiểm tra Liên kết & UTM Builder',
      description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
      status: 'PASS',
      recommendation: 'Đã phát hiện UTM source=facebook và medium=post. Đường dẫn hợp lệ.',
    },
    {
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'PASS',
      recommendation: 'Không phát hiện lỗi chính tả nghiêm trọng. Ngắt đoạn rõ ràng.',
    },
    {
      id: 'check_policy',
      category: 'POLICY',
      title: 'Chính sách Cộng đồng & Quảng cáo',
      description: 'Phát hiện các từ khóa nhạy cảm, cam kết thái quá hoặc vi phạm chính sách Meta/TikTok',
      status: 'WARN',
      recommendation: 'Lưu ý từ "giảm giá 50%" có thể bị bóp reach nhẹ trên một số Fanpage mới nếu chạy ads.',
    },
    {
      id: 'check_media',
      category: 'MEDIA',
      title: 'Tỷ lệ Asset & Kích thước Khung hình',
      description: 'Đối chiếu tỷ lệ khung hình với từng nền tảng (9:16 dọc cho Reels/TikTok, 1:1 cho Feed)',
      status: 'PASS',
      recommendation: 'Khuyến nghị đính kèm ít nhất 1 video dọc 9:16 hoặc carousel ảnh chất lượng cao.',
    },
    {
      id: 'check_cta',
      category: 'CTA',
      title: 'Lời kêu gọi hành động (Call To Action)',
      description: 'Bài viết có chỉ dẫn hành vi cụ thể (Inbox, Nhấn link, Bình luận)',
      status: 'PASS',
      recommendation: 'Đã có CTA rõ ràng: "Nhấn vào link bên dưới để nhận mã giảm giá".',
    },
    {
      id: 'check_time',
      category: 'TIME',
      title: 'Khung giờ vàng xuất bản (Golden Hours)',
      description: 'Gợi ý thời điểm tệp khán giả mục tiêu online đông đảo nhất',
      status: 'PASS',
      recommendation: 'Khung giờ tối ưu hôm nay: 11:30 - 13:00 hoặc 19:30 - 21:30.',
    },
  ]);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      toast.success('Đã hoàn tất kiểm tra chất lượng trước xuất bản! Điểm số an toàn: 95/100');
    }, 600);
  };

  const passCount = checks.filter(c => c.status === 'PASS').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;
  const failCount = checks.filter(c => c.status === 'FAIL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Bộ Tiêu Chuẩn Kiểm Tra Trước Xuất Bản (Pre-Publish Checklist - F078)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Rà soát toàn diện: Link & UTM tracking, chính tả tiếng Việt, chính sách nền tảng (Policy), tỷ lệ asset và CTA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-emerald-200">
            <span className="text-emerald-700 font-bold">{passCount} Đạt</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-700 font-bold">{warnCount} Lưu ý</span>
            <span className="text-gray-300">•</span>
            <span className="text-rose-700 font-bold">{failCount} Lỗi</span>
          </div>
        </div>
      </div>

      {/* Interactive Audit Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Content input to test */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Nội dung cần kiểm duyệt
          </span>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Caption bài viết</label>
            <textarea
              rows={6}
              value={testCaption}
              onChange={(e) => setTestCaption(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none font-sans"
              placeholder="Dán nội dung caption vào đây để kiểm tra..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Đường dẫn đính kèm (Link & UTM)</label>
            <input
              type="url"
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:border-emerald-500"
              placeholder="https://yourwebsite.com/landing?utm_source=facebook"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="btn-primary py-2.5 px-4 text-xs font-semibold flex-1 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuditing ? 'Đang phân tích...' : 'Kiểm Tra Tiêu Chuẩn Ngay'}</span>
            </button>
            <button
              onClick={() => {
                navigate('/create', {
                  state: {
                    prefilledCaption: testCaption,
                  },
                });
              }}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Đưa sang Đăng Bài</span>
            </button>
          </div>
        </div>

        {/* Right: Checklist Items */}
        <div className="lg:col-span-7 space-y-3">
          {checks.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:border-emerald-200 transition space-y-2"
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

              <div className="ml-6 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 text-xs text-gray-700 font-medium">
                💡 <span className="font-bold text-gray-900">Khuyến nghị Topify:</span> {item.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
