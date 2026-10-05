'use client';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Link as LinkIcon, Loader2, Video, Music, AlertCircle, Send, Users, FolderOpen, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface MediaInfo {
  url: string;
  quality?: string;
  extension?: string;
  type?: string; // video, audio
  size?: string;
}

interface DownloaderResponse {
  title?: string;
  thumbnail?: string;
  medias?: MediaInfo[];
  links?: MediaInfo[]; // some APIs use links
  error?: string;
  // Generic catch-all for unknown structures
  [key: string]: any;
}

export default function DownloaderPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloaderResponse | null>(null);
  const [fetchError, setFetchError] = useState('');

  // Download states for Electron / Web
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadedFiles, setDownloadedFiles] = useState<Record<string, string>>({});

  // Auto-post state
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [groupUrl, setGroupUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [watermarkText, setWatermarkText] = useState('Topmedia');
  const [autoPostLoading, setAutoPostLoading] = useState(false);
  const [autoPostStatus, setAutoPostStatus] = useState('');
  const [autoPostError, setAutoPostError] = useState('');
  const [autoPostSuccess, setAutoPostSuccess] = useState('');

  // Accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Lắng nghe tiến trình tải từ Electron Main Process
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.onDownloadProgress) {
      const cleanup = window.electron.onDownloadProgress((data) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [data.url]: data.percent,
        }));
      });
      return cleanup;
    }
  }, []);

  // Lắng nghe tiến trình Auto-Post từ Electron Main Process
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.onAutoPostStatus) {
      const cleanup = window.electron.onAutoPostStatus((data: any) => {
        if (data?.message) {
          setAutoPostStatus(data.message);
        }
      });
      return cleanup;
    }
  }, []);

  const handleDownload = async (media: MediaInfo) => {
    if (!media.url) return;

    const rawTitle = (result?.title || 'video')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .trim()
      .slice(0, 50);
    const ext = media.extension || (media.type?.includes('audio') ? 'mp3' : 'mp4');
    const quality = (media.quality || media.type || 'hd').replace(/\s+/g, '_');
    const filename = `${rawTitle}-${quality}.${ext}`;

    // Nếu chạy trong Desktop App Electron
    if (typeof window !== 'undefined' && window.electron?.downloadFile) {
      setDownloadingUrl(media.url);
      setDownloadProgress((prev) => ({ ...prev, [media.url]: 0 }));

      try {
        const res = await window.electron.downloadFile({
          url: media.url,
          filename,
          title: `Lưu video: ${filename}`,
        });

        if (res.canceled) {
          return;
        }

        if (res.success && res.filePath) {
          setDownloadedFiles((prev) => ({ ...prev, [media.url]: res.filePath! }));
          toast.success(`Tải xuống thành công!`, {
            description: `${res.filename}`,
            duration: 8000,
            action: {
              label: 'Mở thư mục',
              onClick: () => window.electron?.showItemInFolder?.(res.filePath!),
            },
          });
        } else {
          toast.error(res.error || 'Tải video thất bại');
        }
      } catch (err: any) {
        toast.error(`Lỗi tải video: ${err.message || 'Không thể kết nối'}`);
      } finally {
        setDownloadingUrl(null);
      }
    } else {
      // Fallback khi chạy trên trình duyệt Web: dùng link tuyệt đối proxy
      const downloadUrl = `https://topify.vn/api/proxy-download?url=${encodeURIComponent(media.url)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đang bắt đầu tải video: ${filename}`);
    }
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setAccountsLoading(true);
        const res = await api.get('/facebook-accounts');
        if (Array.isArray(res.data)) {
          setAccounts(res.data);
          // Auto select live accounts by default
          const liveIds = res.data.filter((a: any) => a.status === 'LIVE').map((a: any) => a.id);
          setSelectedAccounts(liveIds.length > 0 ? liveIds : res.data.map((a: any) => a.id));
        }
      } catch (e) {
        console.error('Failed to load facebook accounts in Downloader:', e);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setFetchError('');
    setAutoPostError('');
    setResult(null);
    setAutoPostSuccess('');
    setAutoPostStatus('');

    try {
      const res = await api.post('/downloader', { url: url.trim() });
      setResult(res.data);
      toast.success('Lấy thông tin video thành công!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Lỗi khi lấy thông tin video';
      setFetchError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPost = async (videoUrlToPost?: string) => {
    const targetVideo = videoUrlToPost || selectedVideo;
    if (!targetVideo) {
      toast.error('Vui lòng chọn video cần đăng!');
      return;
    }
    if (!groupUrl.trim()) {
      toast.error('Vui lòng nhập Link Group hoặc Trang Facebook ở khung bên trên trước!');
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài khoản Facebook để đăng!');
      return;
    }

    setSelectedVideo(targetVideo);
    setAutoPostLoading(true);
    setAutoPostError('');
    setAutoPostSuccess('');
    setAutoPostStatus('Đang chuẩn bị tiến trình đăng bài...');

    try {
      // Nếu chạy trong Desktop App Electron -> Chạy trực tiếp qua Playwright trên máy người dùng
      if (typeof window !== 'undefined' && window.electron?.postFacebookGroup) {
        const targetAccounts = accounts.filter(a => selectedAccounts.includes(a.id) || selectedAccounts.includes(a.profileId));
        const realProfileIds = targetAccounts.map(a => a.profileId || a.id);

        const res = await window.electron.postFacebookGroup({
          videoUrl: targetVideo,
          groupUrl: groupUrl.trim(),
          caption,
          watermarkText: watermarkText.trim() || 'Topmedia',
          accounts: targetAccounts,
          profileIds: realProfileIds
        });

        if (res.success) {
          if (res.results && Array.isArray(res.results)) {
            const anySuccess = res.results.some((r: any) => r.success);
            const failed = res.results.filter((r: any) => !r.success);
            if (!anySuccess && failed.length > 0) {
              const errMsg = failed[0].error || 'Lỗi khi tự động đăng bài lên Group';
              setAutoPostError(errMsg);
              toast.error(errMsg);
              return;
            }
          }
          setAutoPostSuccess('Video đã được tải, xử lý và đăng lên Facebook Group thành công!');
          toast.success('Đăng bài lên Facebook Group thành công!');
        } else {
          const errMsg = res.error || 'Lỗi khi tự động đăng bài lên Group';
          setAutoPostError(errMsg);
          toast.error(errMsg);
        }
      } else {
        // Fallback Web API
        await api.post('/autopost', {
          videoUrl: targetVideo,
          groupUrl: groupUrl.trim(),
          caption,
          watermarkText: watermarkText.trim() || 'Topmedia',
          accountIds: selectedAccounts
        });

        setAutoPostSuccess('Video đã được đóng dấu watermark và đăng lên Facebook Group thành công!');
        toast.success('Đăng bài lên Facebook thành công!');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Lỗi khi tự động đăng bài';
      setAutoPostError(errMsg);
      toast.error(errMsg);
    } finally {
      setAutoPostLoading(false);
      setAutoPostStatus('');
    }
  };

  // Helper to extract media list from various API response structures
  const getMediaList = (data: DownloaderResponse): MediaInfo[] => {
    if (data.medias && Array.isArray(data.medias)) return data.medias;
    if (data.links && Array.isArray(data.links)) return data.links;
    
    // If it's a very generic object with URL fields, try to extract them
    const possibleLinks: MediaInfo[] = [];
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key].startsWith('http') && (data[key].includes('.mp4') || data[key].includes('.mp3'))) {
        possibleLinks.push({ url: data[key], quality: key });
      }
    });
    return possibleLinks;
  };

  const medias = result ? getMediaList(result) : [];
  const videoMedias = medias.filter(m => m.extension !== 'mp3' && !m.type?.includes('audio'));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Video Downloader
          </h1>
          <p className="page-subtitle">
            Download videos and audio from YouTube, Facebook, TikTok, and more.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-2 sm:p-4 transition-all hover:shadow-2xl hover:shadow-blue-900/10">
        <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your video link here..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent text-gray-900 rounded-2xl focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none text-base"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url}
            className="whitespace-nowrap inline-flex items-center justify-center gap-2 shrink-0 px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-semibold rounded-2xl shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Start
              </>
            )}
          </button>
        </form>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{fetchError}</div>
        </div>
      )}

      {result && (
        <div className="card-apple p-6 sm:p-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Thumbnail Preview Block */}
            {(result.thumbnail || result.picture) && (
              <div className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 self-start">
                <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-3 shadow-sm space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[460px] aspect-[9/16] sm:aspect-auto">
                    <img
                      src={result.thumbnail || result.picture}
                      alt={result.title || "Video thumbnail"}
                      className="max-h-[460px] w-full object-contain mx-auto rounded-xl"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Video className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      Xem trước
                    </div>
                  </div>
                  {result.title && (
                    <div className="px-1 py-0.5">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed">
                        {result.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Details and Links */}
            <div className="flex-1 min-w-0 space-y-5 w-full">
              {result.title && (
                <h3 className="text-xl font-bold text-neutral-900 line-clamp-2 leading-snug">
                  {result.title}
                </h3>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                    Tùy chọn tải về & Đăng bài
                  </h4>
                </div>

                {videoMedias.length > 0 && (
                  <div className="p-4 bg-[var(--color-primary-soft)] border border-[var(--color-primary)] border-opacity-30 rounded-2xl space-y-4 mb-4">
                    <p className="text-[13px] text-[var(--color-primary)] font-semibold">Để dùng tính năng Auto-Post cho một video bên dưới, hãy nhập Link Nhóm và Caption trước:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[var(--color-foreground)]">Facebook Group URL</label>
                        <input 
                          type="url"
                          placeholder="https://www.facebook.com/groups/yourgroup"
                          value={groupUrl}
                          onChange={(e) => setGroupUrl(e.target.value)}
                          className="input-apple"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[var(--color-foreground)]">Watermark (Đóng dấu video)</label>
                        <input 
                          type="text"
                          placeholder="Nhập chữ chèn vào video"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="input-apple"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[13px] font-semibold text-[var(--color-foreground)]">Post Caption</label>
                        <textarea 
                          rows={1}
                          placeholder="Write something about this video..."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="input-apple resize-none min-h-[42px]"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 pt-3 border-t border-[var(--color-primary)] border-opacity-20">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chọn tài khoản Facebook để đăng</span>
                          {accounts.length > 0 && (
                            <span className="text-[11px] font-normal text-gray-500">
                              (Đã chọn {selectedAccounts.length}/{accounts.length})
                            </span>
                          )}
                        </label>
                        {accounts.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAccounts(accounts.map(a => a.id))}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Chọn tất cả
                            </button>
                            <span className="text-gray-300">•</span>
                            <button
                              type="button"
                              onClick={() => setSelectedAccounts([])}
                              className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold"
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        )}
                      </div>

                      {accountsLoading ? (
                        <div className="flex items-center gap-2 p-3 text-xs text-gray-500 bg-white rounded-xl border border-gray-200">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span>Đang tải danh sách tài khoản Facebook...</span>
                        </div>
                      ) : accounts.length === 0 ? (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 gap-3">
                          <div className="text-xs text-amber-800">
                            Chưa có tài khoản Facebook nào trong hệ thống. Vui lòng thêm tài khoản trước khi đăng.
                          </div>
                          <Link
                            to="/facebook-accounts"
                            className="whitespace-nowrap text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs transition-colors shrink-0"
                          >
                            + Thêm tài khoản FB
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-neutral-200 custom-scrollbar">
                          {accounts.map(acc => {
                            const isSelected = selectedAccounts.includes(acc.id);
                            return (
                              <label
                                key={acc.id}
                                className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-xs'
                                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-gray-700 font-medium'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 bg-white border-neutral-300 cursor-pointer"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAccounts(prev => [...prev, acc.id]);
                                    } else {
                                      setSelectedAccounts(prev => prev.filter(id => id !== acc.id));
                                    }
                                  }}
                                />
                                <span>{acc.name}</span>
                                {acc.status === 'LIVE' ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Tài khoản LIVE" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-gray-400" title={acc.status || 'UNKNOWN'} />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* AutoPost Live Status & Feedback */}
                    {autoPostStatus && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600 flex-shrink-0" />
                        <span>{autoPostStatus}</span>
                      </div>
                    )}

                    {autoPostError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Lỗi khi đăng bài:</p>
                          <p className="mt-0.5">{autoPostError}</p>
                        </div>
                      </div>
                    )}

                    {autoPostSuccess && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Thành công!</p>
                          <p className="mt-0.5">{autoPostSuccess}</p>
                          <p className="mt-1 text-[11px] text-emerald-700">💡 Bạn có thể xem ảnh màn hình quá trình đăng bài trong tab <b>Phát trực tiếp (Live)</b>.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {medias.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {medias.map((media, idx) => {
                      const isVideo = media.extension !== 'mp3' && !media.type?.includes('audio');
                      return (
                        <div
                          key={idx}
                          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-card)] transition-all gap-4"
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="p-2.5 rounded-xl bg-[var(--color-muted)] group-hover:bg-[var(--color-primary-soft)] text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                              {isVideo ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                            </div>
                            <div className="truncate">
                              <p className="text-[14px] font-semibold text-[var(--color-foreground)] truncate">
                                {media.quality || media.type || media.extension || 'Download File'}
                              </p>
                              {(media.extension || media.size) && (
                                <p className="text-[12px] text-[var(--color-muted-foreground)] mt-0.5">
                                  {[media.extension, media.size].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto mt-3 sm:mt-0 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDownload(media)}
                              disabled={downloadingUrl === media.url}
                              className={`whitespace-nowrap inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all shrink-0 ${
                                downloadedFiles[media.url]
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'btn-secondary shadow-xs hover:shadow-sm'
                              }`}
                            >
                              {downloadingUrl === media.url ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 flex-shrink-0" />
                                  <span>{downloadProgress[media.url] ? `${downloadProgress[media.url]}%` : 'Đang tải...'}</span>
                                </>
                              ) : downloadedFiles[media.url] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span>Đã tải xong</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Tải về</span>
                                </>
                              )}
                            </button>

                            {downloadedFiles[media.url] && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.electron?.showItemInFolder) {
                                    window.electron.showItemInFolder(downloadedFiles[media.url]);
                                  }
                                }}
                                className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold shrink-0 transition-all shadow-xs"
                                title="Mở thư mục chứa video vừa tải"
                              >
                                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Mở file</span>
                              </button>
                            )}
                            
                            {isVideo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAutoPost(media.url);
                                }}
                                disabled={autoPostLoading && selectedVideo === media.url}
                                className="btn-primary whitespace-nowrap inline-flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-bold shrink-0 shadow-xs hover:shadow-sm"
                              >
                                {autoPostLoading && selectedVideo === media.url ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                                    <span>Đang đăng...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>Auto-Post</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500 italic">
                    <p>No direct download links found in standard format.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
