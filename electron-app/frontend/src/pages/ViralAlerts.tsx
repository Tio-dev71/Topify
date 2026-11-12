import React, { useState, useEffect } from 'react';
import {
  Flame,
  Bell,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Share2,
  Eye,
  ThumbsUp,
  MessageCircle,
  Sliders,
  X,
  Zap,
  Activity,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate, useLocation } from 'react-router-dom';

interface TrendingItem {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE';
  publishedHoursAgo: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  velocityScore: number;
  growthStatus: 'BREAKOUT' | 'STEADY' | 'PEAKING';
  growthBadge: string;
  thumbnailUrl: string;
}

interface AlertRule {
  id: string;
  name: string;
  minViralScore: number;
  keywords: string[];
  notifyInApp: boolean;
  notifyEmail: boolean;
  isActive: boolean;
  createdAt?: string;
}

interface TriggeredAlert {
  id: string;
  ruleName: string;
  title: string;
  sourceUrl?: string;
  platform: string;
  viralScore: number;
  detectedAt: string;
  isRead: boolean;
}

interface ViralAlertsProps {
  defaultTab?: 'trending' | 'alerts';
}

export default function ViralAlerts({ defaultTab }: ViralAlertsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab =
    defaultTab ||
    (location.pathname.includes('trending')
      ? 'trending'
      : location.pathname.includes('alerts')
      ? 'alerts'
      : 'trending');

  const [activeTab, setActiveTab] = useState<'trending' | 'alerts'>(initialTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.includes('trending')) {
      setActiveTab('trending');
    } else if (location.pathname.includes('alerts')) {
      setActiveTab('alerts');
    }
  }, [defaultTab, location.pathname]);

  const handleTabChange = (tab: 'trending' | 'alerts') => {
    setActiveTab(tab);
    navigate(`/intelligence/${tab}`, { replace: true });
  };

  // Trending state (F110)
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedGrowth, setSelectedGrowth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Alerts state (F112)
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [triggeringTest, setTriggeringTest] = useState(false);

  // New Rule Form State
  const [newRuleName, setNewRuleName] = useState('');
  const [newMinScore, setNewMinScore] = useState(80);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newKeywords, setNewKeywords] = useState<string[]>(['Viral', 'Review', 'Sale']);
  const [newNotifyInApp, setNewNotifyInApp] = useState(true);
  const [newNotifyEmail, setNewNotifyEmail] = useState(true);
  const [savingRule, setSavingRule] = useState(false);

  useEffect(() => {
    fetchTrending();
    fetchAlerts();
  }, []);

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await api.get('/intelligence/trending');
      if (res.data?.success && Array.isArray(res.data.items)) {
        setTrendingList(res.data.items);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Không thể tải danh sách xu hướng bùng nổ');
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.get('/intelligence/alerts');
      if (res.data?.success) {
        setRules(res.data.rules || []);
        const rawAlerts = res.data.triggeredAlerts || res.data.alerts || [];
        setTriggeredAlerts(rawAlerts);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Không thể tải quy tắc và cảnh báo');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    if (!newKeywords.includes(newKeywordInput.trim())) {
      setNewKeywords([...newKeywords, newKeywordInput.trim()]);
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setNewKeywords(newKeywords.filter((k) => k !== kw));
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      toast.error('Vui lòng nhập tên quy tắc');
      return;
    }
    if (newKeywords.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 từ khóa theo dõi');
      return;
    }

    setSavingRule(true);
    try {
      const res = await api.post('/intelligence/alerts', {
        action: 'create_rule',
        name: newRuleName,
        minViralScore: newMinScore,
        keywords: newKeywords,
        notifyInApp: newNotifyInApp,
        notifyEmail: newNotifyEmail,
      });

      if (res.data?.success) {
        toast.success('Đã tạo quy tắc cảnh báo bùng nổ mới (F112)');
        setShowCreateRuleModal(false);
        setNewRuleName('');
        fetchAlerts();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Lỗi khi tạo quy tắc');
    } finally {
      setSavingRule(false);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await api.patch('/intelligence/alerts', { id: alertId });
      setTriggeredAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      toast.success('Đã đánh dấu đã đọc');
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi khi cập nhật trạng thái cảnh báo');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Bạn có chắc muốn xóa quy tắc cảnh báo này?')) return;
    try {
      await api.delete(`/intelligence/alerts?id=${ruleId}`);
      toast.success('Đã xóa quy tắc cảnh báo');
      fetchAlerts();
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi khi xóa quy tắc');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await api.delete(`/intelligence/alerts?alertId=${alertId}`);
      setTriggeredAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('Đã xóa thông báo');
    } catch {
      toast.error('Lỗi khi xóa cảnh báo');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await api.post('/intelligence/alerts', { action: 'toggle_rule', id: ruleId });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
      );
      toast.success('Đã cập nhật trạng thái hoạt động quy tắc');
    } catch {
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleTestTrigger = async () => {
    setTriggeringTest(true);
    try {
      const res = await api.post('/intelligence/alerts', {
        action: 'test_trigger',
        viralScore: 96,
        keyword: 'Review sản phẩm bùng nổ',
        ruleName: 'Cảnh báo Vượt ngưỡng (Test F112)',
        platform: 'TIKTOK',
      });
      if (res.data?.success) {
        toast.success('⚡ Đã kích hoạt cảnh báo thử nghiệm thành công! Điểm viral: 96/100');
        fetchAlerts();
      }
    } catch {
      toast.error('Lỗi khi kích hoạt cảnh báo thử nghiệm');
    } finally {
      setTriggeringTest(false);
    }
  };

  const filteredTrending = trendingList.filter((item) => {
    const matchPlatform = selectedPlatform === 'ALL' || item.platform === selectedPlatform;
    const matchGrowth =
      selectedGrowth === 'ALL' ||
      (selectedGrowth === 'BREAKOUT' && item.growthStatus === 'BREAKOUT') ||
      (selectedGrowth === 'STEADY' && item.growthStatus === 'STEADY');
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlatform && matchGrowth && matchSearch;
  });

  const filteredAlerts = triggeredAlerts.filter((a) => {
    if (alertFilter === 'unread') return !a.isRead;
    if (alertFilter === 'read') return a.isRead;
    return true;
  });

  const unreadAlertsCount = triggeredAlerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 p-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        {/* Title and Metadata (Full Width - No text squishing) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              {activeTab === 'trending' ? 'Phân hệ M6 • F110' : 'Phân hệ M6 • F112'}
            </span>
            <span className="text-xs font-medium text-gray-400">Social Listening</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5 leading-snug">
            {activeTab === 'trending' ? (
              <>
                <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 fill-amber-500 shrink-0" />
                <span>Xu hướng & Nội dung Bùng nổ (Trending / Viral Content - F110)</span>
              </>
            ) : (
              <>
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 fill-amber-500 shrink-0" />
                <span>Cảnh báo Từ khóa & Vượt ngưỡng (Keyword / Viral Alert - F112)</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-4xl leading-relaxed">
            {activeTab === 'trending'
              ? 'Phát hiện nội dung tăng trưởng nhanh theo vận tốc tương tác (Velocity Score) trên đa nền tảng để tham khảo, lấy cảm hứng và 1-click Remix tạo bài viết mới.'
              : 'Thiết lập quy tắc cảnh báo khi keyword hoặc điểm viral score vượt ngưỡng (50–98 điểm); nhận thông báo tức thì qua Desktop App và Email.'}
          </p>
        </div>

        {/* Action Toolbar (Placed cleanly below header to prevent squeezing) */}
        <div className="pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (activeTab === 'trending') fetchTrending();
                else fetchAlerts();
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Làm mới</span>
            </button>

            {activeTab === 'alerts' && (
              <button
                onClick={handleTestTrigger}
                disabled={triggeringTest}
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-50"
                title="Kích hoạt ngay một cảnh báo mẫu điểm 96/100 để kiểm chứng"
              >
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{triggeringTest ? 'Đang kích hoạt...' : 'Thử nghiệm Cảnh báo (Test Alert)'}</span>
              </button>
            )}
          </div>

          <div>
            {activeTab === 'alerts' ? (
              <button
                onClick={() => setShowCreateRuleModal(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-xs whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Thiết lập Cảnh báo mới (F112)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  handleTabChange('alerts');
                  setShowCreateRuleModal(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                title="Chuyển sang F112 để thiết lập quy tắc tự động gửi thông báo khi phát hiện nội dung vượt ngưỡng"
              >
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cài đặt cảnh báo vượt ngưỡng</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('trending')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'trending'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Nội dung Bùng nổ (Trending / Viral Content - F110)</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-100">
            {trendingList.length} video
          </span>
        </button>

        <button
          onClick={() => handleTabChange('alerts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span>Cảnh báo Vượt ngưỡng & Quy tắc (Keyword / Viral Alert - F112)</span>
          {unreadAlertsCount > 0 ? (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
              {unreadAlertsCount} mới
            </span>
          ) : (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {rules.length} quy tắc
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TRENDING VELOCITY (F110) */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          {/* F110 Feature Overview & Mechanism Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Cơ chế hoạt động F110: Đo lường Vận tốc bùng nổ (Viral Velocity Score)
                  </h4>
                  <p className="text-[11px] text-amber-900/90 mt-0.5">
                    Hệ thống Social Listening liên tục quét các bài viết/video tăng trưởng nhanh nhất trên TikTok, Facebook, Instagram, YouTube để bạn nắm bắt xu hướng và 1-click tạo bài viết phái sinh.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/60 text-[11px]">
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-100/80">
                <span className="font-bold text-amber-950 block">📊 Công thức Vận tốc (Velocity):</span>
                <span className="text-gray-600 text-[10px]">Tốc độ tăng trưởng tương tác mới (Lượt xem + Thích + Chia sẻ) phát sinh theo mỗi giờ (views/giờ).</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-100/80">
                <span className="font-bold text-amber-950 block">🔥 Phân tầng Ngưỡng Viral:</span>
                <span className="text-gray-600 text-[10px]">≥ 90 điểm: Siêu Bùng Nổ (+15.000 – 50.000 views/h) • 75–89 điểm: Tăng Trưởng Nhanh (+2.500 – 10.000 views/h).</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-100/80">
                <span className="font-bold text-amber-950 block">✨ 1-Click Remix AI:</span>
                <span className="text-gray-600 text-[10px]">Bấm nút tại card để nạp chủ đề viral vào Content Studio, tự động biến tấu thành nội dung thương hiệu.</span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
              <span className="text-[11px] text-gray-400 block font-semibold uppercase">Tổng video theo dõi</span>
              <span className="text-xl font-bold text-gray-900">{trendingList.length} video</span>
              <span className="text-[10px] text-gray-500 block">Đa nền tảng (TikTok, FB, IG, YT)</span>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
              <span className="text-[11px] text-amber-700 block font-semibold uppercase">Vận tốc cao nhất</span>
              <span className="text-xl font-bold text-amber-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                99/100
              </span>
              <span className="text-[10px] text-amber-600 block">+50,000 views/giờ</span>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[11px] text-emerald-700 block font-semibold uppercase">Nội dung Siêu Bùng Nổ</span>
              <span className="text-xl font-bold text-emerald-800">
                {trendingList.filter((i) => i.growthStatus === 'BREAKOUT').length} video
              </span>
              <span className="text-[10px] text-emerald-600 block">Vận tốc Velocity ≥ 90</span>
            </div>
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 shadow-2xs space-y-1">
              <span className="text-[11px] text-indigo-700 block font-semibold uppercase">Tăng trưởng nhanh</span>
              <span className="text-xl font-bold text-indigo-800">
                {trendingList.filter((i) => i.growthStatus === 'STEADY').length} video
              </span>
              <span className="text-[10px] text-indigo-600 block">Vận tốc Velocity 75–89</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-gray-500 mr-1">Nền tảng:</span>
              {['ALL', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                    selectedPlatform === plat
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {plat === 'ALL' ? 'Tất cả nền tảng' : plat}
                </button>
              ))}

              <span className="text-xs font-semibold text-gray-500 ml-2 mr-1">Vận tốc:</span>
              <button
                onClick={() => setSelectedGrowth('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  selectedGrowth === 'ALL'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedGrowth('BREAKOUT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  selectedGrowth === 'BREAKOUT'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                🔥 Siêu Bùng Nổ
              </button>
              <button
                onClick={() => setSelectedGrowth('STEADY')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  selectedGrowth === 'STEADY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                ⚡ Tăng Trưởng Nhanh
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Trending Cards Grid */}
          {loadingTrending ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTrending.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-2xs">
              <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700">Không tìm thấy nội dung phù hợp</h3>
              <p className="text-sm text-gray-500 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc lọc sang nền tảng khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrending.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail & Badge */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white">
                          {item.platform}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {item.velocityScore}/100
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-amber-300 shadow-xs">
                          {item.growthBadge}
                        </span>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {item.authorAvatar ? (
                          <img
                            src={item.authorAvatar}
                            alt={item.author}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                            {item.author.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-700">{item.author}</span>
                        <span className="text-xs text-gray-400">• {item.publishedHoursAgo}h trước</span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-gray-100">
                      {/* Metric Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600 mb-3 font-mono">
                        <div className="bg-gray-50 py-1.5 rounded-xl border border-gray-100">
                          <div className="font-bold text-gray-900">{(item.views / 1000).toFixed(0)}k</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Views
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-xl border border-gray-100">
                          <div className="font-bold text-gray-900">{(item.likes / 1000).toFixed(1)}k</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <ThumbsUp className="w-2.5 h-2.5" /> Likes
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-xl border border-gray-100">
                          <div className="font-bold text-gray-900">{item.comments}</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <MessageCircle className="w-2.5 h-2.5" /> Cmt
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-xl border border-gray-100">
                          <div className="font-bold text-gray-900">{item.shares}</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <Share2 className="w-2.5 h-2.5" /> Share
                          </div>
                        </div>
                      </div>

                      {/* Quick 1-click Repurpose / Remix */}
                      <button
                        onClick={() => {
                          navigate(`/create?trendTopic=${encodeURIComponent(item.title)}`);
                          toast.success('Đã nạp chủ đề viral vào Content Studio để tạo bài viết phái sinh!');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-colors shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Tạo bài viết phái sinh (Remix AI - 1-Click)
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALERTS & RULES (F112) */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* F112 Feature Overview & Mechanism Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Cơ chế hoạt động F112: Hệ thống Cảnh báo Vượt ngưỡng Tự động (Alert Engine)
                  </h4>
                  <p className="text-[11px] text-indigo-900/90 mt-0.5">
                    Khác với F110 (nơi duyệt và tìm kiếm xu hướng), F112 là công cụ chủ động bắn tín hiệu báo động khi thị trường xuất hiện nội dung vượt ngưỡng điểm Viral Velocity hoặc chứa các từ khóa quan trọng bạn đang quan tâm.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-200/60 text-[11px]">
              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100/80">
                <span className="font-bold text-indigo-950 block">⚙️ Quy tắc Ngưỡng (Rule):</span>
                <span className="text-gray-600 text-[10px]">Cài đặt ngưỡng điểm tối thiểu (ví dụ ≥ 80đ) và các từ khóa theo dõi (#KhủngHoảng, #Review, #Sale).</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100/80">
                <span className="font-bold text-indigo-950 block">🔔 Kích hoạt Tự động (Trigger):</span>
                <span className="text-gray-600 text-[10px]">Khi có bài viết thỏa mãn điều kiện quy tắc, sự kiện sẽ xuất hiện ở bảng bên trái và bắn thông báo In-App / Email.</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100/80">
                <span className="font-bold text-indigo-950 block">🧪 Thử nghiệm (Test Alert):</span>
                <span className="text-gray-600 text-[10px]">Dùng nút "Thử nghiệm Cảnh báo" ở góc trên để mô phỏng một sự kiện bùng nổ 96/100 kiểm chứng quy trình.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Triggered Events List (Left Column) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="min-w-0 pr-2">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Cảnh Báo Vượt Ngưỡng Đã Kích Hoạt Theo Thời Gian Thực</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hệ thống tự động phát hiện và gửi tín hiệu báo động khi nội dung vượt ngưỡng Viral Velocity hoặc chứa từ khóa bùng nổ
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto text-xs bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
                  <button
                    onClick={() => setAlertFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
                      alertFilter === 'all' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    Tất cả ({triggeredAlerts.length})
                  </button>
                  <button
                    onClick={() => setAlertFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
                      alertFilter === 'unread' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-100/60'
                    }`}
                  >
                    Chưa đọc ({unreadAlertsCount})
                  </button>
                  <button
                    onClick={() => setAlertFilter('read')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
                      alertFilter === 'read' ? 'bg-gray-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    Đã đọc ({triggeredAlerts.length - unreadAlertsCount})
                  </button>
                </div>
              </div>

              {loadingAlerts ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Không có cảnh báo nào trong mục này</p>
                  <p className="text-xs text-gray-400 mt-1">Bấm "Thử nghiệm Cảnh báo" ở trên để kích hoạt ngay một cảnh báo mẫu.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                        alert.isRead
                          ? 'bg-white border-gray-100 opacity-80'
                          : 'bg-amber-50/50 border-amber-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl mt-0.5 flex-shrink-0 ${
                            alert.isRead ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white shadow-xs'
                          }`}
                        >
                          <Flame className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                              {alert.ruleName}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">• {alert.platform}</span>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                              Điểm Viral: {alert.viralScore}/100
                            </span>
                            {!alert.isRead && (
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide bg-rose-50 px-1.5 py-0.5 rounded">
                                Mới
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                          <span className="text-[11px] text-gray-400 block font-mono">
                            Phát hiện lúc: {new Date(alert.detectedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkAlertRead(alert.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        {alert.sourceUrl && (
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-200 rounded-lg transition-colors"
                            title="Xem liên kết nguồn"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-lg transition-colors"
                          title="Xóa cảnh báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rules Configuration Panel (Right Column) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Quy Tắc Ngưỡng (F112)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    Tự động kích hoạt khi vượt ngưỡng
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateRuleModal(true)}
                  className="btn-primary text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Thêm mới</span>
                </button>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      rule.isActive
                        ? 'border-gray-200 bg-gray-50/70 hover:bg-white'
                        : 'border-gray-100 bg-gray-50/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 line-clamp-1">{rule.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                            rule.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title="Bật/Tắt quy tắc"
                        >
                          {rule.isActive ? 'Đang chạy' : 'Tạm dừng'}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                          title="Xóa quy tắc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 text-[11px]">Ngưỡng Viral tối thiểu:</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        ≥ {rule.minViralScore} điểm
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {rule.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[10px] text-gray-400 border-t border-gray-100">
                      <span>In-App: {rule.notifyInApp ? '✓' : '✗'} • Email: {rule.notifyEmail ? '✓' : '✗'}</span>
                      <span className="font-medium text-gray-500">
                        {rule.isActive ? 'Tự động quét' : 'Đã ngắt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* CREATE RULE MODAL */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                Thiết Lập Quy Tắc Cảnh Báo Xu Hướng Mới (F112)
              </h3>
              <button
                onClick={() => setShowCreateRuleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tên quy tắc theo dõi *
                </label>
                <input
                  type="text"
                  placeholder="VD: Cảnh báo bài viết Siêu Viral ngành F&B..."
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-gray-700">Ngưỡng điểm Viral tối thiểu</label>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    ≥ {newMinScore} / 100 điểm
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={newMinScore}
                  onChange={(e) => setNewMinScore(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                  <span>50 (Tăng trưởng vừa)</span>
                  <span>75 (Thịnh hành)</span>
                  <span>95 (Siêu bùng nổ)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Từ khóa / Hashtag kích hoạt cảnh báo *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa và nhấn Thêm..."
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    className="flex-1 px-3.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {newKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg"
                    >
                      #{kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-amber-500 hover:text-amber-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Kênh nhận thông báo</label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNotifyInApp}
                    onChange={(e) => setNewNotifyInApp(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  Thông báo trực tiếp trên Desktop App (In-App notification)
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNotifyEmail}
                    onChange={(e) => setNewNotifyEmail(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  Gửi email báo cáo khi phát hiện nội dung đột biến
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateRuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {savingRule ? 'Đang lưu...' : 'Lưu quy tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
