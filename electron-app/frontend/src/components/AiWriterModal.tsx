import { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Film,
  FileText,
  BookOpen,
  ArrowRight,
  Clock,
  Hash,
  Send,
  Loader2,
  ChevronRight,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface AiWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  onApplyContent: (content: {
    title: string;
    caption: string;
    hashtags?: string;
  }) => void;
}

const INDUSTRIES = [
  { id: 'FASHION', label: 'Thời trang & Phụ kiện', icon: '👗' },
  { id: 'BEAUTY', label: 'Mỹ phẩm & Làm đẹp', icon: '💄' },
  { id: 'FOOD_BEVERAGE', label: 'Ẩm thực & Quán Cafe', icon: '☕' },
  { id: 'REAL_ESTATE', label: 'Bất động sản & Nhà đất', icon: '🏢' },
  { id: 'TECH_GADGETS', label: 'Công nghệ & Điện máy', icon: '📱' },
  { id: 'EDUCATION', label: 'Giáo dục & Khóa học', icon: '📚' },
  { id: 'FINANCE', label: 'Tài chính & Đầu tư', icon: '📈' },
  { id: 'FITNESS_HEALTH', label: 'Sức khỏe & Gym/Yoga', icon: '🧘' },
  { id: 'TRAVEL', label: 'Du lịch & Khách sạn', icon: '✈️' },
  { id: 'B2B_SERVICES', label: 'Dịch vụ Doanh nghiệp & Marketing', icon: '💼' },
];

const TONES = [
  { id: 'HUMOROUS', label: 'Hài hước & Gen Z', icon: '😂', desc: 'Dí dỏm, bắt trend duyên dáng' },
  { id: 'EXPERT', label: 'Chuyên gia uy tín', icon: '🎓', desc: 'Sâu sắc, số liệu rõ ràng' },
  { id: 'EMPATHETIC', label: 'Tâm sự & Đồng cảm', icon: '❤️', desc: 'Chạm cảm xúc người đọc' },
  { id: 'SENSATIONAL', label: 'Giật gân & Gây tò mò', icon: '⚡', desc: 'Mở đầu nghịch lý, bất ngờ' },
  { id: 'SALES_FOMO', label: 'Chốt sale FOMO', icon: '🔥', desc: 'Khuyến mãi có hạn, dứt khoát' },
  { id: 'LUXURY', label: 'Sang trọng & Tinh tế', icon: '💎', desc: 'Đẳng cấp, tao nhã quý phái' },
];

const GOALS = [
  { id: 'ENGAGEMENT', label: 'Tăng tương tác (Like/Share/Comment)' },
  { id: 'LEAD_GEN', label: 'Thu thập Leads (Nhắn tin / SĐT)' },
  { id: 'DIRECT_SALES', label: 'Bán hàng trực tiếp (Chốt đơn)' },
  { id: 'BRANDING', label: 'Định vị thương hiệu & Niềm tin' },
];

const FORMATS = [
  { id: 'SOCIAL_CAPTION', label: 'Caption Mạng Xã Hội', icon: FileText, desc: 'Facebook, Instagram, Zalo chuẩn SEO' },
  { id: 'SHORT_VIDEO_SCRIPT', label: 'Kịch bản Video ngắn', icon: Film, desc: 'TikTok, Reels, Shorts kèm góc máy' },
  { id: 'STORYTELLING', label: 'Kể chuyện Storytelling', icon: BookOpen, desc: 'Bài viết trải nghiệm & bài học dài' },
];

export function AiWriterModal({
  isOpen,
  onClose,
  initialTopic = '',
  onApplyContent,
}: AiWriterModalProps) {
  const [industry, setIndustry] = useState('FASHION');
  const [tone, setTone] = useState('HUMOROUS');
  const [goal, setGoal] = useState('ENGAGEMENT');
  const [format, setFormat] = useState('SOCIAL_CAPTION');
  const [topic, setTopic] = useState(initialTopic);
  const [productName, setProductName] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Vui lòng nhập chủ đề bài viết!');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post('/content-studio/ai-writer', {
        industry,
        tone,
        goal,
        format,
        topic,
        productName,
        keyBenefits,
      });

      if (res.data?.success && res.data?.data) {
        setResult(res.data.data);
        toast.success('AI đã hoàn thành nội dung bài viết!');
      } else {
        throw new Error('Không nhận được dữ liệu phản hồi');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const fullText = `${result.title}\n\n${result.caption}\n\n${(result.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Đã sao chép toàn bộ nội dung!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!result) return;
    onApplyContent({
      title: result.title || '',
      caption: result.caption || '',
      hashtags: (result.hashtags || []).join(' '),
    });
    toast.success('Đã áp dụng nội dung vào bài viết!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Trợ Lý AI Viết Caption & Kịch Bản</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  F016 • SO9 AI Studio
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Sinh nội dung chuyên sâu cá nhân hóa theo 10 ngành hàng, 6 tone giọng và 3 định dạng video/social
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

        {/* Modal 2-column layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Left Column: Form Settings */}
          <div className="lg:col-span-6 p-6 space-y-5">
            {/* 1. Ngành hàng (Industry) */}
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 block">
                1. Ngành Hàng Của Bạn
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setIndustry(ind.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium flex items-center gap-2 transition-all ${
                      industry === ind.id
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{ind.icon}</span>
                    <span className="truncate">{ind.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tone Giọng (Tone of Voice) */}
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 block">
                2. Tone Giọng (Phong Cách Viết)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                      tone === t.id
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                        : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Định Dạng & Mục Tiêu */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 block">
                  3. Định Dạng
                </label>
                <div className="space-y-1.5">
                  {FORMATS.map((fmt) => {
                    const IconComponent = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormat(fmt.id)}
                        className={`w-full p-2 rounded-xl text-left border text-xs flex items-center gap-2 transition-all ${
                          format === fmt.id
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                            : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 block">
                  4. Mục Tiêu
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500"
                >
                  {GOALS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Thông tin chủ đề */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between mb-1">
                  <span>Ý Tưởng / Chủ Đề Bài Viết *</span>
                  <span className="text-[11px] text-gray-400 font-normal">Bắt buộc</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: Cách phối đồ hack dáng cho nàng công sở, Bí quyết đầu tư..."
                  className="input-apple text-xs w-full bg-gray-50/70 border border-gray-200 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">Tên Sản Phẩm (Tùy chọn)</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Set đầm dạ hội Bloom"
                    className="input-apple text-xs w-full bg-gray-50/70 border border-gray-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">Lợi Ích Nổi Bật (Tùy chọn)</label>
                  <input
                    type="text"
                    value={keyBenefits}
                    onChange={(e) => setKeyBenefits(e.target.value)}
                    placeholder="VD: Vải lụa mát, tôn eo, freeship"
                    className="input-apple text-xs w-full bg-gray-50/70 border border-gray-200 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full btn-apple-primary py-3 text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-bold disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Đang Soạn Bài Viết Theo Ngành Hàng...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sinh Nội Dung Chuẩn Chuyên Gia
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output Preview */}
          <div className="lg:col-span-6 p-6 flex flex-col bg-gray-50/30">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Kết Quả Soạn Thảo AI
              </h4>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    Áp dụng vào bài viết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {!result && !isGenerating ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-400 p-6">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Chưa có nội dung nào được sinh</p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Chọn ngành hàng, tone giọng và bấm nút "Sinh Nội Dung Chuẩn Chuyên Gia" ở cột bên trái
                  </p>
                </div>
              ) : isGenerating ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-bold text-gray-700">Topify AI đang phân tích dữ liệu ngành hàng...</p>
                  <p className="text-[11px] text-gray-400">Đang áp dụng công thức viết bài hấp dẫn và sinh bộ hashtags</p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Title Preview */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Tiêu đề thu hút (Title)
                    </span>
                    <h5 className="text-sm font-bold text-gray-900 leading-snug">{result.title}</h5>
                  </div>

                  {/* Script Scenes if Video */}
                  {result.scenes && result.scenes.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                        <span className="flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-indigo-600" />
                          Phân Cảnh Kịch Bản Video ({result.scenes.length} cảnh)
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Chuẩn TikTok 30s
                        </span>
                      </div>

                      <div className="space-y-2">
                        {result.scenes.map((scene: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-bold text-[11px] text-indigo-800">
                              <span>
                                Cảnh #{idx + 1} ({scene.timeSlot}) - {scene.phase}
                              </span>
                              <span className="text-gray-500 font-normal">{scene.cameraAngle}</span>
                            </div>
                            <p className="text-gray-700 text-[11px]">
                              <strong>Hình ảnh:</strong> {scene.visualCue}
                            </p>
                            <p className="text-indigo-950 text-[12px] font-medium bg-white/70 p-2 rounded-lg">
                              🗣️ "{scene.voiceover}"
                            </p>
                            <p className="text-[10px] text-amber-700">
                              🔤 Chữ trên màn hình: <strong>{scene.onscreenText}</strong>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption Preview */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      <span>Nội dung mô tả (Caption hoàn chỉnh)</span>
                      <span className="text-gray-400 font-normal">
                        {result.caption?.length || 0} ký tự • ~{result.estimatedReadTimeSec || 30}s đọc
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-xl border border-gray-100 font-sans">
                      {result.caption}
                    </p>
                  </div>

                  {/* Hashtags & Meta Info */}
                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Hash className="w-3.5 h-3.5 text-emerald-600" />
                      Bộ Hashtags Đề Xuất
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.hashtags || []).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-1">
                      <Clock className="w-3 h-3" />
                      {result.recommendedPostTime}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Topify Content Studio SO9 Intelligence
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
