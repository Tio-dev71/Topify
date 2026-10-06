'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Link as LinkIcon,
  Loader2,
  Video,
  Music,
  AlertCircle,
  Sparkles,
  Check,
  Copy,
  X,
  Film,
  CheckCircle2,
  Image as ImageIcon,
  Images,
} from 'lucide-react';

interface MediaInfo {
  url: string;
  quality?: string;
  extension?: string;
  type?: string;
  size?: string;
  isNoWatermark?: boolean;
  isRecommended?: boolean;
}

interface DownloaderResponse {
  title?: string;
  thumbnail?: string;
  picture?: string;
  duration?: number;
  isTikTok?: boolean;
  isPhotoPost?: boolean;
  images?: string[];
  author?: {
    nickname?: string;
    unique_id?: string;
    avatar?: string;
  };
  medias?: MediaInfo[];
  links?: MediaInfo[];
  error?: string | boolean;
  message?: string;
  [key: string]: any;
}

export default function DownloaderClient() {
  // Input 1: Universal Downloader
  const [universalUrl, setUniversalUrl] = useState('');
  // Input 2: TikTok No Watermark Downloader
  const [tiktokUrl, setTiktokUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<'universal' | 'tiktok' | null>(null);
  const [result, setResult] = useState<DownloaderResponse | null>(null);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFetch = async (
    targetUrl: string,
    isTikTokNoWatermark: boolean,
    source: 'universal' | 'tiktok'
  ) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setActiveSource(source);
    setError('');
    setResult(null);

    try {
      let finalUrl = targetUrl.trim();

      // Clean up YouTube URLs if needed
      try {
        const urlObj = new URL(finalUrl);
        if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
          urlObj.searchParams.delete('list');
          urlObj.searchParams.delete('index');
          urlObj.searchParams.delete('start_radio');
          finalUrl = urlObj.toString();
        }
      } catch {
        // ignore parse error
      }

      const res = await fetch('/api/downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: finalUrl,
          isTikTokNoWatermark,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Lỗi hệ thống: Server không trả về JSON (Mã: ${res.status}). Vui lòng thử lại sau.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Lỗi khi lấy thông tin video');
      }

      if (data.error === true || (data.code !== undefined && data.code !== 0 && !data.medias)) {
        throw new Error(
          data.message ||
            data.error ||
            'Không tìm thấy link tải cho video này. Có thể video bị giới hạn, bản quyền hoặc để chế độ riêng tư.'
        );
      }

      setResult(data);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi bất ngờ xảy ra khi tải video');
    } finally {
      setLoading(false);
      setActiveSource(null);
    }
  };

  const handleCopyLink = async (urlToCopy: string) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedUrl(urlToCopy);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // Fallback
    }
  };

  const getMediaList = (data: DownloaderResponse): MediaInfo[] => {
    if (data.medias && Array.isArray(data.medias)) return data.medias;
    if (data.links && Array.isArray(data.links)) return data.links;

    const possibleLinks: MediaInfo[] = [];
    Object.keys(data).forEach((key) => {
      if (
        typeof data[key] === 'string' &&
        data[key].startsWith('http') &&
        (data[key].includes('.mp4') || data[key].includes('.mp3'))
      ) {
        possibleLinks.push({ url: data[key], quality: key });
      }
    });
    return possibleLinks;
  };

  const medias = result ? getMediaList(result) : [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 relative z-10">
      {/* ──────────────────────────────────────────────────
          BOX 1: Universal Video Downloader
      ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xl shadow-indigo-500/5 transition-all">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Film className="w-4 h-4" />
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-900">
              Tải Video Đa Nền Tảng
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            YouTube • Facebook • TikTok • Instagram • X
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetch(universalUrl, false, 'universal');
          }}
          className="relative flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 sm:p-2 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-indigo-300 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all gap-2"
        >
          {/* Icon & Input */}
          <div className="flex-1 flex items-center pl-2 sm:pl-3 min-w-0">
            <LinkIcon className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="url"
              value={universalUrl}
              onChange={(e) => setUniversalUrl(e.target.value)}
              placeholder="Dán link video tại đây (YouTube, Facebook, TikTok, v.v.)..."
              className="w-full bg-transparent border-0 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none focus:ring-0 focus:outline-none"
              required
            />
            {universalUrl && (
              <button
                type="button"
                onClick={() => setUniversalUrl('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 transition-colors"
                title="Xóa link"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Start Button */}
          <button
            type="submit"
            disabled={loading || !universalUrl.trim()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-12 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] shrink-0"
          >
            {loading && activeSource === 'universal' ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Bắt đầu</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ──────────────────────────────────────────────────
          DIVIDER / SEPARATOR
      ────────────────────────────────────────────────── */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50/90 backdrop-blur-sm px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 rounded-full border border-slate-200">
            Dành riêng cho TikTok
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          BOX 2: TikTok Video Downloader - No Watermark
      ────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-b from-white via-rose-50/20 to-white rounded-3xl p-5 sm:p-7 border-2 border-rose-200/80 shadow-xl shadow-rose-500/5 transition-all overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[#25F4EE]/20 to-[#FE2C55]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-[#25F4EE]">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.88-4.49V8.8a8.28 8.28 0 0 0 4.89 1.58V6.93a4.85 4.85 0 0 1-1-.24z" />
              </svg>
              <span>TikTok No Watermark</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <Sparkles className="w-3 h-3" />
              Không logo 100%
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Tải Video TikTok Không Logo (No Watermark)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Dán link TikTok (<span className="text-slate-800 font-medium">tiktok.com/@...</span> hoặc link rút gọn <span className="text-slate-800 font-medium">vt.tiktok.com/...</span>) để tải video MP4 chất lượng gốc HD không logo, không dính ID tác giả.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetch(tiktokUrl, true, 'tiktok');
          }}
          className="relative flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 sm:p-2 rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-400 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100 transition-all gap-2 shadow-sm"
        >
          {/* Icon & Input */}
          <div className="flex-1 flex items-center pl-2 sm:pl-3 min-w-0">
            <span className="p-1 rounded-lg bg-rose-50 text-rose-500 shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.88-4.49V8.8a8.28 8.28 0 0 0 4.89 1.58V6.93a4.85 4.85 0 0 1-1-.24z" />
              </svg>
            </span>
            <input
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="Dán link video TikTok cần tải không logo vào đây..."
              className="w-full bg-transparent border-0 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none focus:ring-0 focus:outline-none"
              required
            />
            {tiktokUrl && (
              <button
                type="button"
                onClick={() => setTiktokUrl('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 transition-colors"
                title="Xóa link"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* TikTok No Watermark Button */}
          <button
            type="submit"
            disabled={loading || !tiktokUrl.trim()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-12 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-neutral-900 via-neutral-900 to-rose-600 hover:from-black hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-500/20 active:scale-[0.98] shrink-0"
          >
            {loading && activeSource === 'tiktok' ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 text-cyan-300" />
                <span>Đang tải không logo...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <span>Tải No Watermark</span>
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="mt-4 pt-3 border-t border-rose-100 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Không logo watermark
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Chuẩn chất lượng gốc HD
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tách nhạc chuông MP3
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Miễn phí 100%
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          ERROR ALERT
      ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Không thể lấy video</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────
          RESULT CARD
      ────────────────────────────────────────────────── */}
      {result && !error && (
        <div
          ref={resultsRef}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 animate-fade-in space-y-6"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">
                {result.isTikTok
                  ? result.isPhotoPost
                    ? `Album Ảnh TikTok đã sẵn sàng (${result.images?.length || medias.filter((m) => m.type === 'image').length} ảnh HD)`
                    : 'Video TikTok đã sẵn sàng (No Watermark)'
                  : 'Kết quả lấy link video'}
              </h3>
            </div>
            {result.isTikTok && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {result.isPhotoPost ? '✓ Album Ảnh Không Logo' : '✓ Đã loại bỏ Watermark'}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail Column */}
            {(result.thumbnail || result.picture) && (
              <div className="w-full md:w-5/12 flex-shrink-0">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
                  <img
                    src={result.thumbnail || result.picture}
                    alt={result.title || 'Video thumbnail'}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  {result.duration && result.duration > 0 ? (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-xs font-mono font-medium">
                      {Math.floor(result.duration / 60)}:
                      {String(Math.floor(result.duration % 60)).padStart(2, '0')}
                    </div>
                  ) : result.isPhotoPost ? (
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
                      <Images className="w-3.5 h-3.5" />
                      <span>{result.images?.length || medias.filter((m) => m.type === 'image').length} Ảnh</span>
                    </div>
                  ) : null}
                </div>

                {/* Author Info (TikTok) */}
                {result.author && (
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    {result.author.avatar && (
                      <img
                        src={result.author.avatar}
                        alt={result.author.nickname || 'Author'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {result.author.nickname || result.author.unique_id}
                      </p>
                      {result.author.unique_id && (
                        <p className="text-xs text-slate-500 truncate">
                          @{result.author.unique_id}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Details & Download Options */}
            <div className="flex-1 space-y-5">
              {result.title && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-3 leading-snug">
                    {result.title}
                  </h4>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tùy chọn tải xuống
                </h5>

                {medias.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {medias.map((media, idx) => {
                      const isAudio =
                        media.extension === 'mp3' || media.type?.includes('audio');
                      const isImage =
                        media.type === 'image' || media.extension === 'jpg';
                      const isNoWatermark = media.isNoWatermark;
                      const isRecommended = media.isRecommended;

                      const extension = isAudio ? '.mp3' : isImage ? '.jpg' : '.mp4';
                      const suffix = isAudio
                        ? '-audio'
                        : isImage
                        ? `-anh-${idx + 1}`
                        : isNoWatermark
                        ? '-no-watermark'
                        : '';

                      const encodedDownloadUrl = `/api/proxy-download?url=${encodeURIComponent(
                        media.url
                      )}&filename=${encodeURIComponent(
                        (result.title
                          ? result.title.substring(0, 40).replace(/[^a-zA-Z0-9\s-_]/g, '')
                          : 'tiktok'
                        ).trim() +
                          suffix +
                          extension
                      )}`;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all gap-3 ${
                            isNoWatermark || isRecommended
                              ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white shadow-sm ring-1 ring-emerald-200'
                              : 'border-slate-200 hover:border-indigo-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 ${
                                isNoWatermark || isRecommended
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isAudio
                                  ? 'bg-purple-100 text-purple-700'
                                  : isImage
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isAudio ? (
                                <Music className="w-5 h-5" />
                              ) : isImage ? (
                                <ImageIcon className="w-5 h-5" />
                              ) : isNoWatermark ? (
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Video className="w-5 h-5" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-sm font-bold text-slate-900">
                                  {media.quality ||
                                    media.type ||
                                    (isImage
                                      ? `Ảnh ${idx + 1} (Không Logo)`
                                      : isNoWatermark
                                      ? 'Video Không Logo'
                                      : 'Tải Video')}
                                </p>
                                {isRecommended && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs shrink-0">
                                    Khuyên dùng
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mt-0.5">
                                {[
                                  media.extension?.toUpperCase() ||
                                    (isAudio ? 'MP3' : isImage ? 'JPG' : 'MP4'),
                                  media.size,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(media.url)}
                              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                              title="Sao chép link tải trực tiếp"
                            >
                              {copiedUrl === media.url ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Download button */}
                            <a
                              href={encodedDownloadUrl}
                              download
                              className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-[0.98] w-full sm:w-auto ${
                                isNoWatermark || isRecommended
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                                  : 'bg-slate-900 hover:bg-black text-white'
                              }`}
                            >
                              <Download className="w-4 h-4" />
                              <span>
                                {isImage
                                  ? 'Tải Ảnh HD'
                                  : isNoWatermark
                                  ? 'Tải Không Logo'
                                  : isAudio
                                  ? 'Tải Nhạc MP3'
                                  : 'Tải Về'}
                              </span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500 italic text-center">
                    Không tìm thấy link tải trực tiếp.
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
