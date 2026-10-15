import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Repeat,
  FileText,
  Film,
  BookOpen,
  Copy,
  Check,
  Send,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Clock,
  Hash,
  Loader2,
  CheckCircle2,
  Wand2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { SpinModal, type SpinVariantItem } from '../components/SpinModal';
import { AiWriterModal } from '../components/AiWriterModal';

const INDUSTRIES = [
  { id: 'FASHION', label: 'Thời trang & Phụ kiện', icon: '👗', desc: 'OOTD, mixmatch, phong cách sành điệu' },
  { id: 'BEAUTY', label: 'Mỹ phẩm & Làm đẹp', icon: '💄', desc: 'Skincare, makeup, liệu trình spa' },
  { id: 'FOOD_BEVERAGE', label: 'Ẩm thực & Quán Cafe', icon: '☕', desc: 'Review quán, món ngon, ăn vặt' },
  { id: 'REAL_ESTATE', label: 'Bất động sản & Nhà đất', icon: '🏢', desc: 'Căn hộ, đất nền, đầu tư sinh lời' },
  { id: 'TECH_GADGETS', label: 'Công nghệ & Điện máy', icon: '📱', desc: 'Đập hộp, review thiết bị thông minh' },
  { id: 'EDUCATION', label: 'Giáo dục & Khóa học', icon: '📚', desc: 'Tiếng Anh, kỹ năng mềm, luyện thi' },
  { id: 'FINANCE', label: 'Tài chính & Đầu tư', icon: '📈', desc: 'Dòng tiền, tiết kiệm, chứng khoán' },
  { id: 'FITNESS_HEALTH', label: 'Sức khỏe & Gym/Yoga', icon: '🧘', desc: 'Eat clean, giảm cân, thể hình' },
  { id: 'TRAVEL', label: 'Du lịch & Khách sạn', icon: '✈️', desc: 'Checkin, nghỉ dưỡng, cẩm nang phượt' },
  { id: 'B2B_SERVICES', label: 'Dịch vụ Doanh nghiệp & Marketing', icon: '💼', desc: 'Chuyển đổi số, B2B, tối ưu chi phí' },
];

const TONES = [
  { id: 'HUMOROUS', label: 'Hài hước & Bắt trend', icon: '😂', desc: 'Dí dỏm, ngôn ngữ Gen Z' },
  { id: 'EXPERT', label: 'Chuyên gia uy tín', icon: '🎓', desc: 'Học thuật, số liệu rõ ràng' },
  { id: 'EMPATHETIC', label: 'Tâm sự & Đồng cảm', icon: '❤️', desc: 'Chạm cảm xúc, thấu hiểu' },
  { id: 'SENSATIONAL', label: 'Giật gân & Tò mò', icon: '⚡', desc: 'Mở đầu nghịch lý, bất ngờ' },
  { id: 'SALES_FOMO', label: 'Chốt sale FOMO', icon: '🔥', desc: 'Khuyến mãi có hạn, cấp bách' },
  { id: 'LUXURY', label: 'Sang trọng & Tinh tế', icon: '💎', desc: 'Đẳng cấp, tao nhã quý phái' },
];

const GOALS = [
  { id: 'ENGAGEMENT', label: 'Tăng tương tác (Like, Share, Comment)' },
  { id: 'LEAD_GEN', label: 'Thu thập Leads (Nhắn tin / SĐT)' },
  { id: 'DIRECT_SALES', label: 'Bán hàng trực tiếp (Chốt đơn)' },
  { id: 'BRANDING', label: 'Định vị thương hiệu & Niềm tin' },
];

const FORMATS = [
  { id: 'SOCIAL_CAPTION', label: 'Caption Mạng Xã Hội', icon: FileText, desc: 'Facebook, Instagram, Zalo chuẩn SEO' },
  { id: 'SHORT_VIDEO_SCRIPT', label: 'Kịch bản Video ngắn', icon: Film, desc: 'TikTok, Reels, Shorts kèm góc máy' },
  { id: 'STORYTELLING', label: 'Kể chuyện Storytelling', icon: BookOpen, desc: 'Bài viết trải nghiệm & bài học dài' },
];

export default function ContentStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ai_writer' | 'spin_tool' | 'templates'>('ai_writer');

  // AI Writer State (F016)
  const [industry, setIndustry] = useState('FASHION');
  const [tone, setTone] = useState('HUMOROUS');
  const [goal, setGoal] = useState('ENGAGEMENT');
  const [format, setFormat] = useState('SOCIAL_CAPTION');
  const [topic, setTopic] = useState('');
  const [productName, setProductName] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [copiedAi, setCopiedAi] = useState(false);

  // Spin Content State (F015)
  const [spinInput, setSpinInput] = useState('');
  const [spinCount, setSpinCount] = useState<number>(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinVariants, setSpinVariants] = useState<SpinVariantItem[]>([]);
  const [averageUniqueness, setAverageUniqueness] = useState<number>(0);
  const [copiedSpinId, setCopiedSpinId] = useState<string | null>(null);

  // Spintax Lab State (F015)
  const [spintaxInput, setSpintaxInput] = useState(
    '{Xin chào|Hi cả nhà|Chào các bạn}, {hôm nay|ngày đẹp trời hôm nay} Topify {xin chia sẻ|bật mí} {bí quyết|tuyệt chiêu} {đỉnh cao|tuyệt vời} này nhé!'
  );
  const [spintaxSample, setSpintaxSample] = useState('');
  const [spintaxCombos, setSpintaxCombos] = useState<number | null>(null);

  // Quick prompt starters
  const quickPrompts = [
    'Bí quyết phối đồ hack dáng cho nàng công sở thanh lịch',
    '3 Bước trị mụn ẩn tại nhà chuẩn spa chỉ sau 1 tuần',
    'Top 5 quán cafe view hoàng hôn cực chill tại Hà Nội',
    'Đầu tư căn hộ chung cư 2 phòng ngủ sinh lời vượt trội',
    'Đập hộp robot hút bụi thông minh tự giặt giẻ lau nhà',
  ];

  const handleGenerateAi = async (customTopic?: string) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề hoặc ý tưởng bài viết!');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await api.post('/content-studio/ai-writer', {
        industry,
        tone,
        goal,
        format,
        topic: finalTopic,
        productName,
        keyBenefits,
      });

      if (res.data?.success && res.data?.data) {
        setAiResult(res.data.data);
        toast.success('Topify AI đã sinh nội dung thành công!');
      } else {
        throw new Error('Lỗi phản hồi dữ liệu');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Có lỗi xảy ra khi tạo nội dung với AI');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateSpin = async () => {
    if (!spinInput.trim()) {
      toast.error('Vui lòng nhập nội dung caption cần làm mới!');
      return;
    }

    setIsSpinning(true);
    try {
      const res = await api.post('/content-studio/spin', {
        text: spinInput,
        count: spinCount,
      });

      if (res.data?.success && res.data?.data) {
        setSpinVariants(res.data.data.variants || []);
        setAverageUniqueness(res.data.data.averageUniqueness || 82);
        toast.success(`Đã tự động tạo ${res.data.data.variants.length} biến thể caption chống trùng lặp!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể tạo biến thể spin');
    } finally {
      setIsSpinning(false);
    }
  };

  const handleTestSpintax = async () => {
    if (!spintaxInput.trim()) return;
    try {
      const res = await api.post('/content-studio/spin', {
        text: spintaxInput,
        testSpintaxOnly: true,
      });

      if (res.data?.success && res.data?.data) {
        setSpintaxCombos(res.data.data.totalCombinations || 1);
        setSpintaxSample(res.data.data.sampleVariant || '');
        toast.success('Bung thử Spintax thành công!');
      }
    } catch {
      toast.error('Lỗi khi phân tích Spintax');
    }
  };

  const handleApplyToCreatePost = (title: string, caption: string) => {
    // Navigate to CreatePost with state or search params
    navigate('/create', {
      state: {
        prefilledTitle: title,
        prefilledCaption: caption,
      },
    });
    toast.success('Đã chuyển nội dung sang màn hình Tạo Bài Viết!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Module M2 • Content Studio & SO9 Marketing Suite
          </div>
          <h1 className="text-3xl font-black tracking-tight">Studio Nội Dung & Spin Biến Thể</h1>
          <p className="text-purple-100 text-sm leading-relaxed">
            Hỗ trợ người sáng tạo và doanh nghiệp sinh kịch bản video TikTok triệu view, viết caption đa ngành hàng
            theo 6 tone giọng (F016) và công nghệ Spin Spintax tự động chống trùng lặp, chống spam đa kênh (F015).
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('ai_writer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ai_writer'
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Trợ Lý AI Viết Caption / Kịch Bản (F016)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spin_tool')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'spin_tool'
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              Spin Nội Dung Chống Spam (F015)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Công Thức Copywriting Kinh Điển
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: AI WRITER (F016) */}
      {activeTab === 'ai_writer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Thiết Lập Thông Số Sáng Tạo</h3>
                <p className="text-xs text-gray-500">Tùy biến theo đúng đặc thù ngành hàng và khách hàng mục tiêu</p>
              </div>
            </div>

            {/* Quick Starters */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                Gợi ý chủ đề nhanh:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.slice(0, 3).map((qp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTopic(qp);
                      handleGenerateAi(qp);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-600 border border-gray-200 rounded-lg text-left transition-all"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                Ngành Hàng (10 Ngành)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setIndustry(ind.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs flex items-center gap-2 transition-all ${
                      industry === ind.id
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-2xs'
                        : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{ind.icon}</span>
                    <span className="truncate">{ind.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone of voice */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                Tone Giọng (6 Phong Cách)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all ${
                      tone === t.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Goal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Định Dạng
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                >
                  {FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Mục Tiêu Bài Viết
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                >
                  {GOALS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-800 mb-1 block">Chủ đề bài viết *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: 5 Sai lầm khi chăm sóc da dầu mụn..."
                  className="input-apple text-xs w-full bg-gray-50 border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Serum B5 Phục Hồi"
                    className="input-apple text-xs w-full bg-gray-50 border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">Lợi ích chính</label>
                  <input
                    type="text"
                    value={keyBenefits}
                    onChange={(e) => setKeyBenefits(e.target.value)}
                    placeholder="VD: Căng bóng, mờ thâm sau 7 ngày"
                    className="input-apple text-xs w-full bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => handleGenerateAi()}
              disabled={isGeneratingAi || !topic.trim()}
              className="w-full btn-apple-primary py-3 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang sáng tạo nội dung...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Sinh Bài Viết Với AI
                </>
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Bản Thảo Hoàn Thiện (Preview)</h3>
                  <p className="text-xs text-gray-500">Xem trước kịch bản video hoặc caption bán hàng</p>
                </div>
              </div>

              {aiResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const full = `${aiResult.title}\n\n${aiResult.caption}\n\n${(aiResult.hashtags || []).join(' ')}`;
                      navigator.clipboard.writeText(full);
                      setCopiedAi(true);
                      toast.success('Đã sao chép nội dung!');
                      setTimeout(() => setCopiedAi(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1 transition-all"
                  >
                    {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToCreatePost(aiResult.title, aiResult.caption)}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 hover:shadow-md transition-all"
                  >
                    Đăng ngay (/create)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {!aiResult && !isGeneratingAi ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center text-gray-400 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Chưa có bài viết nào được tạo</p>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Hãy điền chủ đề ở khung bên trái hoặc bấm chọn nhanh một gợi ý để trải nghiệm sức mạnh của AI Writer!
                  </p>
                </div>
              ) : isGeneratingAi ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-bold text-gray-700">Đang sáng tạo nội dung...</p>
                  <p className="text-xs text-gray-400">Tối ưu từ ngữ theo tone giọng {tone} và ngành hàng {industry}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Tiêu đề Viral (Headline)
                    </span>
                    <h4 className="text-base font-bold text-gray-900">{aiResult.title}</h4>
                  </div>

                  {/* Scenes if video script */}
                  {aiResult.scenes && aiResult.scenes.length > 0 && (
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                        <span className="flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-indigo-600" />
                          Kịch bản phân cảnh video ({aiResult.scenes.length} cảnh)
                        </span>
                        <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                          Khung hình dọc 9:16
                        </span>
                      </div>

                      <div className="space-y-2">
                        {aiResult.scenes.map((sc: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-indigo-700 text-[11px]">
                              <span>
                                #{idx + 1} ({sc.timeSlot}) - {sc.phase}
                              </span>
                              <span className="text-gray-400 font-normal">{sc.cameraAngle}</span>
                            </div>
                            <p className="text-gray-600 text-[11px]">
                              <strong>Hình ảnh:</strong> {sc.visualCue}
                            </p>
                            <p className="text-gray-900 text-xs bg-indigo-50/50 p-2 rounded-lg font-medium">
                              🗣️ "{sc.voiceover}"
                            </p>
                            <p className="text-amber-700 text-[11px]">
                              🔤 Text hiển thị: <strong>{sc.onscreenText}</strong>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      <span>Nội dung Caption chi tiết</span>
                      <span className="text-gray-400 font-normal">
                        {aiResult.caption?.length} ký tự • ~{aiResult.estimatedReadTimeSec}s đọc
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line font-sans">
                      {aiResult.caption}
                    </p>
                  </div>

                  {/* Hashtags & Posting Time */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Hash className="w-3.5 h-3.5 text-emerald-600" />
                      Hashtags Đề Xuất
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(aiResult.hashtags || []).map((t: string, i: number) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      {aiResult.recommendedPostTime}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPIN CONTENT & SPINTAX (F015) */}
      {activeTab === 'spin_tool' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Spin Input */}
          <div className="lg:col-span-6 space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Bộ Sinh Biến Thể Tự Động (AI Spin)</h3>
                  <p className="text-xs text-gray-500">Nhập 1 bài viết để tạo ra 3-8 phiên bản diễn đạt hoàn toàn mới</p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Chống phạt trùng lặp
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                Nội dung gốc cần spin
              </label>
              <textarea
                value={spinInput}
                onChange={(e) => setSpinInput(e.target.value)}
                rows={5}
                placeholder="Dán bài viết hoặc nội dung caption cần nhân bản tại đây..."
                className="w-full p-4 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-purple-500 transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Số lượng biến thể:</span>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {[3, 5, 8].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSpinCount(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        spinCount === c ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500'
                      }`}
                    >
                      {c} bản
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateSpin}
                disabled={isSpinning || !spinInput.trim()}
                className="btn-apple-primary px-5 py-2.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isSpinning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                Tự Động Sinh {spinCount} Biến Thể
              </button>
            </div>

            {/* Spintax Helper */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Trình Thử Nghiệm Spintax Cú Pháp {'{A|B|C}'}
                </span>
                <span className="text-[10px] text-gray-400">Nâng cao</span>
              </div>
              <textarea
                value={spintaxInput}
                onChange={(e) => setSpintaxInput(e.target.value)}
                rows={3}
                className="w-full p-3 font-mono text-xs bg-indigo-50/40 border border-indigo-200 rounded-xl"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestSpintax}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Bung thử Spintax
                </button>
                {spintaxCombos !== null && (
                  <span className="text-xs font-bold text-emerald-700">
                    Khả năng tạo: ~{spintaxCombos} kết hợp ngẫu nhiên
                  </span>
                )}
              </div>
              {spintaxSample && (
                <div className="p-3 bg-white border border-indigo-100 rounded-xl text-xs text-gray-700 leading-relaxed">
                  <strong className="text-indigo-800">Bản bung ngẫu nhiên:</strong> {spintaxSample}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Spin Output */}
          <div className="lg:col-span-6 space-y-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Kết Quả Biến Thể Độc Nhất ({spinVariants.length})</h3>
                {averageUniqueness > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Độ độc nhất: {averageUniqueness}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {spinVariants.length === 0 ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center text-gray-400 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                    <Repeat className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Chưa có biến thể nào được tạo</p>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Nhập nội dung gốc và bấm "Tự Động Sinh Biến Thể" để tạo các phiên bản caption hoàn toàn mới
                  </p>
                </div>
              ) : (
                spinVariants.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-gray-50/60 rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          #{v.index}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{v.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Khác biệt {v.uniquenessScore}%
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(v.caption);
                            setCopiedSpinId(v.id);
                            toast.success('Đã sao chép biến thể!');
                            setTimeout(() => setCopiedSpinId(null), 2000);
                          }}
                          className="p-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          {copiedSpinId === v.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyToCreatePost(v.title, v.caption)}
                          className="text-xs font-bold px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
                        >
                          Dùng bản này
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-gray-100">
                      {v.caption}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MARKETING TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Card 1: AIDA */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 font-black flex items-center justify-center">
                A
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Công thức AIDA</h4>
                <p className="text-xs text-gray-500">Attention - Interest - Desire - Action</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Mô hình kinh điển phù hợp cho các bài viết giới thiệu sản phẩm mới hoặc chạy quảng cáo chuyển đổi. Thu hút
              chú ý $\rightarrow$ Gây thích thú $\rightarrow$ Kích thích khao khát $\rightarrow$ Kêu gọi hành động.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai_writer');
                setGoal('DIRECT_SALES');
                setTopic('Giới thiệu sản phẩm mới theo công thức AIDA');
              }}
              className="w-full py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all"
            >
              Áp dụng mẫu này
            </button>
          </div>

          {/* Card 2: PAS */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 font-black flex items-center justify-center">
                P
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Công thức PAS</h4>
                <p className="text-xs text-gray-500">Problem - Agitate - Solution</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Xoáy sâu vào nỗi đau của khách hàng $\rightarrow$ Làm trầm trọng hóa vấn đề $\rightarrow$ Đưa ra giải pháp
              cứu cánh hoàn hảo. Rất hiệu quả cho các ngành dịch vụ, khóa học, mỹ phẩm.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai_writer');
                setTone('EMPATHETIC');
                setGoal('LEAD_GEN');
                setTopic('Giải quyết nỗi đau khách hàng theo công thức PAS');
              }}
              className="w-full py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
            >
              Áp dụng mẫu này
            </button>
          </div>

          {/* Card 3: BAB */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 font-black flex items-center justify-center">
                B
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Công thức BAB</h4>
                <p className="text-xs text-gray-500">Before - After - Bridge</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tạo sự đối lập ngoạn mục giữa tình trạng Trước (Before) và Sau (After) khi sử dụng sản phẩm. Cây cầu
              (Bridge) chính là bí quyết giúp khách hàng đạt được ước mơ.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai_writer');
                setTone('SALES_FOMO');
                setFormat('SHORT_VIDEO_SCRIPT');
                setTopic('Kịch bản video so sánh Trước và Sau với BAB');
              }}
              className="w-full py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all"
            >
              Áp dụng mẫu này
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
