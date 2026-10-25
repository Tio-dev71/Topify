import { useState, useEffect, useRef } from 'react';
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
  Tag
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/media', formData);

      if (res.data) {
        toast.success(`Đã tải lên "${file.name}" thành công!`);
        setAssets(prev => [res.data, ...prev.filter(a => a.id !== res.data.id)]);
        fetchAssets();
      }
    } catch (err: any) {
      console.error('Lỗi khi tải file media lên server:', err);
      const msg = err?.response?.data?.error || err?.message || 'Vui lòng kiểm tra kết nối mạng';
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
            accept="image/*,video/*,audio/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
          >
            <Upload className="w-4 h-4" />
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
                      src={getMediaUrl(asset.storageUrl)}
                      alt={asset.fileName}
                      onError={() => {
                        setFailedImages(prev => ({ ...prev, [asset.id]: true }));
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : isImg ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-2 text-center group-hover:bg-gray-100 transition">
                      <ImageIcon className="w-8 h-8 text-indigo-400 mb-1" />
                      <span className="text-[10px] text-gray-500 font-medium truncate max-w-full px-1">{asset.fileName}</span>
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
              {viewingAsset.mediaType === 'IMAGE' || viewingAsset.mimeType?.startsWith('image/') ? (
                <img
                  src={getMediaUrl(viewingAsset.storageUrl)}
                  alt={viewingAsset.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
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
