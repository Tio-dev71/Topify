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
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

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

export default function ViralAlerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'trending' | 'alerts'>('trending');
  
  // Trending state (F110)
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Alerts state (F112)
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);

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
        setTriggeredAlerts(res.data.triggeredAlerts || []);
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
        name: newRuleName,
        minViralScore: newMinScore,
        keywords: newKeywords,
        notifyInApp: newNotifyInApp,
        notifyEmail: newNotifyEmail,
      });

      if (res.data?.success) {
        toast.success('Đã tạo quy tắc cảnh báo xu hướng mới');
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
      toast.success('Đã xóa quy tắc');
      fetchAlerts();
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi khi xóa quy tắc');
    }
  };

  const filteredTrending = trendingList.filter((item) => {
    const matchPlatform = selectedPlatform === 'ALL' || item.platform === selectedPlatform;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlatform && matchSearch;
  });

  const unreadAlertsCount = triggeredAlerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />
            Cảnh Báo & Nội Dung Bùng Nổ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi vận tốc tăng trưởng (Velocity), phát hiện nội dung viral sớm và nhận cảnh báo theo thời gian thực
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'trending') fetchTrending();
              else fetchAlerts();
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
          <button
            onClick={() => {
              setActiveTab('alerts');
              setShowCreateRuleModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:opacity-95 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Thiết lập Cảnh báo mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'trending'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Nội dung Bùng nổ (Trending Velocity)
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
            {trendingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Cảnh báo Đã kích hoạt & Quy tắc
          {unreadAlertsCount > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TRENDING VELOCITY (F110) */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              {['ALL', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPlatform === plat
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {plat === 'ALL' ? 'Tất cả nền tảng' : plat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Trending Cards Grid */}
          {loadingTrending ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTrending.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700">Không tìm thấy nội dung phù hợp</h3>
              <p className="text-sm text-gray-500 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc lọc sang nền tảng khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrending.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
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
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {item.velocityScore}/100
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-amber-300 shadow">
                        {item.growthBadge}
                      </span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        {item.authorAvatar ? (
                          <img
                            src={item.authorAvatar}
                            alt={item.author}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {item.author.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-600">{item.author}</span>
                        <span className="text-xs text-gray-400">• {item.publishedHoursAgo}h trước</span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-amber-600 cursor-pointer">
                        {item.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Metric Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600 mb-4">
                        <div className="bg-gray-50 py-1.5 rounded-lg">
                          <div className="font-bold text-gray-900">{(item.views / 1000).toFixed(0)}k</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Views
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-lg">
                          <div className="font-bold text-gray-900">{(item.likes / 1000).toFixed(1)}k</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <ThumbsUp className="w-2.5 h-2.5" /> Likes
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-lg">
                          <div className="font-bold text-gray-900">{item.comments}</div>
                          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            <MessageCircle className="w-2.5 h-2.5" /> Cmt
                          </div>
                        </div>
                        <div className="bg-gray-50 py-1.5 rounded-lg">
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
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Tạo bài viết phái sinh (Remix AI)
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Triggered Events List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Cảnh Báo Đã Kích Hoạt Theo Thời Gian Thực
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hệ thống tự động quét và báo động khi bài viết vượt ngưỡng Viral Velocity hoặc chứa từ khóa bùng nổ
                  </p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                  {triggeredAlerts.length} thông báo
                </span>
              </div>

              {loadingAlerts ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : triggeredAlerts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Tất cả đều an toàn, chưa có cảnh báo nào được kích hoạt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {triggeredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                        alert.isRead
                          ? 'bg-white border-gray-100 opacity-75'
                          : 'bg-amber-50/40 border-amber-200/80 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl mt-0.5 ${
                            alert.isRead ? 'bg-gray-100 text-gray-500' : 'bg-amber-500 text-white'
                          }`}
                        >
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                              {alert.ruleName}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">• {alert.platform}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Điểm Viral: {alert.viralScore}/100
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1">{alert.title}</p>
                          <span className="text-[11px] text-gray-400 mt-1 inline-block">
                            {new Date(alert.detectedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkAlertRead(alert.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        {alert.sourceUrl && (
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Xem nguồn gốc"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rules Configuration Panel (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  Quy Tắc Ngưỡng Cảnh Báo
                </h3>
                <button
                  onClick={() => setShowCreateRuleModal(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm mới
                </button>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{rule.name}</span>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Xóa quy tắc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Ngưỡng Viral:</span>
                      <span className="font-bold text-amber-600">≥ {rule.minViralScore} điểm</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {rule.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400 border-t border-gray-100">
                      <span>In-App: {rule.notifyInApp ? '✓' : '✗'}</span>
                      <span>Email: {rule.notifyEmail ? '✓' : '✗'}</span>
                      <span className="ml-auto text-emerald-600 font-semibold">Đang hoạt động</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                Thiết Lập Quy Tắc Cảnh Báo Xu Hướng
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tên quy tắc theo dõi
                </label>
                <input
                  type="text"
                  placeholder="VD: Cảnh báo bài viết Siêu Viral ngành F&B..."
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngưỡng điểm Viral tối thiểu</label>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {newMinScore} / 100 điểm
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
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>50 (Tăng trưởng vừa)</span>
                  <span>75 (Thịnh hành)</span>
                  <span>95 (Siêu bùng nổ)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Từ khóa / Hashtag cần theo dõi
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
                    className="flex-1 px-3.5 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {newKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg"
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
                <label className="text-xs font-semibold text-gray-700 block">Kênh nhận thông báo</label>
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
