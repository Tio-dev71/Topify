import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Film,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Edit3,
  Save,
  ExternalLink,
  Hash,
  MessageSquare,
  AlignLeft,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { 
  STATUS_CONFIG, 
  PLATFORM_CONFIG, 
  safeFormatDate, 
  normalizePlatform, 
  normalizeHashtags 
} from '../lib/utils';

interface PostDetailData {
  id: string;
  title: string;
  caption: string | null;
  firstComment: string | null;
  hashtags: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  videoAsset?: { originalFileName?: string; storageUrl?: string } | null;
  platforms: {
    id: string;
    platform: string;
    status: string;
    externalPostId?: string | null;
    errorMessage?: string | null;
  }[];
  createdBy?: { name: string | null; email: string } | null;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editFirstComment, setEditFirstComment] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/${id}`);
      if (res.data) {
        const p = res.data;
        setPost(p);
        setEditTitle(p.title || '');
        setEditCaption(p.caption || '');
        setEditHashtags(normalizeHashtags(p.hashtags));
        setEditFirstComment(p.firstComment || '');
        let scheduledIso = '';
        if (p.scheduledAt) {
          try {
            const d = new Date(p.scheduledAt);
            if (!isNaN(d.getTime())) {
              scheduledIso = d.toISOString().slice(0, 16);
            }
          } catch {}
        }
        setEditScheduledAt(scheduledIso);
      }
    } catch (e: any) {
      toast.error('Không tìm thấy bài viết hoặc không có quyền truy cập');
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/posts/${id}`, {
        title: editTitle.trim(),
        caption: editCaption.trim() || null,
        hashtags: editHashtags.trim() || null,
        firstComment: editFirstComment.trim() || null,
        scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
      });
      toast.success('Đã cập nhật bài viết thành công');
      setIsEditing(false);
      fetchPost();
    } catch (e: any) {
      toast.error('Lỗi lưu bài viết: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async () => {
    try {
      const res = await api.post(`/posts/${id}/retry`);
      if (res.status === 200) {
        toast.success('Đang thử lại đăng bài...');
        fetchPost();
      }
    } catch {
      toast.error('Lỗi khi thử lại đăng bài');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bài viết này không?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Đã xoá bài viết');
      navigate('/posts');
    } catch {
      toast.error('Lỗi khi xoá bài viết');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin bài viết...</p>
      </div>
    );
  }

  if (!post) return null;

  const statusConfig = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="max-w-[1000px] mx-auto pb-16 animate-fade-in space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/posts"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách bài viết
        </Link>

        <div className="flex items-center gap-2">
          {(post.status === 'FAILED' || post.status === 'PARTIAL_FAILED') && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm flex items-center gap-2 transition-colors border border-amber-200"
            >
              <RotateCcw className="w-4 h-4" />
              Thử lại ngay
            </button>
          )}

          {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 transition-colors border border-indigo-200"
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <span>{isEditing ? 'Huỷ chỉnh sửa' : 'Chỉnh sửa nội dung'}</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Xoá bài viết"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-8">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 shadow-2xs ${
                post.status === 'PUBLISHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                post.status === 'FAILED' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                post.status === 'PUBLISHING' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                'bg-purple-50 border-purple-200 text-purple-700'
              }`}>
                {post.status === 'PUBLISHED' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 post.status === 'FAILED' ? <AlertCircle className="w-3.5 h-3.5" /> :
                 <Clock className="w-3.5 h-3.5" />}
                {statusConfig?.label || post.status}
              </span>
              <span className="text-xs text-gray-400">
                Tạo lúc: {safeFormatDate(post.createdAt, 'HH:mm - dd/MM/yyyy')}
              </span>
            </div>
            {!isEditing ? (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {post.title || 'Chưa đặt tiêu đề'}
              </h1>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề bài viết</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-apple text-xl font-bold w-full bg-white border border-gray-300"
                />
              </div>
            )}
          </div>

          {post.scheduledAt && safeFormatDate(post.scheduledAt, 'HH:mm - dd/MM/yyyy', '') && (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-right flex-shrink-0">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Thời gian lên lịch
              </p>
              <p className="text-base font-bold text-indigo-950 mt-0.5">
                {safeFormatDate(post.scheduledAt, 'HH:mm - dd/MM/yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Content Layout: Video on Left, Info on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Video Preview */}
          <div className="lg:col-span-5 w-full max-w-[340px] xl:max-w-[360px] mx-auto self-start">
            <div className="aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-lg border border-black/10 relative max-h-[580px] flex items-center justify-center">
              {post.videoAsset?.storageUrl ? (
                <video
                  src={post.videoAsset.storageUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8">
                  <Film className="w-12 h-12 mb-3" />
                  <p className="text-sm">Không có file video</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-7 space-y-6">
            {/* Platforms Status */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Nền tảng xuất bản
              </h3>
              <div className="space-y-2.5">
                {(post.platforms || []).map(normalizePlatform).map((pl, idx) => {
                  const cfg = PLATFORM_CONFIG[pl.platform as keyof typeof PLATFORM_CONFIG];
                  const isSuccess = pl.status === 'PUBLISHED';
                  const isFail = pl.status === 'FAILED';

                  let linkUrl = '';
                  if (pl.externalPostId) {
                    if (pl.platform === 'YOUTUBE_SHORTS') {
                      linkUrl = `https://www.youtube.com/shorts/${pl.externalPostId}`;
                    } else if (pl.platform === 'FACEBOOK_REELS') {
                      linkUrl = `https://www.facebook.com/reel/${pl.externalPostId}`;
                    }
                  }

                  return (
                    <div
                      key={pl.externalPostId || pl.platform + idx}
                      className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cfg?.color || '#6366f1' }}
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {cfg?.name || (pl.platform ? pl.platform.replace(/_/g, ' ') : 'Nền tảng')}
                          </p>
                          {pl.errorMessage && (
                            <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
                              {pl.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isSuccess ? 'bg-emerald-100 text-emerald-700' :
                          isFail ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {isSuccess ? 'Thành công' : isFail ? 'Thất bại' : 'Đang xử lý'}
                        </span>
                        {linkUrl && (
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
                            title="Mở xem video trên nền tảng"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editable Fields or View Details */}
            {!isEditing ? (
              <div className="space-y-5 pt-4 border-t border-gray-100">
                {/* Caption */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
                    Nội dung mô tả (Caption)
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {post.caption || <span className="text-gray-400 italic">Không có nội dung mô tả</span>}
                  </p>
                </div>

                {/* Hashtags */}
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600" />
                    Hashtags
                  </p>
                  {normalizeHashtags(post.hashtags) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {normalizeHashtags(post.hashtags).split(/[\s,]+/).filter(Boolean).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs"
                        >
                          {t.startsWith('#') ? t : `#${t}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chưa nhập hashtag</span>
                  )}
                </div>

                {/* First Comment */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-1.5">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Bình luận đầu tiên (Tự động đăng)
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {post.firstComment || <span className="text-gray-400 italic">Không có bình luận đầu tiên</span>}
                  </p>
                </div>
              </div>
            ) : (
              /* Edit Mode Inputs */
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
                    Mô tả (Caption)
                  </label>
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="input-apple w-full text-sm bg-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600" />
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={editHashtags}
                    onChange={(e) => setEditHashtags(e.target.value)}
                    className="input-apple w-full text-sm bg-white"
                    placeholder="#viral #trending #shorts"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Bình luận đầu tiên
                  </label>
                  <input
                    type="text"
                    value={editFirstComment}
                    onChange={(e) => setEditFirstComment(e.target.value)}
                    className="input-apple w-full text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Thời gian hẹn giờ
                  </label>
                  <input
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="input-apple w-full text-sm bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-3 flex-wrap">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveEdit}
                    className="btn-primary py-2.5 px-6 text-sm font-semibold whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0"
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-2.5 px-5 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 whitespace-nowrap inline-flex items-center justify-center shrink-0"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
