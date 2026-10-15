import { useState } from 'react';
import {
  X,
  Repeat,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export interface SpinVariantItem {
  id: string;
  index: number;
  caption: string;
  title: string;
  uniquenessScore: number;
  hook: string;
  hashtags: string[];
  wordCount: number;
}

interface SpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCaption?: string;
  initialTitle?: string;
  onApplyVariant: (selectedCaption: string, selectedTitle?: string) => void;
  onDistributeToAllVideos?: (variants: SpinVariantItem[]) => void;
  totalVideosCount?: number;
}

export function SpinModal({
  isOpen,
  onClose,
  initialCaption = '',
  initialTitle = '',
  onApplyVariant,
  onDistributeToAllVideos,
  totalVideosCount = 1,
}: SpinModalProps) {
  const [activeTab, setActiveTab] = useState<'ai_spin' | 'spintax'>('ai_spin');
  const [inputText, setInputText] = useState(initialCaption);
  const [variantsCount, setVariantsCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<SpinVariantItem[]>([]);
  const [averageUniqueness, setAverageUniqueness] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Spintax testing state
  const [spintaxInput, setSpintaxInput] = useState(
    initialCaption.includes('{')
      ? initialCaption
      : '{Xin chào|Hi cả nhà|Chào các bạn}, {hôm nay|ngày đẹp trời} mình {chia sẻ|bật mí} {bí quyết|tuyệt chiêu} {tuyệt vời|đỉnh cao} này nhé!'
  );
  const [spintaxCombinations, setSpintaxCombinations] = useState<number | null>(null);
  const [spintaxSample, setSpintaxSample] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerateAiVariants = async () => {
    if (!inputText.trim()) {
      toast.error('Vui lòng nhập nội dung caption gốc để spin!');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post('/content-studio/spin', {
        text: inputText,
        count: variantsCount,
        originalTitle: initialTitle,
      });

      if (res.data?.success && res.data?.data) {
        setVariants(res.data.data.variants || []);
        setAverageUniqueness(res.data.data.averageUniqueness || 80);
        toast.success(`Đã tự động sinh thành công ${res.data.data.variants.length} biến thể độc nhất!`);
      } else {
        throw new Error('Không nhận được dữ liệu phản hồi');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Có lỗi xảy ra khi spin biến thể');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSpintax = async () => {
    if (!spintaxInput.trim()) {
      toast.error('Vui lòng nhập cú pháp Spintax để kiểm tra!');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post('/content-studio/spin', {
        text: spintaxInput,
        testSpintaxOnly: true,
      });

      if (res.data?.success && res.data?.data) {
        setSpintaxCombinations(res.data.data.totalCombinations || 1);
        setSpintaxSample(res.data.data.sampleVariant || '');
        toast.success('Bung thử Spintax thành công!');
      }
    } catch (err: any) {
      toast.error('Không thể phân tích cú pháp Spintax');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplySingle = (variant: SpinVariantItem) => {
    onApplyVariant(variant.caption, variant.title);
    toast.success(`Đã áp dụng Biến thể #${variant.index} vào bài viết!`);
    onClose();
  };

  const handleDistributeAll = () => {
    if (onDistributeToAllVideos && variants.length > 0) {
      onDistributeToAllVideos(variants);
      toast.success(`Đã tự động phân bổ ${variants.length} biến thể cho các video!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Spin Nội Dung Chống Trùng Lặp & Spam</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  F015 • SO9 Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Tự động sinh các biến thể caption độc nhất để qua mặt thuật toán phạt spam của Facebook, TikTok, YouTube
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-gray-100 px-6 bg-gray-50/60">
          <button
            type="button"
            onClick={() => setActiveTab('ai_spin')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ai_spin'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            Tự động sinh biến thể với AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spintax')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'spintax'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            Phân tích cú pháp Spintax {'{A|B|C}'}
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'ai_spin' ? (
            <>
              {/* Input Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    Nội dung Caption gốc cần làm mới
                  </label>
                  <span className="text-xs text-gray-400">
                    {inputText.length} ký tự • {inputText.split(/\s+/).filter(Boolean).length} từ
                  </span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Dán hoặc nhập caption gốc vào đây để AI tự sinh các phiên bản diễn đạt khác nhau..."
                  className="w-full min-h-[110px] p-4 text-sm bg-gray-50/70 border border-gray-200 rounded-2xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-y"
                />

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Số biến thể muốn sinh:</span>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      {[3, 5, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setVariantsCount(num)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            variantsCount === num
                              ? 'bg-white text-purple-700 shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {num} bản
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiVariants}
                    disabled={isGenerating || !inputText.trim()}
                    className="btn-apple-primary px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang biến hóa caption...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Sinh {variantsCount} Biến Thể Độc Nhất
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Variants Results */}
              {variants.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        Danh Sách Biến Thể Đã Sinh ({variants.length})
                      </h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Độ độc nhất TB: {averageUniqueness}%
                      </span>
                    </div>

                    {totalVideosCount > 1 && onDistributeToAllVideos && (
                      <button
                        type="button"
                        onClick={handleDistributeAll}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Phân bổ đều cho {totalVideosCount} video
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                              #{v.index}
                            </span>
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[280px]">
                              {v.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                v.uniquenessScore >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              Khác biệt {v.uniquenessScore}%
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopy(v.caption, v.id)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                              title="Sao chép"
                            >
                              {copiedId === v.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApplySingle(v)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center gap-1"
                            >
                              Áp dụng
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          {v.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Spintax Tab */
            <div className="space-y-4">
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Cách sử dụng Spintax chuẩn:</p>
                  <p className="mt-0.5 text-indigo-700 leading-relaxed">
                    Sử dụng cặp dấu ngoặc nhọn <code>{'{...|...}'}</code> để liệt kê các từ đồng nghĩa.
                    Ví dụ: <code>{'{Chào bạn|Xin chào}'} hôm nay mình {'{rất vui|hân hạnh}'}</code>.
                    Mỗi lần đăng hệ thống sẽ bốc ngẫu nhiên một lựa chọn để tạo thành nội dung không bao giờ lặp lại!
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                  Soạn thảo cú pháp Spintax
                </label>
                <textarea
                  value={spintaxInput}
                  onChange={(e) => setSpintaxInput(e.target.value)}
                  rows={4}
                  className="w-full p-4 text-sm bg-gray-50/70 border border-gray-200 rounded-2xl font-mono focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleTestSpintax}
                  disabled={isGenerating || !spintaxInput.trim()}
                  className="btn-apple-primary px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                  Bung Thử Spintax
                </button>
              </div>

              {spintaxCombinations !== null && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Phân tích thành công! Khả năng tạo: ~{spintaxCombinations} biến thể khác nhau
                    </span>
                  </div>
                  <div className="text-xs text-gray-800 bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="font-semibold text-gray-500 text-[11px] mb-1">Ví dụ một bản bung ngẫu nhiên:</p>
                    <p className="leading-relaxed">{spintaxSample}</p>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyVariant(spintaxSample);
                        toast.success('Đã áp dụng mẫu spintax vào bài viết!');
                        onClose();
                      }}
                      className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                    >
                      Dùng mẫu này cho bài viết
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Topify Multi-variant Anti-Spam Protection
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
