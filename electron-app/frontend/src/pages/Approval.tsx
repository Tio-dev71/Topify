import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Calendar, Eye, X, Copy, Tag, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface PostApprovalItem {
  id: string;
  title: string;
  caption: string | null;
  postType: string;
  status: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
  hashtags?: string | null;
  createdAt: string;
  createdBy?: { name: string | null; email: string };
}

export default function Approval() {
  const [posts, setPosts] = useState<PostApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts?status=PENDING_REVIEW&search=${search}`);
      if (res.data) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách bài viết chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  const handleApprove = async (id: string, action: 'approve' | 'reject', reasonText = '') => {
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/approve`, {
        action,
        reason: reasonText,
      });

      if (res.data) {
        toast.success(action === 'approve' ? 'Đã phê duyệt bài viết thành công' : 'Đã từ chối bài viết');
        setPosts(prev => prev.filter(p => p.id !== id));
        setSelectedPost(null);
        setShowRejectInput(false);
        setRejectReason('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi xử lý duyệt bài');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Phê duyệt bài viết (Approval Workflow - F079)</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm duyệt nội dung trước khi xuất bản tự động lên các kênh mạng xã hội</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Đang tải danh sách bài viết chờ duyệt...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-gray-900 font-bold text-sm">Không có bài viết nào cần duyệt</p>
          <p className="text-xs text-gray-500">Tất cả bài viết đã được xử lý hoặc xuất bản theo lịch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Chờ duyệt
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 
                  onClick={() => setSelectedPost(post)}
                  className="font-bold text-sm text-gray-900 line-clamp-1 cursor-pointer hover:text-indigo-600 transition"
                >
                  {post.title}
                </h3>

                <p className="text-xs text-gray-600 line-clamp-3">
                  {post.caption || <span className="text-gray-400 italic">Không có nội dung văn bản</span>}
                </p>

                {post.hashtags && (
                  <p className="text-[11px] font-mono text-indigo-600 line-clamp-1">
                    {post.hashtags}
                  </p>
                )}

                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                  <span>Tác giả:</span>
                  <span className="font-semibold text-gray-700">{post.createdBy?.name || post.createdBy?.email || 'Thành viên'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPost(post)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedPost(post);
                      setShowRejectInput(true);
                    }}
                    className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                    title="Từ chối"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleApprove(post.id, 'approve')}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition inline-flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Duyệt</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details & Action Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Chi tiết bài viết duyệt</h3>
              <button onClick={() => setSelectedPost(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="font-bold text-gray-500 block mb-1">Tiêu đề bài viết</label>
                <div className="font-bold text-sm text-gray-900">{selectedPost.title}</div>
              </div>

              <div>
                <label className="font-bold text-gray-500 block mb-1">Nội dung (Caption)</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.caption || 'Trống'}
                </div>
              </div>

              {selectedPost.hashtags && (
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Hashtags</label>
                  <div className="font-mono text-indigo-600">{selectedPost.hashtags}</div>
                </div>
              )}

              {showRejectInput && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <label className="font-bold text-rose-800 block">Lý do từ chối / Góp ý sửa:</label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do cần chỉnh sửa..."
                    className="w-full p-2 rounded-lg border border-rose-200 bg-white text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleApprove(selectedPost.id, 'reject', rejectReason)}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold text-xs"
              >
                Đóng
              </button>

              {!showRejectInput && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-semibold text-xs hover:bg-rose-100"
                  >
                    Từ chối bài viết
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleApprove(selectedPost.id, 'approve')}
                    className="btn-primary px-5 py-2 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Duyệt & Cho phép xuất bản</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
