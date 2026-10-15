import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  Repeat,
  Sparkles,
  Wand2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { PLATFORM_CONFIG, safeFormatDate } from '../lib/utils';
import { DuplicateWarningCard, type DuplicateCheckResult } from '../components/DuplicateWarningCard';
import { ContentScoreCard, type ContentScoreData } from '../components/ContentScoreCard';
import { SpinModal, type SpinVariantItem } from '../components/SpinModal';
import { AiWriterModal } from '../components/AiWriterModal';

type Platform = keyof typeof PLATFORM_CONFIG;
type PublishMode = 'now' | 'schedule';

export const PLATFORM_PROVIDER_MAP: Record<string, string> = {
  FACEBOOK_REELS: 'META',
  FACEBOOK_POST: 'META',
  INSTAGRAM_REELS: 'META',
  INSTAGRAM_CAROUSEL: 'META',
  INSTAGRAM_STORY: 'META',
  YOUTUBE_SHORTS: 'YOUTUBE',
  TIKTOK_VIDEO: 'TIKTOK',
  ZALO_POST: 'ZALO',
  ZALO_ARTICLE: 'ZALO',
};

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

  // Evergreen state (F083)
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [recycleIntervalDays, setRecycleIntervalDays] = useState(30);

  // Duplicate Check state per video ID (F082)
  const [duplicateResults, setDuplicateResults] = useState<Record<string, DuplicateCheckResult | null>>({});
  const [checkingDuplicates, setCheckingDuplicates] = useState<Record<string, boolean>>({});
  const [spinningCaption, setSpinningCaption] = useState<Record<string, boolean>>({});

  // AI Content Score state per video ID (F084)
  const [scoreResults, setScoreResults] = useState<Record<string, ContentScoreData | null>>({});
  const [scoringContent, setScoringContent] = useState<Record<string, boolean>>({});

  // F015 & F016: Spin Modal & AI Writer Modal state
  const location = useLocation();
  const [spinModalOpen, setSpinModalOpen] = useState(false);
  const [aiWriterModalOpen, setAiWriterModalOpen] = useState(false);
  const [activeVideoForModal, setActiveVideoForModal] = useState<UploadedVideo | null>(null);

  // Listen for navigation state from ContentStudio
  useEffect(() => {
    const locState = location.state as { prefilledTitle?: string; prefilledCaption?: string } | null;
    if (locState?.prefilledTitle || locState?.prefilledCaption) {
      if (videos.length === 0) {
        const draft: UploadedVideo = {
          id: `draft_${Date.now()}`,
          originalFileName: 'Ban_thao_Content_Studio.mp4',
          titleFromFileName: locState.prefilledTitle || 'Bài viết mới',
          storageUrl: '',
          size: 1024 * 500,
          mimeType: 'video/mp4',
          title: locState.prefilledTitle || '',
          caption: locState.prefilledCaption || '',
          firstComment: '',
          hashtags: '#Topify #ContentStudio',
        };
        setVideos([draft]);
      } else {
        updateVideoField(videos[0].id, 'title', locState.prefilledTitle || videos[0].title);
        updateVideoField(videos[0].id, 'caption', locState.prefilledCaption || videos[0].caption);
      }
      toast.success('Đã áp dụng nội dung từ Content Studio!');
    }
  }, [location.state]);

  const openAiWriterModal = (video?: UploadedVideo) => {
    setActiveVideoForModal(video || (videos.length > 0 ? videos[0] : null));
    setAiWriterModalOpen(true);
  };

  const openSpinModal = (video?: UploadedVideo) => {
    setActiveVideoForModal(video || (videos.length > 0 ? videos[0] : null));
    setSpinModalOpen(true);
  };

  const handleApplyAiContent = (content: { title: string; caption: string; hashtags?: string }) => {
    if (activeVideoForModal) {
      updateVideoField(activeVideoForModal.id, 'title', content.title);
      updateVideoField(activeVideoForModal.id, 'caption', content.caption);
      if (content.hashtags) {
        updateVideoField(activeVideoForModal.id, 'hashtags', content.hashtags);
      }
    } else if (videos.length > 0) {
      updateVideoField(videos[0].id, 'title', content.title);
      updateVideoField(videos[0].id, 'caption', content.caption);
      if (content.hashtags) {
        updateVideoField(videos[0].id, 'hashtags', content.hashtags);
      }
    } else {
      const draft: UploadedVideo = {
        id: `draft_${Date.now()}`,
        originalFileName: 'Ban_thao_AI.mp4',
        titleFromFileName: content.title || 'Bài viết AI',
        storageUrl: '',
        size: 1024 * 500,
        mimeType: 'video/mp4',
        title: content.title,
        caption: content.caption,
        firstComment: '',
        hashtags: content.hashtags || '',
      };
      setVideos([draft]);
    }
  };

  const handleApplySpinVariant = (caption: string, title?: string) => {
    const targetVideo = activeVideoForModal || (videos.length > 0 ? videos[0] : null);
    if (targetVideo) {
      updateVideoField(targetVideo.id, 'caption', caption);
      if (title) updateVideoField(targetVideo.id, 'title', title);
    } else {
      const draft: UploadedVideo = {
        id: `draft_${Date.now()}`,
        originalFileName: 'Ban_thao_Spin.mp4',
        titleFromFileName: title || 'Bài viết Spin',
        storageUrl: '',
        size: 1024 * 500,
        mimeType: 'video/mp4',
        title: title || 'Biến thể bài viết',
        caption: caption,
        firstComment: '',
        hashtags: '#Topify #SpinVariant',
      };
      setVideos([draft]);
    }
  };

  const handleDistributeSpinVariants = (variants: SpinVariantItem[]) => {
    if (videos.length === 0) return;
    setVideos((prev) =>
      prev.map((v, idx) => {
        const variant = variants[idx % variants.length];
        return {
          ...v,
          caption: variant.caption,
          title: variant.title || v.title,
        };
      })
    );
  };

  // F108: Listen for transfer from Social Search
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const captionParam = searchParams.get('caption');
    const tagsParam = searchParams.get('tags');
    const sourceParam = searchParams.get('source');

    if (captionParam && videos.length === 0) {
      const newDraftVideo: UploadedVideo = {
        id: `draft_${Date.now()}`,
        originalFileName: `Y_tuong_tu_${sourceParam || 'Social_Search'}.mp4`,
        titleFromFileName: `Ý tưởng từ ${sourceParam || 'Xu hướng MXH'}`,
        storageUrl: '',
        size: 1024 * 500,
        mimeType: 'video/mp4',
        title: `Ý tưởng từ ${sourceParam || 'Xu hướng MXH'}`,
        caption: decodeURIComponent(captionParam),
        firstComment: '',
        hashtags: tagsParam ? decodeURIComponent(tagsParam) : '',
      };
      setVideos([newDraftVideo]);
      toast.success('Đã nạp ý tưởng nội dung từ Social Search vào bài viết!');
    }
  }, [searchParams]);

  const handleAnalyzeContentScore = async (video: UploadedVideo) => {
    if (!video.caption?.trim() && !video.title?.trim()) {
      toast.error('Vui lòng nhập nội dung mô tả hoặc tiêu đề trước khi chấm điểm');
      return;
    }

    setScoringContent((prev) => ({ ...prev, [video.id]: true }));
    try {
      const res = await api.post('/content/ai-score', {
        title: video.title || video.titleFromFileName || '',
        caption: video.caption || '',
        platform: platforms[0] || 'TIKTOK_VIDEO',
      });

      if (res?.data?.data) {
        setScoreResults((prev) => ({ ...prev, [video.id]: res.data.data }));
        toast.success(`Chấm điểm hoàn tất: ${res.data.data.overallScore}/100 điểm!`);
      }
    } catch (err: any) {
      console.error('Failed to analyze score', err);
      toast.error(err?.response?.data?.error || 'Không thể chấm điểm nội dung lúc này');
    } finally {
      setScoringContent((prev) => ({ ...prev, [video.id]: false }));
    }
  };

  const handleApplySuggestedCaption = (video: UploadedVideo, newCaption: string) => {
    updateVideoField(video.id, 'caption', newCaption);
    toast.success('Đã áp dụng bản caption tối ưu hóa của AI!');
  };

  // Debounced duplicate content scanner
  useEffect(() => {
    if (videos.length === 0) return;

    const timer = setTimeout(async () => {
      for (const v of videos) {
        if (!v.title && !v.caption && !v.id) continue;

        setCheckingDuplicates((prev) => ({ ...prev, [v.id]: true }));
        try {
          const res = await api.post('/content/duplicate-check', {
            title: v.title || v.titleFromFileName || '',
            caption: v.caption || '',
            videoAssetId: v.id,
          });
          setDuplicateResults((prev) => ({ ...prev, [v.id]: res.data }));
        } catch (err) {
          console.error('Failed duplicate check for video', v.id, err);
        } finally {
          setCheckingDuplicates((prev) => ({ ...prev, [v.id]: false }));
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [videos]);

  const handleSpinCaption = async (video: UploadedVideo) => {
    setSpinningCaption((prev) => ({ ...prev, [video.id]: true }));
    try {
      const res = await api
        .post('/ai/spin-caption', {
          title: video.title,
          caption: video.caption,
        })
        .catch(() => null);

      if (res?.data?.newCaption) {
        updateVideoField(video.id, 'caption', res.data.newCaption);
        toast.success('Đã viết lại caption thành công với AI!');
      } else {
        const original = video.caption || video.title;
        const hooks = [
          '🔥 Bạn đã biết điều này chưa? ',
          '💡 Bí quyết cực hay không thể bỏ lỡ: ',
          '✨ Chia sẻ hữu ích hôm nay dành cho bạn: ',
          '🚀 Khám phá ngay mẹo đỉnh cao này: ',
        ];
        const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
        const newText = original ? `${randomHook}${original.replace(/^[🔥💡✨🚀]\s*/, '')}` : randomHook;
        updateVideoField(video.id, 'caption', newText);
        toast.success('Đã làm mới nội dung Caption!');
      }
    } catch {
      toast.error('Không thể làm mới caption');
    } finally {
      setSpinningCaption((prev) => ({ ...prev, [video.id]: false }));
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/social/status');
        if (res.data && res.data.connections) {
          const providers: Record<string, boolean> = {};
          res.data.connections.forEach((conn: any) => {
            if (conn.provider && conn.connected !== false) {
              providers[conn.provider] = true;
              if (conn.provider === 'GOOGLE') providers['YOUTUBE'] = true;
              if (conn.provider === 'YOUTUBE') providers['GOOGLE'] = true;
            }
          });
          setConnectedProviders(providers);
          // Auto filter out any platform that is not connected
          setPlatforms((prev) =>
            prev.filter((p) => {
              const req = PLATFORM_PROVIDER_MAP[p];
              return req ? !!providers[req] : false;
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch social status', error);
      }
    };
    fetchStatus();

    const handleFocus = () => fetchStatus();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchStatus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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
    const requiredProvider = PLATFORM_PROVIDER_MAP[platform];
    const isConnected = requiredProvider ? !!connectedProviders[requiredProvider] : false;
    if (!isConnected) {
      const name = requiredProvider === 'META' ? 'Facebook' : requiredProvider === 'TIKTOK' ? 'TikTok' : requiredProvider;
      toast.error(`Vui lòng kết nối tài khoản ${name} trước khi chọn!`);
      return;
    }
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

    const unconnected = platforms.filter(p => {
      const req = PLATFORM_PROVIDER_MAP[p];
      return !req || !connectedProviders[req];
    });

    if (unconnected.length > 0) {
      const missingNames = Array.from(new Set(unconnected.map(p => {
        const req = PLATFORM_PROVIDER_MAP[p];
        if (req === 'META') return 'Facebook';
        if (req === 'TIKTOK') return 'TikTok';
        if (req === 'YOUTUBE') return 'YouTube';
        if (req === 'ZALO') return 'Zalo';
        return req || p;
      }))).join('/');
      toast.error(`Vui lòng kết nối tài khoản ${missingNames} trước khi đăng.`);
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
          isEvergreen,
          recycleIntervalDays: isEvergreen ? Number(recycleIntervalDays) : undefined,
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

      {/* Content Studio AI Toolbar (M2: F015 & F016) */}
      <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-blue-50/80 border border-purple-200/60 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Content Studio AI Toolbar</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                M2 • F015 & F016
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tự động viết kịch bản đa ngành hàng hoặc spin biến thể caption chống thuật toán spam
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAiWriterModal()}
            className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 hover:shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Trợ Lý AI Viết Bài (F016)
          </button>
          <button
            type="button"
            onClick={() => openSpinModal()}
            className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 hover:shadow-xs"
          >
            <Repeat className="w-3.5 h-3.5 text-purple-600" />
            Spin Biến Thể Caption (F015)
          </button>
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                          <AlignLeft className="w-4 h-4 text-purple-600" />
                          Nội dung mô tả (Caption)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAiWriterModal(v)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            Trợ lý AI (F016)
                          </button>
                          <button
                            type="button"
                            onClick={() => openSpinModal(v)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <Repeat className="w-3 h-3 text-purple-600" />
                            Spin biến thể (F015)
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={v.caption}
                        onChange={(e) => updateVideoField(v.id, 'caption', e.target.value)}
                        className="input-apple min-h-[90px] resize-y text-[14px] leading-relaxed bg-gray-50/60 border border-gray-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                        placeholder="Nhập nội dung chia sẻ, kêu gọi hành động cho video..."
                        rows={3}
                      />

                      {/* Duplicate Warning Card (F082) */}
                      <div className="pt-2">
                        <DuplicateWarningCard
                          result={duplicateResults[v.id] || null}
                          loading={!!checkingDuplicates[v.id]}
                          onSpinCaption={() => handleSpinCaption(v)}
                          isSpinning={!!spinningCaption[v.id]}
                        />
                      </div>

                      {/* AI Content Score Card (F084) */}
                      <div className="pt-2">
                        <ContentScoreCard
                          scoreData={scoreResults[v.id] || null}
                          loading={!!scoringContent[v.id]}
                          onAnalyze={() => handleAnalyzeContentScore(v)}
                          onApplySuggested={(newCap) => handleApplySuggestedCaption(v, newCap)}
                          canAnalyze={Boolean(v.caption?.trim() || v.title?.trim())}
                        />
                      </div>
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
                    const requiredProvider = PLATFORM_PROVIDER_MAP[key] || '';
                    const isConnected = requiredProvider ? !!connectedProviders[requiredProvider] : false;

                    const handlePlatformClick = () => {
                      if (!isConnected) {
                        const providerName = requiredProvider === 'META' ? 'Meta (Facebook / Instagram)' : requiredProvider;
                        toast.error(`Nền tảng "${config.name}" chưa được kết nối. Vui lòng vào Cài đặt hệ thống > Kết nối tài khoản ${providerName}.`);
                        return;
                      }
                      togglePlatform(key);
                    };

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={handlePlatformClick}
                        className={`platform-chip px-5 py-3.5 rounded-2xl text-[14px] font-bold whitespace-nowrap inline-flex items-center gap-2.5 shrink-0 border-2 transition-all duration-200 cursor-pointer
                          ${!isConnected 
                            ? 'opacity-40 bg-gray-50 border-gray-200 text-gray-400 select-none hover:bg-gray-100/80 hover:border-gray-300' 
                            : selected 
                              ? 'shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm text-gray-700'}`}
                        style={selected && isConnected ? { color: config.color, backgroundColor: `${config.color}14`, borderColor: config.color } : {}}
                        title={!isConnected ? `Nhấp để xem hướng dẫn kết nối ${requiredProvider}` : ''}
                      >
                        <Film className="w-4 h-4" />
                        {config.name}
                        {!isConnected && (
                          <span className="text-[11px] ml-1 px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200 font-bold tracking-wide">
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

            {/* 3. Tùy chọn Tái đăng (Evergreen Content - F083) */}
            <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white mt-0.5 shadow-sm">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                      Nội dung Evergreen (Tái đăng định kỳ)
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Mới
                      </span>
                    </h3>
                    <p className="text-[13px] text-gray-600 mt-0.5">
                      Đánh dấu video này là nội dung giá trị lâu dài. Hệ thống sẽ tự động lên lịch đăng lại sau một khoảng thời gian mà không làm mất bài cũ.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isEvergreen}
                    onChange={(e) => setIsEvergreen(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isEvergreen && (
                <div className="pt-3 border-t border-emerald-200/60 animate-fade-in space-y-3">
                  <label className="block text-[14px] font-bold text-gray-900">
                    Chu kỳ tái xuất bản (ngày):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[15, 30, 45, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setRecycleIntervalDays(days)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          recycleIntervalDays === days
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        {days} ngày
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={recycleIntervalDays}
                        onChange={(e) => setRecycleIntervalDays(Math.max(1, parseInt(e.target.value) || 30))}
                        className="input-apple text-xs w-20 py-1.5 px-2 bg-white border border-gray-200"
                      />
                      <span className="text-xs text-gray-500 font-medium">ngày</span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800">
                    💡 Sau {recycleIntervalDays} ngày kể từ lần xuất bản gần nhất, bài viết này sẽ xuất hiện trong danh sách "Cần tái đăng" để bạn kiểm tra hoặc tự động đăng lại.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              {platforms.some(p => !connectedProviders[PLATFORM_PROVIDER_MAP[p]]) && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Vui lòng kết nối tài khoản mạng xã hội trước khi đăng bài.</span>
                </div>
              )}
              {platforms.length === 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Vui lòng chọn ít nhất 1 nền tảng mạng xã hội đã kết nối để tiếp tục.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || platforms.length === 0 || platforms.some(p => !connectedProviders[PLATFORM_PROVIDER_MAP[p]])}
                className="btn-primary w-full py-4 text-[16px] font-bold whitespace-nowrap inline-flex items-center justify-center gap-2.5 shrink-0 shadow-md hover:shadow-lg transition-all rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* F015 Spin Modal */}
      <SpinModal
        isOpen={spinModalOpen}
        onClose={() => setSpinModalOpen(false)}
        initialCaption={activeVideoForModal?.caption || videos[0]?.caption || ''}
        initialTitle={activeVideoForModal?.title || videos[0]?.title || ''}
        onApplyVariant={handleApplySpinVariant}
        onDistributeToAllVideos={handleDistributeSpinVariants}
        totalVideosCount={videos.length}
      />

      {/* F016 AI Writer Modal */}
      <AiWriterModal
        isOpen={aiWriterModalOpen}
        onClose={() => setAiWriterModalOpen(false)}
        initialTopic={activeVideoForModal?.title || videos[0]?.title || ''}
        onApplyContent={handleApplyAiContent}
      />
    </div>
  );
}
