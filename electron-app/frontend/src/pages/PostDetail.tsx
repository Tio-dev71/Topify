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
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getMediaUrl } from '../lib/axios';
import { 
  STATUS_CONFIG, 
  PLATFORM_CONFIG, 
  safeFormatDate, 
  normalizePlatform, 
  normalizeHashtags,
  formatFileSize,
  formatVideoDuration,
  checkShortsCriteria,
  formatFriendlyPublishError,
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
  videoAsset?: {
    id?: string;
    originalFileName?: string;
    storageUrl?: string;
    duration?: number | null;
    size?: number | null;
    mimeType?: string | null;
  } | null;
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

  // Version History State & Tabs (F081)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoadingVersions(true);
      const res = await api.get(`/posts/${id}/versions`);
      if (res.data?.versions) {
        setVersions(res.data.versions);
      }
    } catch {
      //
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!post) return;
    try {
      setCreatingSnapshot(true);
      const res = await api.post(`/posts/${id}/versions`, {
        title: post.title,
        caption: post.caption,
        hashtags: post.hashtags,
      });
      if (res.data?.success) {
        toast.success('Đã lưu bản sao phiên bản hiện tại thành công!');
        fetchVersions();
      }
    } catch (e: any) {
      toast.error('Lỗi khi lưu bản sao: ' + (e.response?.data?.error || e.message));
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestoreVersion = async (v: any) => {
    const versionName = `v${versions.length - versions.findIndex(item => item.id === v.id)}`;
    const formattedDate = new Date(v.createdAt).toLocaleString('vi-VN');
    if (!window.confirm(`Bạn có chắc chắn muốn khôi phục bài viết về phiên bản ${versionName} (${formattedDate})?\n\nTiêu đề: ${v.title || '(Không có)'}`)) {
      return;
    }
    try {
      setRestoringVersionId(v.id);
      const res = await api.post(`/posts/${id}/versions`, { versionId: v.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Đã khôi phục thành công về phiên bản ${versionName}!`);
        await Promise.all([fetchPost(), fetchVersions()]);
      }
    } catch (e: any) {
      toast.error('Lỗi khi khôi phục phiên bản: ' + (e.response?.data?.error || e.message));
    } finally {
      setRestoringVersionId(null);
    }
  };

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
    if (id) {
      fetchPost();
      fetchVersions();
    }
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

      // Save a new version snapshot in history (F081)
      try {
        await api.post(`/posts/${id}/versions`, {
          title: editTitle.trim(),
          caption: editCaption.trim() || null,
          hashtags: editHashtags.trim() || null,
        });
      } catch {}

      toast.success('Đã cập nhật bài viết & lưu bản sao lịch sử thành công');
      setIsEditing(false);
      fetchPost();
      fetchVersions();
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

        {/* Navigation Tabs (F081: Details & Version History) */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>Nội dung & Nền tảng</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lịch sử phiên bản (Version History)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold">
              {versions.length}
            </span>
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Content Layout: Video on Left, Info on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Video Preview & Specs */}
          <div className="lg:col-span-5 w-full max-w-[340px] xl:max-w-[360px] mx-auto self-start space-y-4">
            <div className="aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-lg border border-black/10 relative max-h-[580px] flex items-center justify-center">
              {post.videoAsset?.storageUrl ? (
                <video
                  src={getMediaUrl(post.videoAsset.storageUrl)}
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

            {/* Video Technical Specs Card */}
            {post.videoAsset && (
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-purple-600" />
                    Thông số kỹ thuật Video
                  </span>
                  {(() => {
                    const shortsCheck = checkShortsCriteria(post.videoAsset.duration, post.videoAsset.mimeType);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        shortsCheck.isEligible ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {shortsCheck.badge}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 font-mono text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-sans">Thời lượng:</span>
                    <span className="font-bold text-gray-900">{formatVideoDuration(post.videoAsset.duration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-sans">Dung lượng:</span>
                    <span className="font-bold text-gray-900">{formatFileSize(post.videoAsset.size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-sans">Định dạng:</span>
                    <span className="font-bold text-gray-900 uppercase">{post.videoAsset.mimeType?.replace('video/', '') || 'MP4'}</span>
                  </div>
                </div>

                {(() => {
                  const shortsCheck = checkShortsCriteria(post.videoAsset.duration, post.videoAsset.mimeType);
                  return (
                    <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                      shortsCheck.isEligible 
                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800' 
                        : 'bg-amber-50/70 border-amber-200/80 text-amber-800'
                    }`}>
                      <p className="font-semibold">{shortsCheck.isEligible ? '✅ Thỏa mãn tiêu chuẩn YouTube Shorts:' : '⚠️ Lưu ý định dạng:'}</p>
                      <p className="mt-0.5">{shortsCheck.note}</p>
                    </div>
                  );
                })()}

                {post.videoAsset.originalFileName && (
                  <p className="text-[10px] text-gray-400 truncate pt-1 border-t border-gray-200/40" title={post.videoAsset.originalFileName}>
                    Tên file: {post.videoAsset.originalFileName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-7 space-y-6">
            {/* Platforms Status */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Nền tảng xuất bản & Trạng thái chi tiết
              </h3>
              <div className="space-y-3">
                {(post.platforms || []).map(normalizePlatform).map((pl, idx) => {
                  const cfg = PLATFORM_CONFIG[pl.platform as keyof typeof PLATFORM_CONFIG];
                  const isSuccess = pl.status === 'PUBLISHED';
                  const isFail = pl.status === 'FAILED';
                  const friendlyErr = isFail ? formatFriendlyPublishError(pl.errorMessage, pl.platform) : null;

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
                      className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: cfg?.color || '#6366f1' }}
                          />
                          <p className="text-sm font-bold text-gray-900">
                            {cfg?.name || (pl.platform ? pl.platform.replace(/_/g, ' ') : 'Nền tảng')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isSuccess ? 'bg-emerald-100 text-emerald-700' :
                            isFail ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {isSuccess ? 'Đã đăng thành công' : isFail ? 'Thất bại' : 'Đang xử lý'}
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

                      {/* If FAILED, render detailed friendly error + guide */}
                      {friendlyErr && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-rose-950">
                                Lý do thất bại: <span className="font-semibold text-rose-800">{friendlyErr.reason}</span>
                              </p>
                              {friendlyErr.guide && (
                                <p className="text-[11px] text-rose-800 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-100">
                                  💡 <strong>Hướng dẫn khắc phục:</strong> {friendlyErr.guide}
                                </p>
                              )}
                            </div>
                          </div>
                          {pl.errorMessage && (
                            <details className="mt-1 text-[10px] text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700 font-mono">Chi tiết kỹ thuật (Raw Log)</summary>
                              <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded-md font-mono text-[9px] overflow-x-auto whitespace-pre-wrap max-h-36">
                                {pl.errorMessage}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
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

            {/* Lịch sử phiên bản bài viết (Bottom Summary in Details Tab) */}
            <div className="card-apple p-6 space-y-4 w-full">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Lịch sử phiên bản (Version History - F081)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold font-mono">
                    {versions.length} phiên bản đã lưu
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Xem toàn bộ Tab Lịch sử →
                  </button>
                </div>
              </div>

              {loadingVersions ? (
                <div className="py-6 text-center text-xs text-gray-400">Đang tải lịch sử phiên bản...</div>
              ) : versions.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                  Chưa có phiên bản cũ nào được ghi nhận. Các chỉnh sửa mới sẽ tự động lưu lại bản sao lịch sử tại đây.
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((ver, idx) => {
                    const isCurrent = idx === 0;
                    const versionNumber = `v${versions.length - idx}`;
                    return (
                      <div
                        key={ver.id}
                        className={`p-4 rounded-2xl border transition space-y-2.5 shadow-2xs ${
                          isCurrent ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center font-mono ${
                              isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {versionNumber}
                            </span>
                            <span className="text-xs font-semibold text-gray-800">
                              {new Date(ver.createdAt).toLocaleString('vi-VN')}
                            </span>
                            {ver.editedBy?.name && (
                              <span className="text-[11px] text-gray-500">
                                bởi <span className="font-medium text-gray-700">{ver.editedBy.name}</span>
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Bản hiện tại
                              </span>
                            )}
                          </div>

                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={restoringVersionId === ver.id}
                              onClick={() => handleRestoreVersion(ver)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                              title={`Khôi phục bài viết về ${versionNumber}`}
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${restoringVersionId === ver.id ? 'animate-spin' : ''}`} />
                              <span>{restoringVersionId === ver.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                            </button>
                          )}
                        </div>

                        {/* Version content snapshot */}
                        <div className="text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1">
                          <div className="font-semibold text-gray-900 truncate">
                            Tiêu đề: {ver.title || '(Không có tiêu đề)'}
                          </div>
                          {ver.caption && (
                            <p className="line-clamp-2 text-gray-600 italic">
                              "{ver.caption}"
                            </p>
                          )}
                          {ver.hashtags && (
                            <div className="text-[11px] font-mono text-indigo-600">
                              {ver.hashtags}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dedicated Version History Tab (F081) */
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-950 text-sm">
                    Lịch sử các phiên bản sửa đổi nội dung (F081)
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold font-mono">
                    {versions.length} phiên bản
                  </span>
                </div>
                <p className="text-xs text-indigo-700/80">
                  Hệ thống tự động lưu trữ các bản sửa đổi nội dung. Nhấp nút "Khôi phục" tại bất kỳ phiên bản nào bên dưới để đưa nội dung bài viết quay lại trạng thái đó.
                </p>
              </div>

              <button
                type="button"
                disabled={creatingSnapshot}
                onClick={handleCreateSnapshot}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingSnapshot ? 'Đang lưu bản sao...' : 'Lưu bản sao hiện tại (Snapshot)'}</span>
              </button>
            </div>

            {loadingVersions ? (
              <div className="py-12 text-center text-xs text-gray-400">Đang tải lịch sử phiên bản...</div>
            ) : versions.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                Chưa có phiên bản cũ nào được ghi nhận. Các chỉnh sửa mới sẽ tự động lưu lại bản sao lịch sử tại đây.
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((ver, idx) => {
                  const isCurrent = idx === 0;
                  const versionNumber = `v${versions.length - idx}`;
                  return (
                    <div
                      key={ver.id}
                      className={`p-5 rounded-2xl border transition space-y-3.5 shadow-2xs ${
                        isCurrent
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center font-mono ${
                            isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {versionNumber}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {new Date(ver.createdAt).toLocaleString('vi-VN')}
                          </span>
                          {ver.editedBy?.name && (
                            <span className="text-xs text-gray-500">
                              bởi <span className="font-semibold text-gray-700">{ver.editedBy.name}</span>
                            </span>
                          )}
                          {ver.snapshot?.reason && (
                            <span className="text-[11px] text-gray-500 italic">
                              • {ver.snapshot.reason}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Bản hiện tại
                            </span>
                          )}
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            disabled={restoringVersionId === ver.id}
                            onClick={() => handleRestoreVersion(ver)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            title={`Khôi phục bài viết về ${versionNumber}`}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${restoringVersionId === ver.id ? 'animate-spin' : ''}`} />
                            <span>{restoringVersionId === ver.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                          </button>
                        )}
                      </div>

                      {/* Full Content Snapshot Box */}
                      <div className="text-xs text-gray-700 bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-2.5">
                        <div>
                          <span className="font-bold text-gray-900">Tiêu đề: </span>
                          <span className="font-medium text-gray-800">{ver.title || '(Không có tiêu đề)'}</span>
                        </div>
                        {ver.caption && (
                          <div>
                            <span className="font-bold text-gray-900">Nội dung Caption: </span>
                            <p className="mt-1 text-gray-700 whitespace-pre-line bg-white p-3 rounded-lg border border-gray-200/80 font-mono leading-relaxed text-[11px]">
                              {ver.caption}
                            </p>
                          </div>
                        )}
                        {ver.hashtags && (
                          <div>
                            <span className="font-bold text-gray-900">Hashtags: </span>
                            <span className="font-mono text-indigo-600 font-semibold">{ver.hashtags}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
