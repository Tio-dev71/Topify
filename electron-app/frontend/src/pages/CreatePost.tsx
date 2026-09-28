import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Film,
  X,
  Loader2,
  Calendar,
  Send,
  Clock,
  Info,
  FileText,
  AlignLeft,
  Hash,
  MessageSquare,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { PLATFORM_CONFIG, safeFormatDate } from '../lib/utils';

type Platform = 'FACEBOOK_REELS' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS';
type PublishMode = 'now' | 'schedule';

interface UploadedVideo {
  id: string;
  originalFileName: string;
  titleFromFileName: string;
  storageUrl: string;
  size: number;
  mimeType: string;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  // User editable
  title: string;
  caption: string;
  firstComment: string;
  hashtags: string;
}

const readVideoMetadata = (file: File): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          duration: Math.round(video.duration || 0),
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
        });
      };
      video.onerror = () => {
        resolve({ duration: 0, width: 0, height: 0 });
      };
      video.src = URL.createObjectURL(file);
    } catch {
      resolve({ duration: 0, width: 0, height: 0 });
    }
  });
};

const isAllowedVideoType = (type: string) => {
  return ['video/mp4', 'video/quicktime', 'video/webm'].includes(type);
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SUGGESTED_TAGS = ['#Shorts', '#Trending', '#Viral', '#Reels', '#FYP', '#Review', '#Topify'];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<UploadedVideo[]>([]);

  // Global Form state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/social/status');
        if (res.data && res.data.connections) {
          const providers: Record<string, boolean> = {};
          res.data.connections.forEach((conn: any) => {
            providers[conn.provider] = true;
          });
          setConnectedProviders(providers);
        }
      } catch (error) {
        console.error('Failed to fetch social status', error);
      }
    };
    fetchStatus();
  }, []);

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      if (!isAllowedVideoType(f.type)) {
        toast.error(`Định dạng không hợp lệ: ${f.name}`);
        return false;
      }
      if (f.size > 2000 * 1024 * 1024) {
        toast.error(`File quá lớn (Tối đa 2GB): ${f.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress(Math.round(((i) / validFiles.length) * 100));

      const meta = await readVideoMetadata(file);

      const formData = new FormData();
      formData.append('video', file);
      if (meta.duration > 0) {
        formData.append('duration', meta.duration.toString());
      }
      formData.append('width', meta.width.toString());
      formData.append('height', meta.height.toString());

      try {
        const res = await api.post('/upload', formData);

        if (res.status === 200 || res.status === 201) {
          const result = res.data;
          setVideos((prev) => [
            ...prev,
            {
              ...result,
              duration: meta.duration || result.duration || 0,
              width: meta.width || 0,
              height: meta.height || 0,
              title: result.titleFromFileName || file.name.replace(/\.[^/.]+$/, ''),
              caption: '',
              firstComment: '',
              hashtags: '#Shorts #Trending',
            },
          ]);
          successCount++;
        }
      } catch (error: any) {
        toast.error(`Lỗi tải lên: ${error.response?.data?.error || file.name}`);
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      if (successCount > 0) toast.success(`Đã tải lên ${successCount} video`);
    }, 500);

  }, []);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleUpload(e.target.files);
      }
    },
    [handleUpload]
  );

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateVideoField = (id: string, field: keyof UploadedVideo, value: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addTagToVideo = (id: string, tag: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id !== id) return v;
      const current = v.hashtags ? v.hashtags.trim() : '';
      if (current.includes(tag)) return v;
      return { ...v, hashtags: current ? `${current} ${tag}` : tag };
    }));
  };

  const copyToAllVideos = (source: UploadedVideo) => {
    setVideos(prev => prev.map(v => ({
      ...v,
      caption: source.caption,
      hashtags: source.hashtags,
      firstComment: source.firstComment,
    })));
    toast.success('Đã sao chép Mô tả, Hashtags và Bình luận cho tất cả video!');
  };

  // Submit all
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (videos.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 video.');
      return;
    }
    if (platforms.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 nền tảng.');
      return;
    }
    if (publishMode === 'schedule') {
      if (!scheduledAt) {
        toast.error('Vui lòng chọn ngày và giờ đăng bài.');
        return;
      }
      const schedDate = new Date(scheduledAt);
      if (schedDate.getTime() <= Date.now()) {
        toast.error('Thời gian lên lịch phải ở tương lai.');
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;

    for (const video of videos) {
      try {
        const payloadTitle = video.title.trim() || video.titleFromFileName;
        const payloadScheduledAt = publishMode === 'schedule' ? new Date(scheduledAt).toISOString() : null;

        const res = await api.post('/posts', {
          title: payloadTitle,
          caption: video.caption.trim() || null,
          firstComment: video.firstComment.trim() || null,
          hashtags: video.hashtags.trim() || null,
          videoAssetId: video.id,
          platforms,
          publishMode,
          scheduledAt: payloadScheduledAt,
        });

        if (res.status === 200 || res.status === 201) {
          successCount++;
        }
      } catch (error: any) {
        toast.error(`Lỗi tạo bài viết cho ${video.originalFileName}: ${error.response?.data?.error || 'Lỗi không xác định'}`);
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      toast.success(
        publishMode === 'now'
          ? `Đang đăng ${successCount} video!`
          : `Đã lên lịch ${successCount} video thành công!`
      );
      navigate('/posts');
    }
  };

  const showYouTubeWarning = platforms.includes('YOUTUBE_SHORTS');

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-3xl font-bold text-gray-900 tracking-tight">Tạo bài đăng mới</h1>
          <p className="page-subtitle text-[15px] text-gray-500 mt-1">
            Thiết lập tiêu đề, hashtag, bình luận đầu và hẹn giờ tự động xuất bản đa nền tảng
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Upload Zone */}
        <div
          className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${
            dragOver 
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] scale-[1.01] shadow-xl shadow-[var(--color-primary-soft)]' 
              : 'border-gray-200 bg-white hover:border-[var(--color-primary)] hover:bg-gray-50/70 hover:shadow-md'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-primary-soft)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-gray-900">Đang tải video lên hệ thống...</p>
                <p className="text-[14px] text-[var(--color-muted-foreground)] mt-1">
                  {uploadProgress}% hoàn thành
                </p>
              </div>
              <div className="w-full max-w-[280px] mx-auto h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50/80 flex items-center justify-center shadow-sm border border-indigo-100/50">
                <Upload className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-gray-900">
                  Kéo thả video vào đây hoặc <span className="text-[var(--color-primary)] hover:underline">chọn tệp từ máy</span>
                </p>
                <p className="text-[13px] text-gray-500 mt-1">
                  Hỗ trợ định dạng MP4, MOV, WebM (Tối đa 2GB mỗi video)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Form Cards */}
        {videos.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Film className="w-5 h-5 text-[var(--color-primary)]" />
                Nội dung chi tiết bài viết
                <span className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-[12px]">
                  {videos.length} video
                </span>
              </h3>
              {videos.length > 1 && (
                <button
                  type="button"
                  onClick={() => copyToAllVideos(videos[0])}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Sao chép nội dung video đầu tiên cho các video còn lại"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Áp dụng cho tất cả video</span>
                </button>
              )}
            </div>

            <div className="grid gap-6">
              {videos.map((v, idx) => (
                <div key={v.id} className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6 relative group transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)]">
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeVideo(v.id)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Xoá video này"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Video Media Info Bar */}
                  <div className="flex items-center gap-4 pr-10">
                    <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md ring-1 ring-black/5 relative">
                      <video src={v.storageUrl} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                        <Film className="w-6 h-6 text-white/80" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        Video #{idx + 1}: {v.originalFileName}
                      </p>
                      <div className="text-[12px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600">
                          {(v.mimeType || 'video/mp4').split('/')[1].toUpperCase()}
                        </span>
                        <span>{formatFileSize(v.size)}</span>
                        {v.duration ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                            {v.duration}s
                          </span>
                        ) : null}
                        {v.width && v.height ? (
                          <span className={`px-2 py-0.5 rounded-md font-medium ${v.width > v.height ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'}`}>
                            {v.width}x{v.height} ({v.width > v.height ? 'Ngang 16:9' : 'Dọc 9:16'})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* YouTube Shorts Compatibility Warnings */}
                  {platforms.includes('YOUTUBE_SHORTS') && v.width && v.height && v.width > v.height && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-900">Cảnh báo khung hình: Video đang là Video Ngang ({v.width}x{v.height})</p>
                        <p className="mt-0.5 text-rose-700 leading-relaxed">
                          YouTube chỉ phân phối vào tab <strong>Shorts</strong> đối với video dọc (9:16) hoặc vuông (1:1). Nếu bạn đăng video ngang này, YouTube sẽ tự động coi đây là <strong>Video thường (Standard Video)</strong>!
                        </p>
                      </div>
                    </div>
                  )}

                  {platforms.includes('YOUTUBE_SHORTS') && v.duration && v.duration > 180 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-900">Cảnh báo thời lượng: Video quá dài ({v.duration}s)</p>
                        <p className="mt-0.5 text-rose-700 leading-relaxed">
                          YouTube Shorts chỉ hỗ trợ video tối đa 3 phút (180 giây). Video dài hơn sẽ bị YouTube xuất bản dưới dạng Video thông thường.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form Inputs Grid */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {/* 1. Tiêu đề (Title) */}
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-gray-900">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Tiêu đề bài viết / Video
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <span className="text-xs font-normal text-gray-400">
                          {v.title.length}/100 ký tự
                        </span>
                      </label>
                      <input
                        type="text"
                        value={v.title}
                        maxLength={100}
                        onChange={(e) => updateVideoField(v.id, 'title', e.target.value)}
                        className="input-apple text-[15px] font-semibold w-full bg-gray-50/60 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Nhập tiêu đề hiển thị hấp dẫn..."
                        required
                      />
                    </div>

                    {/* 2. Nội dung / Mô tả (Caption) */}
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                        <AlignLeft className="w-4 h-4 text-purple-600" />
                        Nội dung mô tả (Caption)
                      </label>
                      <textarea
                        value={v.caption}
                        onChange={(e) => updateVideoField(v.id, 'caption', e.target.value)}
                        className="input-apple min-h-[90px] resize-y text-[14px] leading-relaxed bg-gray-50/60 border border-gray-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                        placeholder="Nhập nội dung chia sẻ, kêu gọi hành động cho video..."
                        rows={3}
                      />
                    </div>

                    {/* 3. Hashtags & 4. Bình luận đầu tiên */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Hashtags */}
                      <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-2">
                        <label className="block text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                          <Hash className="w-4 h-4 text-emerald-600" />
                          Hashtags (Gắn thẻ xu hướng)
                        </label>
                        <input
                          type="text"
                          value={v.hashtags}
                          onChange={(e) => updateVideoField(v.id, 'hashtags', e.target.value)}
                          className="input-apple text-[14px] bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 w-full"
                          placeholder="#viral #trending #shorts"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {SUGGESTED_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTagToVideo(v.id, tag)}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-700 transition-all shadow-2xs"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* First Comment */}
                      <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 space-y-2">
                        <label className="block text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-amber-600" />
                          Bình luận đầu tiên (Tự động bình luận)
                        </label>
                        <input
                          type="text"
                          value={v.firstComment}
                          onChange={(e) => updateVideoField(v.id, 'firstComment', e.target.value)}
                          className="input-apple text-[14px] bg-white border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 w-full"
                          placeholder="Ví dụ: Link sản phẩm tại bio hoặc Đăng ký kênh nhé!"
                        />
                        <p className="text-[11px] text-amber-800 leading-tight">
                          💡 Hệ thống tự động đăng comment này ngay sau khi video lên sóng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Settings */}
        {videos.length > 0 && (
          <div className="space-y-8 animate-fade-in bg-white rounded-3xl p-8 border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            
            {/* Platform Selection */}
            <div>
              <label className="block text-[15px] font-bold text-gray-900 mb-3">
                1. Chọn nền tảng phân phối
              </label>
              <div className="flex flex-wrap gap-4">
                {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG]][]).map(
                  ([key, config]) => {
                    const selected = platforms.includes(key);
                    
                    let requiredProvider = '';
                    if (key === 'FACEBOOK_REELS' || key === 'INSTAGRAM_REELS') {
                      requiredProvider = 'META';
                    } else if (key === 'YOUTUBE_SHORTS') {
                      requiredProvider = 'YOUTUBE';
                    } else if (key === 'TIKTOK_VIDEO') {
                      requiredProvider = 'TIKTOK';
                    }
                    
                    const isConnected = requiredProvider ? connectedProviders[requiredProvider] : true;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!isConnected}
                        onClick={() => togglePlatform(key)}
                        className={`platform-chip px-5 py-3.5 rounded-2xl text-[14px] font-bold whitespace-nowrap inline-flex items-center gap-2.5 shrink-0 border-2 transition-all duration-200
                          ${!isConnected ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' : 
                            selected ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm text-gray-700'}`}
                        style={selected && isConnected ? { color: config.color, backgroundColor: `${config.color}14`, borderColor: config.color } : {}}
                        title={!isConnected ? `Vui lòng kết nối ${requiredProvider} trong Cài đặt` : ''}
                      >
                        <Film className="w-4 h-4" />
                        {config.name}
                        {!isConnected && (
                          <span className="text-[11px] ml-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 font-bold tracking-wide">
                            CHƯA KẾT NỐI
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {showYouTubeWarning && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3 shadow-sm">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-[14px] text-amber-800 leading-relaxed space-y-1">
                    <p className="font-semibold text-amber-900">Yêu cầu đối với định dạng YouTube Shorts:</p>
                    <p className="text-xs text-amber-700">
                      • <strong>Tỷ lệ khung hình:</strong> Bắt buộc là video dọc (9:16) hoặc vuông (1:1). Video ngang (16:9) sẽ bị YouTube đưa vào danh mục Video thường.
                    </p>
                    <p className="text-xs text-amber-700">
                      • <strong>Thời lượng:</strong> Tối đa 60 giây (hoặc tối đa 180 giây cho video dọc/vuông).
                    </p>
                    <p className="text-xs text-amber-700">
                      • <strong>Hashtag:</strong> Hệ thống tự động thêm thẻ <code>#Shorts</code> vào tiêu đề và mô tả để YouTube lập chỉ mục ngay.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Publish Mode */}
            <div>
              <label className="block text-[15px] font-bold text-gray-900 mb-3">
                2. Chế độ đăng bài
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    publishMode === 'now' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Send className={`w-6 h-6 mb-2 ${publishMode === 'now' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                  <p className="text-[16px] font-bold text-gray-900">Đăng ngay lập tức</p>
                  <p className={`text-[13px] mt-1 ${publishMode === 'now' ? 'text-[var(--color-primary)] font-medium' : 'text-gray-500'}`}>
                    Xuất bản lên các nền tảng đã chọn ngay bây giờ
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    publishMode === 'schedule' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-600/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Calendar className={`w-6 h-6 mb-2 ${publishMode === 'schedule' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <p className="text-[16px] font-bold text-gray-900">Lên lịch hẹn giờ</p>
                  <p className={`text-[13px] mt-1 ${publishMode === 'schedule' ? 'text-indigo-700 font-medium' : 'text-gray-500'}`}>
                    Tự động xuất bản theo ngày và giờ chính xác
                  </p>
                </button>
              </div>
            </div>

            {/* Schedule DateTime Input */}
            {publishMode === 'schedule' && (
              <div className="animate-fade-in bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-200 space-y-3">
                <label className="block text-[15px] font-bold text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Chọn ngày & giờ tự động xuất bản
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    Bắt buộc chọn giờ
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input-apple w-full py-3.5 px-4 text-[16px] font-medium border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl bg-white"
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  required
                />
                {scheduledAt ? (
                  <div className="flex items-center gap-2.5 text-[14px] text-indigo-950 bg-white p-3.5 rounded-xl border border-indigo-200 font-medium shadow-xs">
                    <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>
                      Hệ thống sẽ tự động xuất bản vào lúc: <strong className="text-indigo-700 font-bold">{safeFormatDate(scheduledAt, 'HH:mm - EEEE, dd/MM/yyyy')}</strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-[13px] text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    Vui lòng chọn thời gian trong tương lai để hệ thống tự động xuất bản.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || platforms.length === 0}
                className="btn-primary w-full py-4 text-[16px] font-bold whitespace-nowrap inline-flex items-center justify-center gap-2.5 shrink-0 shadow-md hover:shadow-lg transition-all rounded-2xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {publishMode === 'now' ? 'Đang gửi yêu cầu đăng...' : 'Đang thiết lập lịch hẹn...'}
                  </>
                ) : publishMode === 'now' ? (
                  <>
                    <Send className="w-5 h-5" />
                    Đăng ngay {videos.length} Video
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Lên lịch hẹn giờ {videos.length} Video
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
