import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
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
  AlertCircle,
  Repeat,
  Sparkles,
  Wand2,
  Layers,
  Shuffle,
  Dices,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getMediaUrl } from '../lib/axios';
import { PLATFORM_CONFIG, safeFormatDate, sanitizeUtf8, sanitizeUtf8Nullable } from '../lib/utils';
import {
  GOLDEN_HOUR_PRESETS,
  getLocalDateString,
  normalizeDateStringToYMD,
  isPresetDisabled,
  getWindowStatus,
  computeRandomWindowTimes,
} from '../lib/randomWindow';
import { DuplicateWarningCard, type DuplicateCheckResult } from '../components/DuplicateWarningCard';
import { ContentScoreCard, type ContentScoreData } from '../components/ContentScoreCard';
import { SpinModal, type SpinVariantItem } from '../components/SpinModal';
import { AiWriterModal } from '../components/AiWriterModal';

type Platform = keyof typeof PLATFORM_CONFIG;
type PublishMode = 'now' | 'schedule' | 'random_window';

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
  isDraft?: boolean;
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
  const [replacingDraftId, setReplacingDraftId] = useState<string | null>(null);
  const [draftReminderModalOpen, setDraftReminderModalOpen] = useState(false);
  const [targetDraftForModal, setTargetDraftForModal] = useState<UploadedVideo | null>(null);

  const handleTriggerReplaceDraft = (draftId?: string) => {
    if (draftId) {
      setReplacingDraftId(draftId);
    } else {
      const firstDraft = videos.find(v => v.isDraft || v.id.startsWith('draft_') || !v.storageUrl);
      setReplacingDraftId(firstDraft ? firstDraft.id : null);
    }
    fileInputRef.current?.click();
  };

  // Global Form state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // F022: Random Time Window State
  const getInitialRandomDate = () => {
    const now = new Date();
    // Evening preset ends at 22:30. If it's already 22:30 or later, default to tomorrow
    if (now.getHours() > 22 || (now.getHours() === 22 && now.getMinutes() >= 30)) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return getLocalDateString(tomorrow);
    }
    return getLocalDateString(now);
  };

  const [randomDate, setRandomDate] = useState<string>(getInitialRandomDate);
  const [randomStartTime, setRandomStartTime] = useState<string>('19:30');
  const [randomEndTime, setRandomEndTime] = useState<string>('22:30');
  const [randomPreset, setRandomPreset] = useState<string>('evening');
  const [isEvenlySpaced, setIsEvenlySpaced] = useState<boolean>(true);
  const [randomShuffleKey, setRandomShuffleKey] = useState<number>(0);
  const [currentClock, setCurrentClock] = useState<Date>(() => new Date());

  // Periodically refresh currentClock to keep disabled presets and random boundaries up to date
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Auto-switch away from expired presets when randomDate changes
  useEffect(() => {
    const currentP = GOLDEN_HOUR_PRESETS.find((p) => p.id === randomPreset);
    if (currentP && isPresetDisabled(currentP, randomDate, currentClock)) {
      const firstAvailable = GOLDEN_HOUR_PRESETS.find((p) => p.id !== 'custom' && !isPresetDisabled(p, randomDate, currentClock));
      if (firstAvailable) {
        setRandomPreset(firstAvailable.id);
        setRandomStartTime(firstAvailable.start);
        setRandomEndTime(firstAvailable.end);
        setRandomShuffleKey((k) => k + 1);
      } else {
        setRandomPreset('custom');
      }
    }
  }, [randomDate, randomPreset, currentClock]);

  const handleSelectPreset = (preset: { id: string; start: string; end: string }) => {
    if (isPresetDisabled(preset, randomDate, currentClock)) return;
    setRandomPreset(preset.id);
    if (preset.id !== 'custom') {
      setRandomStartTime(preset.start);
      setRandomEndTime(preset.end);
      setRandomShuffleKey((prev) => prev + 1);
    }
  };

  // Compute distributed / random timestamps for each video
  const getComputedRandomTimes = useCallback((): Record<string, Date> => {
    const itemIds = videos.length > 0 ? videos.map((v) => v.id) : ['preview_single'];
    return computeRandomWindowTimes({
      randomDate,
      startTime: randomStartTime,
      endTime: randomEndTime,
      itemIds,
      isEvenlySpaced,
      shuffleKey: randomShuffleKey,
      currentTime: currentClock,
    });
  }, [randomDate, randomStartTime, randomEndTime, videos, isEvenlySpaced, randomShuffleKey, currentClock]);

  const computedRandomSchedule = getComputedRandomTimes();
  const windowStatus = getWindowStatus(randomDate, randomStartTime, randomEndTime, currentClock);
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

  // Listen for navigation state from ContentStudio / MultiPlatformResizer
  useEffect(() => {
    const locState = location.state as {
      prefilledTitle?: string;
      prefilledCaption?: string;
      prefilledHashtags?: string;
      prefilledMediaUrl?: string;
      prefilledMediaName?: string;
      prefilledMediaType?: 'image' | 'video';
    } | null;
    if (locState?.prefilledTitle || locState?.prefilledCaption || locState?.prefilledHashtags || locState?.prefilledMediaUrl) {
      if (videos.length === 0) {
        const draft: UploadedVideo = {
          id: `draft_${Date.now()}`,
          originalFileName: locState.prefilledMediaName || (locState.prefilledMediaUrl ? 'asset_resized.png' : 'Bản thảo kịch bản AI (Chưa gắn video)'),
          titleFromFileName: locState.prefilledTitle || 'Bản thảo kịch bản AI',
          storageUrl: locState.prefilledMediaUrl || '',
          size: 1024 * 1024,
          mimeType: locState.prefilledMediaType === 'image' || (locState.prefilledMediaUrl && locState.prefilledMediaUrl.startsWith('data:image')) ? 'image/png' : 'video/mp4',
          isDraft: !locState.prefilledMediaUrl,
          title: locState.prefilledTitle || '',
          caption: locState.prefilledCaption || '',
          firstComment: '',
          hashtags: locState.prefilledHashtags || '#Topify #ContentStudio',
        };
        setVideos([draft]);
      } else {
        updateVideoField(videos[0].id, 'title', locState.prefilledTitle || videos[0].title);
        updateVideoField(videos[0].id, 'caption', locState.prefilledCaption || videos[0].caption);
        if (locState.prefilledHashtags) {
          updateVideoField(videos[0].id, 'hashtags', locState.prefilledHashtags);
        }
        if (locState.prefilledMediaUrl) {
          setVideos(prev =>
            prev.map((v, i) =>
              i === 0
                ? {
                    ...v,
                    storageUrl: locState.prefilledMediaUrl!,
                    originalFileName: locState.prefilledMediaName || v.originalFileName,
                    mimeType:
                      locState.prefilledMediaType === 'image' ||
                      locState.prefilledMediaUrl!.startsWith('data:image')
                        ? 'image/png'
                        : 'video/mp4',
                    isDraft: false,
                  }
                : v
            )
          );
        }
      }
      toast.success(
        locState.prefilledMediaUrl
          ? 'Đã áp dụng asset đã resize và nội dung vào bài viết!'
          : 'Đã áp dụng nội dung từ Content Studio! Vui lòng tải video thực tế để xuất bản.'
      );
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
        originalFileName: 'Bản thảo kịch bản AI (Chưa gắn video)',
        titleFromFileName: content.title || 'Bản thảo kịch bản AI',
        storageUrl: '',
        size: 0,
        mimeType: 'video/mp4',
        isDraft: true,
        title: content.title,
        caption: content.caption,
        firstComment: '',
        hashtags: content.hashtags || '',
      };
      setVideos([draft]);
      toast.success('Đã nạp kịch bản AI vào bản thảo! Vui lòng tải video thực tế để xuất bản.');
    }
  };

  const handleApplySpinVariant = (caption: string, title?: string) => {
    const safeCaption = sanitizeUtf8(caption);
    const safeTitle = sanitizeUtf8(title);
    const targetVideo = activeVideoForModal || (videos.length > 0 ? videos[0] : null);
    if (targetVideo) {
      updateVideoField(targetVideo.id, 'caption', safeCaption);
      if (safeTitle) updateVideoField(targetVideo.id, 'title', safeTitle);
    } else {
      const draft: UploadedVideo = {
        id: `draft_${Date.now()}`,
        originalFileName: 'Bản thảo Spin (Chưa gắn video)',
        titleFromFileName: safeTitle || 'Bản thảo Spin',
        storageUrl: '',
        size: 0,
        mimeType: 'video/mp4',
        isDraft: true,
        title: safeTitle || 'Biến thể bài viết',
        caption: safeCaption,
        firstComment: '',
        hashtags: '#Topify #SpinVariant',
      };
      setVideos([draft]);
      toast.success('Đã áp dụng biến thể Spin! Vui lòng tải video thực tế để xuất bản.');
    }
  };

  const handleDistributeSpinVariants = (variants: SpinVariantItem[]) => {
    if (videos.length === 0) return;
    setVideos((prev) =>
      prev.map((v, idx) => {
        const variant = variants[idx % variants.length];
        const safeCaption = sanitizeUtf8(variant.caption);
        const safeTitle = sanitizeUtf8(variant.title);
        return {
          ...v,
          caption: safeCaption,
          title: safeTitle || v.title,
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
        originalFileName: `Bản thảo từ ${sourceParam || 'Xu hướng MXH'} (Chưa gắn video)`,
        titleFromFileName: `Ý tưởng từ ${sourceParam || 'Xu hướng MXH'}`,
        storageUrl: '',
        size: 0,
        mimeType: 'video/mp4',
        isDraft: true,
        title: `Ý tưởng từ ${sourceParam || 'Xu hướng MXH'}`,
        caption: decodeURIComponent(captionParam),
        firstComment: '',
        hashtags: tagsParam ? decodeURIComponent(tagsParam) : '',
      };
      setVideos([newDraftVideo]);
      toast.success('Đã nạp ý tưởng nội dung từ Social Search! Vui lòng tải video thực tế để xuất bản.');
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
        platform: platforms[0] || '',
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
        if (v.isDraft || v.id.startsWith('draft_') || !v.storageUrl) continue;

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
        const cleanOriginal = sanitizeUtf8(original ? original.replace(/^[🔥💡✨🚀]\s*/u, '') : '');
        const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
        const newText = cleanOriginal ? sanitizeUtf8(`${randomHook}${cleanOriginal}`) : randomHook;
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
    let replacedCount = 0;

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
          setVideos((prev) => {
            const targetIdx = replacingDraftId
              ? prev.findIndex(v => v.id === replacingDraftId)
              : prev.findIndex(v => v.isDraft || v.id.startsWith('draft_') || !v.storageUrl);

            if (targetIdx !== -1) {
              replacedCount++;
              const draft = prev[targetIdx];
              const updated = [...prev];
              updated[targetIdx] = {
                ...draft,
                ...result,
                id: result.id,
                originalFileName: result.originalFileName || file.name,
                titleFromFileName: result.titleFromFileName || file.name.replace(/\.[^/.]+$/, ''),
                storageUrl: result.storageUrl,
                size: result.size || file.size,
                mimeType: result.mimeType || file.type,
                duration: meta.duration || result.duration || 0,
                width: meta.width || 0,
                height: meta.height || 0,
                title: draft.title || result.titleFromFileName || file.name.replace(/\.[^/.]+$/, ''),
                caption: draft.caption || '',
                firstComment: draft.firstComment || '',
                hashtags: draft.hashtags || '#Shorts #Trending',
                isDraft: false,
              };
              return updated;
            }

            return [
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
                isDraft: false,
              },
            ];
          });
          successCount++;
        }
      } catch (error: any) {
        toast.error(`Lỗi tải lên: ${error.response?.data?.error || file.name}`);
      }
    }

    setReplacingDraftId(null);
    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      if (replacedCount > 0) {
        toast.success(`Đã thay thế bản thảo AI bằng video thực tế thành công!`);
      } else if (successCount > 0) {
        toast.success(`Đã tải lên ${successCount} video`);
      }
    }, 500);

  }, [replacingDraftId]);

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
    if (replacingDraftId === id) setReplacingDraftId(null);
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

    const unattachedDrafts = videos.filter(v => v.isDraft || v.id.startsWith('draft_') || !v.storageUrl);
    if (unattachedDrafts.length > 0) {
      setTargetDraftForModal(unattachedDrafts[0]);
      setDraftReminderModalOpen(true);
      toast.warning('Vui lòng chọn video thực tế để thay thế bản thảo AI trước khi đăng!');
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

    if (publishMode === 'random_window') {
      if (!randomDate || !randomStartTime || !randomEndTime) {
        toast.error('Vui lòng chọn ngày và khung giờ đăng ngẫu nhiên (F022).');
        return;
      }
      const normDate = normalizeDateStringToYMD(randomDate);
      const [startH, startM] = randomStartTime.split(':').map(Number);
      const [endH, endM] = randomEndTime.split(':').map(Number);
      const [yr, mo, da] = normDate.split('-').map(Number);
      const startMs = new Date(yr, mo - 1, da, startH, startM, 0, 0).getTime();
      const endMs = new Date(yr, mo - 1, da, endH, endM, 0, 0).getTime();
      if (endMs <= startMs) {
        toast.error('Khung giờ không hợp lệ: Giờ kết thúc phải sau giờ bắt đầu.');
        return;
      }
      const nowMs = Date.now();
      if (endMs <= nowMs) {
        toast.error('Khung giờ lên lịch ngẫu nhiên đã qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác.');
        return;
      }
      const effectiveStartMs = Math.max(startMs, nowMs + 60000);
      if (endMs <= effectiveStartMs) {
        toast.error('Thời gian còn lại trong khung giờ quá ngắn (dưới 1 phút). Vui lòng chọn khung giờ khác.');
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;

    for (const video of videos) {
      try {
        const payloadTitle = sanitizeUtf8(video.title) || sanitizeUtf8(video.titleFromFileName) || 'Untitled';
        let payloadScheduledAt: string | null = null;
        let randomStartIso: string | undefined = undefined;
        let randomEndIso: string | undefined = undefined;

        if (publishMode === 'schedule') {
          payloadScheduledAt = new Date(scheduledAt).toISOString();
        } else if (publishMode === 'random_window') {
          const vidSched = computedRandomSchedule[video.id] || computedRandomSchedule['preview_single'];
          if (!vidSched || vidSched.getTime() <= Date.now()) {
            toast.error('Không thể xác định thời điểm đăng hợp lệ trong tương lai.');
            setSubmitting(false);
            return;
          }
          payloadScheduledAt = vidSched.toISOString();
          const normDate = normalizeDateStringToYMD(randomDate);
          const [startH, startM] = randomStartTime.split(':').map(Number);
          const [endH, endM] = randomEndTime.split(':').map(Number);
          const [yr, mo, da] = normDate.split('-').map(Number);
          randomStartIso = new Date(yr, mo - 1, da, startH, startM, 0, 0).toISOString();
          randomEndIso = new Date(yr, mo - 1, da, endH, endM, 0, 0).toISOString();
        }

        const res = await api.post('/posts', {
          title: payloadTitle,
          caption: sanitizeUtf8Nullable(video.caption),
          firstComment: sanitizeUtf8Nullable(video.firstComment),
          hashtags: sanitizeUtf8Nullable(video.hashtags),
          videoAssetId: video.id,
          platforms,
          publishMode,
          scheduledAt: payloadScheduledAt,
          isRandomWindow: publishMode === 'random_window',
          randomWindowStart: randomStartIso,
          randomWindowEnd: randomEndIso,
          isEvergreen,
          recycleIntervalDays: isEvergreen ? Number(recycleIntervalDays) : undefined,
        });

        if (res.status === 200 || res.status === 201) {
          successCount++;
          if (res.data?.warning) {
            toast.warning(res.data.warning, { duration: 6000 });
          }
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
          : publishMode === 'random_window'
          ? `Đã lên lịch thành công ${successCount} video trong khung ${randomStartTime} - ${randomEndTime}!`
          : `Đã lên lịch ${successCount} video thành công!`
      );
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
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
              : videos.some(v => v.isDraft || !v.storageUrl)
              ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/70 shadow-sm'
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
          ) : videos.some(v => v.isDraft || !v.storageUrl) ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center shadow-sm border border-amber-200">
                <Upload className="w-8 h-8 text-amber-600 animate-bounce" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-gray-900">
                  Kéo thả video vào đây hoặc <span className="text-amber-600 hover:underline">chọn tệp từ máy</span>
                </p>
                <p className="text-[13px] text-amber-800 mt-1 font-medium">
                  Tệp video tải lên sẽ tự động được gắn vào bản thảo kịch bản AI bên dưới (giữ nguyên tiêu đề & caption)
                </p>
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
                  {videos.length} bài viết
                </span>
                {videos.some(v => v.isDraft || !v.storageUrl) && (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Chờ gắn video ({videos.filter(v => v.isDraft || !v.storageUrl).length})
                  </span>
                )}
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
              {videos.map((v, idx) => {
                const isDraftItem = v.isDraft || v.id.startsWith('draft_') || !v.storageUrl;
                return (
                <div key={v.id} className={`bg-white rounded-3xl border ${isDraftItem ? 'border-amber-200 ring-1 ring-amber-100 shadow-[0_8px_30px_rgb(245,158,11,0.06)]' : 'border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.03)]'} p-6 space-y-6 relative group transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)]`}>
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeVideo(v.id)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer z-10"
                    title="Xoá bài viết này"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Draft Warning Banner */}
                  {isDraftItem && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[13px] text-amber-950">
                            Bản thảo kịch bản AI • Chưa có tệp video thực tế
                          </p>
                          <p className="text-amber-700 text-[12px] mt-0.5">
                            Tiêu đề và caption đã được nạp từ AI. Bạn cần chọn tệp video thực tế để thay thế trước khi xuất bản.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTriggerReplaceDraft(v.id)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tải video thay thế
                      </button>
                    </div>
                  )}

                  {/* Video Media Info Bar */}
                  <div className="flex items-center gap-4 pr-10">
                    {isDraftItem ? (
                      <button
                        type="button"
                        onClick={() => handleTriggerReplaceDraft(v.id)}
                        className="w-20 h-20 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 flex flex-col items-center justify-center flex-shrink-0 transition-all group/btn cursor-pointer shadow-inner"
                        title="Nhấp để tải lên video cho bản thảo này"
                      >
                        <Upload className="w-6 h-6 text-amber-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-amber-700 mt-1">Gắn video</span>
                      </button>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md ring-1 ring-black/5 relative">
                        <video src={getMediaUrl(v.storageUrl)} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                          <Film className="w-6 h-6 text-white/80" />
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-gray-900 truncate">
                          {isDraftItem ? `Bản thảo #${idx + 1}: ${v.title || v.originalFileName}` : `Video #${idx + 1}: ${v.originalFileName}`}
                        </p>
                        {isDraftItem ? (
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Bản thảo AI
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTriggerReplaceDraft(v.id)}
                            className="text-[11px] text-gray-400 hover:text-blue-600 underline font-medium cursor-pointer"
                          >
                            Thay video khác
                          </button>
                        )}
                      </div>

                      <div className="text-[12px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        {isDraftItem ? (
                          <>
                            <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                              Chưa có file video
                            </span>
                            <span className="text-gray-400 text-xs">
                              (Hỗ trợ MP4, MOV, WebM - Tối đa 2GB)
                            </span>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-900">Lưu ý thời lượng: Video dài {v.duration}s (&gt; 180s)</p>
                        <p className="mt-0.5 text-amber-700 leading-relaxed">
                          YouTube Shorts chỉ phân loại dạng Shorts đối với video tối đa 3 phút (180 giây). Video này dài {v.duration}s nên sẽ được YouTube tự động xuất bản dưới dạng <strong>Video thông thường</strong>. Hệ thống vẫn hỗ trợ đăng và lên lịch hẹn giờ bình thường!
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
              );
            })}
            </div>
          </div>
        )}

        {/* Global Settings */}
        {videos.length > 0 && (
          <div className="space-y-8 animate-fade-in bg-white rounded-3xl p-8 border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            
            {/* Platform Selection */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <label className="block text-[15px] font-bold text-gray-900">
                  1. Chọn nền tảng phân phối
                </label>
                <Link
                  to="/settings"
                  className="text-xs px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Mở Cài đặt hệ thống để kết nối thêm Facebook Fanpage, TikTok, YouTube, Zalo"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Kết nối thêm kênh mạng xã hội (Settings)
                </Link>
              </div>
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
                      • <strong>Thời lượng:</strong> Tối đa 60 giây (hoặc tối đa 180 giây cho video dọc/vuông). Video dài hơn 180 giây vẫn được đăng/hẹn giờ bình thường và YouTube sẽ tự động phân loại thành Video thông thường.
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    publishMode === 'now' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Send className={`w-5 h-5 mb-2 ${publishMode === 'now' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                  <p className="text-[15px] font-bold text-gray-900">Đăng ngay</p>
                  <p className={`text-[12px] mt-0.5 ${publishMode === 'now' ? 'text-[var(--color-primary)] font-medium' : 'text-gray-500'}`}>
                    Xuất bản ngay lập tức
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    publishMode === 'schedule' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-600/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Calendar className={`w-5 h-5 mb-2 ${publishMode === 'schedule' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <p className="text-[15px] font-bold text-gray-900">Lên lịch chính xác</p>
                  <p className={`text-[12px] mt-0.5 ${publishMode === 'schedule' ? 'text-indigo-700 font-medium' : 'text-gray-500'}`}>
                    Cố định 1 mốc giờ cụ thể
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishMode('random_window')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 relative overflow-hidden ${
                    publishMode === 'random_window' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm ring-2 ring-purple-600/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    F022
                  </span>
                  <Shuffle className={`w-5 h-5 mb-2 ${publishMode === 'random_window' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <p className="text-[15px] font-bold text-gray-900">Random trong khung</p>
                  <p className={`text-[12px] mt-0.5 ${publishMode === 'random_window' ? 'text-purple-700 font-medium' : 'text-gray-500'}`}>
                    Ngẫu nhiên giờ chống spam
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

            {/* F022: Random Time Window Panel */}
            {publishMode === 'random_window' && (
              <div className="animate-fade-in bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white p-6 rounded-2xl border-2 border-purple-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Cấu hình Khung giờ ngẫu nhiên (F022)
                      </h3>
                      <p className="text-[12px] text-gray-500">
                        Hệ thống tự động random mốc giờ xuất bản trong khoảng cho phép để tạo nhịp đăng tự nhiên
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">
                    Random Time Window
                  </span>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    1. Ngày áp dụng khung giờ:
                  </label>
                  <input
                    type="date"
                    value={normalizeDateStringToYMD(randomDate)}
                    onChange={(e) => setRandomDate(normalizeDateStringToYMD(e.target.value))}
                    min={getLocalDateString(new Date())}
                    className="w-full py-2.5 px-3.5 text-sm font-medium border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Golden Hour Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    2. Chọn nhanh khung giờ vàng hoặc tùy chỉnh:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GOLDEN_HOUR_PRESETS.map((p) => {
                      const isSelected = randomPreset === p.id;
                      const disabled = isPresetDisabled(p, randomDate, currentClock);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            disabled
                              ? 'border-gray-200 bg-gray-100/70 text-gray-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs font-bold'
                              : 'border-purple-100 bg-white hover:bg-purple-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{p.label}</span>
                            {disabled && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-semibold">
                                Đã qua
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              disabled
                                ? 'text-gray-400'
                                : isSelected
                                ? 'text-purple-100'
                                : 'text-purple-700 font-mono'
                            }`}
                          >
                            {p.id === 'custom' ? 'Tự nhập giờ' : `${p.start} – ${p.end}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start Time & End Time Inputs */}
                <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        Giờ bắt đầu khung (Start):
                      </label>
                      <input
                        type="time"
                        value={randomStartTime}
                        onChange={(e) => {
                          setRandomStartTime(e.target.value);
                          setRandomPreset('custom');
                          setRandomShuffleKey((k) => k + 1);
                        }}
                        className="w-full py-2 px-3 text-sm font-semibold border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        Giờ kết thúc khung (End):
                      </label>
                      <input
                        type="time"
                        value={randomEndTime}
                        onChange={(e) => {
                          setRandomEndTime(e.target.value);
                          setRandomPreset('custom');
                          setRandomShuffleKey((k) => k + 1);
                        }}
                        className="w-full py-2 px-3 text-sm font-semibold border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {windowStatus.isInProgress && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        Khung giờ đang diễn ra. Thời điểm đăng chỉ được random trong phần thời gian còn lại (từ giờ hiện tại đến {randomEndTime}).
                      </span>
                    </div>
                  )}

                  {windowStatus.isExpired && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>
                        Khung giờ đã qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác hoặc chuyển sang ngày mai.
                      </span>
                    </div>
                  )}
                </div>

                {/* Evenly Spaced Toggle for Multiple Videos */}
                {videos.length > 1 && (
                  <div className="flex items-center justify-between bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
                    <div>
                      <span className="text-xs font-bold text-purple-900 block">
                        Phân bổ rải đều {videos.length} video trong khung
                      </span>
                      <span className="text-[11px] text-purple-700">
                        Tự động cách đều thời điểm đăng các video để tránh trùng phút spam
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEvenlySpaced}
                        onChange={(e) => {
                          setIsEvenlySpaced(e.target.checked);
                          setRandomShuffleKey((k) => k + 1);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>
                )}

                {/* Live Random Preview Box */}
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Dices className="w-4 h-4 text-purple-600" />
                      Mô phỏng thời điểm đăng ngẫu nhiên:
                    </span>
                    <button
                      type="button"
                      disabled={windowStatus.isExpired}
                      onClick={() => setRandomShuffleKey((k) => k + 1)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                        windowStatus.isExpired
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                      }`}
                      title="Bấm để sinh thời điểm ngẫu nhiên khác"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Random lại mốc giờ
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {windowStatus.isExpired ? (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>Khung giờ đã qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác hoặc đổi sang ngày mai.</span>
                      </div>
                    ) : videos.length === 0 ? (
                      <div className="p-3 rounded-lg bg-purple-50 text-xs text-purple-900 font-medium">
                        🎲 Dự kiến xuất bản lúc: <strong className="font-bold text-purple-700">
                          {computedRandomSchedule['preview_single']
                            ? safeFormatDate(computedRandomSchedule['preview_single'].toISOString(), 'HH:mm - EEEE, dd/MM/yyyy')
                            : 'Chưa xác định'}
                        </strong>
                      </div>
                    ) : (
                      videos.map((vid, idx) => {
                        const vidTime = computedRandomSchedule[vid.id];
                        return (
                          <div
                            key={vid.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/80 border border-purple-100 text-xs"
                          >
                            <span className="font-semibold text-gray-800 truncate max-w-[240px]">
                              Video #{idx + 1}: {vid.title || vid.originalFileName}
                            </span>
                            <span className="font-bold text-purple-700 font-mono bg-white px-2.5 py-1 rounded border border-purple-200">
                              {vidTime ? safeFormatDate(vidTime.toISOString(), 'HH:mm (dd/MM)') : 'Không hợp lệ'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
              {videos.some(v => v.isDraft || v.id.startsWith('draft_') || !v.storageUrl) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-bold text-amber-950">Chưa gắn video thực tế vào bản thảo AI</p>
                      <p className="text-amber-700 text-xs mt-0.5">
                        Bạn cần chọn video thực tế từ máy tính để thay thế bản thảo trước khi tiến hành xuất bản.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerReplaceDraft()}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Chọn video ngay
                  </button>
                </div>
              )}

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
                className="btn-primary w-full py-4 text-[16px] font-bold whitespace-nowrap inline-flex items-center justify-center gap-2.5 shrink-0 shadow-md hover:shadow-lg transition-all rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {publishMode === 'now' ? 'Đang gửi yêu cầu đăng...' : 'Đang thiết lập lịch hẹn...'}
                  </>
                ) : videos.some(v => v.isDraft || v.id.startsWith('draft_') || !v.storageUrl) ? (
                  <>
                    <Upload className="w-5 h-5" />
                    Vui lòng chọn video thực tế để đăng bài
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

      {/* Draft Video Required Modal */}
      {draftReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setDraftReminderModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Vui lòng chọn video thực tế
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bài viết đang sử dụng bản thảo kịch bản AI:
                <span className="font-semibold text-gray-900 block mt-1.5 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 truncate">
                  {targetDraftForModal?.title || targetDraftForModal?.titleFromFileName || 'Bản thảo kịch bản AI'}
                </span>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed pt-1">
                Topify đã nạp sẵn toàn bộ Tiêu đề, Caption và Hashtags tối ưu bởi AI. Để đăng lên các nền tảng (Facebook, TikTok, YouTube, Instagram), bạn cần đính kèm tệp video thực tế (MP4, MOV, WebM).
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDraftReminderModalOpen(false);
                  handleTriggerReplaceDraft(targetDraftForModal?.id);
                }}
                className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Chọn video từ máy tính ngay
              </button>
              <button
                type="button"
                onClick={() => setDraftReminderModalOpen(false)}
                className="w-full py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng và tiếp tục chỉnh sửa nội dung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
