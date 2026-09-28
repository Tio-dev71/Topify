'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  ExternalLink, 
  Clock, 
  Activity, 
  Info, 
  Sparkles, 
  X, 
  ArrowUpRight,
  BarChart3,
  HelpCircle,
  Newspaper,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type Keyword = {
  id: string;
  keyword: string;
  volume: number;
  trend: string | null;
  mentionCount?: number;
  createdAt: string;
};

type MentionItem = {
  id: string;
  title: string;
  message: string | null;
  sourceUrl: string | null;
  keyword: string | null;
  createdAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
};

type KeywordDetailData = {
  tracker: Keyword | null;
  keyword: string;
  volume: number;
  trend: string;
  trendRate: string;
  competitionLevel: string;
  competitionIndex: number;
  metricsExplanation: {
    volumeTitle: string;
    volumeValue: string;
    volumeDescription: string;
    trendTitle: string;
    trendValue: string;
    trendDescription: string;
    competitionTitle: string;
    competitionValue: string;
    competitionDescription: string;
  };
  stats: {
    totalMentions: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  };
  relatedKeywords: Array<{
    text: string;
    volume: number;
    trend?: number;
    competition?: string;
  }>;
  mentions: MentionItem[];
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  // Detail Modal State
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<KeywordDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'mentions' | 'insights' | 'related'>('mentions');
  const [mentionSentimentFilter, setMentionSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [syncingDetail, setSyncingDetail] = useState(false);

  // Edit Keyword State
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [editKeywordForm, setEditKeywordForm] = useState({ keyword: '', volume: 0, trend: 'FLAT' });
  const [updatingKeyword, setUpdatingKeyword] = useState(false);

  const handleOpenEditKeyword = (kw: Keyword, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingKeyword(kw);
    setEditKeywordForm({
      keyword: kw.keyword,
      volume: kw.volume,
      trend: kw.trend || 'FLAT'
    });
  };

  const handleUpdateKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword) return;
    if (!editKeywordForm.keyword.trim()) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }
    setUpdatingKeyword(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingKeyword.id,
          keyword: editKeywordForm.keyword.trim(),
          volume: editKeywordForm.volume,
          trend: editKeywordForm.trend
        })
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success('Cập nhật từ khóa thành công');
        setKeywords(prev => prev.map(k => k.id === updated.id ? { ...k, ...updated } : k));
        setEditingKeyword(null);
      } else {
        toast.error('Lỗi khi cập nhật từ khóa');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật từ khóa');
    } finally {
      setUpdatingKeyword(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch('/api/keywords');
      if (res.ok) {
        const data = await res.json();
        setKeywords(data.keywords || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách từ khóa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/keywords')
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setKeywords(data.keywords || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoading(false);
          toast.error('Lỗi khi tải danh sách từ khóa');
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenDetail = async (id: string, keywordStr?: string) => {
    setSelectedKeywordId(id);
    setDetailLoading(true);
    setDetailData(null);
    setActiveDetailTab('mentions');
    setMentionSentimentFilter('all');

    try {
      const queryParam = id ? `id=${id}` : `keyword=${encodeURIComponent(keywordStr || '')}`;
      const res = await fetch(`/api/keywords/detail?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      } else {
        toast.error('Không thể tải chi tiết kết quả từ khóa');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải chi tiết từ khóa');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSyncSingleKeyword = async (id: string, keywordName: string) => {
    setSyncingDetail(true);
    try {
      const res = await fetch(`/api/keywords/sync?id=${id}`, { method: 'POST' });
      if (res.ok) {
        toast.success(`Đã cập nhật bài viết & số liệu mới cho "${keywordName}"`);
        // Refresh detail view
        await handleOpenDetail(id, keywordName);
        // Refresh list
        fetchKeywords();
      } else {
        toast.error('Lỗi khi đồng bộ từ khóa');
      }
    } catch {
      toast.error('Lỗi kết nối khi đồng bộ');
    } finally {
      setSyncingDetail(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKw = newKeyword.trim();
    if (!cleanKw) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: cleanKw })
      });

      if (res.ok) {
        const createdKeyword = await res.json();
        toast.success(`Đã thêm từ khóa "${cleanKw}". Hệ thống đã thu thập số liệu & bài viết ban đầu!`);
        setShowAddModal(false);
        setNewKeyword('');
        await fetchKeywords();
        // Immediately open the details view so the user can see what Topify collected!
        if (createdKeyword?.id) {
          handleOpenDetail(createdKeyword.id, cleanKw);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm từ khóa');
      }
    } catch {
      toast.error('Lỗi khi lưu từ khóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKeyword = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa từ khóa này khỏi danh sách theo dõi?')) return;
    
    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa từ khóa');
        if (selectedKeywordId === id) {
          setSelectedKeywordId(null);
          setDetailData(null);
        }
        fetchKeywords();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  const renderTrendIcon = (trend: string | null) => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  const totalVolume = keywords.reduce((sum, kw) => sum + (kw.volume || 0), 0);
  const totalCollectedMentions = keywords.reduce((sum, kw) => sum + (kw.mentionCount || 0), 0);

  const filteredMentions = detailData?.mentions.filter(m => {
    if (mentionSentimentFilter === 'all') return true;
    return m.sentiment === mentionSentimentFilter;
  }) || [];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Social Listening & Market Intelligence
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-foreground)] tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Key className="w-6 h-6" />
            </div>
            Theo Dõi Từ Khóa
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-2xl">
            Theo dõi xu hướng tìm kiếm Google, khối lượng thảo luận và tự động thu thập các bài viết, tin tức liên quan theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/keywords/sync', { method: 'POST' });
                if (res.ok) {
                  toast.success('Đồng bộ khối lượng tìm kiếm và bài viết thành công');
                  fetchKeywords();
                } else {
                  toast.error('Lỗi khi đồng bộ dữ liệu');
                  setLoading(false);
                }
              } catch {
                toast.error('Lỗi khi đồng bộ dữ liệu');
                setLoading(false);
              }
            }} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] transition-all font-medium text-sm text-[var(--color-foreground)] shadow-sm"
            title="Đồng bộ lại khối lượng tìm kiếm và bài viết mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Từ Khóa</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Từ Khóa Theo Dõi</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-foreground)]">
            {keywords.length}
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Đang chủ động giám sát trên hệ thống
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lượng Tìm Kiếm Hàng Tháng</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-foreground)]">
            {totalVolume.toLocaleString('vi-VN')}
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Lượt tìm kiếm Google trung bình mỗi tháng
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bài Viết & Đề Cập Đã Thu Thập</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Newspaper className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {totalCollectedMentions}
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Bài viết tin tức & thảo luận được quét về
          </p>
        </div>
      </div>

      {/* Main Keywords Table */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--color-foreground)]">
              Danh Sách Từ Khóa Đang Theo Dõi
            </h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Click vào từng dòng hoặc nút &ldquo;Chi tiết&rdquo; để xem các bài viết thu thập được và giải thích số liệu.
            </p>
          </div>
          <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
            💡 Gợi ý: Bấm vào từ khóa để mở rộng chi tiết nội dung
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-muted)]/60 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap min-w-[220px]">Từ Khóa</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[200px]">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span>Khối Lượng Tìm Kiếm</span>
                    <span 
                      className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Số lượt tìm kiếm trung bình mỗi tháng của người dùng Việt Nam trên Google (Google Keyword Insights)"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[150px]">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span>Xu Hướng</span>
                    <span 
                      className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Mức độ tăng trưởng hay giảm sút nhu cầu tìm kiếm trong 3 tháng gần nhất"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[180px]">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span>Nội Dung Thu Thập</span>
                    <span 
                      className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Tổng số bài viết tin tức, thảo luận và đề cập mà Topify đã quét được cho từ khóa này"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[130px]">Ngày Thêm</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap w-[160px]">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Đang tải danh sách từ khóa và bài viết...</span>
                    </div>
                  </td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="p-3 w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                        <Key className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-base text-[var(--color-foreground)]">Chưa có từ khóa nào được theo dõi</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Nhập từ khóa thương hiệu, sản phẩm hoặc chủ đề bạn muốn theo dõi để bắt đầu thu thập dữ liệu tự động.
                      </p>
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm từ khóa đầu tiên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                keywords.map(kw => (
                  <tr 
                    key={kw.id} 
                    onClick={() => handleOpenDetail(kw.id, kw.keyword)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 min-w-[220px] max-w-[320px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform shrink-0" />
                        <span 
                          title={kw.keyword}
                          className="font-bold text-base text-[var(--color-foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate block"
                        >
                          {kw.keyword}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap w-[200px]">
                      <div className="whitespace-nowrap">
                        <span className="font-bold text-[var(--color-foreground)]">
                          {kw.volume > 0 ? kw.volume.toLocaleString('vi-VN') : 'Đang phân tích...'}
                        </span>
                        {kw.volume > 0 && (
                          <span className="text-xs text-[var(--color-muted-foreground)] ml-1">
                            lượt/tháng
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap w-[150px]">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {renderTrendIcon(kw.trend)}
                        <span>
                          {kw.trend === 'UP' ? 'Tăng trưởng' : kw.trend === 'DOWN' ? 'Giảm' : 'Ổn định'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap w-[180px]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(kw.id, kw.keyword);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
                      >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>
                          {kw.mentionCount !== undefined && kw.mentionCount > 0 
                            ? `${kw.mentionCount} bài viết` 
                            : 'Xem chi tiết'}
                        </span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-xs text-[var(--color-muted-foreground)] whitespace-nowrap w-[130px]">
                      {new Date(kw.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap w-[160px]">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenDetail(kw.id, kw.keyword)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                          title="Xem chi tiết kết quả & bài viết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={(e) => handleOpenEditKeyword(kw, e)}
                          className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors"
                          title="Chỉnh sửa từ khóa & số liệu"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleSyncSingleKeyword(kw.id, kw.keyword)}
                          className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                          title="Đồng bộ lại từ khóa này"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={(e) => handleDeleteKeyword(kw.id, e)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                          title="Xóa từ khóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER: View Collected Content & Explain Metrics */}
      <AnimatePresence>
        {selectedKeywordId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-4xl border border-[var(--color-border)] overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-start justify-between gap-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                      Chi Tiết Thu Thập & Giải Thích Số Liệu
                    </span>
                    {detailData?.trend && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {renderTrendIcon(detailData.trend)}
                        {detailData.trend === 'UP' ? 'Đang tăng trưởng' : 'Ổn định'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-[var(--color-foreground)] flex items-center gap-2">
                    <span>#</span>
                    <span>{detailData?.keyword || 'Đang tải...'}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {detailData && (
                    <button
                      onClick={() => handleSyncSingleKeyword(selectedKeywordId, detailData.keyword)}
                      disabled={syncingDetail}
                      className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Quét lại nội dung mới nhất"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingDetail ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedKeywordId(null);
                      setDetailData(null);
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 px-6 border-b border-[var(--color-border)] bg-[var(--color-card)]/50 shrink-0 text-sm font-semibold">
                <button
                  onClick={() => setActiveDetailTab('mentions')}
                  className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                    activeDetailTab === 'mentions'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>Bài Viết & Đề Cập Thu Thập</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {detailData?.mentions.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('insights')}
                  className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                    activeDetailTab === 'insights'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Giải Thích Số Liệu Tổng</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('related')}
                  className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                    activeDetailTab === 'related'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Từ Khóa Liên Quan</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {detailData?.relatedKeywords.length || 0}
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {detailLoading ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Đang thu thập và phân tích kết quả từ khóa...</p>
                    <p className="text-xs text-zinc-500">Đang truy vấn Google Insights & Real-Time News Data</p>
                  </div>
                ) : !detailData ? (
                  <div className="py-16 text-center text-zinc-500">
                    Không tìm thấy thông tin từ khóa này.
                  </div>
                ) : (
                  <>
                    {/* TAB 1: MENTIONS & COLLECTED CONTENT */}
                    {activeDetailTab === 'mentions' && (
                      <div className="space-y-4">
                        {/* Sentiment Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-[var(--color-border)]">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-zinc-500 mr-1">Bộ lọc sắc thái:</span>
                            <button
                              onClick={() => setMentionSentimentFilter('all')}
                              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                                mentionSentimentFilter === 'all'
                                  ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white'
                                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                              }`}
                            >
                              Tất cả ({detailData.mentions.length})
                            </button>
                            <button
                              onClick={() => setMentionSentimentFilter('positive')}
                              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                                mentionSentimentFilter === 'positive'
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              Tích cực ({detailData.stats.positiveCount})
                            </button>
                            <button
                              onClick={() => setMentionSentimentFilter('negative')}
                              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                                mentionSentimentFilter === 'negative'
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              }`}
                            >
                              Tiêu cực ({detailData.stats.negativeCount})
                            </button>
                            <button
                              onClick={() => setMentionSentimentFilter('neutral')}
                              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                                mentionSentimentFilter === 'neutral'
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                              }`}
                            >
                              Trung tính ({detailData.stats.neutralCount})
                            </button>
                          </div>

                          <Link
                            href={`/dashboard/social/alerts?keyword=${encodeURIComponent(detailData.keyword)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <span>Mở trong Cảnh Báo Đề Cập</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* List of Mentions */}
                        {filteredMentions.length === 0 ? (
                          <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-border)] space-y-3">
                            <Newspaper className="w-8 h-8 text-zinc-400 mx-auto" />
                            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                              Chưa có bài viết nào phù hợp với bộ lọc
                            </p>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                              Bấm nút bên dưới để hệ thống quét bài viết báo chí và mạng xã hội mới nhất cho từ khóa này.
                            </p>
                            <button
                              onClick={() => handleSyncSingleKeyword(selectedKeywordId, detailData.keyword)}
                              disabled={syncingDetail}
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingDetail ? 'animate-spin' : ''}`} />
                              Quét bài viết ngay
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredMentions.map(mention => (
                              <div
                                key={mention.id}
                                className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-bold text-base text-[var(--color-foreground)] leading-snug">
                                    {mention.title}
                                  </h4>
                                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    mention.sentiment === 'positive'
                                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : mention.sentiment === 'negative'
                                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                                      : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                    {mention.sentiment === 'positive' ? 'Tích cực' : mention.sentiment === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                                  </span>
                                </div>

                                {mention.message && (
                                  <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3 leading-relaxed">
                                    {mention.message}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)] text-xs text-zinc-500">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>{new Date(mention.createdAt).toLocaleDateString('vi-VN')} {new Date(mention.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                  </div>

                                  {mention.sourceUrl && (
                                    <a
                                      href={mention.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                    >
                                      <span>Xem bài viết gốc</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: METRICS & EXPLANATION */}
                    {activeDetailTab === 'insights' && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-3">
                          <Info className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm mb-1">Tại sao có các số liệu tổng này?</p>
                            <p className="leading-relaxed">
                              Các chỉ số bên dưới được tính toán tự động dựa trên dữ liệu Google Keyword Insights và cơ chế Social Listening của Topify. Chúng giúp bạn đánh giá được mức độ quan tâm của thị trường và sức nóng của từ khóa trước khi ra quyết định nội dung hoặc chiến dịch quảng cáo.
                            </p>
                          </div>
                        </div>

                        {/* Metric Breakdown Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                              {detailData.metricsExplanation.volumeTitle}
                            </span>
                            <div className="text-2xl font-black text-[var(--color-foreground)]">
                              {detailData.metricsExplanation.volumeValue}
                            </div>
                            <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed pt-2 border-t border-[var(--color-border)]">
                              {detailData.metricsExplanation.volumeDescription}
                            </p>
                          </div>

                          <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                              {detailData.metricsExplanation.trendTitle}
                            </span>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              {renderTrendIcon(detailData.trend)}
                              <span>{detailData.metricsExplanation.trendValue}</span>
                            </div>
                            <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed pt-2 border-t border-[var(--color-border)]">
                              {detailData.metricsExplanation.trendDescription}
                            </p>
                          </div>

                          <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                              {detailData.metricsExplanation.competitionTitle}
                            </span>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                              {detailData.metricsExplanation.competitionValue}
                            </div>
                            <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed pt-2 border-t border-[var(--color-border)]">
                              {detailData.metricsExplanation.competitionDescription}
                            </p>
                          </div>
                        </div>

                        {/* Additional Insight Note */}
                        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-[var(--color-border)] space-y-3">
                          <h4 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            <span>Đánh giá của hệ thống về từ khóa &ldquo;{detailData.keyword}&rdquo;</span>
                          </h4>
                          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                            Từ khóa này đang có dung lượng tìm kiếm đạt <strong>{detailData.volume.toLocaleString('vi-VN')} lượt/tháng</strong> với xu hướng <strong>{detailData.trend === 'UP' ? 'tăng trưởng tích cực' : 'ổn định'}</strong>. Trong hệ thống Social Listening, Topify đã ghi nhận <strong>{detailData.stats.totalMentions} bài viết</strong> thảo luận liên quan, trong đó có <strong>{detailData.stats.positiveCount} bài tích cực</strong> và <strong>{detailData.stats.negativeCount} bài cần chú ý</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: RELATED KEYWORDS */}
                    {activeDetailTab === 'related' && (
                      <div className="space-y-4">
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Các từ khóa mở rộng liên quan mật thiết đến &ldquo;{detailData.keyword}&rdquo; được người dùng tìm kiếm nhiều nhất trên Google. Bạn có thể thêm ngay vào danh sách theo dõi.
                        </p>

                        {detailData.relatedKeywords.length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 text-xs">
                            Chưa tìm thấy từ khóa mở rộng liên quan.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {detailData.relatedKeywords.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all flex items-center justify-between gap-3"
                              >
                                <div>
                                  <span className="font-bold text-sm text-[var(--color-foreground)] block">
                                    {item.text}
                                  </span>
                                  <span className="text-xs text-zinc-500">
                                    {item.volume.toLocaleString('vi-VN')} lượt/tháng
                                  </span>
                                </div>

                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/keywords', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ keyword: item.text })
                                      });
                                      if (res.ok) {
                                        toast.success(`Đã thêm "${item.text}" vào danh sách theo dõi!`);
                                        fetchKeywords();
                                      } else {
                                        toast.error('Lỗi khi thêm từ khóa');
                                      }
                                    } catch {
                                      toast.error('Lỗi kết nối khi thêm từ khóa');
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                                >
                                  + Theo dõi
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-card)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-zinc-500">
                  Dữ liệu được cập nhật tự động qua Topify Real-Time Engine
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKeywordId(null);
                      setDetailData(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Đóng
                  </button>
                  {detailData && (
                    <Link
                      href={`/dashboard/social/alerts?keyword=${encodeURIComponent(detailData.keyword)}`}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                    >
                      <span>Xem toàn bộ cảnh báo đề cập</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD KEYWORD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">Thêm Từ Khóa Theo Dõi</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddKeyword} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-[var(--color-foreground)]">
                    Từ khóa hoặc Tên thương hiệu *
                  </label>
                  <input 
                    type="text" 
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    placeholder="VD: marketing, VinFast, bất động sản..."
                    className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                    required
                    autoFocus
                  />
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Quy trình tự động của Topify:
                    </p>
                    <p>
                      1. Truy vấn khối lượng tìm kiếm và xu hướng tăng/giảm từ Google Insights.
                    </p>
                    <p>
                      2. Tự động quét và thu thập các bài viết tin tức, thảo luận ban đầu về từ khóa này để hiển thị ngay chi tiết cho bạn.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang phân tích & thu thập...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Bắt Đầu Theo Dõi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT KEYWORD MODAL */}
        {editingKeyword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-card)] rounded-2xl shadow-2xl w-full max-w-md border border-[var(--color-border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-amber-500" />
                    Chỉnh Sửa Từ Khóa
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    Cập nhật từ khóa, lượng tìm kiếm và xu hướng
                  </p>
                </div>
                <button 
                  onClick={() => setEditingKeyword(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateKeyword} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                    Từ khóa theo dõi *
                  </label>
                  <input 
                    type="text" 
                    value={editKeywordForm.keyword}
                    onChange={e => setEditKeywordForm({ ...editKeywordForm, keyword: e.target.value })}
                    placeholder="VD: marketing, seo, trí tuệ nhân tạo..."
                    className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-[var(--color-foreground)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                    Lượng tìm kiếm ước tính hàng tháng (Volume)
                  </label>
                  <input 
                    type="number" 
                    value={editKeywordForm.volume}
                    onChange={e => setEditKeywordForm({ ...editKeywordForm, volume: parseInt(e.target.value, 10) || 0 })}
                    placeholder="VD: 40500"
                    className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-[var(--color-foreground)]"
                  />
                  <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                    Lượng tìm kiếm trung bình mỗi tháng trên công cụ tìm kiếm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                    Xu hướng tìm kiếm (Trend)
                  </label>
                  <select 
                    value={editKeywordForm.trend}
                    onChange={e => setEditKeywordForm({ ...editKeywordForm, trend: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-[var(--color-foreground)]"
                  >
                    <option value="UP">Tăng trưởng (UP)</option>
                    <option value="FLAT">Ổn định (FLAT)</option>
                    <option value="DOWN">Giảm (DOWN)</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-3 justify-end border-t border-[var(--color-border)]">
                  <button 
                    type="button"
                    onClick={() => setEditingKeyword(null)}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingKeyword}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
                  >
                    {updatingKeyword ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
