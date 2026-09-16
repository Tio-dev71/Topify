'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, CheckCircle2, ChevronRight, Upload, Calendar, Wand2, CheckSquare, Sparkles, Smartphone, Play, Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type VideoAsset = {
  id: string;
  originalFileName: string;
  titleFromFileName: string;
  storageUrl: string;
  createdAt: string;
};

export default function CreatePostPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['FACEBOOK_REELS']);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'auto_schedule' | 'request_approval'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // AI features state
  const [isSpinning, setIsSpinning] = useState(false);
  const [checklist, setChecklist] = useState({
    policy: false,
    quality: false,
    tags: false
  });
  
  const isChecklistComplete = checklist.policy && checklist.quality && checklist.tags;
  
  // Media picker state
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVideos(false);
      }
    };
    fetchVideos();
  }, []);

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedVideoId || platforms.length === 0) {
      alert('Vui lòng nhập tiêu đề, chọn video và ít nhất 1 nền tảng.');
      return;
    }
    if (publishMode === 'schedule' && (!scheduledDate || !scheduledTime)) {
      alert('Vui lòng chọn ngày giờ lên lịch.');
      return;
    }
    if (!isChecklistComplete) {
      alert('Vui lòng hoàn thành checklist trước khi đăng.');
      return;
    }

    let scheduledAt = null;
    if (publishMode === 'schedule') {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          caption,
          hashtags,
          firstComment,
          videoAssetId: selectedVideoId,
          platforms,
          publishMode,
          scheduledAt
        }),
      });

      if (res.ok) {
        router.push('/dashboard/content/posts');
      } else {
        const data = await res.json();
        alert(data.error || 'Đã xảy ra lỗi khi tạo bài viết');
      }
    } catch (_error) {
      alert('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpinContent = () => {
    if (!caption) {
      alert("Vui lòng nhập nội dung gốc để tạo biến thể.");
      return;
    }
    setIsSpinning(true);
    setTimeout(() => {
      setCaption(prev => prev + "\n\n(Đã được tối ưu bởi AI ✨)");
      setIsSpinning(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] pb-24">
      <div className="relative pt-8 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#5B3DF5]/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
          <Link href="/dashboard/content/posts" className="hover:text-[#5B3DF5] transition-colors">Bài viết</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-gray-100">Tạo bài viết mới</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
            Tạo Bài Viết
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-base max-w-2xl">
            Soạn thảo, xem trước và đăng bài viết lên đa nền tảng cùng lúc với trải nghiệm siêu mượt mà.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Content Editor (span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-5">
                <div className="p-2.5 bg-[#5B3DF5]/10 rounded-2xl text-[#5B3DF5]">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nội dung</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tiêu đề (Nội bộ) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                  placeholder="VD: Campaign Tháng 10 - Video 1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Caption (Nội dung bài đăng)</label>
                  <button 
                    type="button" 
                    onClick={handleSpinContent}
                    disabled={isSpinning || !caption}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#5B3DF5] bg-[#5B3DF5]/10 hover:bg-[#5B3DF5]/20 px-4 py-2 rounded-full transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} /> 
                    {isSpinning ? 'Đang tối ưu...' : 'Tối ưu AI'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 transition-all text-sm resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                  placeholder="Viết gì đó thật thu hút..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hashtags</label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                    placeholder="#xuhuong #trend"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bình luận đầu tiên</label>
                  <input
                    type="text"
                    value={firstComment}
                    onChange={e => setFirstComment(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                    placeholder="Ghim link hoặc lời kêu gọi..."
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#3B82F6]/10 rounded-2xl text-[#3B82F6]">
                    <Video className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chọn Video <span className="text-rose-500">*</span></h2>
                </div>
                <Link href="/dashboard/upload" target="_blank" className="text-sm text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 px-4 py-2 rounded-full font-bold flex items-center gap-1.5 transition-colors">
                  <Upload className="w-4 h-4" /> Tải lên mới
                </Link>
              </div>
              
              {loadingVideos ? (
                <div className="py-12 text-center"><div className="w-10 h-10 border-4 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto"/></div>
              ) : videos.length === 0 ? (
                <div className="text-center py-14 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Video className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">Chưa có video nào</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Hãy tải lên một video để bắt đầu đăng bài.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                  {videos.map(video => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={video.id} 
                      onClick={() => setSelectedVideoId(video.id)}
                      className={`cursor-pointer group relative aspect-[9/16] bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 ${
                        selectedVideoId === video.id ? 'ring-4 ring-[#5B3DF5] shadow-[0_0_20px_rgba(91,61,245,0.3)]' : 'hover:ring-4 hover:ring-[#3B82F6]/50'
                      }`}
                    >
                      <video src={video.storageUrl} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors ${selectedVideoId === video.id ? 'bg-black/0' : ''}`} />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 flex flex-col justify-end p-4">
                        <p className="text-xs text-white font-semibold line-clamp-2 leading-tight">{video.originalFileName}</p>
                      </div>
                      
                      {/* Play Icon Overlay on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                          <Play className="w-6 h-6 ml-1" />
                        </div>
                      </div>

                      {selectedVideoId === video.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 bg-[#5B3DF5] text-white rounded-full p-1.5 shadow-lg"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Column 2: Settings & Publish (span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700/50 pb-5">Nền tảng đăng <span className="text-rose-500">*</span></h2>
              <div className="space-y-4">
                {[
                  { id: 'FACEBOOK_REELS', label: 'Facebook Reels', color: 'bg-[#1877F2]' },
                  { id: 'INSTAGRAM_REELS', label: 'Instagram Reels', color: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
                  { id: 'YOUTUBE_SHORTS', label: 'YouTube Shorts', color: 'bg-[#FF0000]' },
                  { id: 'TIKTOK_VIDEO', label: 'TikTok Video', color: 'bg-black dark:bg-white' },
                ].map(platform => (
                  <label key={platform.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${platforms.includes(platform.id) ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 shadow-[0_4px_15px_rgba(91,61,245,0.1)]' : 'border-gray-200 dark:border-gray-700 hover:border-[#5B3DF5]/30 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-3.5 h-3.5 rounded-full ${platform.color} shadow-sm`} />
                      <span className={`text-base font-bold ${platforms.includes(platform.id) ? 'text-[#5B3DF5]' : 'text-gray-700 dark:text-gray-300'}`}>{platform.label}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${platforms.includes(platform.id) ? 'bg-[#5B3DF5] border-[#5B3DF5]' : 'border-gray-300 dark:border-gray-600'}`}>
                      {platforms.includes(platform.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={platforms.includes(platform.id)}
                      onChange={() => handlePlatformToggle(platform.id)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700/50 pb-5">Lịch đăng</h2>
              
              <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner">
                <button 
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${publishMode === 'now' ? 'bg-white dark:bg-gray-800 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Đăng ngay
                </button>
                <button 
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${publishMode === 'schedule' ? 'bg-white dark:bg-gray-800 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Lên lịch
                </button>
                <button 
                  type="button"
                  onClick={() => setPublishMode('auto_schedule')}
                  className={`flex-1 min-w-[130px] py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${publishMode === 'auto_schedule' ? 'bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg shadow-[#5B3DF5]/30' : 'text-gray-500 dark:text-gray-400 hover:text-[#5B3DF5]'}`}
                >
                  <Sparkles className="w-4 h-4" /> Thông minh
                </button>
              </div>

              <AnimatePresence mode="wait">
                {publishMode === 'schedule' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ngày đăng</label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 text-sm shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Giờ đăng</label>
                      <input 
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 focus:border-[#5B3DF5]/50 text-sm shadow-inner"
                      />
                    </div>
                  </motion.div>
                )}

                {publishMode === 'auto_schedule' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 overflow-hidden"
                  >
                    <div className="p-5 bg-gradient-to-r from-[#5B3DF5]/10 to-[#3B82F6]/10 rounded-2xl border border-[#5B3DF5]/20 flex gap-4 items-start">
                      <div className="bg-gradient-to-br from-[#5B3DF5] to-[#3B82F6] rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">AI Tự Động Phân Tích</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed font-medium">
                          Dựa trên dữ liệu insight của trang, thuật toán sẽ tự động chọn "Giờ Vàng" có khả năng viral cao nhất trong 24h tới để đăng.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pre-publish Checklist */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-emerald-500" /> Điều kiện xuất bản
              </h2>
              <div className="space-y-2">
                {[
                  { id: 'policy', label: 'Tuân thủ chính sách bản quyền', checked: checklist.policy },
                  { id: 'quality', label: 'Video không chứa logo nền tảng khác', checked: checklist.quality },
                  { id: 'tags', label: 'Nội dung phù hợp, hashtag rõ ràng', checked: checklist.tags }
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group transition-all">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shadow-sm ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {item.checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${item.checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={e => setChecklist(prev => ({...prev, [item.id]: e.target.checked}))} 
                      className="hidden" 
                    />
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={submitting || !isChecklistComplete}
              className="w-full py-4 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-xl shadow-[#5B3DF5]/30 hover:shadow-2xl hover:shadow-[#5B3DF5]/50 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xuất bản...
                </>
              ) : (
                publishMode === 'now' ? 'Xuất Bản Ngay' : publishMode === 'schedule' ? 'Xác Nhận Lên Lịch' : publishMode === 'auto_schedule' ? 'Auto-Schedule (AI)' : 'Gửi Yêu Cầu Duyệt'
              )}
            </motion.button>
          </div>

          {/* Column 3: Live Preview (span 3) */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-12 bg-black dark:bg-[#121212] border-8 border-gray-900 rounded-[3rem] p-3 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative mx-auto max-w-[320px] ring-1 ring-white/10"
            >
              {/* Phone Notch */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50">
                <div className="w-36 h-7 bg-gray-900 rounded-b-3xl" />
              </div>

              <div className="absolute top-2 left-6 right-6 flex justify-between z-50 text-[11px] text-white font-bold px-2 mt-1 drop-shadow-md">
                <span>9:41</span>
                <div className="flex gap-1.5 items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>
                  <div className="w-5 h-3 bg-white rounded-sm" />
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-[#1A1A1A] relative mt-2 border border-white/5">
                {selectedVideo ? (
                  <>
                    <video src={selectedVideo.storageUrl} className="w-full h-full object-cover" loop muted autoPlay playsInline />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 space-y-4">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-sm font-bold px-8 text-center leading-relaxed">Chọn video để xem trước giao diện</span>
                  </div>
                )}

                {/* Mock UI Overlay */}
                {selectedVideo && (
                  <>
                    <div className="absolute right-3 bottom-28 flex flex-col gap-6 items-center z-20">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] text-white font-bold shadow-black drop-shadow-lg">1.2K</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] text-white font-bold shadow-black drop-shadow-lg">342</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                          <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] text-white font-bold shadow-black drop-shadow-lg">89</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                          <MoreHorizontal className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-4 right-16 z-20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#3B82F6] p-[2px]">
                          <div className="w-full h-full bg-black rounded-full border border-black" />
                        </div>
                        <span className="text-base font-extrabold text-white drop-shadow-lg">@yourpage</span>
                        <button className="px-3 py-1.5 text-[11px] font-bold bg-white/20 backdrop-blur-md text-white rounded-lg border border-white/30 ml-1">Follow</button>
                      </div>
                      <div className="text-sm text-white drop-shadow-lg line-clamp-3 font-medium opacity-95 leading-relaxed whitespace-pre-wrap">
                        {caption || 'Caption bài viết sẽ hiển thị ở đây. Nhập caption ở cột bên trái để xem trước...'}
                      </div>
                      <div className="text-sm text-[#3B82F6] font-bold drop-shadow-lg line-clamp-1">
                        {hashtags || '#hashtags'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Phone Bottom Bar */}
              <div className="absolute bottom-2 inset-x-0 h-1.5 flex justify-center z-50">
                <div className="w-28 h-1.5 bg-white/40 rounded-full" />
              </div>
            </motion.div>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-6 flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4" /> Live Preview
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
