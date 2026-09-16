'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Key, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

type Keyword = {
  id: string;
  keyword: string;
  volume: number;
  trend: string | null;
  createdAt: string;
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keywords');
      if (res.ok) {
        const data = await res.json();
        setKeywords(data.keywords || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách từ khóa');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword })
      });

      if (res.ok) {
        toast.success('Thêm từ khóa thành công');
        setShowAddModal(false);
        setNewKeyword('');
        fetchKeywords();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi thêm từ khóa');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu từ khóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa từ khóa này?')) return;
    
    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa từ khóa');
        fetchKeywords();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  const renderTrendIcon = (trend: string | null) => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Key className="w-6 h-6 text-[#5B3DF5]" />
            Theo Dõi Từ Khóa
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Theo dõi xu hướng tìm kiếm và độ hot của các từ khóa liên quan</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchKeywords} className="p-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Thêm Từ Khóa
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Từ Khóa</th>
                <th className="px-6 py-4 font-semibold">Khối Lượng Tìm Kiếm</th>
                <th className="px-6 py-4 font-semibold">Xu Hướng</th>
                <th className="px-6 py-4 font-semibold">Ngày Thêm</th>
                <th className="px-6 py-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && keywords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-muted-foreground)]">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-muted-foreground)]">
                    Chưa có từ khóa nào được theo dõi.
                  </td>
                </tr>
              ) : (
                keywords.map(kw => (
                  <tr key={kw.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                      {kw.keyword}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                      {kw.volume > 0 ? kw.volume.toLocaleString() : 'Đang thu thập'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {renderTrendIcon(kw.trend)}
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                          {kw.trend === 'UP' ? 'Tăng' : kw.trend === 'DOWN' ? 'Giảm' : 'Ổn định'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                      {new Date(kw.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteKeyword(kw.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa từ khóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold">Thêm Từ Khóa Theo Dõi</h3>
            </div>
            
            <form onSubmit={handleAddKeyword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Từ khóa *</label>
                <input 
                  type="text" 
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  placeholder="VD: xu hướng marketing 2026"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                  required
                />
                <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                  Hệ thống sẽ tự động quét khối lượng và xu hướng tìm kiếm cho từ khóa này.
                </p>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm Từ Khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
