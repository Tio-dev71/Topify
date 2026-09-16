'use client';

import { useState, useEffect } from 'react';
import { Download, Link as LinkIcon, Loader2, Video, Music, AlertCircle, Send, Users } from 'lucide-react';

const API_URL = import.meta.env.DEV ? '/api' : 'https://topify.vn/api';

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
  const [error, setError] = useState('');

  // Auto-post state
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [groupUrl, setGroupUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [watermarkText, setWatermarkText] = useState('Topmedia');
  const [autoPostLoading, setAutoPostLoading] = useState(false);
  const [autoPostSuccess, setAutoPostSuccess] = useState('');

  // Accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${API_URL}/facebook-accounts`);
        const data = await res.json();
        if (Array.isArray(data)) setAccounts(data);
      } catch (e) {}
    };
    fetchAccounts();
  }, []);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);
    setAutoPostSuccess('');

    try {
      const res = await fetch(`${API_URL}/downloader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video details');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || !groupUrl) return;
    if (selectedAccounts.length === 0) {
      alert('Please select at least one Facebook account to post with.');
      return;
    }

    setAutoPostLoading(true);
    setError('');
    setAutoPostSuccess('');

    try {
      const res = await fetch(`${API_URL}/autopost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: selectedVideo,
          groupUrl,
          caption,
          watermarkText,
          accountIds: selectedAccounts
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to process and post video');
      }

      setAutoPostSuccess('Video has been watermarked and successfully posted to the Facebook Group!');
    } catch (err: any) {
      setError(err.message || 'An error occurred during auto-posting.');
    } finally {
      setAutoPostLoading(false);
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
            className="flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-semibold rounded-2xl shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4 flex items-start gap-3 text-red-800 dark:text-red-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {autoPostSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-4 flex items-start gap-3 text-green-800 dark:text-green-400 animate-in fade-in slide-in-from-top-2">
          <div className="text-sm font-medium">{autoPostSuccess}</div>
        </div>
      )}

      {result && !error && (
        <div className="card-apple p-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            {(result.thumbnail || result.picture) && (
              <div className="w-full md:w-1/3 flex-shrink-0 relative aspect-video rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={result.thumbnail || result.picture}
                  alt={result.title || "Video thumbnail"}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            {/* Details and Links */}
            <div className="flex-1 space-y-4">
              {result.title && (
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white line-clamp-2">
                  {result.title}
                </h3>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Download & Auto-Post Options
                  </h4>
                </div>

                {videoMedias.length > 0 && (
                  <div className="p-4 bg-[var(--color-primary-soft)] border border-[var(--color-primary)] border-opacity-30 rounded-xl space-y-4 mb-4">
                    <p className="text-[13px] text-[var(--color-primary)] font-medium">Để dùng tính năng Auto-Post cho một video bên dưới, hãy nhập Link Nhóm và Caption trước:</p>
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
                    
                    <div className="space-y-2 pt-3 border-t border-[var(--color-primary)] border-opacity-20">
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        <Users className="w-3.5 h-3.5" />
                        Select Accounts to Post
                      </label>
                      {accounts.length === 0 ? (
                        <div className="text-xs text-neutral-500">No accounts available. Please add them in the FB Accounts page.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 custom-scrollbar">
                          {accounts.map(acc => (
                            <label key={acc.id} className="flex items-center gap-1.5 cursor-pointer bg-neutral-50 dark:bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-[var(--color-primary-soft)] hover:border-[var(--color-primary)] hover:border-opacity-30 transition-all">
                              <input 
                                type="checkbox" 
                                className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-white border-neutral-300"
                                checked={selectedAccounts.includes(acc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAccounts(prev => [...prev, acc.id]);
                                  } else {
                                    setSelectedAccounts(prev => prev.filter(id => id !== acc.id));
                                  }
                                }}
                              />
                              <span className="text-[13px] font-medium text-[var(--color-foreground)]">{acc.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
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
                              <p className="text-[14px] font-medium text-[var(--color-foreground)] truncate">
                                {media.quality || media.type || media.extension || 'Download File'}
                              </p>
                              {(media.extension || media.size) && (
                                <p className="text-[12px] text-[var(--color-muted-foreground)] mt-0.5">
                                  {[media.extension, media.size].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <a
                              href={`/api/proxy-download?url=${encodeURIComponent(media.url)}&filename=video-${Date.now()}`}
                              download
                              className="btn-secondary flex-1 sm:flex-none py-2 text-[13px]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Tải về
                            </a>
                            
                            {isVideo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!groupUrl) {
                                    alert('Vui lòng nhập Facebook Group URL ở trên trước khi Auto-Post!');
                                    return;
                                  }
                                  setSelectedVideo(media.url);
                                  // Call handleAutoPost explicitly but simulate event
                                  handleAutoPost({ preventDefault: () => {} } as React.FormEvent);
                                }}
                                disabled={autoPostLoading}
                                className="btn-primary flex-1 sm:flex-none py-2 text-[13px]"
                              >
                                {autoPostLoading && selectedVideo === media.url ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                Auto-Post
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 italic">
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
