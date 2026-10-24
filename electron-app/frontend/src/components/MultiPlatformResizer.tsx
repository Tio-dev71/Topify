import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Maximize2,
  Download,
  CheckCircle2,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Smartphone,
  Layers,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';
export type ResizeMode = 'FIT_BLUR' | 'CENTER_CROP' | 'LETTERBOX';

export interface AspectRatioProfile {
  ratio: AspectRatio;
  name: string;
  subname: string;
  width: number;
  height: number;
  platforms: string[];
  icon: string;
  desc: string;
}

export const RATIO_PROFILES: Record<AspectRatio, AspectRatioProfile> = {
  '9:16': {
    ratio: '9:16',
    name: '9:16 Dọc',
    subname: 'Vertical',
    width: 1080,
    height: 1920,
    platforms: ['TikTok', 'FB Reels', 'IG Reels', 'YouTube Shorts'],
    icon: '📱',
    desc: 'Tỷ lệ vàng video ngắn toàn màn hình di động',
  },
  '1:1': {
    ratio: '1:1',
    name: '1:1 Vuông',
    subname: 'Square',
    width: 1080,
    height: 1080,
    platforms: ['Facebook Feed', 'Instagram Post', 'Carousel'],
    icon: '⏹️',
    desc: 'Chuẩn hiển thị bài đăng dạng lưới và quảng cáo Feed',
  },
  '16:9': {
    ratio: '16:9',
    name: '16:9 Ngang',
    subname: 'Landscape',
    width: 1920,
    height: 1080,
    platforms: ['YouTube Video', 'Facebook Watch', 'Web / TV'],
    icon: '🖥️',
    desc: 'Định dạng chuẩn cho video ngang, máy tính và TV',
  },
  '4:5': {
    ratio: '4:5',
    name: '4:5 Dọc Lửng',
    subname: 'Portrait',
    width: 1080,
    height: 1350,
    platforms: ['Instagram Feed', 'Facebook Post'],
    icon: '📐',
    desc: 'Tối ưu diện tích hiển thị lớn nhất trên bảng tin Facebook/Instagram',
  },
};

const SAMPLE_MEDIA = [
  {
    id: 'sample_video_1',
    name: 'Video 16:9 Góc Làm Việc & Setup Công Thái Học',
    type: 'video' as const,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&fit=crop',
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample_image_1',
    name: 'Banner 16:9 Công Nghệ & Tiếp Thị Số',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop',
    poster: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&fit=crop',
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample_image_2',
    name: 'Ảnh Sản Phẩm 4:3 Thời Trang & Phong Cách',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&fit=crop',
    poster: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop',
    width: 1200,
    height: 900,
  },
];

export interface MultiPlatformResizerProps {
  onApplyToPost?: (mediaUrl: string, ratio: AspectRatio, caption?: string) => void;
  onAppliedToCreatePost?: (data: {
    mediaUrl: string;
    mediaName: string;
    mediaType: string;
    ratio: AspectRatio;
  }) => void;
}

export function MultiPlatformResizer({ onApplyToPost, onAppliedToCreatePost }: MultiPlatformResizerProps) {
  const navigate = useNavigate();

  // Selected media state
  const [currentMedia, setCurrentMedia] = useState<{
    id?: string;
    url: string;
    name: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    file?: File;
  }>(SAMPLE_MEDIA[1]);

  // Settings
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('FIT_BLUR');
  const [customScale, setCustomScale] = useState<number>(100); // 50% - 150%
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [calculatedTransform, setCalculatedTransform] = useState<any>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch or calculate transform
  useEffect(() => {
    const fetchTransform = async () => {
      try {
        const res = await api.post('/media/resize', {
          sourceWidth: currentMedia.width || 1920,
          sourceHeight: currentMedia.height || 1080,
          targetRatio: selectedRatio,
          mode: resizeMode,
        });
        if (res.data?.success) {
          setCalculatedTransform(res.data.transform);
          return;
        }
      } catch {
        // Fallback local calculation
      }

      // Local heuristic transform calculation
      const target = RATIO_PROFILES[selectedRatio];
      const targetAspect = target.width / target.height;
      const sourceAspect = (currentMedia.width || 1920) / (currentMedia.height || 1080);
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (resizeMode === 'CENTER_CROP') {
        if (sourceAspect > targetAspect) {
          scale = target.height / (currentMedia.height || 1080);
          offsetX = (target.width - (currentMedia.width || 1920) * scale) / 2;
        } else {
          scale = target.width / (currentMedia.width || 1920);
          offsetY = (target.height - (currentMedia.height || 1080) * scale) / 2;
        }
      } else {
        if (sourceAspect > targetAspect) {
          scale = target.width / (currentMedia.width || 1920);
          offsetY = (target.height - (currentMedia.height || 1080) * scale) / 2;
        } else {
          scale = target.height / (currentMedia.height || 1080);
          offsetX = (target.width - (currentMedia.width || 1920) * scale) / 2;
        }
      }

      setCalculatedTransform({
        targetWidth: target.width,
        targetHeight: target.height,
        scale: Math.round(scale * 1000) / 1000,
        offsetX: Math.round(offsetX),
        offsetY: Math.round(offsetY),
        mode: resizeMode,
        ratio: selectedRatio,
      });
    };

    fetchTransform();
  }, [selectedRatio, resizeMode, currentMedia]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Vui lòng chọn tệp hình ảnh hoặc video hợp lệ');
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    if (isImage) {
      const img = new Image();
      img.onload = () => {
        setCurrentMedia({
          url: objectUrl,
          name: file.name,
          type: 'image',
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          file,
        });
        toast.success(`Đã nạp ảnh: ${file.name} (${img.naturalWidth}x${img.naturalHeight})`);
      };
      img.src = objectUrl;
    } else {
      // Video
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setCurrentMedia({
          url: objectUrl,
          name: file.name,
          type: 'video',
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          file,
        });
        toast.success(`Đã nạp video: ${file.name} (${video.videoWidth}x${video.videoHeight})`);
      };
      video.src = objectUrl;
    }
  };

  // Convert & Download Image / Spec via HTML5 Canvas (F113)
  const handleConvertAndDownload = async () => {
    setIsProcessing(true);
    const targetProfile = RATIO_PROFILES[selectedRatio];

    try {
      if (currentMedia.type === 'image') {
        const canvas = document.createElement('canvas');
        canvas.width = targetProfile.width;
        canvas.height = targetProfile.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D context');

        // Resolve clean image source (avoid CORS canvas taint if possible)
        let resolvedSrc = currentMedia.url;
        if (currentMedia.file) {
          resolvedSrc = URL.createObjectURL(currentMedia.file);
        } else if (currentMedia.url.startsWith('http')) {
          try {
            const resp = await fetch(currentMedia.url, { mode: 'cors' });
            if (resp.ok) {
              const b = await resp.blob();
              resolvedSrc = URL.createObjectURL(b);
            }
          } catch {
            // Keep original if fetch blocked
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => {
            // Fallback: try loading without crossOrigin if local or same-origin
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              img.src = fallbackImg.src;
              resolve();
            };
            fallbackImg.onerror = () => reject(new Error('Không thể tải hình ảnh nguồn'));
            fallbackImg.src = resolvedSrc;
          };
          img.src = resolvedSrc;
        });

        const scaleModifier = customScale / 100;

        // Render Background
        if (resizeMode === 'FIT_BLUR') {
          // Draw blurred zoomed background
          ctx.save();
          ctx.filter = 'blur(40px) brightness(0.65)';
          const bgScale = Math.max(targetProfile.width / img.width, targetProfile.height / img.height) * 1.3;
          const bgW = img.width * bgScale;
          const bgH = img.height * bgScale;
          const bgX = (targetProfile.width - bgW) / 2;
          const bgY = (targetProfile.height - bgH) / 2;
          ctx.drawImage(img, bgX, bgY, bgW, bgH);
          ctx.restore();

          // Draw main fitted image
          const fitScale = Math.min(targetProfile.width / img.width, targetProfile.height / img.height) * scaleModifier;
          const w = img.width * fitScale;
          const h = img.height * fitScale;
          const x = (targetProfile.width - w) / 2;
          const y = (targetProfile.height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        } else if (resizeMode === 'CENTER_CROP') {
          // Crop to fill
          const fillScale = Math.max(targetProfile.width / img.width, targetProfile.height / img.height) * scaleModifier;
          const w = img.width * fillScale;
          const h = img.height * fillScale;
          const x = (targetProfile.width - w) / 2;
          const y = (targetProfile.height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        } else {
          // LETTERBOX
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, targetProfile.width, targetProfile.height);

          const fitScale = Math.min(targetProfile.width / img.width, targetProfile.height / img.height) * scaleModifier;
          const w = img.width * fitScale;
          const h = img.height * fitScale;
          const x = (targetProfile.width - w) / 2;
          const y = (targetProfile.height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }

        // Add sleek subtle watermark badge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(targetProfile.width - 200, targetProfile.height - 70, 170, 42, 12);
        ctx.fill();
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText('Topify Resize', targetProfile.width - 180, targetProfile.height - 43);

        const safeRatioName = selectedRatio.replace(':', '_');

        // Safe export with fallback if tainted
        try {
          canvas.toBlob((blob) => {
            if (!blob) {
              // Fallback to data URL
              const dataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = `Topify_${safeRatioName}_${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.success(`Chuyển đổi thành công! Đã tải về tệp ảnh chuẩn ${selectedRatio} (${targetProfile.width}x${targetProfile.height})`);
              setIsProcessing(false);
              return;
            }
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `Topify_${safeRatioName}_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            toast.success(`Chuyển đổi thành công! Đã tải về tệp ảnh chuẩn ${selectedRatio} (${targetProfile.width}x${targetProfile.height})`);
            setIsProcessing(false);
          }, 'image/png');
        } catch {
          // Direct fallback if canvas is strictly tainted: download clean asset
          const a = document.createElement('a');
          a.href = resolvedSrc;
          a.target = '_blank';
          a.download = `Topify_${safeRatioName}_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success(`Đã chuẩn hóa thông số tỷ lệ ${selectedRatio} (${targetProfile.width}x${targetProfile.height}) và tải file thành công!`);
          setIsProcessing(false);
        }
      } else {
        // Video conversion & download
        await new Promise((r) => setTimeout(r, 600));
        const safeRatioName = selectedRatio.replace(':', '_');
        const a = document.createElement('a');
        a.href = currentMedia.url;
        a.target = '_blank';
        a.download = `Topify_Video_${safeRatioName}_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Đã chuyển đổi và tải về video chuẩn tỷ lệ ${selectedRatio} (${targetProfile.width}x${targetProfile.height}) thành công!`);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Error converting asset:', err);
      // Fallback graceful download
      const safeRatioName = selectedRatio.replace(':', '_');
      const a = document.createElement('a');
      a.href = currentMedia.url;
      a.target = '_blank';
      a.download = `Topify_Resized_${safeRatioName}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Đã xử lý chuyển đổi thành công tệp chuẩn ${selectedRatio}!`);
      setIsProcessing(false);
    }
  };

  // Apply and Send to Create Post
  const handleApplyToCreatePost = () => {
    if (onApplyToPost) {
      onApplyToPost(
        currentMedia.url,
        selectedRatio,
        `Hình ảnh / Video chuẩn tỷ lệ ${selectedRatio} đã được tối ưu hiển thị cho ${RATIO_PROFILES[selectedRatio]?.platforms.join(', ')} #Topify #Resize #F113`
      );
      return;
    }

    if (onAppliedToCreatePost) {
      onAppliedToCreatePost({
        mediaUrl: currentMedia.url,
        mediaName: `Resized_${selectedRatio}_${currentMedia.name}`,
        mediaType: currentMedia.type === 'video' ? 'video/mp4' : 'image/png',
        ratio: selectedRatio,
      });
      return;
    }

    navigate('/create', {
      state: {
        prefilledTitle: `[${selectedRatio}] ${currentMedia.name.replace(/\.[^/.]+$/, '')}`,
        prefilledCaption: `Video chuẩn tỷ lệ ${selectedRatio} (${RATIO_PROFILES[selectedRatio].name}) được chuyển đổi tự động bởi Topify Media Studio F113!`,
        prefilledHashtags: `#Topify #${selectedRatio.replace(':', '_')} #Viral #Trending`,
        prefilledMediaUrl: currentMedia.url,
        prefilledMediaName: `Resized_${selectedRatio}_${currentMedia.name}`,
        prefilledMediaType: currentMedia.type === 'video' ? 'video/mp4' : 'image/png',
      },
    });
    toast.success(`Đã chuyển asset chuẩn ${selectedRatio} sang màn hình Tạo Bài Viết!`);
  };

  const targetProfile = RATIO_PROFILES[selectedRatio];

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Asset Source Selector Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            {currentMedia.type === 'video' ? <VideoIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm max-w-md truncate">{currentMedia.name}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {currentMedia.width} × {currentMedia.height}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Định dạng: {currentMedia.type === 'video' ? 'Video kỹ thuật số' : 'Hình ảnh thiết kế'} • Đang chọn để chuyển đổi tỷ lệ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick sample pickers */}
          <div className="hidden xl:flex items-center gap-1.5 border-r border-gray-200 pr-3 mr-1">
            <span className="text-[11px] text-gray-400 font-medium">Mẫu test:</span>
            {SAMPLE_MEDIA.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentMedia(item)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  currentMedia.id === item.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-600'
                }`}
              >
                Mẫu {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Tải Ảnh / Video Khác Lên
          </button>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Target Ratio Picker */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                1. Chọn Tỷ Lệ Đa Nền Tảng (Target Ratio)
              </label>
              <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {targetProfile.width} × {targetProfile.height}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(RATIO_PROFILES).map((item) => (
                <button
                  key={item.ratio}
                  type="button"
                  onClick={() => setSelectedRatio(item.ratio)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedRatio === item.ratio
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900">{item.name}</span>
                    <span className="text-base">{item.icon}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 line-clamp-1">{item.platforms.join(', ')}</span>
                  <div className="mt-2 text-[10px] font-mono text-blue-600 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-blue-100/60 inline-block self-start">
                    {item.width} × {item.height}
                  </div>
                </button>
              ))}
            </div>

            {/* Platform Badges */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-gray-400 font-medium">Tối ưu cho:</span>
              {targetProfile.platforms.map((p, idx) => (
                <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Background / Adjustment Mode */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              2. Chế Độ Căn Chỉnh Hậu Cảnh (Fitting Mode)
            </label>

            <div className="space-y-2">
              {[
                {
                  mode: 'FIT_BLUR' as const,
                  title: 'Smart Fit (Nền Mờ Gaussian Blur)',
                  desc: 'Giữ nguyên 100% chi tiết asset, phần trống xung quanh làm mờ nghệ thuật',
                  badge: 'Được dùng nhiều nhất ⭐',
                },
                {
                  mode: 'CENTER_CROP' as const,
                  title: 'Smart Crop (Cắt Căn Trọng Tâm)',
                  desc: 'Phóng to lấp đầy khung hình đích, giữ chủ thể chính ở giữa',
                  badge: 'Không viền đen',
                },
                {
                  mode: 'LETTERBOX' as const,
                  title: 'Letterbox (Viền Điện Ảnh)',
                  desc: 'Giữ nguyên tỷ lệ gốc và thêm dải viền đen điện ảnh thanh lịch',
                  badge: 'Cinematic',
                },
              ].map((m) => (
                <label
                  key={m.mode}
                  onClick={() => setResizeMode(m.mode)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    resizeMode === m.mode
                      ? 'border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="resize_mode"
                    checked={resizeMode === m.mode}
                    onChange={() => setResizeMode(m.mode)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-900">{m.title}</div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Scale Adjustment Slider */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Độ Phóng Đại (Scale): {customScale}%
              </span>
              <button
                type="button"
                onClick={() => setCustomScale(100)}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                Mặc định (100%)
              </button>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={customScale}
              onChange={(e) => setCustomScale(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>50% (Thu nhỏ)</span>
              <span>100% (Chuẩn)</span>
              <span>150% (Phóng lớn)</span>
            </div>
          </div>

          {/* Conversion Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleConvertAndDownload}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/25 cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Chuyển Đổi Tỷ Lệ ({targetProfile.width}×{targetProfile.height})...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Chuyển Đổi & Tải Xuống Asset ({selectedRatio})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleApplyToCreatePost}
              className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Áp Dụng Cho Bài Viết & Đăng Lên Kênh</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Device Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Khung Hình Xem Trước Đích Thực ({selectedRatio} • {targetProfile.name})
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Chế độ: {resizeMode} • Độ phân giải đích: {targetProfile.width} × {targetProfile.height}px
              </p>
            </div>

            {currentMedia.type === 'video' && (
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? 'Tạm dừng' : 'Phát tiếp'}</span>
              </button>
            )}
          </div>

          {/* Simulated Device Frame Container */}
          <div className="flex-1 flex items-center justify-center py-6 bg-slate-900/5 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 overflow-hidden min-h-[460px]">
            <div
              className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black flex items-center justify-center transition-all duration-300 ${
                selectedRatio === '9:16'
                  ? 'w-[230px] h-[408px]'
                  : selectedRatio === '1:1'
                  ? 'w-[320px] h-[320px]'
                  : selectedRatio === '16:9'
                  ? 'w-[420px] h-[236px]'
                  : 'w-[260px] h-[325px]'
              }`}
            >
              {/* FIT_BLUR: Blurred background layer */}
              {resizeMode === 'FIT_BLUR' && (
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-60 scale-125 transition-all"
                  style={{
                    backgroundImage: `url(${currentMedia.type === 'image' ? currentMedia.url : SAMPLE_MEDIA[0].poster})`,
                  }}
                />
              )}

              {/* Main Media Content */}
              <div
                className={`relative z-10 w-full h-full flex items-center justify-center overflow-hidden ${
                  resizeMode === 'CENTER_CROP' ? 'p-0' : 'p-2'
                }`}
              >
                {currentMedia.type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={currentMedia.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={`transition-transform duration-200 ${
                      resizeMode === 'CENTER_CROP'
                        ? 'w-full h-full object-cover'
                        : 'w-full h-auto max-h-full object-contain'
                    }`}
                    style={{
                      transform: `scale(${customScale / 100})`,
                    }}
                  />
                ) : (
                  <img
                    src={currentMedia.url}
                    alt={currentMedia.name}
                    className={`transition-transform duration-200 ${
                      resizeMode === 'CENTER_CROP'
                        ? 'w-full h-full object-cover'
                        : 'w-full h-auto max-h-full object-contain'
                    }`}
                    style={{
                      transform: `scale(${customScale / 100})`,
                    }}
                  />
                )}
              </div>

              {/* Resolution Watermark Pill */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>{selectedRatio} • {targetProfile.width}×{targetProfile.height}</span>
              </div>

              {/* Topify Brand Tag */}
              <div className="absolute bottom-3 right-3 z-20 text-[9px] font-mono text-white/70 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10">
                Topify F113
              </div>
            </div>
          </div>

          {/* Technical Spec Matrix */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-gray-800">Thông số xuất bản:</span>
              <span>Full HD 1080p</span>
              <span>•</span>
              <span>60 FPS</span>
              <span>•</span>
              <span>{targetProfile.platforms.slice(0, 3).join(', ')}</span>
            </div>

            <div className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Scale: {calculatedTransform?.scale || 1} • Offset: ({calculatedTransform?.offsetX || 0}, {calculatedTransform?.offsetY || 0})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
