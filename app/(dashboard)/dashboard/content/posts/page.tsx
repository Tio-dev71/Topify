'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2, LayoutGrid, RefreshCcw, Video, CalendarDays, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

type Post = {
  id: string;
  title: string;
  caption: string | null;
  postType: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  platforms: { platform: string; status: string }[];
  createdBy: { name: string | null; email: string };
  videoAsset?: { originalFileName: string; storageUrl: string };
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (silent = false) => {
    try {
      const res = await fetch(`/api/posts?search=${search}&status=${statusFilter === 'ALL' ? '' : statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [search, statusFilter]);

  // Polling for PUBLISHING status
  useEffect(() => {
    const hasPublishing = posts.some(p => p.status === 'PUBLISHING' || p.platforms.some(pl => pl.status === 'PUBLISHING'));
    if (!hasPublishing) return;
    
    const interval = setInterval(() => {
      fetchPosts(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [posts, statusFilter, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 border backdrop-blur-md";
    switch (status) {
      case 'DRAFT': return <span className={`${baseClasses} bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300`}><div className="w-1.5 h-1.5 rounded-full bg-gray-500" />Nháp</span>;
      case 'PENDING_REVIEW': return <span className={`${baseClasses} bg-amber-500/10 text-amber-600 border-amber-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-amber-500" />Chờ duyệt</span>;
      case 'APPROVED': return <span className={`${baseClasses} bg-blue-500/10 text-blue-600 border-blue-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />Đã duyệt</span>;
      case 'SCHEDULED': return <span className={`${baseClasses} bg-purple-500/10 text-purple-600 border-purple-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-purple-500" />Đã lên lịch</span>;
      case 'PUBLISHING': return <span className={`${baseClasses} bg-indigo-500/10 text-indigo-600 border-indigo-500/20`}><RefreshCcw className="w-3 h-3 animate-spin"/> Đang đăng</span>;
      case 'PUBLISHED': return <span className={`${baseClasses} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Đã đăng</span>;
      case 'FAILED': return <span className={`${baseClasses} bg-rose-500/10 text-rose-600 border-rose-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-rose-500" />Lỗi</span>;
      case 'PARTIAL_FAILED': return <span className={`${baseClasses} bg-orange-500/10 text-orange-600 border-orange-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-orange-500" />Lỗi một phần</span>;
      default: return <span className={`${baseClasses} bg-gray-500/10 text-gray-700 border-gray-500/20`}><div className="w-1.5 h-1.5 rounded-full bg-gray-500" />{status}</span>;
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Tất cả bài viết' },
    { id: 'DRAFT', label: 'Bản nháp' },
    { id: 'PENDING_REVIEW', label: 'Chờ duyệt' },
    { id: 'SCHEDULED', label: 'Đã lên lịch' },
    { id: 'PUBLISHED', label: 'Đã xuất bản' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] pb-24">
      {/* Premium Header */}
      <div className="relative pt-12 pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5B3DF5]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight"
            >
              Quản lý Bài Viết
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400 mt-2 text-base"
            >
              Theo dõi, chỉnh sửa và quản lý tất cả các bài viết trên các nền tảng
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 w-full md:w-auto"
          >
            <button 
              onClick={handleRefresh}
              className="p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all"
              title="Làm mới"
            >
              <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin text-[#5B3DF5]' : ''}`} />
            </button>
            <Link 
              href="/dashboard/content/create" 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white shadow-lg shadow-[#5B3DF5]/25 hover:shadow-xl hover:shadow-[#5B3DF5]/40 hover:-translate-y-1 transition-all"
            >
              <Plus className="w-5 h-5" />
              Tạo bài mới
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        {/* Filters Section */}
        <div className="flex flex-col xl:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex bg-white/30 dark:bg-gray-800/30 backdrop-blur-md p-1.5 rounded-2xl overflow-x-auto hide-scrollbar border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors z-10 ${
                  statusFilter === tab.id
                    ? 'text-[#5B3DF5]'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {statusFilter === tab.id && (
                  <motion.div
                    layoutId="activeTabPosts"
                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content Area */}
        <div className="grid gap-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 flex flex-col items-center justify-center gap-4"
              >
                <div className="w-10 h-10 border-4 border-[#5B3DF5]/20 border-t-[#5B3DF5] rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
              </motion.div>
            ) : posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 flex flex-col items-center justify-center gap-6"
              >
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center shadow-inner">
                  <LayoutGrid className="w-12 h-12 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Không có bài viết nào</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                    Chưa có bài viết nào phù hợp với bộ lọc hiện tại. Hãy tạo mới hoặc thay đổi bộ lọc tìm kiếm.
                  </p>
                </div>
                <Link 
                  href="/dashboard/content/create" 
                  className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                >
                  Tạo bài viết đầu tiên
                </Link>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                    {/* Icon / Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-800 shadow-inner overflow-hidden relative">
                      {post.postType === 'REEL' ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5B3DF5]/10 to-[#3B82F6]/10 flex items-center justify-center">
                          <Video className="w-6 h-6 text-[#5B3DF5]" />
                        </div>
                      ) : (
                        <LayoutGrid className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {post.title}
                        </h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                        {post.caption || 'Không có nội dung mô tả'}
                      </p>
                      
                      {/* Platforms */}
                      <div className="flex flex-wrap gap-2">
                        {post.platforms.map((p, i) => {
                          let dotColor = 'bg-gray-400';
                          if (p.status === 'PUBLISHED') dotColor = 'bg-emerald-500';
                          if (p.status === 'FAILED') dotColor = 'bg-rose-500';
                          if (p.status === 'PUBLISHING') dotColor = 'bg-indigo-500 animate-pulse';

                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
                              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {p.platform.split('_')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-4 md:gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <CalendarDays className="w-4 h-4" />
                        <span className="font-medium">
                          {post.scheduledAt ? format(new Date(post.scheduledAt), 'dd/MM/yyyy HH:mm') : format(new Date(post.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-[#5B3DF5] hover:border-[#5B3DF5]/30 hover:shadow-md transition-all" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-amber-500 hover:border-amber-500/30 hover:shadow-md transition-all" title="Chỉnh sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 transition-all" title="Xoá">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
