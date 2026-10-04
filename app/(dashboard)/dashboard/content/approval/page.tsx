'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Search, LayoutGrid, Calendar, Eye, MessageSquare, X, Copy, Check, ExternalLink, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSession } from '@/lib/supabase/useSession';

type Post = {
  id: string;
  title: string;
  caption: string | null;
  postType: string;
  status: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
  hashtags?: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string };
};

export default function ApprovalPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copied, setCopied] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch only PENDING_REVIEW posts
      const res = await fetch(`/api/posts?status=PENDING_REVIEW&search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  const handleApprove = async (id: string, action: 'approve' | 'reject', reasonText = '') => {
    if (!isAdmin) {
      alert('Bạn không có quyền duyệt bài viết');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn ${action === 'approve' ? 'Duyệt' : 'Từ chối'} bài viết này?`)) return;
    
    try {
      const res = await fetch(`/api/posts/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reasonText })
      });
      
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        if (selectedPost?.id === id) {
          setSelectedPost(null);
          setShowRejectInput(false);
          setRejectReason('');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi khi thao tác');
      }
    } catch (err) {
      alert('Lỗi hệ thống');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Duyệt bài viết</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Danh sách các bài viết đang chờ phê duyệt</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-medium">
          Bạn không có quyền duyệt bài. Chỉ Admin mới có thể thực hiện thao tác này.
        </div>
      )}

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          placeholder="Tìm theo tiêu đề, người tạo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#5B3DF5]/30 border-t-[#5B3DF5] rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]">
            <CheckCircle className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-3" />
            <p className="text-[var(--color-foreground)] font-medium">Không có bài viết nào chờ duyệt</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Tất cả bài viết đã được xử lý xong</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col hover:border-[#5B3DF5]/50 transition-colors shadow-sm">
              <div 
                onClick={() => setSelectedPost(post)}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-[var(--color-foreground)] line-clamp-2 leading-tight hover:text-[#5B3DF5] transition-colors">{post.title}</h3>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-semibold whitespace-nowrap">
                    Chờ duyệt
                  </span>
                </div>
                
                <div className="bg-[var(--color-background)] rounded-xl p-3 mb-4 min-h-[64px]">
                  <p className="text-xs text-[var(--color-foreground)]/90 line-clamp-3 leading-relaxed">{post.caption || '(Không có nội dung)'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#5B3DF5] to-[#3B82F6] flex flex-shrink-0 items-center justify-center text-[10px] text-white font-bold">
                  {post.createdBy.name?.[0]?.toUpperCase() || post.createdBy.email[0].toUpperCase()}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  <span className="font-medium text-[var(--color-foreground)]">{post.createdBy.name || post.createdBy.email.split('@')[0]}</span>
                  <span className="mx-1">•</span>
                  {format(new Date(post.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[var(--color-border)]">
                <button 
                  onClick={() => setSelectedPost(post)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </button>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => handleApprove(post.id, 'reject')}
                      className="flex items-center justify-center p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-colors"
                      title="Từ chối"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleApprove(post.id, 'approve')}
                      className="flex items-center justify-center p-2 rounded-xl text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 transition-colors"
                      title="Duyệt"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Approval Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setSelectedPost(null)}>
          <div className="bg-[var(--color-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--color-border)] p-6 space-y-5 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start pb-3 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400">
                    Chờ phê duyệt
                  </span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    Loại: {selectedPost.postType || 'Bài đăng'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] leading-snug">
                  {selectedPost.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author and Date Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Người tạo:</span>
                <span className="font-semibold text-[var(--color-foreground)] truncate block">
                  {selectedPost.createdBy.name || selectedPost.createdBy.email}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Thời gian tạo:</span>
                <span className="font-semibold text-[var(--color-foreground)] block">
                  {format(new Date(selectedPost.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] col-span-2 sm:col-span-1">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Lịch đăng dự kiến:</span>
                <span className="font-semibold text-[var(--color-foreground)] block">
                  {selectedPost.scheduledAt ? format(new Date(selectedPost.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'Đăng ngay khi duyệt'}
                </span>
              </div>
            </div>

            {/* Post Caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Nội dung bài viết (Caption)
                </label>
                {selectedPost.caption && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPost.caption || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#5B3DF5] hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                )}
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed min-h-[100px] select-text">
                {selectedPost.caption || '(Không có nội dung caption)'}
              </div>
            </div>

            {/* Media URLs if any */}
            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] block mb-1.5">
                  Tệp đính kèm ({selectedPost.mediaUrls.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedPost.mediaUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Media ${i}`} className="w-full h-24 object-cover rounded-xl border border-[var(--color-border)]" />
                  ))}
                </div>
              </div>
            )}

            {/* Rejection reason box */}
            {showRejectInput && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-2">
                <label className="block text-xs font-semibold text-red-600 dark:text-red-400">
                  Lý do từ chối (Gửi phản hồi cho người tạo):
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do bài viết chưa đạt yêu cầu..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-red-300 dark:border-red-900 bg-white dark:bg-black/40 text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[var(--color-border)]">
              <Link
                href="/dashboard/content/posts"
                className="text-xs font-semibold text-[#5B3DF5] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở trong Quản lý bài viết
              </Link>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Đóng
                </button>
                {isAdmin && (
                  <>
                    {!showRejectInput ? (
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối...
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedPost.id, 'reject', rejectReason)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Xác nhận từ chối
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedPost.id, 'approve')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Phê duyệt bài viết
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
