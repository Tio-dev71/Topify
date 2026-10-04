'use client';

import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Video, FileAudio, FileText, Search, Upload, Plus, Trash2, Edit2, Tag, Loader2, Eye, X, Copy, Check, ExternalLink, Download } from 'lucide-react';
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
  const [viewingAsset, setViewingAsset] = useState<MediaAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [editForm, setEditForm] = useState({ fileName: '', tags: '' });
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleOpenEdit = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setEditForm({
      fileName: asset.fileName,
      tags: asset.tags || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!editForm.fileName.trim()) {
      alert('Vui lòng nhập tên file');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/media/${editingAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: editForm.fileName.trim(),
          tags: editForm.tags.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAssets(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        if (viewingAsset?.id === updated.id) {
          setViewingAsset(prev => prev ? { ...prev, ...updated } : null);
        }
        setEditingAsset(null);
        alert('Đã cập nhật thông tin media!');
      } else {
        alert('Cập nhật thất bại');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá file này?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== id));
        if (viewingAsset?.id === id) setViewingAsset(null);
        if (editingAsset?.id === id) setEditingAsset(null);
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
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Thư viện phương tiện (Media)</h1>
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
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'IMAGE', label: 'Hình ảnh' },
            { key: 'VIDEO', label: 'Video' },
            { key: 'AUDIO', label: 'Âm thanh' },
            { key: 'DOCUMENT', label: 'Tài liệu' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFilterType(item.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterType === item.key
                  ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {item.label}
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
            <div key={asset.id} className="group relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[#5B3DF5]/50 hover:shadow-lg transition-all flex flex-col justify-between">
              <div 
                onClick={() => setViewingAsset(asset)}
                className="aspect-square bg-[var(--color-muted)] relative cursor-pointer overflow-hidden"
              >
                {asset.mediaType === 'IMAGE' ? (
                  // Using img tag for generic URLs instead of next/image to avoid domain config errors
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.storageUrl} alt={asset.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                >
                  <button 
                    onClick={() => setViewingAsset(asset)}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur-sm text-white transition-colors" 
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(asset)}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur-sm text-white transition-colors" 
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(asset.id)} 
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg backdrop-blur-sm text-white transition-colors" 
                    title="Xóa file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p 
                  onClick={() => setViewingAsset(asset)}
                  className="text-sm font-medium text-[var(--color-foreground)] truncate cursor-pointer hover:text-[#5B3DF5] transition-colors" 
                  title={asset.fileName}
                >
                  {asset.fileName}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[var(--color-muted-foreground)]">{(asset.size / 1024 / 1024).toFixed(1)} MB</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{new Date(asset.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                {asset.tags && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {asset.tags.split(',').map((t, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-[var(--color-muted-foreground)] truncate max-w-[120px]">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Media Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#5B3DF5] bg-[#5B3DF5]/10 px-2.5 py-0.5 rounded-lg border border-[#5B3DF5]/20 inline-block mb-1">
                  {viewingAsset.mediaType}
                </span>
                <h3 className="text-lg font-bold text-[var(--color-foreground)] truncate max-w-md" title={viewingAsset.fileName}>
                  {viewingAsset.fileName}
                </h3>
              </div>
              <button 
                onClick={() => setViewingAsset(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Preview Box */}
            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-[var(--color-border)] flex items-center justify-center min-h-[240px] max-h-[400px]">
              {viewingAsset.mediaType === 'IMAGE' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={viewingAsset.storageUrl} 
                  alt={viewingAsset.fileName} 
                  className="max-h-[380px] w-auto max-w-full object-contain mx-auto" 
                />
              ) : viewingAsset.mediaType === 'VIDEO' ? (
                <video 
                  src={viewingAsset.storageUrl} 
                  controls 
                  className="max-h-[380px] w-full"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-[var(--color-muted-foreground)] mx-auto" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{viewingAsset.fileName}</p>
                  <a
                    href={viewingAsset.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#5B3DF5] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở trong tab mới
                  </a>
                </div>
              )}
            </div>

            {/* Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Dung lượng:</span>
                <span className="font-semibold text-[var(--color-foreground)]">{(viewingAsset.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Định dạng (MIME):</span>
                <span className="font-semibold text-[var(--color-foreground)] truncate block">{viewingAsset.mimeType}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] col-span-2 sm:col-span-1">
                <span className="text-[var(--color-muted-foreground)] block mb-0.5">Ngày tải lên:</span>
                <span className="font-semibold text-[var(--color-foreground)]">{new Date(viewingAsset.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Tags Display */}
            {viewingAsset.tags && (
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Tags phân loại:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingAsset.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-[#5B3DF5]/10 text-[#5B3DF5] font-medium border border-[#5B3DF5]/20">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Storage URL Copy */}
            <div>
              <span className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1">Đường dẫn CDN / Storage:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={viewingAsset.storageUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-muted)]/50 border border-[var(--color-border)] text-xs text-[var(--color-foreground)] font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingAsset.storageUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 text-[var(--color-foreground)] text-xs font-medium flex items-center gap-1.5 transition-colors border border-[var(--color-border)]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  const id = viewingAsset.id;
                  handleDelete(id);
                }}
                className="px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa file
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingAsset(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const a = viewingAsset;
                    handleOpenEdit(a);
                  }}
                  className="px-4 py-2 bg-[#5B3DF5] hover:bg-[#5B3DF5]/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#5B3DF5]" />
                Chỉnh sửa thông tin Media
              </h3>
              <button 
                onClick={() => setEditingAsset(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên file *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fileName}
                  onChange={e => setEditForm({ ...editForm, fileName: e.target.value })}
                  placeholder="ten-file.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tags phân loại (ngăn cách bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="banner, khuyến mãi, hè 2026..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Ví dụ: banner, sale, logo</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-[#5B3DF5] hover:bg-[#5B3DF5]/90 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
