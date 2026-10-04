'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2, LayoutGrid, RefreshCcw, Video, CalendarDays, MoreHorizontal, X, Copy, Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  hashtags?: string | null;
  firstComment?: string | null;
};

function safeFormatDate(
  dateValue: string | number | Date | null | undefined,
  formatStr: string,
  fallback: string = '--'
): string {
  if (!dateValue) return fallback;
  try {
    const d = typeof dateValue === 'string' || typeof dateValue === 'number' 
      ? new Date(dateValue) 
      : dateValue;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return fallback;
    }
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // View & Edit Modal States
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    caption: '',
    hashtags: '',
    firstComment: '',
    scheduledAt: '',
    status: 'DRAFT',
  });

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
    const hasPublishing = posts.some(p => {
      if (p.status === 'PUBLISHING') return true;
      if (Array.isArray(p.platforms)) {
        return p.platforms.some(pl => typeof pl === 'object' && pl !== null && pl.status === 'PUBLISHING');
      }
      return false;
    });
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

  const handleOpenView = (post: Post) => {
    setViewingPost(post);
    setCopiedCaption(false);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditFormData({
      title: post.title || '',
      caption: post.caption || '',
      hashtags: post.hashtags || '',
      firstComment: post.firstComment || '',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      status: post.status || 'DRAFT',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editFormData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFormData.title.trim(),
          caption: editFormData.caption,
          hashtags: editFormData.hashtags,
          firstComment: editFormData.firstComment,
          scheduledAt: editFormData.scheduledAt ? new Date(editFormData.scheduledAt).toISOString() : null,
          status: editFormData.status,
        }),
      });

      if (res.ok) {
        toast.success('Đã cập nhật bài viết thành công');
        setEditingPost(null);
        fetchPosts(true);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật bài viết thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi kết nối khi cập nhật bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"?`)) return;

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Đã xóa bài viết thành công');
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        if (viewingPost?.id === post.id) setViewingPost(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Xóa bài viết thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi kết nối khi xóa bài viết');
    }
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
                        <h3 
                          onClick={() => handleOpenView(post)}
                          className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0 cursor-pointer hover:text-[#5B3DF5] transition-colors" 
                          title={post.title}
                        >
                          {post.title}
                        </h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                        {post.caption || 'Không có nội dung mô tả'}
                      </p>
                      
                      {/* Platforms */}
                      <div className="flex flex-wrap gap-2">
                        {(post.platforms || []).map((p, i) => {
                          const platName = typeof p === 'string' ? p : p?.platform || '';
                          const platStatus = typeof p === 'string' ? '' : p?.status || '';
                          let dotColor = 'bg-gray-400';
                          if (platStatus === 'PUBLISHED') dotColor = 'bg-emerald-500';
                          if (platStatus === 'FAILED') dotColor = 'bg-rose-500';
                          if (platStatus === 'PUBLISHING') dotColor = 'bg-indigo-500 animate-pulse';

                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
                              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {platName ? platName.split('_')[0] : 'Khác'}
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
                          {post.scheduledAt
                            ? safeFormatDate(post.scheduledAt, 'dd/MM/yyyy HH:mm')
                            : safeFormatDate(post.createdAt, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenView(post)}
                          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-[#5B3DF5] hover:border-[#5B3DF5]/30 hover:shadow-md transition-all" 
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(post)}
                          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-amber-500 hover:border-amber-500/30 hover:shadow-md transition-all" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post)}
                          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 transition-all" 
                          title="Xoá"
                        >
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

      {/* View Post Modal */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#5B3DF5]/10 text-[#5B3DF5] rounded-2xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết Bài viết</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {viewingPost.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPost(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Title & Status */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">
                    Loại: {viewingPost.postType}
                  </span>
                  {getStatusBadge(viewingPost.status)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingPost.title}</h3>
              </div>

              {/* Video Asset Preview if any */}
              {viewingPost.videoAsset && viewingPost.videoAsset.storageUrl && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[#5B3DF5]" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                      {viewingPost.videoAsset.originalFileName || 'Tệp Video đính kèm'}
                    </span>
                  </div>
                  <a 
                    href={viewingPost.videoAsset.storageUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#5B3DF5] font-semibold hover:underline"
                  >
                    Xem video <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">Nội dung Caption</label>
                  {viewingPost.caption && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingPost.caption || '');
                        setCopiedCaption(true);
                        toast.success('Đã sao chép nội dung caption');
                        setTimeout(() => setCopiedCaption(false), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-[#5B3DF5] hover:underline font-medium"
                    >
                      {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCaption ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {viewingPost.caption || '(Chưa có nội dung caption)'}
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {viewingPost.hashtags && (
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">Hashtags</label>
                  <p className="text-sm text-blue-500 font-medium bg-blue-50/50 dark:bg-blue-900/20 px-3.5 py-2 rounded-xl border border-blue-100 dark:border-blue-800/40">
                    {viewingPost.hashtags}
                  </p>
                </div>
              )}

              {/* First comment */}
              {viewingPost.firstComment && (
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">Bình luận đầu tiên (First Comment)</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200/60 dark:border-gray-800 whitespace-pre-wrap">
                    {viewingPost.firstComment}
                  </p>
                </div>
              )}

              {/* Platforms */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">Nền tảng xuất bản</label>
                <div className="flex flex-wrap gap-2">
                  {(viewingPost.platforms || []).map((p, i) => {
                    const platName = typeof p === 'string' ? p : p?.platform || '';
                    const platStatus = typeof p === 'string' ? '' : p?.status || '';
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800 text-xs font-medium">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{platName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                          {platStatus || 'PENDING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meta Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <span className="block text-gray-400 mb-0.5">Ngày tạo</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {safeFormatDate(viewingPost.createdAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-0.5">Thời gian lên lịch</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {viewingPost.scheduledAt ? safeFormatDate(viewingPost.scheduledAt, 'dd/MM/yyyy HH:mm') : 'Đăng ngay'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <button
                onClick={() => handleDeletePost(viewingPost)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa bài viết
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewingPost(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const target = viewingPost;
                    setViewingPost(null);
                    handleOpenEdit(target);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa Bài viết</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cập nhật nội dung và lịch đăng</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPost(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                  Tiêu đề bài viết *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                  Nội dung Caption
                </label>
                <textarea
                  rows={4}
                  value={editFormData.caption}
                  onChange={(e) => setEditFormData({ ...editFormData, caption: e.target.value })}
                  placeholder="Nhập caption bài viết..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={editFormData.hashtags}
                    onChange={(e) => setEditFormData({ ...editFormData, hashtags: e.target.value })}
                    placeholder="#topify #viral"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                    <option value="APPROVED">Đã duyệt (APPROVED)</option>
                    <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                  Thời gian lên lịch (Tuỳ chọn)
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.scheduledAt}
                  onChange={(e) => setEditFormData({ ...editFormData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5">
                  Bình luận đầu tiên (First Comment)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.firstComment}
                  onChange={(e) => setEditFormData({ ...editFormData, firstComment: e.target.value })}
                  placeholder="Để lại bình luận ghim đầu tiên..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
