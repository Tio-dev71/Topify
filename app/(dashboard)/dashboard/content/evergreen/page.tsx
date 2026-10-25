'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Repeat,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Plus,
  Search,
  RefreshCw,
  Film,
  ExternalLink,
  ChevronRight,
  X,
  Play,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type VideoAsset = {
  id: string;
  originalFileName: string;
  storageUrl: string;
};

type EvergreenPost = {
  id: string;
  title: string;
  caption: string | null;
  videoAssetId: string | null;
  videoAsset?: VideoAsset | null;
  media: { id: string; url: string; type: string }[];
  platforms: { platform: string; status: string }[];
  isEvergreen: boolean;
  recycleIntervalDays: number;
  lastRecycledAt: string | null;
  recycleCount: number;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  daysSinceLastPublished: number;
  isDue: boolean;
  createdBy: { name: string | null; email: string };
  nextRecycleDate?: string;
  daysUntilRecycle?: number;
  recycledPosts?: Array<{
    id: string;
    title: string;
    status: string;
    publishedAt: string | null;
    createdAt: string;
  }>;
};

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK_REELS: 'bg-[#1877F2]',
  FACEBOOK_POST: 'bg-[#1877F2]',
  INSTAGRAM_REELS: 'bg-pink-600',
  INSTAGRAM_CAROUSEL: 'bg-pink-600',
  YOUTUBE_SHORTS: 'bg-[#FF0000]',
  TIKTOK_VIDEO: 'bg-black dark:bg-white dark:text-black',
  ZALO_POST: 'bg-blue-600',
};

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK_REELS: 'FB Reels',
  FACEBOOK_POST: 'FB Post',
  INSTAGRAM_REELS: 'IG Reels',
  INSTAGRAM_CAROUSEL: 'IG Carousel',
  YOUTUBE_SHORTS: 'Shorts',
  TIKTOK_VIDEO: 'TikTok',
  ZALO_POST: 'Zalo',
};

export default function EvergreenContentPage() {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'library'>('suggestions');
  const [hasUserSwitchedTab, setHasUserSwitchedTab] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState({
    totalEvergreen: 0,
    dueCount: 0,
    totalRecycled: 0,
  });
  const [suggestions, setSuggestions] = useState<EvergreenPost[]>([]);
  const [library, setLibrary] = useState<EvergreenPost[]>([]);

  // Modal State for Recycling
  const [selectedPost, setSelectedPost] = useState<EvergreenPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCaption, setModalCaption] = useState('');
  const [modalScheduledDate, setModalScheduledDate] = useState('');
  const [modalScheduledTime, setModalScheduledTime] = useState('');
  const [modalPublishMode, setModalPublishMode] = useState<'schedule' | 'now' | 'draft'>('schedule');
  const [modalPlatforms, setModalPlatforms] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvergreenData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/evergreen?tab=all&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || { totalEvergreen: 0, dueCount: 0, totalRecycled: 0 });
        setSuggestions(data.suggestions || []);
        setLibrary(data.library || []);
        if (activeTab === 'suggestions' && data.metrics?.dueCount === 0 && data.metrics?.totalEvergreen > 0 && !hasUserSwitchedTab) {
          setActiveTab('library');
        }
      } else {
        toast.error('Không thể tải danh sách nội dung Evergreen');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvergreenData();
  }, [search]);

  // Open recycle modal
  const handleOpenRecycleModal = (post: EvergreenPost) => {
    setSelectedPost(post);
    setModalTitle(post.title ? `${post.title} (Tái bản)` : '');
    setModalCaption(post.caption || '');
    
    // Default scheduled time to tomorrow at 09:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setModalScheduledDate(dateStr);
    setModalScheduledTime('09:00');
    setModalPublishMode('schedule');
    setModalPlatforms(post.platforms.map(p => p.platform));
    setModalOpen(true);
  };

  // AI spin caption
  const handleAiSpin = async () => {
    if (!modalCaption) {
      toast.error('Chưa có caption để viết lại');
      return;
    }
    setIsSpinning(true);
    try {
      const res = await fetch('/api/content/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: modalCaption, count: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants && data.variants.length > 0) {
          setModalCaption(data.variants[0]);
          toast.success('Đã làm mới caption bằng AI ✨');
        }
      } else {
        toast.error('Lỗi khi gọi AI Spin');
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi tối ưu AI');
    } finally {
      setIsSpinning(false);
    }
  };

  // Submit recycle
  const handleSubmitRecycle = async () => {
    if (!selectedPost) return;

    if (modalPublishMode === 'schedule' && (!modalScheduledDate || !modalScheduledTime)) {
      toast.error('Vui lòng chọn ngày và giờ lên lịch');
      return;
    }

    if (modalPublishMode !== 'draft' && modalPlatforms.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 nền tảng đăng bài');
      return;
    }

    let scheduledAt = null;
    if (modalPublishMode === 'schedule') {
      scheduledAt = new Date(`${modalScheduledDate}T${modalScheduledTime}`).toISOString();
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/content/evergreen/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          newTitle: modalTitle,
          newCaption: modalCaption,
          newScheduledAt: scheduledAt,
          publishMode: modalPublishMode,
          platforms: modalPlatforms,
        }),
      });

      if (res.ok) {
        toast.success('Tái bản bài viết thành công! Đã thêm vào lịch đăng.');
        setModalOpen(false);
        fetchEvergreenData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Có lỗi khi tái bản bài viết');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Evergreen status
  const handleToggleEvergreen = async (post: EvergreenPost, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/content/posts/${post.id}/evergreen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEvergreen: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus ? 'Đã thêm vào kho Evergreen' : 'Đã bỏ khỏi kho Evergreen');
        fetchEvergreenData();
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  // Update Interval Days
  const handleUpdateInterval = async (post: EvergreenPost, days: number) => {
    try {
      const res = await fetch(`/api/content/posts/${post.id}/evergreen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recycleIntervalDays: days }),
      });
      if (res.ok) {
        toast.success(`Đã đổi chu kỳ sang ${days} ngày`);
        fetchEvergreenData();
      }
    } catch (err) {
      toast.error('Lỗi khi đổi chu kỳ');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] pb-24 text-slate-900 dark:text-slate-100">
      <div className="relative pt-8 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto space-y-8">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <Repeat className="w-4 h-4" />
              <span>M2. Content Studio</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Evergreen & Recycle Content
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tự động gợi ý & tái sử dụng các bài viết trường tồn theo chu kỳ, tối ưu hóa lượt reach mà không mất công viết lại từ đầu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/content/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bài Viết Mới</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kho Bài Evergreen</p>
              <p className="text-2xl font-black mt-0.5">{metrics.totalEvergreen}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nội dung có giá trị lâu dài</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center gap-4 relative overflow-hidden"
          >
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Đề Xuất Hôm Nay</span>
                {metrics.dueCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </p>
              <p className="text-2xl font-black mt-0.5 text-amber-600 dark:text-amber-400">{metrics.dueCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bài viết đã qua chu kỳ, sẵn sàng tái bản</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Lượt Đã Tái Bản</p>
              <p className="text-2xl font-black mt-0.5">{metrics.totalRecycled}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tiết kiệm 85% thời gian sáng tạo</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('suggestions');
                setHasUserSwitchedTab(true);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đề Xuất Tái Bản</span>
              {suggestions.length > 0 && (
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'suggestions' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {suggestions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('library');
                setHasUserSwitchedTab(true);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Kho Evergreen</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'library' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {library.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-xs text-slate-400 mt-3 font-medium">Đang tải dữ liệu nội dung...</p>
          </div>
        ) : activeTab === 'suggestions' ? (
          /* Suggestions Queue Tab */
          <div>
            {suggestions.length === 0 ? (
              <div className="py-16 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 max-w-xl mx-auto p-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Lịch nội dung đang ở trạng thái tối ưu!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Hiện chưa có bài Evergreen nào đến hạn tái bản hôm nay. Hệ thống sẽ tự động quét và gợi ý ngay khi đến hạn chu kỳ.
                </p>
                <button
                  onClick={() => setActiveTab('library')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  Xem toàn bộ kho Evergreen ({library.length})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col justify-between rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/40 p-5 shadow-xs hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300"
                  >
                    <div className="space-y-3">
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          <Clock className="w-3 h-3" />
                          Đã đăng cách đây {post.daysSinceLastPublished} ngày
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          Tái bản: {post.recycleCount} lần
                        </span>
                      </div>

                      {/* Video / Media thumbnail */}
                      {post.videoAsset?.storageUrl ? (
                        <div className="relative aspect-video rounded-2xl bg-black overflow-hidden group">
                          <video src={post.videoAsset.storageUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400">
                          <Film className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      {/* Title & snippet */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {post.title}
                        </h4>
                        {post.caption && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {post.caption}
                          </p>
                        )}
                      </div>

                      {/* Platforms */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.platforms.map((p) => (
                          <span
                            key={p.platform}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                              PLATFORM_COLORS[p.platform] || 'bg-slate-600'
                            }`}
                          >
                            {PLATFORM_LABELS[p.platform] || p.platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRecycleModal(post)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Tái Bản & Lên Lịch</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Evergreen Library Tab */
          <div>
            {library.length === 0 ? (
              <div className="py-16 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 max-w-xl mx-auto p-8">
                <Repeat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Chưa có bài viết nào trong kho Evergreen
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Khi tạo bài viết mới hoặc quản lý bài đã đăng, hãy bật công tắc "Đánh dấu Evergreen" để đưa vào kho trường tồn.
                </p>
                <Link
                  href="/dashboard/content/create"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo bài viết mới ngay</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {library.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Media badge */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {post.videoAsset?.storageUrl ? (
                          <Film className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Repeat className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {post.title}
                          </h4>
                          {post.isDue && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Đến hạn tái bản
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {post.caption || 'Không có caption'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>
                            {post.daysSinceLastPublished === 0
                              ? 'Đăng gần nhất: Vừa mới đăng hôm nay'
                              : `Đã đăng: ${post.daysSinceLastPublished} ngày trước`}
                          </span>
                          <span>•</span>
                          <span>Đã tái bản: {post.recycleCount} lần</span>
                          {post.nextRecycleDate && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Tự động tái bản: {new Date(post.nextRecycleDate).toLocaleDateString('vi-VN')} (còn {post.daysUntilRecycle ?? post.recycleIntervalDays} ngày)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* Interval selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Chu kỳ:</span>
                        <select
                          value={post.recycleIntervalDays || 30}
                          onChange={(e) => handleUpdateInterval(post, Number(e.target.value))}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                        >
                          <option value={15}>15 ngày</option>
                          <option value={30}>30 ngày</option>
                          <option value={45}>45 ngày</option>
                          <option value={60}>60 ngày</option>
                          <option value={90}>90 ngày</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleOpenRecycleModal(post)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Tái bản ngay
                      </button>

                      <button
                        onClick={() => handleToggleEvergreen(post, false)}
                        title="Bỏ khỏi kho Evergreen"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Tái Bản Bài Viết */}
        <AnimatePresence>
          {modalOpen && selectedPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Tái Bản & Lên Lịch Bài Viết
                      </h3>
                      <p className="text-xs text-slate-500">
                        Bài gốc: "{selectedPost.title}"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tiêu đề bài viết mới
                    </label>
                    <input
                      type="text"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nội dung Caption
                      </label>
                      <button
                        type="button"
                        onClick={handleAiSpin}
                        disabled={isSpinning || !modalCaption}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Wand2 className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
                        <span>{isSpinning ? 'Đang viết lại...' : 'AI Spin (Tránh trùng lặp)'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={modalCaption}
                      onChange={(e) => setModalCaption(e.target.value)}
                      className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Hình thức xuất bản
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setModalPublishMode('schedule')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          modalPublishMode === 'schedule'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Lên lịch
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPublishMode('now')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          modalPublishMode === 'now'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Đăng ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPublishMode('draft')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          modalPublishMode === 'draft'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Lưu bản nháp
                      </button>
                    </div>
                  </div>

                  {/* Scheduled date & time */}
                  {modalPublishMode === 'schedule' && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500">Ngày đăng</label>
                        <input
                          type="date"
                          value={modalScheduledDate}
                          onChange={(e) => setModalScheduledDate(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500">Giờ đăng</label>
                        <input
                          type="time"
                          value={modalScheduledTime}
                          onChange={(e) => setModalScheduledTime(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRecycle}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Xác Nhận Tái Bản</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
