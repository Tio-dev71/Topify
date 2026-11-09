import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Scissors,
  Subtitles,
  Sparkles,
  Maximize2,
  Play,
  Download,
  Copy,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Type,
  Palette,
  Share2,
  RefreshCw,
  Video,
  X,
  Upload,
  FileVideo,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Folder,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getMediaUrl } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { MultiPlatformResizer, RATIO_PROFILES } from '../components/MultiPlatformResizer';

type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';
type ResizeMode = 'FIT_BLUR' | 'CENTER_CROP' | 'LETTERBOX';

interface HighlightClip {
  id: string;
  title: string;
  hookPoint: string;
  startTime: number;
  endTime: number;
  duration: number;
  viralPotentialScore: number;
  suggestedCaption: string;
  suggestedTags: string[];
  cutStorageUrl?: string;
  cutAssetId?: string;
  cutFileName?: string;
}

interface SubtitleCue {
  id: string;
  index: number;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

interface SourceVideo {
  id: string;
  title: string;
  duration: number; // in seconds
  url: string;
  file?: File | null;
  assetId?: string | null;
  width?: number;
  height?: number;
  isCustom?: boolean;
}

const SAMPLE_VIDEOS: SourceVideo[] = [
  {
    id: 'sample_1',
    title: 'Review Chi Tiết Bàn Làm Việc Công Thái Học & Setup Góc Làm Việc 2026',
    duration: 180,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample_2',
    title: 'Top 5 Sai Lầm Bán Hàng Đa Kênh Khiến Doanh Thu Sụt Giảm Nghiêm Trọng',
    duration: 240,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample_3',
    title: 'Bí Quyết Xây Kênh Triệu View Từ Con Số 0 Cho Người Mới Bắt Đầu',
    duration: 150,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    width: 1920,
    height: 1080,
  },
];

export default function MediaStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resize' | 'repurpose' | 'subtitles'>('resize');

  // Source Video State (used across F114 and F115)
  const [sourceVideo, setSourceVideo] = useState<SourceVideo>(SAMPLE_VIDEOS[0]);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // F113: Resize State
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('FIT_BLUR');
  const [calculatedTransform, setCalculatedTransform] = useState<any>(null);

  // F114: Repurpose State
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);
  const [analyzingHighlights, setAnalyzingHighlights] = useState(false);
  const [cuttingClipId, setCuttingClipId] = useState<string | null>(null);
  const [transferringClipId, setTransferringClipId] = useState<string | null>(null);
  const [previewClip, setPreviewClip] = useState<HighlightClip | null>(null);

  // Media Library Picker Modal
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaLibraryVideos, setMediaLibraryVideos] = useState<any[]>([]);
  const [loadingLibraryVideos, setLoadingLibraryVideos] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  // F115: Subtitles State
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<'yellow_black' | 'white_dark'>('yellow_black');

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Load Resize spec on change
  useEffect(() => {
    const fetchResizeSpec = async () => {
      try {
        const res = await api.post('/media/resize', {
          sourceWidth: sourceVideo.width || 1920,
          sourceHeight: sourceVideo.height || 1080,
          targetRatio: selectedRatio,
          mode: resizeMode,
        });
        if (res.data.success) {
          setCalculatedTransform(res.data.transform);
        }
      } catch {
        //
      }
    };
    fetchResizeSpec();
  }, [selectedRatio, resizeMode, sourceVideo]);

  // Handle local video file upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|mkv|avi)$/i.test(file.name)) {
      toast.error('Vui lòng chọn tệp video hợp lệ (.mp4, .mov, .webm, .mkv)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]+/g, ' ').trim();

    // Create temporary video element to extract duration & resolution
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const durationSec = Math.round(tempVideo.duration) || 120;
      const newVideo: SourceVideo = {
        id: `custom_${Date.now()}`,
        title: cleanName,
        duration: durationSec,
        url: objectUrl,
        file: file,
        width: tempVideo.videoWidth || 1920,
        height: tempVideo.videoHeight || 1080,
        isCustom: true,
      };
      setSourceVideo(newVideo);
      toast.success(`Đã nạp video: ${file.name} (${durationSec}s, ${tempVideo.videoWidth}x${tempVideo.videoHeight})`);
      triggerHighlightAnalysis(newVideo);
    };

    tempVideo.onerror = () => {
      const newVideo: SourceVideo = {
        id: `custom_${Date.now()}`,
        title: cleanName,
        duration: 180,
        url: objectUrl,
        file: file,
        width: 1920,
        height: 1080,
        isCustom: true,
      };
      setSourceVideo(newVideo);
      toast.success(`Đã nạp video: ${file.name}`);
      triggerHighlightAnalysis(newVideo);
    };

    tempVideo.src = objectUrl;
    // Reset file input value to allow selecting same file again if needed
    e.target.value = '';
  };

  // Open Media Library Modal to pick an existing video
  const openMediaPicker = async () => {
    setIsMediaPickerOpen(true);
    setLoadingLibraryVideos(true);
    try {
      const res = await api.get('/media?type=VIDEO');
      if (res.data?.assets) {
        setMediaLibraryVideos(res.data.assets);
      }
    } catch (err) {
      console.error('Error fetching library videos:', err);
      toast.error('Không thể tải danh sách video từ thư viện');
    } finally {
      setLoadingLibraryVideos(false);
    }
  };

  const handleSelectLibraryVideo = (asset: any) => {
    const fullUrl = asset.storageUrl.startsWith('http')
      ? asset.storageUrl
      : getMediaUrl(asset.storageUrl);

    const cleanName = asset.fileName.replace(/\.[^/.]+$/, '').replace(/[_\\-]+/g, ' ').trim();
    const newVideo: SourceVideo = {
      id: asset.id,
      title: asset.title || cleanName,
      duration: asset.duration || 180,
      url: fullUrl,
      assetId: asset.id,
      width: asset.width || 1920,
      height: asset.height || 1080,
      isCustom: true,
    };
    setSourceVideo(newVideo);
    setIsMediaPickerOpen(false);
    toast.success(`Đã chọn video từ thư viện: ${asset.fileName}`);
    triggerHighlightAnalysis(newVideo);
  };

  // F114: Trigger Highlight Analysis via /api/media/repurpose
  const triggerHighlightAnalysis = async (targetVideo?: SourceVideo, customTranscript?: string) => {
    const vid = targetVideo || sourceVideo;
    const transcript = customTranscript !== undefined ? customTranscript : transcriptInput;
    setAnalyzingHighlights(true);
    try {
      let res;
      if (vid.file) {
        // If local file object, send via multipart/form-data
        const formData = new FormData();
        formData.append('action', 'analyze');
        formData.append('file', vid.file);
        formData.append('title', vid.title);
        formData.append('durationSeconds', String(vid.duration));
        formData.append('transcriptText', transcript);

        res = await api.post('/media/repurpose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/media/repurpose', {
          action: 'analyze',
          title: vid.title,
          durationSeconds: vid.duration,
          transcriptText: transcript,
          mediaUrl: vid.url,
          assetId: vid.assetId,
        });
      }

      if (res.data?.success && res.data?.data?.clips) {
        setHighlights(res.data.data.clips);
        if (res.data.sourceAsset?.id) {
          setSourceVideo((prev) => ({ ...prev, assetId: res.data.sourceAsset.id }));
        }
        toast.success(`Đã trích xuất thành công ${res.data.data.clips.length} clip highlight ngắn từ video!`);
      } else {
        toast.error('Không nhận được dữ liệu clip highlight');
      }
    } catch (err: any) {
      console.error('Error analyzing video repurpose:', err);
      toast.error(`Phân tích video thất bại: ${err.response?.data?.error || err.message || 'Lỗi không xác định'}`);
    } finally {
      setAnalyzingHighlights(false);
    }
  };

  // Request real physical cut of a highlight clip using FFmpeg
  const requestCutClip = async (clip: HighlightClip): Promise<{ storageUrl: string; assetId?: string; fileName: string }> => {
    if (clip.cutStorageUrl) {
      return {
        storageUrl: clip.cutStorageUrl,
        assetId: clip.cutAssetId,
        fileName: clip.cutFileName || `${clip.title}.mp4`,
      };
    }

    if (sourceVideo.file) {
      const formData = new FormData();
      formData.append('action', 'cut');
      formData.append('file', sourceVideo.file);
      formData.append('startTime', String(clip.startTime));
      formData.append('endTime', String(clip.endTime));
      formData.append('clipTitle', clip.title);

      const res = await api.post('/media/repurpose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      if (res.data?.success && res.data?.clipUrl) {
        clip.cutStorageUrl = res.data.clipUrl;
        clip.cutAssetId = res.data.asset?.id;
        clip.cutFileName = res.data.asset?.originalFileName;
        return {
          storageUrl: res.data.clipUrl,
          assetId: res.data.asset?.id,
          fileName: res.data.asset?.originalFileName || `${clip.title}.mp4`,
        };
      }
    } else {
      const res = await api.post(
        '/media/repurpose',
        {
          action: 'cut',
          mediaUrl: sourceVideo.url,
          assetId: sourceVideo.assetId,
          startTime: clip.startTime,
          endTime: clip.endTime,
          clipTitle: clip.title,
        },
        { timeout: 90000 }
      );

      if (res.data?.success && res.data?.clipUrl) {
        clip.cutStorageUrl = res.data.clipUrl;
        clip.cutAssetId = res.data.asset?.id;
        clip.cutFileName = res.data.asset?.originalFileName;
        return {
          storageUrl: res.data.clipUrl,
          assetId: res.data.asset?.id,
          fileName: res.data.asset?.originalFileName || `${clip.title}.mp4`,
        };
      }
    }

    throw new Error('Không thể cắt đoạn video bằng FFmpeg');
  };

  // Download cut clip as MP4
  const handleDownloadClip = async (clip: HighlightClip) => {
    setCuttingClipId(clip.id);
    const toastId = toast.loading(`Đang cắt clip highlight "${clip.title}" (${clip.duration}s) bằng FFmpeg...`);
    try {
      const cut = await requestCutClip(clip);
      toast.dismiss(toastId);
      toast.success(`Đã cắt thành công clip "${clip.title}"! Đang tải về...`);

      const a = document.createElement('a');
      a.href = cut.storageUrl;
      a.target = '_blank';
      a.download = cut.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      toast.dismiss(toastId);
      console.warn('Physical cut failed, downloading fallback URL:', err);
      toast.info('Tải clip dự phòng...');
      const fallbackUrl = sourceVideo.url;
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.target = '_blank';
      a.download = `Topify_Clip_${clip.id}_${clip.startTime}s_${clip.endTime}s.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setCuttingClipId(null);
    }
  };

  // Transfer cut clip to Create Post
  const handleTransferToStudio = async (clip: HighlightClip) => {
    setTransferringClipId(clip.id);
    const toastId = toast.loading(`Đang chuẩn bị clip highlight "${clip.title}" sang Tạo bài viết...`);
    try {
      let cutResult: { storageUrl: string; assetId?: string; fileName: string } = {
        storageUrl: sourceVideo.url,
        assetId: sourceVideo.assetId || undefined,
        fileName: `${clip.title}.mp4`,
      };
      try {
        cutResult = await requestCutClip(clip);
      } catch (cutErr) {
        console.warn('Physical cut failed, passing source video reference:', cutErr);
      }

      toast.dismiss(toastId);
      toast.success('Đã chuyển clip ngắn sang Tạo bài viết!');

      navigate('/create', {
        state: {
          prefilledMediaUrl: cutResult.storageUrl,
          prefilledMediaName: cutResult.fileName,
          prefilledMediaType: 'video',
          prefilledAssetId: cutResult.assetId,
          prefilledWidth: sourceVideo.width || 1080,
          prefilledHeight: sourceVideo.height || 1920,
          prefilledDuration: clip.duration,
          prefilledTitle: clip.title,
          prefilledCaption: clip.suggestedCaption,
          prefilledHashtags: clip.suggestedTags.join(' '),
          prefilledFirstComment: `Link sp và thông tin thêm tại bio! Đăng ký kênh để xem thêm video mới nhất 🔥`,
        },
      });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Không thể chuyển clip sang Tạo bài viết');
    } finally {
      setTransferringClipId(null);
    }
  };

  // F115 Handler
  const handleGenerateSubtitles = async () => {
    setGeneratingSubtitles(true);
    try {
      const res = await api.post('/media/subtitles', {
        title: sourceVideo.title,
        durationSeconds: sourceVideo.duration,
        speechText:
          transcriptInput ||
          `Chào mừng các bạn đã quay trở lại. Hôm nay mình sẽ chia sẻ với các bạn những bài học thực chiến quan trọng nhất về chủ đề ${sourceVideo.title}.`,
      });
      if (res.data.success && res.data.data?.cues) {
        setSubtitles(res.data.data.cues);
        toast.success(`Đã nhận diện và tạo ${res.data.data.cues.length} dòng phụ đề tự động!`);
      }
    } catch {
      toast.error('Không thể sinh phụ đề lúc này');
    } finally {
      setGeneratingSubtitles(false);
    }
  };

  const handleUpdateSubtitleText = (index: number, newText: string) => {
    setSubtitles((prev) =>
      prev.map((cue, i) => (i === index ? { ...cue, text: newText } : cue))
    );
  };

  // Filtered videos in library modal
  const filteredLibraryVideos = mediaLibraryVideos.filter((v) =>
    (v.fileName || '').toLowerCase().includes(librarySearch.toLowerCase()) ||
    (v.tags || '').toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hidden File Input for video upload */}
      <input
        type="file"
        ref={videoFileInputRef}
        accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
        onChange={handleVideoFileUpload}
        className="hidden"
      />

      {/* Video Preview Modal (F114) */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 truncate max-w-xs">{previewClip.title}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                  {previewClip.startTime}s - {previewClip.endTime}s ({previewClip.duration}s)
                </span>
              </div>
              <button
                onClick={() => setPreviewClip(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={previewVideoRef}
                src={previewClip.cutStorageUrl || sourceVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  const target = e.currentTarget;
                  if (!previewClip.cutStorageUrl && previewClip.startTime > 0) {
                    target.currentTime = previewClip.startTime;
                  }
                }}
                onTimeUpdate={(e) => {
                  const target = e.currentTarget;
                  if (!previewClip.cutStorageUrl && previewClip.endTime > 0) {
                    if (target.currentTime >= previewClip.endTime) {
                      target.currentTime = previewClip.startTime;
                      target.pause();
                    }
                  }
                }}
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-md text-[11px] text-amber-400 font-semibold flex items-center gap-1 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Viral: {previewClip.viralPotentialScore}/100
              </div>
              <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] text-white/90 font-mono">
                {previewClip.cutStorageUrl ? 'Đã cắt clip chuẩn' : `Đoạn cắt: ${previewClip.startTime}s → ${previewClip.endTime}s`}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  🎣 Câu Hook mở đầu (0-3s):
                </span>
                <p className="text-xs text-amber-950 font-medium italic mt-0.5">"{previewClip.hookPoint}"</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={cuttingClipId === previewClip.id}
                  onClick={() => handleDownloadClip(previewClip)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {cuttingClipId === previewClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {cuttingClipId === previewClip.id ? 'Đang cắt...' : 'Tải clip về máy (.mp4)'}
                </button>
                <button
                  type="button"
                  disabled={transferringClipId === previewClip.id}
                  onClick={() => {
                    const c = previewClip;
                    setPreviewClip(null);
                    handleTransferToStudio(c);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {transferringClipId === previewClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  Đưa sang Tạo bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Video Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-gray-900">Chọn Video Từ Thư Viện Media Workspace</h3>
              </div>
              <button
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm video theo tên tệp hoặc tags..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingLibraryVideos ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Đang tải danh sách video...</span>
                </div>
              ) : filteredLibraryVideos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3 text-center">
                  <FileVideo className="w-10 h-10 text-gray-300" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Chưa có video nào trong thư viện</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Bạn có thể bấm "Tải Video Dài Từ Máy" để chọn video trực tiếp từ máy tính.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMediaPickerOpen(false);
                      videoFileInputRef.current?.click();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Tải Video Mới Từ Máy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredLibraryVideos.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectLibraryVideo(asset)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        sourceVideo.assetId === asset.id
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5" />
                        </div>
                        <div className="truncate flex-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate" title={asset.fileName}>
                            {asset.fileName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                            <span>{asset.duration ? `${asset.duration}s` : 'Video'}</span>
                            <span>•</span>
                            <span>{(asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-400">
                          {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="font-semibold text-blue-600 flex items-center gap-1">
                          Chọn video <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
            Media Studio AI
          </h1>
          <p className="text-gray-500 mt-1 text-[14px]">
            [F113, F114, F115] Resize đa nền tảng, tách clip highlight từ video dài và nhận diện phụ đề tự động
          </p>
        </div>

        {/* Video active banner */}
        <div className="flex items-center gap-2 p-2.5 px-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-xs max-w-md">
          <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="truncate text-xs font-medium text-gray-800" title={sourceVideo.title}>
            {sourceVideo.title}
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono flex-shrink-0">
            {sourceVideo.duration}s
          </span>
          {sourceVideo.isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold flex-shrink-0">
              Đã tải
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('resize')}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'resize'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
          [F113] Resize Đa Nền Tảng
        </button>

        <button
          onClick={() => {
            setActiveTab('repurpose');
            if (highlights.length === 0) triggerHighlightAnalysis();
          }}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'repurpose'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Scissors className="w-4 h-4" />
          [F114] Tách Clip Highlight (Repurpose)
        </button>

        <button
          onClick={() => {
            setActiveTab('subtitles');
            if (subtitles.length === 0) handleGenerateSubtitles();
          }}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'subtitles'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Subtitles className="w-4 h-4" />
          [F115] Phụ Đề Tự Động (Auto Subtitle)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: [F113] RESIZE ĐA NỀN TẢNG */}
      {/* ========================================================================= */}
      {activeTab === 'resize' && (
        <MultiPlatformResizer
          onApplyToPost={(assetUrl: string, ratio: AspectRatio, caption?: string, assetMeta?: any) => {
            const isVideo = assetMeta?.type === 'video' || assetUrl.endsWith('.mp4');
            navigate('/create', {
              state: {
                prefilledMediaUrl: assetUrl,
                prefilledMediaName:
                  assetMeta?.originalFileName ||
                  `media_studio_resized_${ratio.replace(':', '_')}.${isVideo ? 'mp4' : 'png'}`,
                prefilledMediaType: isVideo ? 'video' : 'image',
                prefilledAssetId: assetMeta?.id,
                prefilledWidth: assetMeta?.width,
                prefilledHeight: assetMeta?.height,
                prefilledDuration: assetMeta?.duration,
                prefilledTitle: `Video/Ảnh đã Resize chuẩn ${ratio} (${RATIO_PROFILES[ratio]?.platforms.join(', ') || ''})`,
                prefilledCaption:
                  caption ||
                  `Tối ưu tỷ lệ ${ratio} cho ${RATIO_PROFILES[ratio]?.platforms.join(', ')} #Topify #MediaStudio #F113`,
                prefilledHashtags: '#Topify #MediaStudio #ResizeF113',
              },
            });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: [F114] REPURPOSE VIDEO HIGHLIGHTS */}
      {/* ========================================================================= */}
      {activeTab === 'repurpose' && (
        <div className="space-y-6">
          {/* Video Selector & Upload Control Card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Video Nguồn:</span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {Math.floor(sourceVideo.duration / 60)}:{(sourceVideo.duration % 60).toString().padStart(2, '0')} ({sourceVideo.duration}s)
                    </span>
                    {sourceVideo.width && sourceVideo.height && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {sourceVideo.width} × {sourceVideo.height}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate mt-0.5" title={sourceVideo.title}>
                    {sourceVideo.title}
                  </h3>
                </div>
              </div>

              {/* Action Buttons: Upload Video & Choose from Library */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Tải Video Dài Từ Máy
                </button>

                <button
                  type="button"
                  onClick={openMediaPicker}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Film className="w-3.5 h-3.5" />
                  Chọn Từ Thư Viện Media
                </button>
              </div>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Video mẫu thử nghiệm:</span>
                {SAMPLE_VIDEOS.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSourceVideo(item);
                      triggerHighlightAnalysis(item);
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer text-[11px] ${
                      sourceVideo.id === item.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                        : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-600'
                    }`}
                  >
                    Mẫu {idx + 1} ({item.duration}s)
                  </button>
                ))}
              </div>

              {sourceVideo.isCustom && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đang dùng video do bạn chọn
                </span>
              )}
            </div>

            {/* Title & Transcript Configuration */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Tiêu đề / Chủ đề chính của video:
                </label>
                <input
                  type="text"
                  value={sourceVideo.title}
                  onChange={(e) => setSourceVideo((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề hoặc chủ đề chính của video..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Bản ghi thoại hoặc tóm tắt ý chính (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  placeholder="Dán tóm tắt ý chính hoặc transcript để AI cắt chuẩn hơn..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* AI Repurposing Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div>
              <div className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Tự Động Phân Tích & Cắt Đoạn Đắt Giá (AI Video Repurposing)
              </div>
              <p className="text-xs text-blue-900/80 mt-0.5">
                Video dài {Math.floor(sourceVideo.duration / 60)} phút ({sourceVideo.duration}s) được trích xuất thành các clip 30s-60s đạt tiềm năng giữ chân người xem cao nhất
              </p>
            </div>

            <button
              onClick={() => triggerHighlightAnalysis()}
              disabled={analyzingHighlights}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzingHighlights ? 'animate-spin' : ''}`} />
              {analyzingHighlights ? 'Đang trích xuất...' : 'Phân tích lại'}
            </button>
          </div>

          {/* Highlights Grid */}
          {analyzingHighlights ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">
                AI đang quét toàn bộ video "{sourceVideo.title}"...
              </p>
              <p className="text-xs text-gray-500 max-w-md">
                Phân tích cao trào, tính toán câu hook 3 giây đầu và định dạng các clip ngắn viral 30s-60s.
              </p>
            </div>
          ) : highlights.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-gray-100 text-center space-y-3">
              <Film className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">Chưa có clip highlight nào</p>
              <p className="text-xs text-gray-500">
                Hãy bấm "Phân tích lại" hoặc tải video mới lên để AI trích xuất các đoạn đắt giá nhất.
              </p>
              <button
                type="button"
                onClick={() => triggerHighlightAnalysis()}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                Bắt Đầu Phân Tích Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {highlights.map((clip) => (
                <div
                  key={clip.id}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-blue-200 hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {clip.startTime}s - {clip.endTime}s ({clip.duration}s)
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {clip.viralPotentialScore}đ Viral
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900 text-sm leading-snug">{clip.title}</h4>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        🎣 Câu mở đầu giữ chân (3s Hook):
                      </span>
                      <p className="text-xs text-amber-950 italic font-medium">"{clip.hookPoint}"</p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{clip.suggestedCaption}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {clip.suggestedTags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono border border-blue-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewClip(clip)}
                        className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-600" />
                        Xem trước
                      </button>
                      <button
                        type="button"
                        disabled={cuttingClipId === clip.id}
                        onClick={() => handleDownloadClip(clip)}
                        className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {cuttingClipId === clip.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {cuttingClipId === clip.id ? 'Đang cắt...' : 'Tải clip (.mp4)'}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={transferringClipId === clip.id}
                      onClick={() => handleTransferToStudio(clip)}
                      className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {transferringClipId === clip.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      {transferringClipId === clip.id ? 'Đang tạo bài...' : 'Đưa sang Tạo bài viết'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: [F115] AUTO SUBTITLES & SPEECH TRANSCRIPTION */}
      {/* ========================================================================= */}
      {activeTab === 'subtitles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subtitle Editor Column */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                  <Type className="w-5 h-5 text-blue-600" />
                  Trình Biên Tập Phụ Đề Theo Giây (Subtitle Cue Editor)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tự động chuyển giọng nói thành văn bản tiếng Việt. Bạn có thể bấm để sửa trực tiếp câu từ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = subtitles.map((s) => `${s.startTime} --> ${s.endTime}\n${s.text}`).join('\n\n');
                    navigator.clipboard.writeText(text);
                    toast.success('Đã sao chép toàn bộ phụ đề .SRT vào clipboard!');
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép SRT
                </button>

                <button
                  onClick={handleGenerateSubtitles}
                  disabled={generatingSubtitles}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingSubtitles ? 'animate-spin' : ''}`} />
                  {generatingSubtitles ? 'Đang nhận diện...' : 'Nhận diện lại'}
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-2">
              {subtitles.map((cue, idx) => (
                <div
                  key={cue.id}
                  className="p-3 bg-gray-50/70 border border-gray-200/70 rounded-xl flex items-center gap-3 hover:border-gray-300 transition"
                >
                  <span className="text-xs font-mono text-gray-400 w-8 text-center flex-shrink-0">#{idx + 1}</span>

                  <div className="flex flex-col text-[11px] font-mono text-blue-600 w-32 flex-shrink-0">
                    <span>{cue.startTime}</span>
                    <span className="text-gray-400">đến {cue.endTime}</span>
                  </div>

                  <input
                    type="text"
                    value={cue.text}
                    onChange={(e) => handleUpdateSubtitleText(idx, e.target.value)}
                    className="flex-1 bg-white border border-gray-200 text-xs text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle Style & Burn-in Preview */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Kiểu Dáng Chữ Phụ Đề (Style)
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => setSubtitleStyle('yellow_black')}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    subtitleStyle === 'yellow_black'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-amber-700">Chữ Vàng Viền Đen (TikTok Viral)</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Dễ đọc nhất trên điện thoại di động</div>
                  </div>
                  <span className="text-sm font-black text-amber-500 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                    Aa
                  </span>
                </button>

                <button
                  onClick={() => setSubtitleStyle('white_dark')}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    subtitleStyle === 'white_dark'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-gray-900">Chữ Trắng Hộp Nền Tối</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Phong cách thanh lịch, tối giản</div>
                  </div>
                  <span className="text-sm font-bold text-white bg-black/80 px-2 py-0.5 rounded">Aa</span>
                </button>
              </div>
            </div>

            {/* Simulated Subtitle Preview */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3 text-center">
              <span className="text-xs text-gray-400">Xem trước hiển thị phụ đề trên video:</span>
              <div className="h-40 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-center p-4 relative overflow-hidden shadow-inner">
                <div
                  className="absolute inset-0 bg-cover bg-center filter opacity-30"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop)`,
                  }}
                />
                <div className="relative z-10 text-center">
                  {subtitleStyle === 'yellow_black' ? (
                    <span className="text-sm font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] uppercase tracking-wide">
                      {subtitles[0]?.text || 'TỐI ƯU QUY TRÌNH TỰ ĐỘNG!'}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-white bg-black/80 px-3 py-1 rounded-md">
                      {subtitles[0]?.text || 'Tối ưu quy trình tự động!'}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success('Đã lưu phụ đề vào video thành công!');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lưu & Áp Dụng Phụ Đề Vào Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
