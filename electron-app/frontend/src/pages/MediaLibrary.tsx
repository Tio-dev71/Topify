import { useState, useEffect, useRef } from 'react';

// Dynamic converter helper so bundler does not hard-fail if package is absent in production container
const convertHeic = async (options: any) => {
  try {
    // @ts-ignore
    const mod = await import('heic2any');
    const fn = (mod as any).default || mod;
    return await fn(options);
  } catch (err) {
    console.warn('heic2any not available:', err);
    throw err;
  }
};
import { 
  Image as ImageIcon, 
  Video, 
  FileAudio, 
  Search, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  Copy, 
  Download,
  Tag,
  Loader2,
  Play,
  Pencil,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getMediaUrl } from '../lib/axios';

export type MediaAssetItem = {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  tags: string | null;
  createdAt: string;
  createdBy?: { name: string | null; email: string };
};

/**
 * Dedicated Video Card Preview with live metadata and canvas thumbnail extraction
 */
function VideoCardPreview({
  asset,
  customThumbnail,
  onOpenPreview,
}: {
  asset: MediaAssetItem;
  customThumbnail?: string;
  onOpenPreview: () => void;
}) {
  const [extractedThumb, setExtractedThumb] = useState<string | null>(customThumbnail || null);
  const [duration, setDuration] = useState<number | null>(asset.duration || null);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const rawUrl = getMediaUrl(asset.storageUrl);
  // Using #t=0.5 at the end of the URL (after any query parameters) directs HTML5 video to decode frame at 0.5s instead of pure black at 0.0s
  const videoSrc = rawUrl.includes('#') ? rawUrl : `${rawUrl}#t=0.5`;

  useEffect(() => {
    if (customThumbnail) {
      setExtractedThumb(customThumbnail);
      return;
    }

    let isCancelled = false;
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.src = videoSrc;

    const timer = setTimeout(() => {
      // Fallback timer if canvas capture doesn't fire
    }, 4000);

    v.onloadedmetadata = () => {
      if (isCancelled) return;
      if (v.duration && !duration) {
        setDuration(Math.round(v.duration));
      }
      try {
        v.currentTime = Math.min(1.0, Math.max(0.2, (v.duration || 1) / 3));
      } catch {}
    };

    v.onseeked = () => {
      if (isCancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(v.videoWidth || 480, 480);
        const aspect = (v.videoHeight || 270) / (v.videoWidth || 480);
        canvas.height = Math.max(Math.round(canvas.width * aspect), 160);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUri = canvas.toDataURL('image/jpeg', 0.85);
          if (!isCancelled) setExtractedThumb(dataUri);
        }
      } catch {
        // Cross-origin may prevent canvas read; video element displays the frame directly
      }
    };

    v.onerror = () => {
      if (isCancelled) return;
      setHasError(true);
    };

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      v.src = '';
    };
  }, [asset.storageUrl, customThumbnail]);

  const formatShortTime = (sec?: number | null) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onOpenPreview}
      onMouseEnter={() => {
        try {
          videoRef.current?.play().catch(() => {});
        } catch {}
      }}
      onMouseLeave={() => {
        if (videoRef.current) {
          try {
            videoRef.current.pause();
            videoRef.current.currentTime = 0.5;
          } catch {}
        }
      }}
      className="w-full h-full relative flex items-center justify-center bg-gray-950 overflow-hidden cursor-pointer group select-none"
    >
      {extractedThumb ? (
        <img
          src={extractedThumb}
          alt={asset.fileName}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      ) : !hasError ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          preload="metadata"
          muted
          loop
          playsInline
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (el.duration && !duration) setDuration(Math.round(el.duration));
            try {
              el.currentTime = Math.min(1.0, Math.max(0.2, (el.duration || 1) / 3));
            } catch {}
          }}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950 text-gray-300 p-2 text-center">
          <Video className="w-8 h-8 text-indigo-400 mb-1" />
          <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
            {asset.fileName.split('.').pop() || 'VIDEO'}
          </span>
        </div>
      )}

      {/* Subtle vignette gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

      {/* Play Icon Badge in Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-md group-hover:scale-110 group-hover:bg-indigo-600 transition duration-200">
          <Play className="w-4 h-4 fill-white translate-x-0.5 text-white" />
        </div>
      </div>

      {/* Top Left VIDEO Badge */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 shadow-xs pointer-events-none">
        <Video className="w-3 h-3 text-indigo-400" />
        <span>VIDEO</span>
      </div>

      {/* Bottom Right Duration Badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs pointer-events-none">
          {formatShortTime(duration)}
        </div>
      )}

      {/* Hover Eye Overlay */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white pointer-events-none">
        <Eye className="w-6 h-6 drop-shadow-md" />
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<MediaAssetItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [retryUrls, setRetryUrls] = useState<Record<string, string>>({});
  const [heicThumbnails, setHeicThumbnails] = useState<Record<string, string>>({});
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [editingAsset, setEditingAsset] = useState<MediaAssetItem | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [modalImgError, setModalImgError] = useState(false);
  const [isDecodingHeicModal, setIsDecodingHeicModal] = useState(false);
  const [heicModalUrl, setHeicModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHeicAsset = (name?: string, mime?: string) => {
    const ext = (name?.split('.').pop() || '').toLowerCase();
    return ext === 'heic' || ext === 'heif' || (mime ? mime.toLowerCase().includes('heic') || mime.toLowerCase().includes('heif') : false);
  };

  const extractVideoMeta = async (file: File): Promise<{ duration?: number; width?: number; height?: number; thumbnailDataUrl?: string }> => {
    return new Promise((resolve) => {
      try {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        v.playsInline = true;
        const objectUrl = URL.createObjectURL(file);
        v.src = objectUrl;

        const timeout = setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          resolve({});
        }, 5000);

        v.onloadedmetadata = () => {
          v.currentTime = Math.min(1.0, (v.duration || 1) / 2);
        };

        v.onseeked = () => {
          clearTimeout(timeout);
          let thumbnailDataUrl: string | undefined;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(v.videoWidth || 480, 480);
            const aspect = (v.videoHeight || 270) / (v.videoWidth || 480);
            canvas.height = Math.max(Math.round(canvas.width * aspect), 160);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {}
          URL.revokeObjectURL(objectUrl);
          resolve({
            duration: Math.round(v.duration || 0),
            width: v.videoWidth,
            height: v.videoHeight,
            thumbnailDataUrl,
          });
        };

        v.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          resolve({});
        };
      } catch {
        resolve({});
      }
    });
  };

  const fetchAssets = async () => {
    setLoading(true);
    setFailedImages({});
    setRetryUrls({});
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType !== 'ALL') params.append('type', filterType);
      
      const res = await api.get(`/media?${params.toString()}`);
      if (res.data) {
        setAssets(res.data.assets || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thư viện media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, filterType]);

  // Decode thumbnails for existing HEIC images in the library
  useEffect(() => {
    const heicItems = assets.filter(
      (a) => isHeicAsset(a.fileName, a.mimeType) && !heicThumbnails[a.id]
    );
    if (heicItems.length === 0) return;

    heicItems.forEach(async (asset) => {
      try {
        const fullUrl = getMediaUrl(asset.storageUrl);
        const res = await fetch(fullUrl);
        const blob = await res.blob();
        const converted = await convertHeic({ blob, toType: 'image/jpeg', quality: 0.8 });
        const single = Array.isArray(converted) ? converted[0] : converted;
        const url = URL.createObjectURL(single);
        setHeicThumbnails((prev) => ({ ...prev, [asset.id]: url }));
      } catch (e) {
        console.warn('Could not decode HEIC thumbnail:', asset.fileName, e);
      }
    });
  }, [assets]);

  // Handle modal view for HEIC assets
  useEffect(() => {
    setModalImgError(false);
    setHeicModalUrl(null);
    setIsDecodingHeicModal(false);

    if (!viewingAsset) return;

    if (isHeicAsset(viewingAsset.fileName, viewingAsset.mimeType)) {
      if (heicThumbnails[viewingAsset.id]) {
        setHeicModalUrl(heicThumbnails[viewingAsset.id]);
        return;
      }
      setIsDecodingHeicModal(true);
      const fullUrl = getMediaUrl(viewingAsset.storageUrl);
      fetch(fullUrl)
        .then((res) => res.blob())
        .then((blob) => convertHeic({ blob, toType: 'image/jpeg', quality: 0.92 }))
        .then((converted) => {
          const single = Array.isArray(converted) ? converted[0] : converted;
          setHeicModalUrl(URL.createObjectURL(single));
          setIsDecodingHeicModal(false);
        })
        .catch((err) => {
          console.warn('Could not decode HEIC for modal view:', err);
          setIsDecodingHeicModal(false);
        });
    }
  }, [viewingAsset]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileToUpload = file;
    const isHeic = isHeicAsset(file.name, file.type);
    const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|flv|wmv|m4v|3gp)$/i.test(file.name);

    setIsUploading(true);
    let conversionToastId: string | number | undefined;

    if (isHeic) {
      conversionToastId = toast.loading('Đang tự động chuyển đổi ảnh HEIC sang JPEG chất lượng cao...');
      try {
        const convertedBlob = await convertHeic({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.92,
        });
        const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        fileToUpload = new File([singleBlob], newName, { type: 'image/jpeg' });
        if (conversionToastId) toast.dismiss(conversionToastId);
        toast.info(`Đã tối ưu chuyển đổi ảnh: ${newName}`);
      } catch (conversionErr) {
        console.warn('Lỗi chuyển đổi HEIC trên client, gửi tệp gốc lên server xử lý:', conversionErr);
        if (conversionToastId) toast.dismiss(conversionToastId);
      }
    }

    let videoMeta: { duration?: number; width?: number; height?: number; thumbnailDataUrl?: string } = {};
    if (isVid) {
      videoMeta = await extractVideoMeta(fileToUpload);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (videoMeta.duration) formData.append('duration', String(videoMeta.duration));
    if (videoMeta.width) formData.append('width', String(videoMeta.width));
    if (videoMeta.height) formData.append('height', String(videoMeta.height));

    try {
      const res = await api.post('/media', formData);

      if (res.data) {
        toast.success(`Đã tải lên "${fileToUpload.name}" thành công!`);
        if (res.data.id && videoMeta.thumbnailDataUrl) {
          setVideoThumbnails(prev => ({ ...prev, [res.data.id]: videoMeta.thumbnailDataUrl! }));
        }
        setAssets(prev => [res.data, ...prev.filter(a => a.id !== res.data.id)]);
        fetchAssets();
      }
    } catch (err: any) {
      console.error('Lỗi khi tải file media lên server:', err);
      const serverErr = err?.response?.data?.error;
      const msg = serverErr || (err?.message === 'Network Error' ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.' : err?.message) || 'Vui lòng kiểm tra kết nối mạng';
      toast.error(`Lỗi khi tải file lên server: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveRename = async () => {
    if (!editingAsset || !editFileName.trim()) return;
    setIsRenaming(true);
    try {
      const res = await api.patch(`/media/${editingAsset.id}`, {
        fileName: editFileName.trim(),
      });
      if (res.data) {
        setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, fileName: res.data.fileName || editFileName.trim() } : a));
        toast.success('Đã đổi tên tệp thành công!');
        setEditingAsset(null);
      }
    } catch (err: any) {
      toast.error('Lỗi khi đổi tên tệp: ' + (err?.response?.data?.error || err.message));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá file "${name}"?`)) return;
    try {
      await api.delete(`/media/${id}`);
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Đã xoá file thành công');
      if (viewingAsset?.id === id) setViewingAsset(null);
    } catch {
      toast.error('Lỗi khi xoá file');
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = getMediaUrl(url);
    navigator.clipboard.writeText(fullUrl);
    toast.success('Đã sao chép link file vào bộ nhớ tạm');
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thư viện Media & Tệp tin (F114)</h1>
          <p className="text-sm text-gray-500 mt-1">Lưu trữ tập trung video, ảnh và tài nguyên sáng tạo đa kênh cho toàn bộ Workspace</p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.heic,.heif,.HEIC,.HEIF,.mp4,.mov,.webm,.mkv,.avi,.flv,.wmv,.m4v,.3gp,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp3,.wav,.ogg,.m4a"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isUploading ? 'Đang tải lên...' : 'Tải File Mới'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType('IMAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'IMAGE' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
          >
            Hình ảnh
          </button>
          <button
            onClick={() => setFilterType('VIDEO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'VIDEO' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
          >
            Video
          </button>
          <button
            onClick={() => setFilterType('AUDIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'AUDIO' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
          >
            Âm thanh
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên file hoặc tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Đang tải tài nguyên Media...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-900 font-bold text-sm">Chưa có tệp media nào</p>
          <p className="text-xs text-gray-500">Tải lên hình ảnh hoặc video để sử dụng ngay trong các bài đăng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => {
            const isImg = asset.mediaType === 'IMAGE' || asset.mimeType?.startsWith('image/');
            const isVid = asset.mediaType === 'VIDEO' || asset.mimeType?.startsWith('video/');

            return (
              <div
                key={asset.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition group flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setViewingAsset(asset)}
                  className="aspect-square bg-gray-50 relative flex items-center justify-center cursor-pointer overflow-hidden border-b border-gray-100"
                >
                  {isImg && !failedImages[asset.id] ? (
                    <img
                      src={heicThumbnails[asset.id] || retryUrls[asset.id] || getMediaUrl(asset.storageUrl)}
                      alt={asset.fileName}
                      onError={() => {
                        const originalUrl = getMediaUrl(asset.storageUrl);
                        if (!retryUrls[asset.id]) {
                          const separator = originalUrl.includes('?') ? '&' : '?';
                          setRetryUrls(prev => ({ ...prev, [asset.id]: `${originalUrl}${separator}t=${Date.now()}` }));
                        } else {
                          setFailedImages(prev => ({ ...prev, [asset.id]: true }));
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : isImg ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-2 text-center group-hover:bg-gray-100 transition relative">
                      <ImageIcon className="w-8 h-8 text-indigo-400 mb-1" />
                      <span className="text-[10px] text-gray-600 font-semibold truncate max-w-full px-1">{asset.fileName}</span>
                      {isHeicAsset(asset.fileName, asset.mimeType) && (
                        <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Ảnh Apple HEIC
                        </span>
                      )}
                    </div>
                  ) : isVid ? (
                    <VideoCardPreview
                      asset={asset}
                      customThumbnail={videoThumbnails[asset.id]}
                      onOpenPreview={() => setViewingAsset(asset)}
                    />
                  ) : (
                    <FileAudio className="w-8 h-8 text-indigo-500" />
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white pointer-events-none">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-3 space-y-1.5 text-xs">
                  <p className="font-bold text-gray-900 truncate" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{formatFileSize(asset.size)}</span>
                    <span>{new Date(asset.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyUrl(asset.storageUrl)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                      title="Sao chép link"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Link</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAsset(asset);
                          setEditFileName(asset.fileName);
                        }}
                        className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100 transition cursor-pointer"
                        title="Đổi tên tệp"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, asset.fileName);
                        }}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-gray-100 transition cursor-pointer"
                        title="Xóa tệp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Đổi tên tệp Media</h3>
              <button
                onClick={() => setEditingAsset(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tên hiển thị mới</label>
              <input
                type="text"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 font-medium text-gray-900"
                placeholder="Nhập tên tệp..."
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1">Đổi tên tệp giúp bạn dễ tìm kiếm và tổ chức tài nguyên trong Workspace.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRename}
                disabled={isRenaming || !editFileName.trim()}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Preview Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 truncate pr-4">{viewingAsset.fileName}</h3>
              <button onClick={() => setViewingAsset(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-950">
              {isDecodingHeicModal ? (
                <div className="p-12 text-center text-white space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs text-gray-300">Đang giải mã hiển thị ảnh định dạng Apple HEIC...</p>
                </div>
              ) : viewingAsset.mediaType === 'IMAGE' || viewingAsset.mimeType?.startsWith('image/') ? (
                !modalImgError ? (
                  <img
                    src={heicModalUrl || heicThumbnails[viewingAsset.id] || retryUrls[viewingAsset.id] || getMediaUrl(viewingAsset.storageUrl)}
                    alt={viewingAsset.fileName}
                    onError={() => setModalImgError(true)}
                    className="max-h-[60vh] max-w-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="p-8 text-center text-white space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white mb-1">
                        {isHeicAsset(viewingAsset.fileName, viewingAsset.mimeType)
                          ? 'Định dạng ảnh Apple HEIC'
                          : 'Không thể xem trước tệp hình ảnh'}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {isHeicAsset(viewingAsset.fileName, viewingAsset.mimeType)
                          ? 'Trình duyệt máy tính không hỗ trợ xem trực tiếp ảnh HEIC này. Bạn có thể bấm nút "Tải Về" bên dưới để mở bằng trình xem ảnh trên máy tính.'
                          : 'Định dạng hình ảnh này không thể hiển thị trực tiếp. Vui lòng tải về máy để xem.'}
                      </p>
                    </div>
                    <a
                      href={getMediaUrl(viewingAsset.storageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      download={viewingAsset.fileName}
                      className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về xem trên máy</span>
                    </a>
                  </div>
                )
              ) : viewingAsset.mediaType === 'VIDEO' || viewingAsset.mimeType?.startsWith('video/') ? (
                <video
                  src={getMediaUrl(viewingAsset.storageUrl)}
                  controls
                  className="max-h-[60vh] max-w-full rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-white">
                  <FileAudio className="w-16 h-16 mx-auto mb-2 text-indigo-400" />
                  <p>{viewingAsset.fileName}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50">
              <div className="font-mono text-gray-500 truncate max-w-md">
                {getMediaUrl(viewingAsset.storageUrl)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(viewingAsset.storageUrl)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
                <a
                  href={getMediaUrl(viewingAsset.storageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  download={viewingAsset.fileName}
                  className="btn-primary px-4 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
