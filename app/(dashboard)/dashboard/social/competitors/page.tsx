'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Eye, Search, Target, TrendingUp, ThumbsUp, MessageCircle, Share2, Link as LinkIcon, Sparkles, X, Edit2, Calendar } from 'lucide-react';
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

  // View Detail & Edit States
  const [viewingCompetitor, setViewingCompetitor] = useState<CompetitorPage | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorPage | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', url: '', avatar: '' });
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    url: '',
    name: ''
  });

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/competitors');
      if (res.ok) {
        const data = await res.json();
        const fetchedPages: CompetitorPage[] = data.pages || [];
        setPages(fetchedPages);
        setSelectedPage(prev => {
          if (prev && fetchedPages.some(p => p.id === prev)) return prev;
          return fetchedPages.length > 0 ? fetchedPages[0].id : null;
        });
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Fanpage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/competitors')
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          const fetchedPages: CompetitorPage[] = data.pages || [];
          setPages(fetchedPages);
          if (fetchedPages.length > 0) {
            setSelectedPage(fetchedPages[0].id);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoading(false);
          toast.error('Lỗi khi tải danh sách Fanpage');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const fetchPosts = async (pageId: string) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/competitors/posts?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      toast.error('Lỗi khi tải bài viết');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (!selectedPage) return;

    let ignore = false;
    fetch(`/api/competitors/posts?pageId=${selectedPage}`)
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setPosts(data.posts || []);
          setLoadingPosts(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoadingPosts(false);
          toast.error('Lỗi khi tải bài viết');
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedPage]);

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
    } catch {
      toast.error('Lỗi khi lưu Fanpage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pageToDelete = pages.find(p => p.id === id);
    const pageName = pageToDelete?.name || 'đối thủ này';

    if (!confirm(`Bạn có chắc chắn muốn ngừng theo dõi và xóa "${pageName}" khỏi danh sách? Toàn bộ bài viết đã quét của đối thủ này sẽ được dọn dẹp khỏi hệ thống.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/competitors?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Đã ngừng theo dõi và xóa đối thủ "${pageName}"`);
        const remaining = pages.filter(p => p.id !== id);
        setPages(remaining);
        if (selectedPage === id) {
          setSelectedPage(remaining.length > 0 ? remaining[0].id : null);
        }
      } else {
        toast.error('Xóa đối thủ thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi xóa đối thủ');
    }
  };

  const handleOpenEdit = (page: CompetitorPage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCompetitor(page);
    setEditFormData({
      name: page.name || '',
      url: page.url || '',
      avatar: page.avatar || ''
    });
  };

  const handleUpdateCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetitor) return;
    if (!editFormData.url.trim()) {
      toast.error('Vui lòng nhập Link đối thủ');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('/api/competitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCompetitor.id,
          name: editFormData.name,
          url: editFormData.url,
          avatar: editFormData.avatar
        })
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success('Cập nhật thông tin đối thủ thành công');
        setPages(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        setEditingCompetitor(null);
      } else {
        toast.error('Lỗi khi cập nhật đối thủ');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật đối thủ');
    } finally {
      setUpdating(false);
    }
  };

  const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>({});
  
  const currentUrl = selectedPage 
    ? (urlOverrides[selectedPage] ?? (pages.find(p => p.id === selectedPage)?.url || '')) 
    : '';

  const handleUrlChange = (newUrl: string) => {
    if (selectedPage) {
      setUrlOverrides(prev => ({ ...prev, [selectedPage]: newUrl }));
    }
  };

  const handleSyncPosts = async () => {
    if (!selectedPage) return;
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/competitors/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageId: selectedPage,
          url: currentUrl.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã cào và cập nhật bài viết mới thành công');
        await fetchPosts(selectedPage);
        await fetchPages();
      } else {
        toast.error(data.error || 'Lỗi khi quét bài mới');
        setLoadingPosts(false);
      }
    } catch {
      toast.error('Lỗi khi quét bài mới');
      setLoadingPosts(false);
    }
  };

  const currentPage = pages.find(p => p.id === selectedPage);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Competitive Social Intelligence
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Target className="w-6 h-6 text-[#5B3DF5]" />
            Spy Đối Thủ
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Theo dõi fanpage đối thủ, quét bài viết viral và phân tích nội dung
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm Fanpage Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-foreground)] text-sm">
              Đang theo dõi ({pages.length})
            </h2>
            <button 
              onClick={fetchPages} 
              className="p-1.5 hover:bg-[var(--color-muted)] rounded-lg transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              title="Làm mới danh sách đối thủ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5B3DF5]' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-2">
            {pages.length === 0 && !loading ? (
              <div className="p-6 text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl space-y-3">
                <Target className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm text-[var(--color-muted-foreground)]">Chưa có Fanpage nào được theo dõi.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm đối thủ
                </button>
              </div>
            ) : (
              pages.map(page => (
                <div 
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`group relative flex items-center justify-between gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedPage === page.id 
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 shadow-sm' 
                      : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]/20 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                      {page.avatar ? (
                        <img src={page.avatar} alt={page.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#5B3DF5]">{page.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-foreground)] truncate group-hover:text-[#5B3DF5] transition-colors">
                        {page.name || 'Unnamed Page'}
                      </p>
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-[var(--color-muted-foreground)] truncate hover:text-[#5B3DF5] hover:underline flex items-center gap-1 mt-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">Link Fanpage</span>
                      </a>
                    </div>
                  </div>

                  {/* Actions: View Detail, Edit, and Delete */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingCompetitor(page);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all"
                      title={`Xem chi tiết đối thủ "${page.name || ''}"`}
                      aria-label="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={(e) => handleOpenEdit(page, e)}
                      className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-all"
                      title={`Chỉnh sửa đối thủ "${page.name || ''}"`}
                      aria-label="Sửa đối thủ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={(e) => handleDeletePage(page.id, e)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                      title={`Ngừng theo dõi và xóa đối thủ "${page.name || ''}"`}
                      aria-label="Xóa đối thủ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
              {/* Header */}
              <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between bg-[var(--color-background)] shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                    {currentPage?.avatar ? (
                      <img src={currentPage.avatar} alt={currentPage.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#5B3DF5]">{currentPage?.name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#5B3DF5] shrink-0" />
                      <h2 className="font-bold text-[var(--color-foreground)] truncate text-base">
                        {currentPage?.name || 'Bài viết mới & Viral'}
                      </h2>
                    </div>
                    {currentPage?.url && (
                      <a 
                        href={currentPage.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Mở Fanpage/Nguồn gốc</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Detail Action Button */}
                  <button 
                    onClick={() => currentPage && setViewingCompetitor(currentPage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-900/40 rounded-xl transition-all shadow-sm"
                    title="Xem thông tin chi tiết đối thủ"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Chi tiết</span>
                  </button>

                  {/* Edit Action Button */}
                  <button 
                    onClick={(e) => currentPage && handleOpenEdit(currentPage, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-[var(--color-border)] rounded-xl transition-all shadow-sm"
                    title="Chỉnh sửa tên và link đối thủ"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Sửa</span>
                  </button>

                  {/* Explicit Unfollow / Delete Action Button */}
                  <button 
                    onClick={(e) => handleDeletePage(selectedPage, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-all shadow-sm"
                    title={`Hủy theo dõi và xóa đối thủ "${currentPage?.name || ''}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hủy theo dõi</span>
                  </button>
                </div>
              </div>

              {/* URL Input & Crawl Toolbar - Matches Step 3 & 4 of user requirements */}
              <div className="p-3 bg-[var(--color-card)] border-b border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input 
                    type="url"
                    value={currentUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Nhập link nguồn (URL) của đối thủ để quét (Fanpage Facebook, TikTok, Báo chí, Website)..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5] transition-all text-[var(--color-foreground)]"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={handleSyncPosts}
                    disabled={loadingPosts || !currentUrl.trim()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm bg-[#5B3DF5] hover:bg-[#4C30D4] text-white rounded-xl transition-all font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Truy cập và cào dữ liệu bài viết mới nhất từ link vừa nhập"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPosts ? 'animate-spin' : ''}`} />
                    <span>{loadingPosts ? 'Đang cào dữ liệu...' : 'Quét bài mới'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-background)]">
                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted-foreground)]">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[#5B3DF5]" />
                    <p>Đang truy cập và cào dữ liệu bài viết...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted-foreground)] p-6 text-center">
                    <Eye className="w-12 h-12 text-[var(--color-muted)] mb-3" />
                    <p className="text-base font-semibold text-[var(--color-foreground)]">Chưa có dữ liệu bài viết</p>
                    <p className="text-sm mt-1 max-w-md">
                      Hệ thống chưa tìm thấy bài viết hoặc nguồn chưa được quét. Hãy kiểm tra URL nguồn phía trên và bấm quét ngay.
                    </p>
                    {currentUrl && (
                      <button
                        onClick={handleSyncPosts}
                        disabled={loadingPosts}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#5B3DF5] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#4C30D4] transition-all shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingPosts ? 'animate-spin' : ''}`} />
                        <span>Quét bài viết ngay từ nguồn này</span>
                      </button>
                    )}
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
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-lg font-bold">Thêm Fanpage Đối Thủ</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
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

      {/* View Detail Modal */}
      {viewingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-lg border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-muted)]/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center overflow-hidden shrink-0">
                  {viewingCompetitor.avatar ? (
                    <img src={viewingCompetitor.avatar} alt={viewingCompetitor.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-[#5B3DF5]">{viewingCompetitor.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
                    {viewingCompetitor.name || 'Đối thủ chưa đặt tên'}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang giám sát</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingCompetitor(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* URL Information */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Link Nguồn Đối Thủ (URL)
                </label>
                <div className="p-3 bg-[var(--color-muted)]/30 rounded-2xl border border-[var(--color-border)] flex items-center justify-between gap-3">
                  <a 
                    href={viewingCompetitor.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{viewingCompetitor.url}</span>
                  </a>
                  <a
                    href={viewingCompetitor.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors shrink-0"
                  >
                    Mở tab mới
                  </a>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#5B3DF5]" />
                    <span className="text-xs font-medium">Bài viết đã cào</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-foreground)]">
                    {viewingCompetitor.id === selectedPage ? posts.length : 'Đang cập nhật'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium">Ngày thêm theo dõi</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-foreground)] mt-1.5">
                    {new Date(viewingCompetitor.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingCompetitor;
                    setViewingCompetitor(null);
                    handleOpenEdit(target);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/40 transition-colors inline-flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCompetitor(null)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Competitor Modal */}
      {editingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-md border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  Chỉnh Sửa Đối Thủ
                </h3>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Cập nhật tên gợi nhớ và URL nguồn theo dõi
                </p>
              </div>
              <button 
                onClick={() => setEditingCompetitor(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCompetitor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                  Tên gợi nhớ đối thủ
                </label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="VD: Báo Vietnamnet, Đối thủ A..."
                  className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 focus:border-[#5B3DF5] transition-all text-[var(--color-foreground)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                  Link nguồn (URL) *
                </label>
                <input 
                  type="url" 
                  value={editFormData.url}
                  onChange={e => setEditFormData({ ...editFormData, url: e.target.value })}
                  placeholder="https://facebook.com/..., https://tiktok.com/@..., https://..."
                  className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 focus:border-[#5B3DF5] transition-all text-[var(--color-foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">
                  Link ảnh đại diện (Tùy chọn)
                </label>
                <input 
                  type="url" 
                  value={editFormData.avatar}
                  onChange={e => setEditFormData({ ...editFormData, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 focus:border-[#5B3DF5] transition-all text-[var(--color-foreground)]"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-[var(--color-border)]">
                <button 
                  type="button"
                  onClick={() => setEditingCompetitor(null)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#4C30D4] transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
                >
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
