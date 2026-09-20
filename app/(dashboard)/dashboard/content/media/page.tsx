'use client';

import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Video, FileAudio, FileText, Search, Upload, Plus, Trash2, Edit2, Tag, Loader2 } from 'lucide-react';
import Image from 'next/image';

type MediaAsset = {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType: string;
  size: number;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  tags: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string };
};

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType !== 'ALL') params.append('type', filterType);
      
      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, filterType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá file này?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Lỗi khi xoá');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newAsset = await res.json();
        setAssets(prev => [newAsset, ...prev]);
      } else {
        if (res.status === 413) {
          alert('Lỗi khi tải lên: File quá lớn (vượt quá giới hạn của server).');
          return;
        }
        let errorMsg = 'Unknown error';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = await res.text();
        }
        alert(`Lỗi khi tải lên: ${errorMsg}`);
      }
    } catch (err: any) {
      alert(`Lỗi khi tải lên: ${err.message || 'Lỗi kết nối'}`);
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Media Library</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý hình ảnh, video và tài liệu</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
        
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? 'Đang tải lên...' : 'Tải lên'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Tìm kiếm file, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {['ALL', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {type === 'ALL' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#5B3DF5]/30 border-t-[#5B3DF5] rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]">
          <ImageIcon className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--color-foreground)] font-medium">Chưa có media nào</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Tải lên hình ảnh hoặc video đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="group relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[#5B3DF5]/50 hover:shadow-lg transition-all">
              <div className="aspect-square bg-[var(--color-muted)] relative">
                {asset.mediaType === 'IMAGE' ? (
                  // Using img tag for generic URLs instead of next/image to avoid domain config errors
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.storageUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                ) : asset.mediaType === 'VIDEO' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-[var(--color-muted-foreground)]" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-[var(--color-muted-foreground)]" />
                  </div>
                )}
                
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur-sm text-white transition-colors" title="Edit tags">
                    <Tag className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg backdrop-blur-sm text-white transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate" title={asset.fileName}>{asset.fileName}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[var(--color-muted-foreground)]">{(asset.size / 1024 / 1024).toFixed(1)} MB</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{new Date(asset.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
