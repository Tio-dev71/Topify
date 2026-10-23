import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  TrendingUp,
  Share2,
  MessageSquare,
  Heart,
  Globe,
  Filter,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface SocialSignal {
  id: string;
  author: string;
  authorAvatar?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE';
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viralScore: number;
  sentiment: 'BUYING_INTENT' | 'POSITIVE' | 'NEUTRAL';
  buyingSignalDescription?: string;
  postedAt: string;
  suggestedTags: string[];
}

export default function SocialSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [sentiment, setSentiment] = useState('ALL');
  const [sort, setSort] = useState('viral');
  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/intelligence/social-search?q=${encodeURIComponent(searchTerm)}&platform=${platform}&sentiment=${sentiment}&sort=${sort}`
      );
      if (res.data.success) {
        setSignals(res.data.signals || []);
      }
    } catch {
      toast.error('Không thể tìm kiếm tín hiệu mạng xã hội');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [platform, sentiment, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSignals();
  };

  const handleTransferToStudio = (item: SocialSignal) => {
    const encodedCaption = encodeURIComponent(item.content);
    const encodedTags = encodeURIComponent(item.suggestedTags.join(' '));
    toast.success('Đang chuyển ý tưởng sang Content Studio...');
    navigate(`/create?caption=${encodedCaption}&tags=${encodedTags}&source=${item.author}`);
  };

  const getPlatformBadge = (plt: string) => {
    const colors: Record<string, string> = {
      TIKTOK: 'bg-rose-50 text-rose-700 border-rose-200',
      FACEBOOK: 'bg-blue-50 text-blue-700 border-blue-200',
      INSTAGRAM: 'bg-pink-50 text-pink-700 border-pink-200',
      YOUTUBE: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${colors[plt] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {plt}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
            Thám Tử Xu Hướng & Tìm Kiếm MXH
          </h1>
          <p className="text-gray-500 mt-1 text-[14px]">
            [F108] Tìm kiếm nội dung viral, tín hiệu hỏi mua và ý tưởng thị trường theo từ khóa/chủ đề
          </p>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setPlatform('ALL');
            setSentiment('ALL');
            fetchSignals();
            toast.success('Đã tải lại danh sách tín hiệu thị trường mới nhất');
          }}
          className="px-3.5 py-2 text-[13px] font-medium rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1.5 self-start md:self-auto shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          Nạp xu hướng mẫu
        </button>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa xu hướng (ví dụ: áo sơ mi, máy hút bụi, skincare, decor phòng làm việc...)"
              className="w-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 pl-11 pr-4 py-3 rounded-2xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Globe className="w-4 h-4 text-gray-400" />
              <span>Nền tảng:</span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-white border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ALL">Tất cả kênh</option>
                <option value="TIKTOK">TikTok</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span>Tín hiệu:</span>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="bg-white border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ALL">Mọi sắc thái</option>
                <option value="BUYING_INTENT">Hỏi mua / Đặt hàng 🔥</option>
                <option value="POSITIVE">Khen ngợi / Tích cực ✨</option>
                <option value="NEUTRAL">Thảo luận cộng đồng 💬</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Sliders className="w-4 h-4 text-gray-400" />
            <span>Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="viral">Viral nhất (Lượt Like & Share)</option>
              <option value="latest">Mới xuất bản gần đây</option>
            </select>
          </div>
        </div>
      </form>

      {/* Result Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {signals.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
            Không tìm thấy tín hiệu phù hợp với từ khóa "{searchTerm}". Hãy thử từ khóa khác hoặc bấm <b>"Nạp xu hướng mẫu"</b>.
          </div>
        ) : (
          signals.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-blue-200 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Author & Platform Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.authorAvatar ? (
                      <img
                        src={item.authorAvatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100 shrink-0 shadow-2xs">
                        {item.author.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold text-gray-900 text-xs truncate"
                        title={item.author}
                      >
                        {item.author}
                      </div>
                      <div className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">
                        {new Date(item.postedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  {/* Badges column: Stacked to prevent horizontal squeeze on author & date */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getPlatformBadge(item.platform)}
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                      <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                      {item.viralScore}đ
                    </span>
                  </div>
                </div>

                {/* Media Preview if available */}
                {item.mediaUrl && (
                  <div className="rounded-xl overflow-hidden h-36 bg-gray-100">
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                )}

                {/* Content */}
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{item.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {item.suggestedTags.map((tag, i) => (
                    <span key={i} className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Buying Intent Badge */}
                {item.sentiment === 'BUYING_INTENT' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-emerald-600" />
                      Tín Hiệu Nhu Cầu Mua Hàng Cao
                    </span>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">{item.buyingSignalDescription}</p>
                  </div>
                )}
              </div>

              {/* Footer Engagement Metrics & Transfer Action */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {item.likesCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                    {item.commentsCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    {item.sharesCount.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleTransferToStudio(item)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Click Chuyển Ý Tưởng Sang Content Studio
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
