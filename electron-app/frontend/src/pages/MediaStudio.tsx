import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
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

export default function MediaStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resize' | 'repurpose' | 'subtitles'>('resize');

  // Sample active video
  const [videoTitle, setVideoTitle] = useState('Review Chi Tiết Bàn Làm Việc Công Thái Học & Setup Góc Làm Việc 2026');
  const [videoDuration, setVideoDuration] = useState(180); // 3 mins

  // F113: Resize State
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('FIT_BLUR');
  const [calculatedTransform, setCalculatedTransform] = useState<any>(null);

  // F114: Repurpose State
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);
  const [analyzingHighlights, setAnalyzingHighlights] = useState(false);

  // F115: Subtitles State
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<'yellow_black' | 'white_dark'>('yellow_black');

  // Load Resize spec on change
  useEffect(() => {
    const fetchResizeSpec = async () => {
      try {
        const res = await api.post('/media/resize', {
          sourceWidth: 1920,
          sourceHeight: 1080,
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
  }, [selectedRatio, resizeMode]);

  // F114 Handler
  const handleGenerateHighlights = async () => {
    setAnalyzingHighlights(true);
    try {
      const res = await api.post('/media/repurpose', {
        title: videoTitle,
        durationSeconds: videoDuration,
        transcriptText: 'Video hướng dẫn chi tiết cách setup bàn làm việc công thái học, bảo vệ cột sống và tăng 200% hiệu suất làm việc.',
      });
      if (res.data.success && res.data.data?.clips) {
        setHighlights(res.data.data.clips);
        toast.success(`Đã trích xuất thành công ${res.data.data.clips.length} clip highlight ngắn!`);
      }
    } catch {
      toast.error('Không thể phân tích tách clip lúc này');
    } finally {
      setAnalyzingHighlights(false);
    }
  };

  // F115 Handler
  const handleGenerateSubtitles = async () => {
    setGeneratingSubtitles(true);
    try {
      const res = await api.post('/media/subtitles', {
        title: videoTitle,
        durationSeconds: videoDuration,
        speechText: 'Chào mừng các bạn đã quay trở lại với kênh. Hôm nay mình sẽ hướng dẫn các bạn cách thiết lập bàn làm việc chuẩn công thái học để không bị mỏi lưng.',
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

  const handleTransferToStudio = (clip: HighlightClip) => {
    const encodedCaption = encodeURIComponent(clip.suggestedCaption);
    const encodedTags = encodeURIComponent(clip.suggestedTags.join(' '));
    toast.success('Đang chuyển clip ngắn sang Content Studio...');
    navigate(`/create?caption=${encodedCaption}&tags=${encodedTags}&source=${encodeURIComponent(clip.title)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
          <div className="truncate text-xs font-medium text-gray-800" title={videoTitle}>
            {videoTitle}
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono flex-shrink-0">
            {videoDuration}s
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('resize')}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
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
            if (highlights.length === 0) handleGenerateHighlights();
          }}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
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
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
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
          onApplyToPost={(assetUrl: string, ratio: AspectRatio, caption?: string) => {
            navigate('/create', {
              state: {
                prefilledMediaUrl: assetUrl,
                prefilledMediaName: `media_studio_resized_${ratio.replace(':', '_')}.png`,
                prefilledMediaType: 'image',
                prefilledTitle: `Video/Ảnh đã Resize chuẩn ${ratio} (${RATIO_PROFILES[ratio]?.platforms.join(', ') || ''})`,
                prefilledCaption: caption || `Tối ưu tỷ lệ ${ratio} cho ${RATIO_PROFILES[ratio]?.platforms.join(', ')} #Topify #MediaStudio #F113`,
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div>
              <div className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Tự Động Phân Tích & Cắt Đoạn Đắt Giá (AI Video Repurposing)
              </div>
              <p className="text-xs text-blue-900/80 mt-0.5">
                Video dài 3 phút đã được trích xuất thành các clip 30s-60s đạt tiềm năng giữ chân người xem cao nhất
              </p>
            </div>

            <button
              onClick={handleGenerateHighlights}
              disabled={analyzingHighlights}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzingHighlights ? 'animate-spin' : ''}`} />
              {analyzingHighlights ? 'Đang trích xuất...' : 'Phân tích lại'}
            </button>
          </div>

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
                      <span key={i} className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono border border-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleTransferToStudio(clip)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer mt-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Đưa Clip Này Sang Content Studio
                </button>
              </div>
            ))}
          </div>
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
