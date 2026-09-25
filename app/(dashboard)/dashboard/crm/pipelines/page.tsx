'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  GripVertical, 
  Settings2, 
  Trash2, 
  Edit2,
  RefreshCw,
  X,
  Layers
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
];

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
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

  useEffect(() => {
    fetchPipelines();
  }, []);

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
        toast.error('Không thể tải danh sách phễu bán hàng');
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi tải phễu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) {
      toast.error('Vui lòng nhập tên phễu');
      return;
    }

    const validStages = newStages.filter(s => s.trim() !== '');
    if (validStages.length === 0) {
      toast.error('Vui lòng thêm ít nhất một bước (stage)');
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
        toast.success('Tạo đường ống mới thành công');
        setShowAddModal(false);
        setNewPipelineName('');
        setNewStages(['Khách hàng mới', 'Đang liên hệ', 'Thương lượng', 'Đã gửi báo giá', 'Thành công']);
        fetchPipelines();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi tạo đường ống');
      }
    } catch (err) {
      toast.error('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePipeline = async (pipeline: Pipeline) => {
    if (pipeline.isDefault) {
      toast.error('Không thể xóa đường ống mặc định');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa phễu "${pipeline.name}"?`)) return;

    try {
      const res = await fetch(`/api/crm/pipelines?id=${pipeline.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa phễu bán hàng');
        fetchPipelines();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Xóa phễu thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi xóa phễu');
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
              Phễu bán hàng (Pipelines)
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Cấu hình các quy trình bán hàng và các bước (Stages)</p>
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
              Tạo đường ống mới
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Pipeline List */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-muted)]/10">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input 
                type="text" 
                placeholder="Tìm đường ống..." 
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
              <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Không có đường ống nào</div>
            ) : (
              filteredPipelines.map(pipeline => (
                <div
                  key={pipeline.id}
                  onClick={() => setActivePipeline(pipeline)}
                  className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                    activePipeline?.id === pipeline.id
                      ? 'bg-white dark:bg-[#1a1b1e] border-[var(--color-primary)] shadow-sm'
                      : 'border-transparent hover:bg-[var(--color-muted)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${activePipeline?.id === pipeline.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`}>
                      {pipeline.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {pipeline.isDefault && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">
                          Mặc định
                        </span>
                      )}
                      {!pipeline.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePipeline(pipeline);
                          }}
                          className="p-1 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Xóa phễu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] mt-1 flex justify-between">
                    <span>{pipeline.stages?.length || 0} bước (stages)</span>
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
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Cấu hình các bước (Stages)</h2>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                    Các bước trong quy trình <strong>{activePipeline.name}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {activePipeline.stages?.map((stage, index) => (
                  <div 
                    key={stage.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1b1e] group shadow-sm"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 font-medium text-[var(--color-foreground)]">
                      {stage.name}
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full border border-black/10" 
                      style={{ backgroundColor: stage.color || '#3B82F6' }} 
                      title="Màu sắc đại diện" 
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
              Chọn một đường ống bên trái để xem các bước.
            </div>
          )}
        </div>
      </div>

      {/* Add Pipeline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Tạo đường ống bán hàng mới</h3>
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
                  Tên đường ống *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quy trình Bán sỉ B2B, Tuyển dụng..."
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-[var(--color-foreground)]">
                    Các bước quy trình (Stages)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewStages([...newStages, `Bước ${newStages.length + 1}`])}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm bước
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
                  {submitting ? 'Đang tạo...' : 'Tạo đường ống'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
