import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Search,
  Target,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
  Share2,
  Link as LinkIcon,
  Sparkles,
  X,
  Edit2,
  Calendar,
  ExternalLink,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export type CompetitorPage = {
  id: string;
  url: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
};

export type CompetitorPost = {
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

export default function Competitors() {
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

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [searchPost, setSearchPost] = useState('');

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/competitors');
      if (res.data) {
        const fetchedPages: CompetitorPage[] = res.data.pages || [];
        setPages(fetchedPages);
        setSelectedPage(prev => {
          if (prev && fetchedPages.some(p => p.id === prev)) return prev;
          return fetchedPages.length > 0 ? fetchedPages[0].id : null;
        });
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Fanpage đối thủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPosts = async (pageId: string) => {
    setLoadingPosts(true);
    try {
      const res = await api.get(`/competitors/posts?pageId=${pageId}&limit=100`);
      if (res.data) {
        setPosts(res.data.posts || []);
      }
    } catch {
      toast.error('Lỗi khi tải bài viết đối thủ');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (selectedPage) {
      fetchPosts(selectedPage);
    } else {
      setPosts([]);
    }
  }, [selectedPage]);

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) {
      toast.error('Vui lòng nhập Link hoặc Tên Fanpage đối thủ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/competitors', formData);
      if (res.data) {
        toast.success('Thêm Fanpage theo dõi thành công!');
        setShowAddModal(false);
        setFormData({ url: '', name: '' });
        fetchPages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm Fanpage đối thủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncPosts = async (pageId: string) => {
    setSyncingId(pageId);
    try {
      const res = await api.post('/competitors/posts/sync', { pageId });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã đồng bộ bài viết đối thủ mới nhất!');
        fetchPosts(pageId);
      } else {
        toast.success('Đã cập nhật bài viết đối thủ!');
        fetchPosts(pageId);
      }
    } catch {
      toast.error('Không thể đồng bộ bài viết lúc này');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeletePage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pageToDelete = pages.find(p => p.id === id);
    const pageName = pageToDelete?.name || 'đối thủ này';

    if (!confirm(`Bạn có chắc chắn muốn ngừng theo dõi và xóa "${pageName}" khỏi danh sách?`)) {
      return;
    }

    try {
      await api.delete(`/competitors?id=${id}`);
      toast.success(`Đã ngừng theo dõi đối thủ "${pageName}"`);
      const remaining = pages.filter(p => p.id !== id);
      setPages(remaining);
      if (selectedPage === id) {
        setSelectedPage(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      toast.error('Lỗi khi xóa Fanpage đối thủ');
    }
  };

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetitor) return;
    setUpdating(true);
    try {
      await api.patch(`/competitors`, {
        id: editingCompetitor.id,
        ...editFormData
      });
      toast.success('Cập nhật thông tin đối thủ thành công!');
      setPages(prev => prev.map(p => p.id === editingCompetitor.id ? { ...p, ...editFormData } : p));
      setEditingCompetitor(null);
    } catch {
      toast.error('Lỗi khi cập nhật đối thủ');
    } finally {
      setUpdating(false);
    }
  };

  const selectedPageObj = pages.find(p => p.id === selectedPage);

  const isPostToday = (postedAtStr: string | null) => {
    if (!postedAtStr) return false;
    const pDate = new Date(postedAtStr);
    const vnNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    return pDate.toLocaleDateString('vi-VN') === vnNow.toLocaleDateString('vi-VN');
  };

  const todayPostsCount = posts.filter(p => isPostToday(p.postedAt)).length;

  const filteredPosts = posts.filter(p => {
    if (!searchPost.trim()) return true;
    return (p.content || '').toLowerCase().includes(searchPost.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <Target className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Theo Dõi Fanpage Đối Thủ (F051)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Quan sát động thái content, tần suất đăng và lượng tương tác của các đối thủ cùng ngành
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2.5 px-4 text-xs font-semibold inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Fanpage Theo Dõi</span>
        </button>
      </div>

      {/* Main Layout: Left Page List, Right Posts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fanpage List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                Danh Sách Đối Thủ ({pages.length})
              </span>
              <button
                onClick={fetchPages}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">Đang tải danh sách đối thủ...</div>
            ) : pages.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-gray-500">Chưa có Fanpage đối thủ nào.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  + Thêm đối thủ đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {pages.map((p) => {
                  const isSelected = p.id === selectedPage;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPage(p.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {p.name ? p.name.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {p.name || 'Fanpage Đối Thủ'}
                          </h4>
                          <p className="text-[11px] text-gray-400 truncate max-w-[170px]">
                            {p.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompetitor(p);
                            setEditFormData({ name: p.name || '', url: p.url, avatar: p.avatar || '' });
                          }}
                          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700"
                          title="Sửa tên đối thủ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePage(p.id, e)}
                          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-rose-600"
                          title="Ngừng theo dõi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feed and Posts Analysis */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPageObj ? (
            <>
              {/* Selected Page Action Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {selectedPageObj.name ? selectedPageObj.name.charAt(0).toUpperCase() : 'F'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedPageObj.name || 'Fanpage Đối Thủ'}
                      </h3>
                      <a
                        href={selectedPageObj.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-blue-600"
                        title="Mở Fanpage trên Facebook"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 font-mono">
                        Đã quét {posts.length} bài viết gần nhất
                      </p>
                      {todayPostsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                          {todayPostsCount} bài hôm nay
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncPosts(selectedPageObj.id)}
                    disabled={syncingId === selectedPageObj.id}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === selectedPageObj.id ? 'animate-spin' : ''}`} />
                    <span>{syncingId === selectedPageObj.id ? 'Đang đồng bộ...' : 'Quét Bài Viết Mới'}</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung bài viết đối thủ..."
                  value={searchPost}
                  onChange={(e) => setSearchPost(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Posts Feed */}
              {loadingPosts ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-xs text-gray-400">
                  Đang tải danh sách bài viết đã quét...
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-500">Chưa tìm thấy bài viết nào của đối thủ này.</p>
                  <button
                    onClick={() => handleSyncPosts(selectedPageObj.id)}
                    className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kích hoạt Quét Dữ Liệu Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs hover:border-gray-200 transition space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.postedAt ? new Date(post.postedAt).toLocaleString('vi-VN') : 'Mới cập nhật'}
                          {isPostToday(post.postedAt) && (
                            <span className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Hôm nay
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                          ID: {post.id.slice(0, 8)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line font-sans">
                        {post.content || <span className="text-gray-400 italic">Bài viết không có văn bản</span>}
                      </p>

                      {/* Engagement Metrics */}
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-50 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-gray-800">{post.likesCount.toLocaleString()}</span>
                          <span className="text-gray-400 text-[11px]">Likes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold text-gray-800">{post.commentsCount.toLocaleString()}</span>
                          <span className="text-gray-400 text-[11px]">Bình luận</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold text-gray-800">{post.sharesCount.toLocaleString()}</span>
                          <span className="text-gray-400 text-[11px]">Chia sẻ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Chưa chọn Fanpage đối thủ nào</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Chọn một Fanpage bên trái để xem bài viết, nhịp độ đăng tải và số liệu tương tác chi tiết.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Thêm Fanpage Theo Dõi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                <span>Thêm Fanpage Đối Thủ (F051)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPage} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Đối Thủ / Thương Hiệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: TechZone Official, Vua Hàng Hiệu..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">
                  Đường dẫn (URL) Fanpage <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://facebook.com/tenfanpage"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-rose-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400">
                  Hệ thống Topify sẽ tự động kết nối và lập chỉ mục bài viết công khai của Page này.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {submitting ? 'Đang thêm...' : 'Lưu & Bắt đầu theo dõi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Sửa Fanpage */}
      {editingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh Sửa Thông Tin Đối Thủ</span>
              </h3>
              <button
                onClick={() => setEditingCompetitor(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePage} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Đối Thủ</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">URL Fanpage</label>
                <input
                  type="url"
                  required
                  value={editFormData.url}
                  onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompetitor(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
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
