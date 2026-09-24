'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Eye, Search, Target, TrendingUp, ThumbsUp, MessageCircle, Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

type CompetitorPage = {
  id: string;
  url: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
};

type CompetitorPost = {
  id: string;
  externalId: string | null;
  content: string | null;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: string | null;
  scrapedAt: string;
};

export default function CompetitorsPage() {
  const [pages, setPages] = useState<CompetitorPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [posts, setPosts] = useState<CompetitorPost[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    url: '',
    name: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchPosts(selectedPage);
    } else {
      setPosts([]);
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/competitors');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        if (data.pages?.length > 0 && !selectedPage) {
          setSelectedPage(data.pages[0].id);
        }
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách Fanpage');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageId: string) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/competitors/posts?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải bài viết');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      toast.error('Vui lòng nhập Link Fanpage');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Thêm Fanpage theo dõi thành công');
        setShowAddModal(false);
        setFormData({ url: '', name: '' });
        fetchPages();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm Fanpage');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu Fanpage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn ngừng theo dõi Fanpage này?')) return;
    
    try {
      const res = await fetch(`/api/competitors?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã ngừng theo dõi');
        if (selectedPage === id) setSelectedPage(null);
        fetchPages();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Target className="w-6 h-6 text-[#5B3DF5]" />
            Spy Đối Thủ
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Theo dõi fanpage đối thủ, quét bài viết viral và phân tích nội dung</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Thêm Fanpage Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-foreground)]">Đang theo dõi ({pages.length})</h2>
            <button onClick={fetchPages} className="p-1 hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 text-[var(--color-muted-foreground)] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-2">
            {pages.length === 0 && !loading ? (
              <div className="p-6 text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl">
                <p className="text-sm text-[var(--color-muted-foreground)]">Chưa có Fanpage nào được theo dõi.</p>
              </div>
            ) : (
              pages.map(page => (
                <div 
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedPage === page.id 
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 shadow-sm' 
                      : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {page.avatar ? (
                      <img src={page.avatar} alt={page.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">{page.name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                      {page.name || 'Unnamed Page'}
                    </p>
                    <a 
                      href={page.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-[var(--color-muted-foreground)] truncate hover:text-[#5B3DF5] hover:underline flex items-center gap-1 mt-0.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <LinkIcon className="w-3 h-3" /> Link Fanpage
                    </a>
                  </div>
                  <button 
                    onClick={(e) => handleDeletePage(page.id, e)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ngừng theo dõi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Posts Area */}
        <div className="lg:col-span-3">
          {!selectedPage ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl border-dashed">
              <Search className="w-12 h-12 text-[var(--color-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-foreground)]">Chọn một Fanpage</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-2">Chọn fanpage ở cột bên trái để xem các bài viết mới nhất</p>
            </div>
          ) : (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[800px]">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)] shrink-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#5B3DF5]" />
                  <h2 className="font-semibold text-[var(--color-foreground)]">Bài viết mới & Viral</h2>
                </div>
                <button 
                  onClick={async () => {
                    setLoadingPosts(true);
                    try {
                      const res = await fetch('/api/competitors/posts/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pageId: selectedPage })
                      });
                      if (res.ok) {
                        toast.success('Quét bài mới thành công');
                        fetchPosts(selectedPage);
                      } else {
                        toast.error('Lỗi khi quét bài mới');
                        setLoadingPosts(false); // Stop loading if error, otherwise fetchPosts will override
                      }
                    } catch (err) {
                      toast.error('Lỗi khi quét bài mới');
                      setLoadingPosts(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-muted)] hover:bg-[var(--color-border)] rounded-lg transition-colors"
                  disabled={loadingPosts}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPosts ? 'animate-spin' : ''}`} />
                  Quét bài mới
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-background)]">
                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted-foreground)]">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[#5B3DF5]" />
                    <p>Đang tải bài viết...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted-foreground)]">
                    <Eye className="w-12 h-12 text-[var(--color-muted)] mb-4" />
                    <p className="text-base font-medium">Chưa có dữ liệu bài viết</p>
                    <p className="text-sm mt-1">Hệ thống đang thu thập hoặc fanpage chưa có bài viết mới.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map(post => (
                      <div key={post.id} className="border border-[var(--color-border)] bg-[var(--color-card)] rounded-xl overflow-hidden flex flex-col hover:border-[#5B3DF5]/50 transition-colors">
                        <div className="p-4 flex-1">
                          <p className="text-xs text-[var(--color-muted-foreground)] mb-2 flex justify-between">
                            <span>{new Date(post.postedAt || post.scrapedAt).toLocaleDateString('vi-VN')}</span>
                            {post.externalId && <span className="font-mono text-gray-400">ID: {post.externalId}</span>}
                          </p>
                          <p className="text-sm text-[var(--color-foreground)] line-clamp-4 whitespace-pre-wrap leading-relaxed">
                            {post.content || 'Không có nội dung chữ'}
                          </p>
                          {post.mediaUrl && (
                            <div className="mt-3 aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                              {post.mediaUrl.endsWith('.mp4') ? (
                                <span className="text-xs font-medium px-2 py-1 bg-black/50 text-white rounded">Video (Có chứa Link)</span>
                              ) : (
                                <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="px-4 py-3 bg-[var(--color-muted)]/30 border-t border-[var(--color-border)] flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                              <ThumbsUp className="w-4 h-4" /> {post.likesCount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                              <MessageCircle className="w-4 h-4" /> {post.commentsCount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-purple-500 transition-colors">
                              <Share2 className="w-4 h-4" /> {post.sharesCount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold">Thêm Fanpage Đối Thủ</h3>
            </div>
            
            <form onSubmit={handleAddPage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tên gợi nhớ (Không bắt buộc)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Đối thủ A"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Link Fanpage *</label>
                <input 
                  type="url" 
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  placeholder="https://facebook.com/fanpage"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang thêm...' : 'Theo Dõi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
