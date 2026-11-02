import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import heic2any from 'heic2any';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getMediaUrl } from '../lib/axios';

export type MediaAssetItem = {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType: string;
  size: number;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  tags: string | null;
  createdAt: string;
  createdBy?: { name: string | null; email: string };
};

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
  const [modalImgError, setModalImgError] = useState(false);
  const [isDecodingHeicModal, setIsDecodingHeicModal] = useState(false);
  const [heicModalUrl, setHeicModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHeicAsset = (name?: string, mime?: string) => {
    const ext = (name?.split('.').pop() || '').toLowerCase();
    return ext === 'heic' || ext === 'heif' || (mime ? mime.toLowerCase().includes('heic') || mime.toLowerCase().includes('heif') : false);
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
        const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 });
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
        .then((blob) => heic2any({ blob, toType: 'image/jpeg', quality: 0.92 }))
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

    setIsUploading(true);
    let conversionToastId: string | number | undefined;

    if (isHeic) {
      conversionToastId = toast.loading('Đang tự động chuyển đổi ảnh HEIC sang JPEG chất lượng cao...');
      try {
        const convertedBlob = await heic2any({
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

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const res = await api.post('/media', formData);

      if (res.data) {
        toast.success(`Đã tải lên "${fileToUpload.name}" thành công!`);
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
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white group-hover:bg-gray-800 transition">
                      <Video className="w-8 h-8 text-indigo-400" />
                    </div>
                  ) : (
                    <FileAudio className="w-8 h-8 text-indigo-500" />
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white">
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
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      title="Sao chép link"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Link</span>
                    </button>

                    <button
                      onClick={() => handleDelete(asset.id, asset.fileName)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
