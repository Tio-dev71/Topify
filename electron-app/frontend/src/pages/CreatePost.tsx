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
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { PLATFORM_CONFIG } from '../lib/utils';

type Platform = 'FACEBOOK_REELS' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS';
type PublishMode = 'now' | 'schedule';

interface UploadedVideo {
  id: string;
  originalFileName: string;
  titleFromFileName: string;
  storageUrl: string;
  size: number;
  mimeType: string;
  // User editable
  title: string;
  caption: string;
  firstComment: string;
  hashtags: string;
}

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

      const formData = new FormData();
      formData.append('video', file);

      try {
        const res = await api.post('/upload', formData);

        if (res.status === 200 || res.status === 201) {
          const result = res.data;
          setVideos((prev) => [
            ...prev,
            {
              ...result,
              title: result.titleFromFileName || file.name,
              caption: '',
              firstComment: '',
              hashtags: '',
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
    if (publishMode === 'schedule' && !scheduledAt) {
      toast.error('Vui lòng chọn ngày và giờ đăng.');
      return;
    }

    setSubmitting(true);
    let successCount = 0;

    for (const video of videos) {
      try {
        const res = await api.post('/posts', {
          title: video.title.trim() || video.titleFromFileName,
          caption: video.caption.trim() || null,
          firstComment: video.firstComment.trim() || null,
          hashtags: video.hashtags.trim() || null,
          videoAssetId: video.id,
          platforms,
          publishMode,
          scheduledAt: publishMode === 'schedule' ? new Date(scheduledAt).toISOString() : null,
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
          : `Đã lên lịch ${successCount} video!`
      );
      navigate('/posts');
    }
  };

  const showYouTubeWarning = platforms.includes('YOUTUBE_SHORTS');

  return (
    <div className="max-w-[720px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Tạo bài đăng</h1>
          <p className="page-subtitle">
            Tải lên video và lên lịch đăng bài hàng loạt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-10">
        {/* Upload Zone */}
        <div
          className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer ${
            dragOver 
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] scale-[1.02] shadow-xl shadow-[var(--color-primary-soft)]' 
              : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] hover:bg-gray-50 hover:shadow-lg'
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
                <p className="text-[16px] font-semibold text-gray-900">Đang tải video lên...</p>
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
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 transition-transform group-hover:scale-110 duration-300">
                <Upload className="w-8 h-8 text-[var(--color-muted-foreground)]" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900">
                  Kéo thả video vào đây hoặc <span className="text-[var(--color-primary)] hover:underline">chọn tệp</span>
                </p>
                <p className="text-[14px] text-[var(--color-muted-foreground)] mt-1.5">
                  Hỗ trợ MP4, MOV, WebM (Tối đa 2GB mỗi file)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Previews */}
        {videos.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-[var(--color-primary)]" />
              Chi tiết video <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[13px]">{videos.length}</span>
            </h3>
            <div className="grid gap-6">
              {videos.map(v => (
                <div key={v.id} className="card-apple p-6 space-y-5 relative group">
                  <button
                    type="button"
                    onClick={() => removeVideo(v.id)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Xoá video"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-5 pr-12">
                    <div className="w-28 h-28 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md ring-1 ring-black/5">
                      <video src={v.storageUrl} className="w-full h-full object-cover" muted />
                    </div>
                    <div className="flex-1 space-y-3 min-w-0 pt-1">
                      <div>
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => updateVideoField(v.id, 'title', e.target.value)}
                          className="input-apple text-[16px] font-semibold w-full placeholder:font-normal"
                          placeholder="Tiêu đề video"
                          required
                        />
                        <p className="text-[13px] text-[var(--color-muted-foreground)] mt-2 flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{(v.mimeType || 'video/mp4').split('/')[1].toUpperCase()}</span>
                          <span>{formatFileSize(v.size)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <textarea
                          value={v.caption}
                          onChange={(e) => updateVideoField(v.id, 'caption', e.target.value)}
                          className="input-apple min-h-[100px] resize-y text-[14px] leading-relaxed bg-white"
                          placeholder="Nội dung bài viết (Caption)..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={v.hashtags}
                          onChange={(e) => updateVideoField(v.id, 'hashtags', e.target.value)}
                          className="input-apple text-[14px] bg-white"
                          placeholder="#viral #trending"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={v.firstComment}
                          onChange={(e) => updateVideoField(v.id, 'firstComment', e.target.value)}
                          className="input-apple text-[14px] bg-white"
                          placeholder="Bình luận đầu tiên (Tuỳ chọn)"
                        />
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
          <div className="space-y-8 animate-fade-in card-apple p-8 bg-gray-50/50 mt-8">
            
            {/* Platform Selection */}
            <div>
              <label className="block text-[15px] font-semibold text-gray-900 mb-4">
                Chọn nền tảng đăng
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
                    }
                    
                    // We only disable if we know the provider is required and not connected
                    const isConnected = requiredProvider ? connectedProviders[requiredProvider] : true;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!isConnected}
                        onClick={() => togglePlatform(key)}
                        className={`platform-chip px-5 py-3 rounded-2xl text-[14px] font-medium flex items-center gap-2.5 border-2 transition-all duration-200
                          ${!isConnected ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400' : 
                            selected ? 'border-transparent shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'}`}
                        style={selected && isConnected ? { color: config.color, backgroundColor: `${config.color}14`, borderColor: config.color } : {}}
                        title={!isConnected ? `Vui lòng kết nối ${requiredProvider} trong Cài đặt` : ''}
                      >
                        <Film className="w-4 h-4" />
                        {config.name}
                        {!isConnected && <span className="text-[11px] ml-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 font-bold tracking-wide">CHƯA KẾT NỐI</span>}
                      </button>
                    );
                  }
                )}
              </div>

              {showYouTubeWarning && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3 shadow-sm">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[14px] text-amber-800 leading-relaxed font-medium">
                    Đối với YouTube Shorts, video cần có định dạng dọc (9:16) và độ dài dưới 60 giây để có kết quả tốt nhất.
                  </p>
                </div>
              )}
            </div>

            {/* Publish Mode */}
            <div>
              <label className="block text-[15px] font-semibold text-gray-900 mb-4">
                Chế độ đăng
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${publishMode === 'now' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
                >
                  <Send className={`w-6 h-6 mb-3 ${publishMode === 'now' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                  <p className="text-[15px] font-semibold text-gray-900">Đăng ngay</p>
                  <p className={`text-[13px] mt-1 ${publishMode === 'now' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>Xuất bản lên nền tảng ngay lập tức</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${publishMode === 'schedule' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
                >
                  <Calendar className={`w-6 h-6 mb-3 ${publishMode === 'schedule' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                  <p className="text-[15px] font-semibold text-gray-900">Lên lịch hẹn giờ</p>
                  <p className={`text-[13px] mt-1 ${publishMode === 'schedule' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>Chọn thời gian tự động đăng bài</p>
                </button>
              </div>
            </div>

            {/* Schedule DateTime */}
            {publishMode === 'schedule' && (
              <div className="animate-fade-in bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  Ngày & Giờ lên lịch
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input-apple w-full py-3 px-4 text-[15px]"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            )}

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting || platforms.length === 0}
                className="btn-primary w-full py-4 text-[16px] font-semibold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {publishMode === 'now' ? 'Đang xuất bản...' : 'Đang lên lịch...'}
                  </>
                ) : publishMode === 'now' ? (
                  <>
                    <Send className="w-5 h-5" />
                    Đăng ngay {videos.length} Video
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Lên lịch {videos.length} Video
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
