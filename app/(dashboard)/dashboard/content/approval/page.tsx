'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, LayoutGrid, Calendar, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSession } from '@/lib/supabase/useSession';

type Post = {
  id: string;
  title: string;
  caption: string | null;
  postType: string;
  status: string;
  createdAt: string;
  createdBy: { name: string | null; email: string };
};

export default function ApprovalPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    if (!isAdmin) {
      alert('Bạn không có quyền duyệt bài viết');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn ${action === 'approve' ? 'Duyệt' : 'Từ chối'} bài viết này?`)) return;
    
    try {
      const res = await fetch(`/api/posts/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: '' })
      });
      
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
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
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="font-bold text-[var(--color-foreground)] line-clamp-2 leading-tight">{post.title}</h3>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold whitespace-nowrap">
                  Chờ duyệt
                </span>
              </div>
              
              <div className="bg-[var(--color-background)] rounded-xl p-3 mb-4 flex-1">
                <p className="text-xs text-[var(--color-foreground)] line-clamp-3">{post.caption || '(Không có nội dung)'}</p>
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
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80 transition-colors">
                  <Eye className="w-4 h-4" /> Xem
                </button>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => handleApprove(post.id, 'reject')}
                      className="flex items-center justify-center p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      title="Từ chối"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleApprove(post.id, 'approve')}
                      className="flex items-center justify-center p-2 rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
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
    </div>
  );
}
