'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  X, 
  Layers,
  Eye,
  Edit2,
  Check,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

type Stage = {
  id: string;
  name: string;
  color?: string | null;
  sortOrder: number;
};

type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
  _count?: { deals: number };
};

const DEFAULT_STAGE_COLORS = [
  '#3B82F6', // Blue
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#6366F1', // Indigo
  '#10B981', // Green
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View & Edit Modal state
  const [viewingPipeline, setViewingPipeline] = useState<Pipeline | null>(null);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editFormData, setEditFormData] = useState<{
    id: string;
    name: string;
    isDefault: boolean;
    stages: { id?: string; name: string; color: string; sortOrder: number }[];
  }>({
    id: '',
    name: '',
    isDefault: false,
    stages: [],
  });

  // Modal state for adding new pipeline
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStages, setNewStages] = useState<string[]>([
    'Khách hàng mới',
    'Đang liên hệ',
    'Thương lượng',
    'Đã gửi báo giá',
    'Thành công'
  ]);

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/pipelines');
      if (res.ok) {
        const data = await res.json();
        const list: Pipeline[] = data.pipelines || [];
        setPipelines(list);
        if (list.length > 0) {
          // Keep current active or set to first
          setActivePipeline(prev => list.find(p => p.id === prev?.id) || list[0]);
        } else {
          setActivePipeline(null);
        }
      } else {
        toast.error('Không thể tải danh sách quy trình bán hàng');
      }
    } catch (_err) {
      toast.error('Lỗi kết nối khi tải quy trình bán hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/crm/pipelines')
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        if (!ignore) {
          const list: Pipeline[] = data.pipelines || [];
          setPipelines(list);
          if (list.length > 0) {
            setActivePipeline(list[0]);
          }
          setLoading(false);
        }
      })
      .catch(_err => {
        if (!ignore) {
          toast.error('Không thể tải danh sách quy trình bán hàng');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenView = (pipeline: Pipeline) => {
    setViewingPipeline(pipeline);
  };

  const handleOpenEdit = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setEditFormData({
      id: pipeline.id,
      name: pipeline.name,
      isDefault: pipeline.isDefault,
      stages: (pipeline.stages || []).map((s, i) => ({
        id: s.id,
        name: s.name,
        color: s.color || DEFAULT_STAGE_COLORS[i % DEFAULT_STAGE_COLORS.length],
        sortOrder: s.sortOrder ?? i,
      })),
    });
  };

  const handleUpdatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.name.trim()) {
      toast.error('Vui lòng nhập tên quy trình');
      return;
    }
    const validStages = editFormData.stages.filter(s => s.name.trim() !== '');
    if (validStages.length === 0) {
      toast.error('Vui lòng thêm ít nhất một giai đoạn (stage)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/crm/pipelines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editFormData.id,
          name: editFormData.name.trim(),
          isDefault: editFormData.isDefault,
          stages: validStages.map((s, i) => ({
            id: s.id,
            name: s.name.trim(),
            color: s.color,
            sortOrder: i,
          })),
        }),
      });

      if (res.ok) {
        toast.success('Cập nhật quy trình bán hàng thành công');
        setEditingPipeline(null);
        await fetchPipelines();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi máy chủ khi cập nhật quy trình');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) {
      toast.error('Vui lòng nhập tên quy trình');
      return;
    }

    const validStages = newStages.filter(s => s.trim() !== '');
    if (validStages.length === 0) {
      toast.error('Vui lòng thêm ít nhất một giai đoạn (stage)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/crm/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPipelineName.trim(),
          stages: validStages.map((name, i) => ({
            name,
            sortOrder: i,
            color: DEFAULT_STAGE_COLORS[i % DEFAULT_STAGE_COLORS.length]
          }))
        })
      });

      if (res.ok) {
        toast.success('Tạo quy trình bán hàng mới thành công');
        setShowAddModal(false);
        setNewPipelineName('');
        setNewStages(['Khách hàng mới', 'Đang liên hệ', 'Thương lượng', 'Đã gửi báo giá', 'Thành công']);
        fetchPipelines();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi tạo quy trình bán hàng');
      }
    } catch (_err) {
      toast.error('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePipeline = async (pipeline: Pipeline) => {
    if (pipeline.isDefault) {
      toast.error('Không thể xóa quy trình mặc định');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa quy trình "${pipeline.name}"?`)) return;

    try {
      const res = await fetch(`/api/crm/pipelines?id=${pipeline.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa quy trình bán hàng');
        fetchPipelines();
        if (viewingPipeline?.id === pipeline.id) setViewingPipeline(null);
        if (editingPipeline?.id === pipeline.id) setEditingPipeline(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Xóa quy trình thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi khi xóa quy trình');
    }
  };

  const filteredPipelines = pipelines.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex-none p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#5B3DF5]" />
              Quy trình bán hàng (Pipelines)
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Cấu hình các quy trình bán hàng và các giai đoạn chuyển đổi (Stages)</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchPipelines}
              className="p-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Tạo quy trình mới
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Pipeline List */}
        <div className="w-84 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-muted)]/10">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input 
                type="text" 
                placeholder="Tìm kiếm quy trình..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading && pipelines.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Đang tải...</div>
            ) : filteredPipelines.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Chưa có quy trình bán hàng nào</div>
            ) : (
              filteredPipelines.map(pipeline => (
                <div
                  key={pipeline.id}
                  onClick={() => setActivePipeline(pipeline)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border cursor-pointer group ${
                    activePipeline?.id === pipeline.id
                      ? 'bg-white dark:bg-[#1a1b1e] border-[var(--color-primary)] shadow-sm'
                      : 'border-transparent hover:bg-[var(--color-muted)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold text-sm truncate ${activePipeline?.id === pipeline.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`}>
                      {pipeline.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {pipeline.isDefault && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">
                          Mặc định
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenView(pipeline);
                          }}
                          className="p-1 rounded-lg text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-muted)] transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(pipeline);
                          }}
                          className="p-1 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                          title="Chỉnh sửa quy trình"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!pipeline.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePipeline(pipeline);
                            }}
                            className="p-1 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Xóa quy trình"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] mt-2 flex justify-between">
                    <span>{pipeline.stages?.length || 0} giai đoạn</span>
                    {pipeline._count?.deals !== undefined && (
                      <span>{pipeline._count.deals} giao dịch</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Edit Stages */}
        <div className="flex-1 overflow-y-auto p-6">
          {activePipeline ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-[var(--color-foreground)]">{activePipeline.name}</h2>
                    {activePipeline.isDefault && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Gồm {activePipeline.stages?.length || 0} giai đoạn chuyển đổi &bull; {activePipeline._count?.deals || 0} giao dịch liên kết
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenView(activePipeline)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm font-medium text-[var(--color-foreground)] transition-colors"
                  >
                    <Eye className="w-4 h-4 text-[#5B3DF5]" />
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => handleOpenEdit(activePipeline)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa quy trình
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[var(--color-foreground)]">Các giai đoạn quy trình (Stages)</h3>
                  <button
                    onClick={() => handleOpenEdit(activePipeline)}
                    className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm hoặc đổi thứ tự
                  </button>
                </div>

                <div className="space-y-3">
                  {activePipeline.stages?.map((stage, index) => (
                    <div 
                      key={stage.id}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] group shadow-sm hover:border-[var(--color-primary)]/40 transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 font-semibold text-[var(--color-foreground)] text-sm">
                        {stage.name}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--color-muted-foreground)] font-mono">
                          Thứ tự: {index + 1}
                        </span>
                        <div 
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner" 
                          style={{ backgroundColor: stage.color || '#3B82F6' }} 
                          title="Màu sắc đại diện" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
              Chọn một quy trình bên trái để xem các giai đoạn.
            </div>
          )}
        </div>
      </div>

      {/* View Pipeline Modal */}
      {viewingPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#5B3DF5]/10 text-[#5B3DF5] rounded-2xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">Chi tiết Quy trình</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Mã quy trình: {viewingPipeline.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPipeline(null)}
                className="p-2 rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Tên quy trình
                  </span>
                  {viewingPipeline.isDefault && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">
                      Quy trình mặc định
                    </span>
                  )}
                </div>
                <h4 className="text-xl font-bold text-[var(--color-foreground)]">{viewingPipeline.name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <div>
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Số giai đoạn</span>
                  <span className="text-base font-bold text-[var(--color-foreground)]">
                    {viewingPipeline.stages?.length || 0} stages
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Giao dịch gắn liền</span>
                  <span className="text-base font-bold text-[var(--color-foreground)]">
                    {viewingPipeline._count?.deals || 0} deals
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] block mb-3">
                  Danh sách giai đoạn (Phễu bán hàng)
                </span>
                <div className="space-y-2">
                  {(viewingPipeline.stages || []).map((stage, idx) => (
                    <div 
                      key={stage.id} 
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-sm font-semibold text-[var(--color-foreground)]">
                        {stage.name}
                      </span>
                      <div 
                        className="w-4 h-4 rounded-full border border-black/10" 
                        style={{ backgroundColor: stage.color || '#3B82F6' }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingPipeline(null)}
                className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingPipeline;
                  setViewingPipeline(null);
                  handleOpenEdit(target);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa quy trình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pipeline Modal */}
      {editingPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">Chỉnh sửa Quy trình bán hàng</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Cập nhật tên và các giai đoạn phễu</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPipeline(null)}
                className="p-2 rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePipeline} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1.5">
                  Tên quy trình bán hàng *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Ví dụ: Bán sỉ B2B, Bán lẻ D2C..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <input
                  type="checkbox"
                  id="editIsDefault"
                  checked={editFormData.isDefault}
                  onChange={(e) => setEditFormData({ ...editFormData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border)]"
                />
                <label htmlFor="editIsDefault" className="text-sm font-medium text-[var(--color-foreground)] cursor-pointer select-none">
                  Đặt làm quy trình mặc định của hệ thống
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-[var(--color-foreground)]">
                    Các giai đoạn (Stages)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextColor = DEFAULT_STAGE_COLORS[editFormData.stages.length % DEFAULT_STAGE_COLORS.length];
                      setEditFormData({
                        ...editFormData,
                        stages: [
                          ...editFormData.stages,
                          {
                            name: `Giai đoạn ${editFormData.stages.length + 1}`,
                            color: nextColor,
                            sortOrder: editFormData.stages.length,
                          }
                        ]
                      });
                    }}
                    className="text-xs text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm giai đoạn
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {editFormData.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
                      <span className="text-xs font-bold text-[var(--color-muted-foreground)] w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={stage.name}
                        onChange={(e) => {
                          const updated = [...editFormData.stages];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setEditFormData({ ...editFormData, stages: updated });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                      
                      {/* Color Selector */}
                      <div className="flex items-center gap-1">
                        {DEFAULT_STAGE_COLORS.slice(0, 5).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              const updated = [...editFormData.stages];
                              updated[idx] = { ...updated[idx], color: c };
                              setEditFormData({ ...editFormData, stages: updated });
                            }}
                            className={`w-4 h-4 rounded-full transition-transform ${stage.color === c ? 'scale-125 ring-2 ring-offset-1 ring-[var(--color-primary)]' : 'opacity-70 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      {/* Move Up / Down */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const updated = [...editFormData.stages];
                            const temp = updated[idx - 1];
                            updated[idx - 1] = updated[idx];
                            updated[idx] = temp;
                            setEditFormData({ ...editFormData, stages: updated });
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editFormData.stages.length - 1}
                          onClick={() => {
                            if (idx === editFormData.stages.length - 1) return;
                            const updated = [...editFormData.stages];
                            const temp = updated[idx + 1];
                            updated[idx + 1] = updated[idx];
                            updated[idx] = temp;
                            setEditFormData({ ...editFormData, stages: updated });
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {editFormData.stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData({
                              ...editFormData,
                              stages: editFormData.stages.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-red-400 hover:text-red-500 p-1"
                          title="Xóa giai đoạn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingPipeline(null)}
                  disabled={submitting}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pipeline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Tạo quy trình bán hàng mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên quy trình bán hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quy trình Bán sỉ B2B, Bán lẻ D2C, Tuyển dụng..."
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-[var(--color-foreground)]">
                    Các giai đoạn quy trình (Stages)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewStages([...newStages, `Giai đoạn ${newStages.length + 1}`])}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm giai đoạn
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newStages.map((stageName, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-muted-foreground)] w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={stageName}
                        onChange={(e) => {
                          const updated = [...newStages];
                          updated[idx] = e.target.value;
                          setNewStages(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                      {newStages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewStages(newStages.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo quy trình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
