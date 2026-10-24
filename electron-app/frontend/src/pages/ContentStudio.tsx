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
  Edit3,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { SpinModal, type SpinVariantItem } from '../components/SpinModal';
import { AiWriterModal } from '../components/AiWriterModal';
import { ImportPostsModal } from '../components/content-studio/ImportPostsModal';
import { MultiPlatformResizer, RATIO_PROFILES, type AspectRatio } from '../components/MultiPlatformResizer';
import { ContentPillarsTab } from '../components/content-studio/ContentPillarsTab';
import { ContentTemplatesTab } from '../components/content-studio/ContentTemplatesTab';
import { ContentBriefsTab } from '../components/content-studio/ContentBriefsTab';
import { PrePublishChecklistTab } from '../components/content-studio/PrePublishChecklistTab';
import { DuplicateDetectionTab } from '../components/content-studio/DuplicateDetectionTab';
import {
  generateSpinVariantsClient,
  parseSpintaxClient,
} from '../lib/spinEngine';

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
  const [activeTab, setActiveTab] = useState<
    'ai_writer' | 'spin_tool' | 'pillars' | 'templates' | 'briefs' | 'checklist' | 'duplicate_check' | 'import_posts' | 'resize_asset'
  >('ai_writer');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'resize' || tabParam === 'resize_asset' || tabParam === 'f113') {
      setActiveTab('resize_asset');
    } else if (tabParam === 'spin') {
      setActiveTab('spin_tool');
    } else if (tabParam === 'pillars' || tabParam === 'f073' || tabParam === 'f074') {
      setActiveTab('pillars');
    } else if (tabParam === 'templates' || tabParam === 'f076') {
      setActiveTab('templates');
    } else if (tabParam === 'briefs' || tabParam === 'f077') {
      setActiveTab('briefs');
    } else if (tabParam === 'checklist' || tabParam === 'f078') {
      setActiveTab('checklist');
    } else if (tabParam === 'duplicate' || tabParam === 'duplicate_check' || tabParam === 'f082') {
      setActiveTab('duplicate_check');
    } else if (tabParam === 'import') {
      setActiveTab('import_posts');
    }
  }, []);

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
  const [originalAiResult, setOriginalAiResult] = useState<any>(null);
  const [copiedAi, setCopiedAi] = useState(false);
  const [newHashtagInput, setNewHashtagInput] = useState('');

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
        setOriginalAiResult(JSON.parse(JSON.stringify(res.data.data)));
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
        return;
      }
      throw new Error('Lỗi phản hồi dữ liệu');
    } catch (err: any) {
      console.warn('API spin thất bại, sử dụng bộ sinh dự phòng cục bộ:', err);
      try {
        const localResult = generateSpinVariantsClient(spinInput, spinCount);
        setSpinVariants(localResult.variants);
        setAverageUniqueness(localResult.averageUniqueness);
        toast.success(`Đã tự động tạo ${localResult.variants.length} biến thể caption chống trùng lặp!`);
      } catch {
        toast.error(err?.response?.data?.error || 'Không thể tạo biến thể spin');
      }
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
        return;
      }
      throw new Error('Lỗi phân tích');
    } catch (err: any) {
      console.warn('API spintax thất bại, dùng bộ phân tích spintax cục bộ:', err);
      try {
        const localSpintax = parseSpintaxClient(spintaxInput);
        setSpintaxCombos(localSpintax.totalCombinations);
        setSpintaxSample(localSpintax.sampleVariant);
        toast.success('Bung thử Spintax thành công!');
      } catch {
        toast.error('Lỗi khi phân tích Spintax');
      }
    }
  };

  const handleApplyToCreatePost = (title: string, caption: string, hashtags?: string[]) => {
    // Navigate to CreatePost with state or search params
    navigate('/create', {
      state: {
        prefilledTitle: title,
        prefilledCaption: caption,
        prefilledHashtags: hashtags && hashtags.length > 0 ? hashtags.join(' ') : undefined,
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

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('ai_writer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
              onClick={() => setActiveTab('pillars')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pillars'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              Trụ Cột & Kế Hoạch (F073/F074)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              Mẫu Bài Viết & Công Thức (F076)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('briefs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'briefs'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              Content Brief (F077)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'checklist'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Checklist Trước Xuất Bản (F078)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('duplicate_check')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'duplicate_check'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-amber-300" />
              Kiểm Tra Trùng Lặp (F082)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resize_asset')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'resize_asset'
                  ? 'bg-white text-purple-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              Resize Đa Nền Tảng (F113)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import_posts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'import_posts'
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Excel / Google Drive (F019)
            </button>
            <button
              type="button"
              onClick={() => setIsSpinModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-purple-500/30 hover:bg-purple-500/50 text-white border border-purple-300/40 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Mở Popup Spin (F015)
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
                  {originalAiResult &&
                    (originalAiResult.title !== aiResult.title ||
                      originalAiResult.caption !== aiResult.caption ||
                      JSON.stringify(originalAiResult.hashtags) !== JSON.stringify(aiResult.hashtags)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAiResult(JSON.parse(JSON.stringify(originalAiResult)));
                          toast.info('Đã khôi phục bản thảo gốc do AI sinh!');
                        }}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200 flex items-center gap-1 transition-all shadow-2xs"
                        title="Khôi phục lại tiêu đề và caption ban đầu do AI gợi ý"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Khôi phục gốc</span>
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => {
                      const full = `${aiResult.title}\n\n${aiResult.caption}${
                        aiResult.hashtags && aiResult.hashtags.length > 0 ? `\n\n${aiResult.hashtags.join(' ')}` : ''
                      }`;
                      navigator.clipboard.writeText(full);
                      setCopiedAi(true);
                      toast.success('Đã sao chép nội dung đã chỉnh sửa!');
                      setTimeout(() => setCopiedAi(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1 transition-all"
                  >
                    {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToCreatePost(aiResult.title, aiResult.caption, aiResult.hashtags)}
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
                  {/* Title (Editable Textarea) */}
                  <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                        <Edit3 className="w-3 h-3 text-purple-600" />
                        Tiêu đề Viral (Headline) • Có thể chỉnh sửa trực tiếp
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {aiResult.title?.length || 0} ký tự
                      </span>
                    </div>
                    <textarea
                      value={aiResult.title || ''}
                      onChange={(e) => setAiResult((prev: any) => ({ ...prev, title: e.target.value }))}
                      rows={2}
                      className="w-full p-2.5 text-sm sm:text-base font-bold text-gray-900 bg-white/90 hover:bg-white focus:bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all resize-y leading-snug shadow-2xs"
                      placeholder="Nhập hoặc chỉnh sửa tiêu đề viral..."
                    />
                  </div>

                  {/* Scenes if video script (Editable) */}
                  {aiResult.scenes && aiResult.scenes.length > 0 && (
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                        <span className="flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-indigo-600" />
                          Kịch bản phân cảnh video ({aiResult.scenes.length} cảnh) • Có thể sửa
                        </span>
                        <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                          Khung hình dọc 9:16
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {aiResult.scenes.map((sc: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-2">
                            <div className="flex items-center justify-between font-bold text-indigo-700 text-[11px]">
                              <span>
                                #{idx + 1} ({sc.timeSlot}) - {sc.phase}
                              </span>
                              <span className="text-gray-400 font-normal">{sc.cameraAngle}</span>
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-0.5">
                                Chỉ dẫn hình ảnh (Visual Cue):
                              </label>
                              <input
                                type="text"
                                value={sc.visualCue || ''}
                                onChange={(e) => {
                                  const updated = [...aiResult.scenes];
                                  updated[idx] = { ...updated[idx], visualCue: e.target.value };
                                  setAiResult((prev: any) => ({ ...prev, scenes: updated }));
                                }}
                                className="w-full px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                                placeholder="Mô tả hình ảnh cho cảnh..."
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-indigo-900 font-semibold uppercase tracking-wider block mb-0.5">
                                🗣️ Lời thoại lồng tiếng (Voiceover):
                              </label>
                              <textarea
                                value={sc.voiceover || ''}
                                onChange={(e) => {
                                  const updated = [...aiResult.scenes];
                                  updated[idx] = { ...updated[idx], voiceover: e.target.value };
                                  setAiResult((prev: any) => ({ ...prev, scenes: updated }));
                                }}
                                rows={2}
                                className="w-full p-2 text-xs font-medium text-gray-900 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all resize-y"
                                placeholder="Lời thoại hoặc âm thanh..."
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block mb-0.5">
                                🔤 Chữ hiển thị trên video:
                              </label>
                              <input
                                type="text"
                                value={sc.onscreenText || ''}
                                onChange={(e) => {
                                  const updated = [...aiResult.scenes];
                                  updated[idx] = { ...updated[idx], onscreenText: e.target.value };
                                  setAiResult((prev: any) => ({ ...prev, scenes: updated }));
                                }}
                                className="w-full px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50/40 border border-amber-200 rounded-lg focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all"
                                placeholder="Chữ/Sticker trên màn hình..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption (Editable Textarea) */}
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      <span className="flex items-center gap-1.5 text-purple-700 font-bold">
                        <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                        Nội dung Caption chi tiết (Click để gõ chỉnh sửa)
                      </span>
                      <span className="text-gray-400 font-normal">
                        {aiResult.caption?.length || 0} ký tự • ~{aiResult.estimatedReadTimeSec || Math.max(5, Math.round((aiResult.caption?.length || 0) / 15))}s đọc
                      </span>
                    </div>
                    <textarea
                      value={aiResult.caption || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiResult((prev: any) => ({
                          ...prev,
                          caption: val,
                          estimatedReadTimeSec: Math.max(5, Math.round(val.length / 15)),
                        }));
                      }}
                      rows={10}
                      className="w-full p-3.5 text-xs text-gray-800 leading-relaxed font-sans bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all resize-y shadow-2xs"
                      placeholder="Nhập hoặc chỉnh sửa trực tiếp nội dung caption chi tiết..."
                    />
                  </div>

                  {/* Hashtags & Posting Time (Interactive) */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-emerald-600" />
                        Hashtags Đề Xuất
                      </span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        (Click tag để xóa hoặc thêm tag mới)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(aiResult.hashtags || []).map((t: string, i: number) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors cursor-pointer group"
                          title="Nhấp để xóa hashtag này"
                          onClick={() => {
                            const nextTags = (aiResult.hashtags || []).filter((_: any, idx: number) => idx !== i);
                            setAiResult((prev: any) => ({ ...prev, hashtags: nextTags }));
                          }}
                        >
                          {t}
                          <span className="text-emerald-400 group-hover:text-rose-500 text-xs font-bold">×</span>
                        </span>
                      ))}
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newHashtagInput}
                          onChange={(e) => setNewHashtagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              let tag = newHashtagInput.trim();
                              if (tag) {
                                if (!tag.startsWith('#')) tag = `#${tag}`;
                                const current = aiResult.hashtags || [];
                                if (!current.includes(tag)) {
                                  setAiResult((prev: any) => ({ ...prev, hashtags: [...current, tag] }));
                                }
                                setNewHashtagInput('');
                              }
                            }
                          }}
                          placeholder="+ Thêm hashtag..."
                          className="px-2 py-0.5 text-[11px] bg-white border border-emerald-200 rounded-lg text-emerald-900 placeholder:text-emerald-400 focus:outline-hidden focus:border-emerald-500 w-28"
                        />
                        {newHashtagInput.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              let tag = newHashtagInput.trim();
                              if (tag) {
                                if (!tag.startsWith('#')) tag = `#${tag}`;
                                const current = aiResult.hashtags || [];
                                if (!current.includes(tag)) {
                                  setAiResult((prev: any) => ({ ...prev, hashtags: [...current, tag] }));
                                }
                                setNewHashtagInput('');
                              }
                            }}
                            className="p-1 bg-emerald-600 text-white rounded-md text-[10px] hover:bg-emerald-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpinModalOpen(true)}
                  className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Mở Popup F015
                </button>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Chống phạt trùng lặp
                </span>
              </div>
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

      {/* TAB: CONTENT PILLARS & MONTHLY/QUARTERLY PLAN (F073 & F074) */}
      {activeTab === 'pillars' && <ContentPillarsTab />}

      {/* TAB: CONTENT TEMPLATES & COPYWRITING FORMULAS (F076) */}
      {activeTab === 'templates' && <ContentTemplatesTab />}

      {/* TAB: CONTENT BRIEFS (F077) */}
      {activeTab === 'briefs' && <ContentBriefsTab />}

      {/* TAB: PRE-PUBLISH CHECKLIST (F078) */}
      {activeTab === 'checklist' && <PrePublishChecklistTab />}

      {/* TAB: DUPLICATE CONTENT DETECTION (F082) */}
      {activeTab === 'duplicate_check' && <DuplicateDetectionTab />}


      {/* TAB 4: IMPORT POSTS FROM EXCEL / DRIVE (F019) */}
      {activeTab === 'import_posts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-8 sm:p-10 shadow-xl">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide uppercase">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Tính Năng Mới &bull; Đặc Tả F019
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Import Bài Viết Hàng Loạt Từ Excel &amp; Google Drive
              </h2>
              <p className="text-emerald-100/90 text-sm leading-relaxed">
                Tiết kiệm 90% thời gian lên bài. Dễ dàng nạp hàng trăm bài viết từ file bảng tính .xlsx, .csv hoặc liên kết Google Sheets trực tiếp, tự động nhận diện khung giờ lên lịch và phân phối đa kênh TikTok, Facebook, Instagram, YouTube.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  Mở Trình Import &amp; Xem Trước Dữ Liệu
                </button>

                <a
                  href="/api/content-studio/import/template"
                  download="Mau_Import_Bai_Viet_Topify.xlsx"
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Tải File Mẫu Chuẩn (.xlsx)
                </a>
              </div>
            </div>
          </div>

          {/* 3 Step Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-gray-900">Chuẩn Bị File Dữ Liệu</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tải file Excel mẫu hoặc dùng Google Sheets có sẵn. Điền các cột Tiêu đề, Caption, Bình luận đầu, Hashtag, Kênh đăng và Thời gian lên lịch.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-gray-900">Xem Trước &amp; Sửa Trực Tiếp</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hệ thống tự động kiểm tra định dạng dữ liệu, cảnh báo lỗi thiếu tiêu đề, cho phép bạn nhấp đúp để chỉnh sửa trực tiếp từng ô trước khi lưu.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-gray-900">Lên Lịch Tự Động Đa Kênh</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Bài viết có ngày giờ sẽ tự động đưa vào hàng đợi lên lịch (SCHEDULED); bài viết không có ngày giờ sẽ lưu dạng bản nháp (DRAFT) để biên tập sau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESIZE ĐA NỀN TẢNG (F113) */}
      {activeTab === 'resize_asset' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  F113 • Chuyển Đổi Tỷ Lệ Asset Đa Nền Tảng (Facebook / IG / TikTok / Shorts)
                </h2>
                <p className="text-xs text-gray-500">
                  Tải ảnh / video từ máy hoặc chọn mẫu có sẵn, chuyển đổi kích thước chuẩn và tải về ngay hoặc áp dụng vào bài viết mới.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> F113 Đang Hoạt Động
              </span>
            </div>
          </div>

          <MultiPlatformResizer
            onApplyToPost={(assetUrl: string, ratio: AspectRatio, caption?: string) => {
              navigate('/create', {
                state: {
                  prefilledMediaUrl: assetUrl,
                  prefilledMediaName: `resized_${ratio.replace(':', '_')}_${Date.now()}.png`,
                  prefilledMediaType: 'image',
                  prefilledTitle: `Asset đã Resize chuẩn ${ratio} (${RATIO_PROFILES[ratio]?.platforms.join(', ') || ''})`,
                  prefilledCaption: caption || `Hình ảnh / Video chuẩn tỷ lệ ${ratio} đã được tối ưu hiển thị cho ${RATIO_PROFILES[ratio]?.platforms.join(', ')} #Topify #Resize #F113`,
                  prefilledHashtags: '#Topify #ContentStudio #ResizeF113',
                },
              });
            }}
          />
        </div>
      )}

      {/* F019: Import Posts Modal */}
      <ImportPostsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => navigate('/posts')}
      />

      {/* F015: Spin Modal Popup */}
      <SpinModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        initialCaption={spinInput || topic || ''}
        onApplyVariant={(selectedCaption, selectedTitle) => {
          setSpinInput(selectedCaption);
          handleApplyToCreatePost(selectedTitle || 'Biến thể bài viết', selectedCaption);
        }}
      />
    </div>
  );
}
