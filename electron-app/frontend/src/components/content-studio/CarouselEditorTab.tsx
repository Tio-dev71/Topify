import React, { useState } from 'react';
import {
  Images,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Send,
  Eye,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

interface CarouselSlide {
  id: string;
  imageUrl: string;
  fileName: string;
  caption: string;
  tag?: string;
}

export function CarouselEditorTab() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<CarouselSlide[]>([
    {
      id: 'slide_1',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      fileName: 'slide-1-cover.jpg',
      caption: 'Trang 1: Bật mí 5 bí quyết tăng trưởng kênh mạng xã hội đột phá năm 2026 🚀',
      tag: 'Bìa chính (Cover)',
    },
    {
      id: 'slide_2',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      fileName: 'slide-2-secret1.jpg',
      caption: 'Trang 2: Bí quyết #1 - Thiết lập Content Pillar phân bổ tỷ trọng nội dung cân bằng.',
      tag: 'Nội dung chi tiết 1',
    },
    {
      id: 'slide_3',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      fileName: 'slide-3-cta.jpg',
      caption: 'Trang 3: Lưu ngay bài viết này và Follow Topify để nhận thêm nhiều bí quyết tự động hóa!',
      tag: 'Lời kêu gọi (CTA)',
    },
  ]);

  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [carouselTitle, setCarouselTitle] = useState('Bộ ảnh Carousel Chiến lược Marketing đa kênh');
  const [overallCaption, setOverallCaption] = useState(
    'Swipe sang trái để khám phá ngay trọn bộ bí kíp marketing tự động hóa cùng Topify! Đừng quên lưu lại để ứng dụng ngay nhé 👇'
  );
  const [hashtags, setHashtags] = useState('#MarketingTips #Carousel #Topify #ContentStrategy #InstagramCarousel');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newSlides: CarouselSlide[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('video', file); // upload endpoint handles media

        try {
          const res = await api.post('/upload', formData);
          if (res.data?.storageUrl) {
            newSlides.push({
              id: `slide_${Date.now()}_${i}`,
              imageUrl: res.data.storageUrl,
              fileName: file.name,
              caption: `Mô tả cho trang ${slides.length + i + 1}: ${file.name.replace(/\.[^/.]+$/, '')}`,
              tag: `Trang ${slides.length + i + 1}`,
            });
          }
        } catch {
          // Fallback to client object URL for preview
          newSlides.push({
            id: `slide_${Date.now()}_${i}`,
            imageUrl: URL.createObjectURL(file),
            fileName: file.name,
            caption: `Mô tả cho trang ${slides.length + i + 1}`,
            tag: `Trang ${slides.length + i + 1}`,
          });
        }
      }

      setSlides((prev) => [...prev, ...newSlides]);
      toast.success(`Đã thêm ${newSlides.length} ảnh vào Carousel!`);
    } catch {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const updateSlideCaption = (idx: number, newCaption: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], caption: newCaption };
      return copy;
    });
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.error('Carousel cần ít nhất 1 ảnh');
      return;
    }
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    if (activeSlideIdx >= idx && activeSlideIdx > 0) {
      setActiveSlideIdx((prev) => prev - 1);
    }
  };

  const moveSlide = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    setActiveSlideIdx(targetIdx);
  };

  const handleCopyAll = () => {
    const text = `📌 ${carouselTitle}\n\n${overallCaption}\n\n${slides
      .map((s, i) => `[Trang ${i + 1}]: ${s.caption}`)
      .join('\n\n')}\n\n${hashtags}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép toàn bộ nội dung Carousel!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToPublisher = async () => {
    setSaving(true);
    try {
      const combinedCaption = `${overallCaption}\n\n${slides
        .map((s, i) => `Slide ${i + 1}: ${s.caption}`)
        .join('\n')}\n\n${hashtags}`;

      navigate('/create', {
        state: {
          prefilledTitle: carouselTitle,
          prefilledCaption: combinedCaption,
          prefilledHashtags: hashtags,
          isCarousel: true,
          carouselSlides: slides,
        },
      });
      toast.success('Đã chuyển bài đăng Carousel sang màn hình xuất bản!');
    } catch {
      toast.error('Không thể điều hướng xuất bản');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-pink-100">
            <Images className="w-3.5 h-3.5 text-amber-300" />
            Tính năng F013 • M2. Content Studio
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Soạn Bài Dạng Carousel (Nhiều Ảnh + Caption Riêng)</h2>
          <p className="text-pink-100 text-xs max-w-2xl leading-relaxed">
            Hỗ trợ tạo bộ ảnh trượt nhiều trang cho Instagram Carousel và Facebook Album. Mỗi trang ảnh có chú thích
            riêng biệt, kết hợp mô phỏng vuốt slide thực tế trước khi xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã sao chép' : 'Sao chép nội dung'}
          </button>
          <button
            type="button"
            onClick={handleSendToPublisher}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white text-purple-700 hover:bg-purple-50 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Đăng bài ngay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Slides Editor */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Info */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              1. Thông tin chung bài viết Carousel
            </h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề Carousel:</label>
              <input
                type="text"
                value={carouselTitle}
                onChange={(e) => setCarouselTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
                placeholder="Nhập tiêu đề bộ ảnh..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Caption tổng thể (Mở đầu bài viết):</label>
              <textarea
                rows={3}
                value={overallCaption}
                onChange={(e) => setOverallCaption(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white resize-none"
                placeholder="Lời mở đầu kêu gọi vuốt xem ảnh..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Hashtags đính kèm:</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
              />
            </div>
          </div>

          {/* Slides List & Caption per Slide */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Images className="w-4 h-4 text-pink-600" />
                2. Danh sách trang ảnh & Chú thích riêng ({slides.length} trang)
              </h3>
              <label className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                Thêm ảnh mới
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeSlideIdx === idx
                      ? 'border-purple-500 bg-purple-50/40 shadow-sm ring-2 ring-purple-500/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-gray-900 overflow-hidden shrink-0 shadow-xs relative">
                      <img src={slide.imageUrl} alt={slide.fileName} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          Trang {idx + 1}: {slide.fileName}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(idx, 'left');
                            }}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100"
                            title="Di chuyển lên trước"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(idx, 'right');
                            }}
                            disabled={idx === slides.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100"
                            title="Di chuyển về sau"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSlide(idx);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                            title="Xóa trang này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                          Chú thích riêng cho trang {idx + 1} (F013):
                        </label>
                        <input
                          type="text"
                          value={slide.caption}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateSlideCaption(idx, e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Nhập nội dung riêng cho trang này..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Carousel Preview Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                Mô phỏng hiển thị Carousel (Vuốt slide)
              </h3>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Trang {activeSlideIdx + 1} / {slides.length}
              </span>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="max-w-[320px] mx-auto bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl ring-1 ring-black/10">
              <div className="bg-white rounded-[2rem] overflow-hidden text-gray-900 space-y-3 pb-3">
                {/* Header */}
                <div className="px-3.5 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                      T
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-900">topify.official</p>
                      <p className="text-[9px] text-gray-400">Được tài trợ</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">•••</span>
                </div>

                {/* Active Slide Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                  {slides[activeSlideIdx] ? (
                    <img
                      src={slides[activeSlideIdx].imageUrl}
                      alt={slides[activeSlideIdx].fileName}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Chưa có ảnh
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {activeSlideIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSlideIdx((prev) => prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {activeSlideIdx < slides.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveSlideIdx((prev) => prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {slides.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`h-1.5 rounded-full transition-all ${
                          activeSlideIdx === dotIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Per-Slide Caption Highlight */}
                <div className="px-3.5 space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                    <strong className="text-purple-700">Chú thích trang {activeSlideIdx + 1}:</strong>{' '}
                    {slides[activeSlideIdx]?.caption || 'Chưa nhập chú thích'}
                  </div>

                  <p className="text-[11px] text-gray-700 line-clamp-2">
                    <span className="font-bold text-gray-900 mr-1.5">topify.official</span>
                    {overallCaption}
                  </p>

                  <p className="text-[10px] text-purple-600 font-medium">{hashtags}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
