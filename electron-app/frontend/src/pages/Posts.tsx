import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Search,
  Eye,
  Trash2,
  RotateCcw,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  MessageSquare,
  X,
  ExternalLink,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { 
  STATUS_CONFIG, 
  PLATFORM_CONFIG, 
  safeFormatDate, 
  normalizePlatform, 
  normalizeHashtags 
} from '../lib/utils';

type StatusFilter = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';

interface PostItem {
  id: string;
  title: string;
  caption: string | null;
  firstComment?: string | null;
  hashtags?: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  videoAsset?: { originalFileName?: string; storageUrl?: string } | null;
  platforms: {
    platform: string;
    status: string;
    externalPostId?: string | null;
    errorMessage?: string | null;
  }[];
  createdBy?: { name: string | null; email: string } | null;
}

const filterTabs: { label: string; value: StatusFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đã lên lịch', value: 'SCHEDULED' },
  { label: 'Đang đăng', value: 'PUBLISHING' },
  { label: 'Đã đăng', value: 'PUBLISHED' },
  { label: 'Thất bại', value: 'FAILED' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'FAILED': return <AlertCircle className="w-3.5 h-3.5" />;
    case 'PUBLISHING': return <RotateCcw className="w-3.5 h-3.5 animate-spin" />;
    case 'SCHEDULED': return <Clock className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

export default function Posts() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  async function fetchPosts(silent = false) {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      const res = await api.get(`/posts?${params}`);
      if (res.data) {
        const postList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.posts)
            ? res.data.posts
            : [];
        setPosts(postList);
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e);
      if (!silent) toast.error('Không thể tải danh sách bài viết');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Polling for PUBLISHING status
  useEffect(() => {
    const hasPublishing = posts.some(p => {
      if (p.status === 'PUBLISHING') return true;
      if (Array.isArray(p.platforms)) {
        return p.platforms.some(pl => {
          const norm = normalizePlatform(pl);
          return norm.status === 'PUBLISHING';
        });
      }
      return false;
    });
    if (!hasPublishing) return;
    
    const interval = setInterval(() => {
      fetchPosts(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [posts, filter]);

  async function deletePost(id: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bài viết này không?')) return;
    try {
      const res = await api.delete(`/posts/${id}`);
      if (res.status === 200) {
        toast.success('Đã xoá bài viết');
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (selectedPost?.id === id) setSelectedPost(null);
      }
    } catch {
      toast.error('Lỗi khi xoá bài viết');
    }
  }

  async function retryPost(id: string) {
    try {
      const res = await api.post(`/posts/${id}/retry`);
      if (res.status === 200) {
        toast.success('Đang thử lại...');
        fetchPosts(true);
        if (selectedPost?.id === id) setSelectedPost(null);
      }
    } catch {
      toast.error('Lỗi khi thử lại');
    }
  }

  const filteredPosts = posts.filter((post) => {
    const title = (post.title || '').toLowerCase();
    const tags = normalizeHashtags(post.hashtags).toLowerCase();
    const query = (search || '').toLowerCase().trim();
    if (!query) return true;
    return title.includes(query) || tags.includes(query);
  });


  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12 max-w-[1400px] mx-auto px-4 sm:px-6"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-black/[0.04] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-gradient-to-br from-[#5B3DF5]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-64 h-64 bg-gradient-to-tr from-[#3B82F6]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6]">Bài Viết</span>
            </h1>
            <p className="text-lg text-gray-500/80 font-medium leading-relaxed">
              Tất cả video của bạn trên đa nền tảng, được tổng hợp tại một giao diện trung tâm thanh lịch.
            </p>
          </div>
          <Link 
            to="/create" 
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 bg-gray-900 rounded-2xl hover:bg-black shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Film className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            Tạo bài đăng mới
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-4 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-black/[0.04] shadow-[0_4px_20px_rgb(0,0,0,0.02)] sticky top-4 z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide w-full xl:w-auto px-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`relative px-6 py-3 text-sm font-semibold rounded-2xl whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                filter === tab.value
                  ? 'text-gray-900 shadow-sm border border-black/5 bg-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 border border-transparent'
              }`}
            >
              {filter === tab.value && (
                <motion.div 
                  layoutId="filter-indicator"
                  className="absolute inset-0 border border-black/5 rounded-2xl pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full xl:w-[380px]">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoặc hashtag..."
            className="block w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-black/[0.04] rounded-2xl text-[15px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/20 focus:border-[#5B3DF5]/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="pt-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-black/[0.04] p-5 space-y-5 shadow-sm">
                <div className="w-full aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse" />
                <div className="space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-4/5 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-100 rounded-md animate-pulse" />
                    <div className="h-6 w-16 bg-gray-100 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 px-6 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-300/60"
          >
            <div className="w-28 h-28 mb-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner">
              <Film className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              {filter !== 'ALL' ? `Không tìm thấy nội dung` : 'Chưa có bài viết nào'}
            </h3>
            <p className="text-gray-500 text-center text-lg max-w-md mb-10 leading-relaxed">
              {filter !== 'ALL'
                ? 'Không có bài viết nào phù hợp với bộ lọc hiện tại.'
                : 'Bắt đầu ngay bằng cách tạo bài viết đầu tiên và phân phối nội dung của bạn.'}
            </p>
            {filter === 'ALL' && (
              <Link to="/create" className="px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-2xl shadow-lg transition-colors flex items-center gap-2">
                Bắt đầu ngay
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence>
              {filteredPosts.map((post, index) => {
                const statusConfig = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -6 }}
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="group bg-white rounded-[2rem] border border-black/[0.05] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col relative cursor-pointer"
                  >
                    {/* Media Display */}
                    <div className="relative aspect-[4/5] bg-gray-900 rounded-[1.5rem] overflow-hidden mb-4">
                      {post.videoAsset?.storageUrl ? (
                        <video
                          src={post.videoAsset.storageUrl}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105"
                          muted
                          loop
                          onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(()=>{})}
                          onMouseOut={(e) => {
                            const v = e.target as HTMLVideoElement;
                            v.pause();
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-400 p-6 text-center">
                          <Film className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-300">Không có file video</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
                      
                      {/* Top Action Bar */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                        <div className={`px-2.5 py-1 rounded-xl border backdrop-blur-md flex items-center gap-1.5 text-xs font-bold shadow-sm ${
                          post.status === 'PUBLISHED' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' :
                          post.status === 'FAILED' ? 'bg-rose-500/20 border-rose-500/30 text-rose-100' :
                          post.status === 'PUBLISHING' ? 'bg-blue-500/20 border-blue-500/30 text-blue-100' :
                          'bg-purple-500/20 border-purple-500/30 text-purple-100'
                        }`}>
                          {getStatusIcon(post.status)}
                          {statusConfig?.label || post.status}
                        </div>
                        
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-2xl">
                          <PlayCircle className="w-7 h-7 text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Bottom Info inside media */}
                      <div className="absolute bottom-3 left-3 right-3 z-10">
                        <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-2 drop-shadow-md">
                          {post.title || 'Chưa đặt tiêu đề'}
                        </h3>
                        <p className="text-white/80 text-[11px] font-medium mt-1 drop-shadow-md flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-white/70" />
                          {post.scheduledAt
                            ? `Hẹn: ${safeFormatDate(post.scheduledAt, 'HH:mm dd/MM/yyyy')}`
                            : safeFormatDate(post.createdAt, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="px-2 pb-2 flex-1 flex flex-col space-y-2.5">
                      {/* Scheduled or Hashtags / Comment badges */}
                      <div className="space-y-1.5">
                        {post.scheduledAt && safeFormatDate(post.scheduledAt, 'HH:mm dd/MM', '') && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-lg w-fit">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>Hẹn giờ: {safeFormatDate(post.scheduledAt, 'HH:mm dd/MM')}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5">
                          {Boolean(normalizeHashtags(post.hashtags)) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 truncate max-w-[160px]">
                              <Hash className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{normalizeHashtags(post.hashtags)}</span>
                            </span>
                          )}
                          {post.firstComment && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100" title={post.firstComment}>
                              <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span>Cmt</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="flex flex-wrap gap-1.5">
                        {(post.platforms || []).map(normalizePlatform).map((p, idx) => {
                          const config = PLATFORM_CONFIG[p.platform as keyof typeof PLATFORM_CONFIG];
                          const platformName = config?.name || (p.platform ? p.platform.replace(/_/g, ' ') : 'Nền tảng');
                          const platformColor = config?.color || '#4b5563';
                          const shortName = platformName.split(' ')[0] || platformName;
                          return (
                            <div
                              key={(p.platform || 'plat') + idx}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border shadow-2xs"
                              style={{
                                color: platformColor,
                                backgroundColor: '#ffffff',
                                borderColor: 'rgba(0,0,0,0.06)',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformColor }} />
                              {shortName}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-auto pt-3 border-t border-black/[0.04] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center border border-black/5 text-[10px] font-bold text-gray-500 uppercase">
                            {post.createdBy?.name?.[0] || post.createdBy?.email?.[0] || '?'}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[80px]">
                            {post.createdBy?.name || post.createdBy?.email?.split('@')[0] || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          {(post.status === 'FAILED' || post.status === 'PARTIAL_FAILED') && (
                            <button
                              onClick={() => retryPost(post.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Thử lại đăng bài"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deletePost(post.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Xoá bài viết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Quick Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedPost(null)}>
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="pr-6">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 mb-2 ${
                  selectedPost.status === 'PUBLISHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  selectedPost.status === 'FAILED' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  selectedPost.status === 'PUBLISHING' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  {getStatusIcon(selectedPost.status)}
                  {STATUS_CONFIG[selectedPost.status as keyof typeof STATUS_CONFIG]?.label || selectedPost.status}
                </span>
                <h2 className="text-xl font-bold text-gray-900 leading-snug">
                  {selectedPost.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player & Basic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Video Player */}
              <div className="aspect-[9/16] max-h-[460px] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                {selectedPost.videoAsset?.storageUrl ? (
                  <video
                    src={selectedPost.videoAsset.storageUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <Film className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Không có file video</p>
                  </div>
                )}
              </div>

              {/* Information list */}
              <div className="space-y-4">
                {/* Schedule info */}
                {selectedPost.scheduledAt && safeFormatDate(selectedPost.scheduledAt, 'HH:mm - EEEE, dd/MM/yyyy', '') && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Lên lịch tự động
                    </p>
                    <p className="text-sm font-bold text-indigo-950 mt-1">
                      {safeFormatDate(selectedPost.scheduledAt, 'HH:mm - EEEE, dd/MM/yyyy')}
                    </p>
                  </div>
                )}

                {/* Caption */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
                    Nội dung mô tả (Caption)
                  </p>
                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                    {selectedPost.caption || <span className="text-gray-400 italic">Không có mô tả</span>}
                  </p>
                </div>

                {/* Hashtags */}
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600" />
                    Hashtags
                  </p>
                  {normalizeHashtags(selectedPost.hashtags) ? (
                    <div className="flex flex-wrap gap-1">
                      {normalizeHashtags(selectedPost.hashtags).split(/[\s,]+/).filter(Boolean).map((t, i) => (
                        <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700">
                          {t.startsWith('#') ? t : `#${t}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chưa nhập hashtag</span>
                  )}
                </div>

                {/* First comment */}
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Bình luận đầu tiên
                  </p>
                  <p className="text-xs font-medium text-gray-900">
                    {selectedPost.firstComment || <span className="text-gray-400 italic">Không có bình luận đầu</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Status */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Trạng thái trên nền tảng
              </h4>
              <div className="space-y-2">
                {(selectedPost.platforms || []).map(normalizePlatform).map((pl, i) => {
                  const cfg = PLATFORM_CONFIG[pl.platform as keyof typeof PLATFORM_CONFIG];
                  let linkUrl = '';
                  if (pl.externalPostId) {
                    if (pl.platform === 'YOUTUBE_SHORTS') linkUrl = `https://www.youtube.com/shorts/${pl.externalPostId}`;
                    else if (pl.platform === 'FACEBOOK_REELS') linkUrl = `https://www.facebook.com/reel/${pl.externalPostId}`;
                  }

                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-xs font-bold" style={{ color: cfg?.color || '#333' }}>
                        {cfg?.name || (pl.platform ? pl.platform.replace(/_/g, ' ') : 'Nền tảng')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          pl.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                          pl.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {pl.status === 'PUBLISHED' ? 'Đã đăng' : pl.status === 'FAILED' ? 'Thất bại' : 'Đang xử lý'}
                        </span>
                        {linkUrl && (
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-white border border-gray-200 text-blue-600"
                            title="Xem video trên nền tảng"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/posts/${selectedPost.id}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap inline-flex items-center gap-1.5 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>Mở trang chỉnh sửa chi tiết đầy đủ &rarr;</span>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {(selectedPost.status === 'FAILED' || selectedPost.status === 'PARTIAL_FAILED') && (
                  <button
                    onClick={() => retryPost(selectedPost.id)}
                    className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 border border-amber-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Thử lại ngay</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs whitespace-nowrap inline-flex items-center shrink-0"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
