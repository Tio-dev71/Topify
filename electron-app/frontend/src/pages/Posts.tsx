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
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { STATUS_CONFIG, PLATFORM_CONFIG } from '../lib/utils';

type StatusFilter = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';

interface PostItem {
  id: string;
  title: string;
  caption: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  videoAsset: { originalFileName: string; storageUrl: string };
  platforms: { platform: string; status: string }[];
  createdBy: { name: string | null; email: string };
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
        setPosts(res.data.posts || []);
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
    const hasPublishing = posts.some(p => p.status === 'PUBLISHING' || p.platforms.some(pl => pl.status === 'PUBLISHING'));
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
      }
    } catch {
      toast.error('Lỗi khi thử lại');
    }
  }

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12 max-w-[1400px] mx-auto px-4 sm:px-6"
    >
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-black/[0.04] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Subtle decorative gradients */}
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

      {/* Modern Filter & Search Bar */}
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
            placeholder="Tìm kiếm nội dung..."
            className="block w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-black/[0.04] rounded-2xl text-[15px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/20 focus:border-[#5B3DF5]/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="pt-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                    whileHover={{ y: -8 }}
                    key={post.id} 
                    className="group bg-white rounded-[2rem] border border-black/[0.04] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col relative"
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#5B3DF5]/0 via-transparent to-transparent opacity-0 group-hover:opacity-[0.02] rounded-[2rem] transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Media Display */}
                    <div className="relative aspect-[4/5] bg-gray-900 rounded-[1.5rem] overflow-hidden mb-5">
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
                      
                      {/* Gradients & Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
                      
                      {/* Top Action Bar */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                        <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-1.5 text-xs font-bold tracking-wide shadow-lg ${
                          post.status === 'PUBLISHED' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' :
                          post.status === 'FAILED' ? 'bg-rose-500/20 border-rose-500/30 text-rose-100' :
                          post.status === 'PUBLISHING' ? 'bg-blue-500/20 border-blue-500/30 text-blue-100' :
                          'bg-black/40 border-white/10 text-white'
                        }`}>
                          {getStatusIcon(post.status)}
                          {statusConfig?.label || post.status}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link
                            to={`/posts/${post.id}`}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Play Button Indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-2xl">
                          <PlayCircle className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>

                      {/* Bottom Info inside media */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 drop-shadow-md">
                          {post.title}
                        </h3>
                        <p className="text-white/70 text-xs font-medium mt-1 drop-shadow-md flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {post.scheduledAt
                            ? format(new Date(post.scheduledAt), 'MMM d, HH:mm')
                            : format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="px-3 pb-3 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.platforms.map((p) => {
                          const config = PLATFORM_CONFIG[p.platform as keyof typeof PLATFORM_CONFIG];
                          return (
                            <div
                              key={p.platform}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide border shadow-sm"
                              style={{
                                color: config?.color || '#4b5563',
                                backgroundColor: '#ffffff',
                                borderColor: 'rgba(0,0,0,0.06)',
                              }}
                            >
                              <div 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ backgroundColor: config?.color || '#4b5563' }} 
                              />
                              {config?.name?.split(' ')[0]}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-auto pt-4 border-t border-black/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center border border-black/5 text-xs font-bold text-gray-500 uppercase">
                            {post.createdBy?.name?.[0] || post.createdBy?.email?.[0] || '?'}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 truncate max-w-[100px]">
                            {post.createdBy?.name || post.createdBy?.email?.split('@')[0] || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {(post.status === 'FAILED' || post.status === 'PARTIAL_FAILED') && (
                            <button
                              onClick={() => retryPost(post.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Thử lại"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deletePost(post.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Xoá bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </motion.div>
  );
}

