import { useState } from 'react';
import {
  Copy,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Repeat,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { checkDuplicateClient, type DuplicateCheckResult } from '../../lib/duplicateEngine';

function formatPct(val: number): number {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  // If val is decimal (e.g. 0.75), convert to 75. If already 0-100 (e.g. 1 or 75), keep it.
  return Math.round(val > 0 && val < 1 ? val * 100 : val);
}

export function DuplicateDetectionTab({ onSendToSpin }: { onSendToSpin?: (text: string) => void }) {
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResult | any | null>(null);

  const handleCheckDuplicate = async () => {
    const trimmedTitle = title.trim();
    const trimmedCaption = caption.trim();

    if (!trimmedCaption && !trimmedTitle) {
      toast.error('Vui lòng nhập tiêu đề hoặc caption để quét trùng lặp');
      return;
    }

    setChecking(true);
    let checkResult: DuplicateCheckResult | null = null;

    try {
      // 1. First attempt: Call backend API
      const res = await api.post('/content/duplicate-check', {
        title: trimmedTitle,
        caption: trimmedCaption,
      });

      if (res?.data) {
        checkResult = res.data;
      }
    } catch (apiErr: any) {
      console.warn('Backend duplicate check encountered an issue, falling back to client-side engine:', apiErr);

      // 2. Fallback: Fetch recent posts from workspace or cache to compare client-side
      let candidatePosts: any[] = [];
      try {
        const postsRes = await api.get('/posts?limit=100');
        candidatePosts = postsRes.data?.posts || postsRes.data || [];
        if (Array.isArray(candidatePosts) && candidatePosts.length > 0) {
          try {
            localStorage.setItem('topify_cached_posts', JSON.stringify(candidatePosts.slice(0, 50)));
          } catch {}
        }
      } catch {
        try {
          const cached = localStorage.getItem('topify_cached_posts');
          if (cached) {
            candidatePosts = JSON.parse(cached);
          }
        } catch {}
      }

      checkResult = checkDuplicateClient(trimmedTitle, trimmedCaption, candidatePosts);
    }

    if (!checkResult) {
      // Ultimate safety fallback
      checkResult = checkDuplicateClient(trimmedTitle, trimmedCaption, []);
    }

    setResult(checkResult);

    const maxPct = formatPct(checkResult.maxSimilarity);
    if (checkResult.hasDuplicates && maxPct >= 35) {
      toast.warning(`Phát hiện nội dung có độ tương đồng ${maxPct}% với bài viết cũ trong Workspace!`);
    } else {
      toast.success('Nội dung độc bản (Unique 100%), không phát hiện trùng lặp trong không gian làm việc!');
    }

    setChecking(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Kiểm Tra Trùng Lặp Nội Dung Trong Workspace (Duplicate Detection - F082)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Sử dụng thuật toán N-Gram & Jaccard Similarity để phát hiện bài viết bị trùng/na ná với lịch sử bài viết cũ nhằm tránh spam thuật toán
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input box */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Tiêu đề bài viết</label>
            <input
              type="text"
              placeholder="Nhập tiêu đề..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Nội dung Caption cần kiểm tra</label>
            <textarea
              rows={8}
              placeholder="Dán toàn bộ nội dung caption bài viết bạn dự định xuất bản..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-rose-500 leading-relaxed resize-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCheckDuplicate}
              disabled={checking}
              className="btn-primary py-2.5 px-5 text-xs font-semibold flex-1 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{checking ? 'Đang đối soát toàn bộ workspace...' : 'Quét Trùng Lặp Ngay (F082)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setCaption('');
                setResult(null);
              }}
              className="py-2.5 px-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold"
              title="Làm mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Results Card */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  {result.hasDuplicates && formatPct(result.maxSimilarity) >= 35 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <span>Kết Quả Đối Soát Trùng Lặp</span>
                </h4>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    result.riskLevel === 'SAFE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : result.riskLevel === 'MODERATE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  MỨC ĐỘ: {result.riskLevel === 'SAFE' ? 'AN TOÀN' : result.riskLevel === 'MODERATE' ? 'TRUNG BÌNH' : 'NGUY CƠ CAO'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-600">Độ tương đồng lớn nhất:</span>
                  <span className="font-bold text-sm text-gray-900">
                    {formatPct(result.maxSimilarity)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      formatPct(result.maxSimilarity) >= 70
                        ? 'bg-rose-500'
                        : formatPct(result.maxSimilarity) >= 35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, formatPct(result.maxSimilarity)))}%` }}
                  />
                </div>
              </div>

              {/* Matches List */}
              {result.matches && result.matches.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 block">
                      Các bài viết cũ phát hiện trùng lặp ({result.matches.length}):
                    </span>
                    {onSendToSpin && (
                      <button
                        type="button"
                        onClick={() => onSendToSpin(caption || title)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Spin chống spam ngay</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {result.matches.map((m: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-gray-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 truncate max-w-[200px]">
                            {m.title || 'Bài viết trong Workspace'}
                          </span>
                          <span className="font-mono text-amber-800 font-bold">
                            {formatPct(m.similarity)}% trùng
                          </span>
                        </div>
                        {m.captionSnippet || m.caption ? (
                          <p className="line-clamp-2 text-gray-600 italic">
                            "{m.captionSnippet || m.caption}"
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">✨ Tuyệt vời! Nội dung này là độc bản hoàn toàn.</p>
                  <p className="text-emerald-700">
                    Bài viết không trùng lặp với bất kỳ bài nào trong tổng số {result.checkedCount || 0} bài viết đã lưu trong không gian làm việc.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Copy className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Sẵn Sàng Quét Trùng Lặp</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Nhập nội dung bài viết và nhấn "Quét Trùng Lặp Ngay" để thuật toán Topify rà soát toàn bộ kho bài viết trong Workspace của bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

