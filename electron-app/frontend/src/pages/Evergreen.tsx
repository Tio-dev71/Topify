import { useState, useEffect } from 'react';
import {
  Repeat,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Search,
  RefreshCw,
  Film,
  Send,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/axios';
import { PLATFORM_CONFIG } from '../lib/utils';

type Platform = keyof typeof PLATFORM_CONFIG;

interface EvergreenPost {
  id: string;
  title: string;
  caption: string | null;
  videoAssetId: string | null;
  videoAsset?: {
    id: string;
    originalFileName: string;
    storageUrl: string;
  } | null;
  media: { id: string; url: string; type: string }[];
  platforms: { platform: string; status: string }[];
  isEvergreen: boolean;
  recycleIntervalDays: number;
  lastRecycledAt: string | null;
  recycleCount: number;
  publishedAt: string | null;
  createdAt: string;
  daysSinceLastPublished: number;
  isDue: boolean;
  daysOverdue: number;
  status?: string;
  nextRecycleDate?: string;
  daysUntilRecycle?: number;
  recycledPosts?: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt?: string | null;
    publishedAt: string | null;
    createdAt: string;
  }>;
}

export default function Evergreen() {
  const [tab, setTab] = useState<'suggestions' | 'library'>('suggestions');
  const [hasUserSwitchedTab, setHasUserSwitchedTab] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<EvergreenPost[]>([]);
  const [metrics, setMetrics] = useState({
    totalEvergreen: 0,
    dueCount: 0,
    totalRecycled: 0,
  });

  // Recycle Modal state
  const [selectedPost, setSelectedPost] = useState<EvergreenPost | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPublishMode, setNewPublishMode] = useState<'now' | 'schedule'>('now');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvergreenPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/content/evergreen', {
        params: { tab, search: search.trim() },
      });
      if (res.data) {
        setPosts(res.data.items || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
          // If on suggestions tab and no posts are due yet, but library has evergreen posts, smart-switch to library tab
          if (tab === 'suggestions' && res.data.metrics.dueCount === 0 && res.data.metrics.totalEvergreen > 0 && !hasUserSwitchedTab) {
            setTab('library');
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load evergreen posts:', err);
      toast.error('Không thể tải danh sách Evergreen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvergreenPosts();
  }, [tab, search]);

  const handleOpenRecycleModal = (post: EvergreenPost) => {
    setSelectedPost(post);
    setNewTitle(post.title);
    setNewCaption(post.caption || '');
    setNewPublishMode('now');
    setNewScheduledAt('');
    setSelectedPlatforms(post.platforms.map((p) => p.platform));
  };

  const handleTogglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSpinCaption = async () => {
    setIsSpinning(true);
    try {
      const res = await api
        .post('/ai/spin-caption', {
          title: newTitle,
          caption: newCaption,
        })
        .catch(() => null);

      if (res?.data?.newCaption) {
        setNewCaption(res.data.newCaption);
        toast.success('Đã viết lại Caption thành công bằng AI!');
      } else {
        const hooks = [
          '🔥 Bí quyết tái đăng: ',
          '💡 Chia sẻ lại cùng bạn: ',
          '✨ Top kiến thức không bao giờ lỗi thời: ',
          '🚀 Đừng bỏ lỡ video cực hay này: ',
        ];
        const cleanExisting = newCaption ? newCaption.replace(/^[🔥💡✨🚀]\s*/u, '').trim() : '';
        const safeExisting = typeof cleanExisting.toWellFormed === 'function' ? cleanExisting.toWellFormed().replace(/\uFFFD/g, '') : cleanExisting;
        const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
        setNewCaption(safeExisting ? `${randomHook}${safeExisting}` : randomHook);
        toast.success('Đã làm mới biến thể Caption!');
      }
    } catch {
      toast.error('Không thể làm mới caption');
    } finally {
      setIsSpinning(false);
    }
  };

  const sanitizeClientText = (val: string | null | undefined): string | null => {
    if (!val) return null;
    const wellFormed = typeof val.toWellFormed === 'function' ? val.toWellFormed() : val;
    const cleaned = wellFormed.replace(/\uFFFD/g, '').trim();
    return cleaned || null;
  };

  const handleConfirmRecycle = async () => {
    if (!selectedPost) return;
    if (selectedPlatforms.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 nền tảng phân phối.');
      return;
    }
    if (newPublishMode === 'schedule' && !newScheduledAt) {
      toast.error('Vui lòng chọn thời gian hẹn giờ tái đăng.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/content/evergreen/recycle', {
        postId: selectedPost.id,
        newTitle: sanitizeClientText(newTitle) || selectedPost.title,
        newCaption: sanitizeClientText(newCaption),
        publishMode: newPublishMode,
        newScheduledAt: newPublishMode === 'schedule' ? new Date(newScheduledAt).toISOString() : null,
        platforms: selectedPlatforms,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(
          newPublishMode === 'now'
            ? 'Đã khởi chạy tái xuất bản bài viết ngay!'
            : 'Đã lên lịch tái xuất bản bài viết thành công!'
        );
        setSelectedPost(null);
        fetchEvergreenPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tái đăng bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableEvergreen = async (post: EvergreenPost) => {
    try {
      await api.patch(`/content/posts/${post.id}/evergreen`, {
        isEvergreen: false,
      });
      toast.success('Đã tắt trạng thái Evergreen cho bài viết.');
      fetchEvergreenPosts();
    } catch {
      toast.error('Không thể cập nhật trạng thái Evergreen');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Nội dung Evergreen (Tái đăng định kỳ)
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Quản lý các bài viết có giá trị dài hạn và tự động tái xuất bản theo chu kỳ mà không sợ bóp tương tác.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEvergreenPosts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng bài Evergreen</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{metrics.totalEvergreen}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đến hạn tái đăng</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{metrics.dueCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt đã tái đăng</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{metrics.totalRecycled}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setTab('suggestions');
              setHasUserSwitchedTab(true);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'suggestions'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🔥 Cần tái đăng ({metrics.dueCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('library');
              setHasUserSwitchedTab(true);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'library'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📚 Thư viện bài ({metrics.totalEvergreen})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả..."
            className="input-apple text-xs pl-9 pr-4 py-2 bg-white border border-gray-200 w-full rounded-xl"
          />
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách bài viết...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
          <Repeat className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">Chưa có bài viết nào</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {tab === 'suggestions'
              ? 'Tuyệt vời! Hiện không có bài viết nào quá hạn chu kỳ tái đăng.'
              : 'Bạn chưa có bài viết nào được đánh dấu Evergreen. Hãy bật tùy chọn Evergreen khi tạo bài viết mới.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl border bg-white p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                post.isDue ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
              }`}
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        post.isDue
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {post.isDue
                        ? `Đến hạn tái đăng (+${post.daysOverdue} ngày)`
                        : `Chu kỳ ${post.recycleIntervalDays} ngày`}
                    </span>

                    {post.status === 'PUBLISHED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đã đăng ngay
                      </span>
                    ) : post.status === 'PUBLISHING' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                        Đang xuất bản
                      </span>
                    ) : post.status === 'SCHEDULED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        <Clock className="w-3 h-3 text-purple-600" />
                        Đã lên lịch
                      </span>
                    ) : null}
                  </div>

                  <span className="text-[11px] font-semibold text-gray-400">
                    Đã tái đăng {post.recycleCount || 0} lần
                  </span>
                </div>

                {/* Video Info */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    {post.videoAsset?.storageUrl ? (
                      <Film className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Play className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-gray-900 truncate">
                      {post.title || 'Bài viết không tên'}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {post.daysSinceLastPublished === 0
                        ? 'Đăng gần nhất: Vừa mới đăng hôm nay'
                        : `Đăng gần nhất: ${post.daysSinceLastPublished} ngày trước`}
                    </p>
                  </div>
                </div>

                {/* Next Recycle Schedule Info */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50/90 px-3 py-2 rounded-xl border border-gray-100">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">
                    {post.isDue
                      ? 'Đã đến thời điểm tái đăng định kỳ'
                      : `Tự động tái đăng: ${post.nextRecycleDate ? new Date(post.nextRecycleDate).toLocaleDateString('vi-VN') : ''} (còn ${post.daysUntilRecycle ?? post.recycleIntervalDays} ngày)`}
                  </span>
                </div>

                {/* Recent Recycled Child Posts if any */}
                {post.recycledPosts && post.recycledPosts.length > 0 && (
                  <div className="pt-0.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                      <span>Bài tái đăng theo chu kỳ:</span>
                      <span className="text-indigo-600 font-bold">{post.recycledPosts.length} bài</span>
                    </div>
                    <div className="space-y-1">
                      {post.recycledPosts.slice(0, 3).map((rp) => (
                        <div key={rp.id} className="text-[11px] text-gray-600 flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                          <span className="truncate max-w-[130px] font-medium" title={rp.title}>{rp.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {rp.scheduledAt && rp.status === 'SCHEDULED' && (
                              <span className="text-[10px] text-indigo-600 font-semibold">
                                Hẹn: {new Date(rp.scheduledAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rp.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : rp.status === 'PUBLISHING'
                                ? 'bg-blue-100 text-blue-700'
                                : rp.status === 'SCHEDULED'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {rp.status === 'PUBLISHED' ? 'Đã đăng' : rp.status === 'PUBLISHING' ? 'Đang đăng' : rp.status === 'SCHEDULED' ? 'Đã lên lịch' : rp.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caption Snippet */}
                {post.caption && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                    "{post.caption}"
                  </p>
                )}

                {/* Platforms Chips */}
                <div className="flex flex-wrap gap-1">
                  {post.platforms.map((p) => {
                    const cfg = PLATFORM_CONFIG[p.platform as Platform];
                    return (
                      <span
                        key={p.platform}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600"
                        style={cfg ? { color: cfg.color, backgroundColor: `${cfg.color}15` } : {}}
                      >
                        {cfg?.name || p.platform}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDisableEvergreen(post)}
                  className="text-xs text-gray-400 hover:text-red-600 font-medium cursor-pointer"
                >
                  Tắt Evergreen
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRecycleModal(post)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tái đăng ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recycle Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Tái xuất bản bài viết</h3>
                    <p className="text-xs text-gray-500">Tạo phiên bản mới cho bài viết Evergreen này</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Tiêu đề bài viết mới</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-apple text-sm w-full bg-gray-50/60 border border-gray-200"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              {/* Caption Input + AI Spin */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Mô tả (Caption)</label>
                  <button
                    type="button"
                    onClick={handleSpinCaption}
                    disabled={isSpinning}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'Đang viết lại...' : 'AI Spin làm mới'}</span>
                  </button>
                </div>
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  rows={4}
                  className="input-apple text-sm w-full bg-gray-50/60 border border-gray-200"
                  placeholder="Nhập nội dung chia sẻ..."
                />
              </div>

              {/* Publish Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Chế độ đăng bài</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPublishMode('now')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newPublishMode === 'now'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Đăng ngay lập tức</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPublishMode('schedule')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newPublishMode === 'schedule'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Lên lịch hẹn giờ</span>
                  </button>
                </div>
              </div>

              {/* Schedule time if schedule mode */}
              {newPublishMode === 'schedule' && (
                <div className="space-y-1.5 animate-fade-in bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                  <label className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Chọn ngày và giờ đăng</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newScheduledAt}
                    onChange={(e) => setNewScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className="input-apple text-xs w-full bg-white border border-emerald-200"
                  />
                </div>
              )}

              {/* Platforms */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Nền tảng xuất bản</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG]][]).map(
                    ([key, config]) => {
                      const isSelected = selectedPlatforms.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleTogglePlatform(key)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-gray-200 bg-white text-gray-600'
                          }`}
                        >
                          {config.name}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRecycle}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận tái xuất bản'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
