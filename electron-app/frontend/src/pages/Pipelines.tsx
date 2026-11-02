import { useState, useEffect } from 'react';
import { 
  Kanban, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Layers, 
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export type Stage = {
  id: string;
  name: string;
  color?: string | null;
  sortOrder: number;
};

export type Pipeline = {
  id: string;
  name: string;
  isDefault?: boolean;
  stages: Stage[];
  _count?: { deals: number };
};

const DEFAULT_STAGES: Stage[] = [
  { id: 'stage_1', name: 'Khách hàng mới', color: '#3B82F6', sortOrder: 1 },
  { id: 'stage_2', name: 'Đang liên hệ', color: '#EAB308', sortOrder: 2 },
  { id: 'stage_3', name: 'Thương lượng', color: '#A855F7', sortOrder: 3 },
  { id: 'stage_4', name: 'Đã gửi báo giá', color: '#6366F1', sortOrder: 4 },
  { id: 'stage_5', name: 'Thành công', color: '#10B981', sortOrder: 5 },
];

const PRESET_COLORS = [
  { name: 'Xanh dương', hex: '#3B82F6' },
  { name: 'Vàng cam', hex: '#EAB308' },
  { name: 'Tím', hex: '#A855F7' },
  { name: 'Chàm', hex: '#6366F1' },
  { name: 'Xanh lục', hex: '#10B981' },
  { name: 'Hồng sen', hex: '#EC4899' },
  { name: 'Đỏ tươi', hex: '#EF4444' },
  { name: 'Xanh lơ', hex: '#06B6D4' },
  { name: 'Cam đất', hex: '#F97316' },
  { name: 'Xám đậm', hex: '#4B5563' },
];

export default function Pipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add stage modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', color: '#3B82F6' });

  // Edit stage modal state (F095)
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    color: string;
    sortOrder: number;
  }>({
    name: '',
    color: '#3B82F6',
    sortOrder: 1,
  });

  // Add pipeline modal state (F094)
  const [isAddPipelineModalOpen, setIsAddPipelineModalOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/pipelines');
      const list: Pipeline[] = res.data?.pipelines || [];
      setPipelines(list);

      if (list.length > 0) {
        const current = activePipeline ? list.find(p => p.id === activePipeline.id) || list[0] : list[0];
        setActivePipeline(current);
        if (current.stages && current.stages.length > 0) {
          const sorted = [...current.stages].sort((a, b) => a.sortOrder - b.sortOrder);
          setStages(sorted);
          try {
            localStorage.setItem('topify_pipeline_stages', JSON.stringify(sorted));
          } catch {}
        }
      } else {
        // Fallback to local cached stages if available
        const cached = localStorage.getItem('topify_pipeline_stages');
        if (cached) {
          try {
            setStages(JSON.parse(cached));
          } catch {}
        }
      }
    } catch {
      // Fallback to local cached stages if network issue
      const cached = localStorage.getItem('topify_pipeline_stages');
      if (cached) {
        try {
          setStages(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  // When active pipeline changes, sync stages
  const handleSelectPipeline = (pipeline: Pipeline) => {
    setActivePipeline(pipeline);
    if (pipeline.stages && pipeline.stages.length > 0) {
      const sorted = [...pipeline.stages].sort((a, b) => a.sortOrder - b.sortOrder);
      setStages(sorted);
    } else {
      setStages([]);
    }
  };

  // Open edit modal for a stage
  const handleOpenEdit = (stage: Stage) => {
    setEditingStage(stage);
    setEditForm({
      name: stage.name,
      color: stage.color || '#3B82F6',
      sortOrder: stage.sortOrder || 1,
    });
  };

  // Save edited stage
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editForm.name.trim()) return;

    setSaving(true);
    try {
      // Calculate updated stages array
      const oldSort = editingStage.sortOrder;
      const newSort = Number(editForm.sortOrder);

      let updatedStages = stages.map(s => {
        if (s.id === editingStage.id) {
          return {
            ...s,
            name: editForm.name.trim(),
            color: editForm.color,
            sortOrder: newSort,
          };
        }
        return s;
      });

      // If sortOrder changed, re-sequence other stages
      if (oldSort !== newSort) {
        updatedStages = updatedStages
          .sort((a, b) => {
            if (a.id === editingStage.id) return newSort - 0.5; // place it right where it belongs
            return a.sortOrder - b.sortOrder;
          })
          .map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
      } else {
        updatedStages.sort((a, b) => a.sortOrder - b.sortOrder);
      }

      setStages(updatedStages);

      // Persist to backend
      const res = await api.patch('/crm/pipelines', {
        id: activePipeline?.id,
        stages: updatedStages.map((s, idx) => ({
          id: s.id.startsWith('stage_') ? undefined : s.id,
          name: s.name,
          color: s.color || '#3B82F6',
          sortOrder: idx + 1,
        })),
      });

      if (res.data) {
        setActivePipeline(res.data);
        if (res.data.stages && res.data.stages.length > 0) {
          const sorted = [...res.data.stages].sort((a, b) => a.sortOrder - b.sortOrder);
          setStages(sorted);
          try {
            localStorage.setItem('topify_pipeline_stages', JSON.stringify(sorted));
          } catch {}
        }
      }

      toast.success(`Đã cập nhật giai đoạn "${editForm.name}" thành công!`);
      setEditingStage(null);
    } catch (err: any) {
      toast.error('Không thể lưu giai đoạn: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Quick reorder stage up or down
  const handleQuickReorder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stages.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...stages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedWithOrder = reordered.map((s, idx) => ({
      ...s,
      sortOrder: idx + 1,
    }));

    setStages(updatedWithOrder);
    try {
      localStorage.setItem('topify_pipeline_stages', JSON.stringify(updatedWithOrder));
    } catch {}

    try {
      const res = await api.patch('/crm/pipelines', {
        id: activePipeline?.id,
        stages: updatedWithOrder.map((s, idx) => ({
          id: s.id.startsWith('stage_') ? undefined : s.id,
          name: s.name,
          color: s.color || '#3B82F6',
          sortOrder: idx + 1,
        })),
      });
      if (res.data?.stages) {
        setActivePipeline(res.data);
        const sorted = [...res.data.stages].sort((a, b) => a.sortOrder - b.sortOrder);
        setStages(sorted);
        try {
          localStorage.setItem('topify_pipeline_stages', JSON.stringify(sorted));
        } catch {}
      }
      toast.success(`Đã đổi vị trí giai đoạn sang thứ tự ${targetIndex + 1}`);
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật thứ tự: ' + (err.response?.data?.error || err.message));
    }
  };

  // Add new stage
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const stageName = newStage.name.trim();
    if (!stageName) return;

    setSaving(true);
    try {
      const item: Stage = {
        id: 'stage_' + Date.now().toString(),
        name: stageName,
        color: newStage.color,
        sortOrder: stages.length + 1,
      };

      const nextStages = [...stages, item];
      setStages(nextStages);
      try {
        localStorage.setItem('topify_pipeline_stages', JSON.stringify(nextStages));
      } catch {}

      const res = await api.patch('/crm/pipelines', {
        id: activePipeline?.id,
        stages: nextStages.map((s, idx) => ({
          id: s.id.startsWith('stage_') ? undefined : s.id,
          name: s.name,
          color: s.color || '#3B82F6',
          sortOrder: idx + 1,
        })),
      });

      if (res.data) {
        setActivePipeline(res.data);
        if (res.data.stages && res.data.stages.length > 0) {
          const sorted = [...res.data.stages].sort((a, b) => a.sortOrder - b.sortOrder);
          setStages(sorted);
          try {
            localStorage.setItem('topify_pipeline_stages', JSON.stringify(sorted));
          } catch {}
        }
      }

      toast.success(`Đã thêm giai đoạn "${stageName}" thành công!`);
      setNewStage({ name: '', color: '#3B82F6' });
      setIsAddModalOpen(false);
    } catch (err: any) {
      // Revert if error
      setStages(stages);
      toast.error('Lỗi khi thêm giai đoạn: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Delete stage
  const handleDelete = async (id: string, name: string) => {
    if (stages.length <= 2) {
      toast.error('Quy trình bán hàng cần tối thiểu 2 giai đoạn');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa giai đoạn "${name}"? Các cơ hội thuộc giai đoạn này có thể bị ảnh hưởng.`)) {
      return;
    }

    setSaving(true);
    try {
      const filtered = stages.filter(s => s.id !== id).map((s, idx) => ({
        ...s,
        sortOrder: idx + 1,
      }));
      setStages(filtered);
      try {
        localStorage.setItem('topify_pipeline_stages', JSON.stringify(filtered));
      } catch {}

      const res = await api.patch('/crm/pipelines', {
        id: activePipeline?.id,
        stages: filtered.map((s, idx) => ({
          id: s.id.startsWith('stage_') ? undefined : s.id,
          name: s.name,
          color: s.color || '#3B82F6',
          sortOrder: idx + 1,
        })),
      });

      if (res.data?.stages) {
        setActivePipeline(res.data);
        const sorted = [...res.data.stages].sort((a, b) => a.sortOrder - b.sortOrder);
        setStages(sorted);
        try {
          localStorage.setItem('topify_pipeline_stages', JSON.stringify(sorted));
        } catch {}
      }

      toast.success(`Đã xóa giai đoạn "${name}" thành công`);
    } catch (err: any) {
      toast.error('Lỗi khi xóa giai đoạn: ' + (err.response?.data?.error || err.message));
      await fetchPipelines();
    } finally {
      setSaving(false);
    }
  };

  // Create new pipeline (F094)
  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    setSaving(true);
    try {
      const res = await api.post('/crm/pipelines', {
        name: newPipelineName.trim(),
        stages: DEFAULT_STAGES.map((s, idx) => ({
          name: s.name,
          color: s.color,
          sortOrder: idx + 1,
        })),
      });

      toast.success(`Đã tạo kênh bán hàng "${newPipelineName}"`);
      setNewPipelineName('');
      setIsAddPipelineModalOpen(false);
      await fetchPipelines();
      if (res.data) {
        handleSelectPipeline(res.data);
      }
    } catch (err: any) {
      toast.error('Không thể tạo quy trình: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Kênh bán hàng & Giai đoạn (Pipelines - F094 | Stages - F095)</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý pipeline bán hàng theo workspace/team (F094) và tùy biến các giai đoạn của quy trình chuyển đổi (F095)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddPipelineModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            <span>+ Tạo Kênh Mới</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Giai Đoạn</span>
          </button>
        </div>
      </div>

      {/* Multiple Pipelines Switcher (if > 1 pipeline) */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">Kênh bán hàng:</span>
          {pipelines.map(pipe => {
            const isSelected = activePipeline?.id === pipe.id;
            return (
              <button
                key={pipe.id}
                onClick={() => handleSelectPipeline(pipe)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{pipe.name}</span>
                {pipe.isDefault && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                    Mặc định
                  </span>
                )}
                {pipe.stages && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                    ({pipe.stages.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pipeline Stage Visual Flow Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Sơ đồ luồng chuyển đổi các giai đoạn ({stages.length} bước)
          </span>
          <span className="text-[11px] text-gray-400">Click vào thẻ giai đoạn bên dưới để chỉnh sửa chi tiết</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(stage)}
                title="Bấm để chỉnh sửa giai đoạn này"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition text-xs font-medium group"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: stage.color || '#3B82F6' }}
                />
                <span className="font-bold text-gray-800 group-hover:text-indigo-600">{stage.name}</span>
                <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
              </button>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Stages List Box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Kanban className="w-4 h-4 text-indigo-600" />
            <span>{activePipeline?.name || 'Quy trình chuyển đổi chuẩn'} ({stages.length} giai đoạn)</span>
          </h2>
          <span className="text-xs text-gray-400">
            Click vào dòng hoặc bấm <span className="font-semibold text-indigo-600">Sửa</span> để chỉnh sửa tên, màu và thứ tự
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              onClick={() => handleOpenEdit(stage)}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-indigo-50/40 hover:border-indigo-300 transition text-xs cursor-pointer group"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                  {idx + 1}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-2xs shrink-0"
                  style={{ backgroundColor: stage.color || '#3B82F6' }}
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-bold text-sm text-gray-900 group-hover:text-indigo-700 transition">
                    {stage.name}
                  </span>
                  <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                    (Bấm để sửa)
                  </span>
                </div>
              </div>

              {/* Right Controls: Reorder, Edit, Delete */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Reorder Arrows */}
                <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs mr-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleQuickReorder(idx, 'up')}
                    title="Chuyển lên trên"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-gray-200" />
                  <button
                    disabled={idx === stages.length - 1}
                    onClick={() => handleQuickReorder(idx, 'down')}
                    title="Chuyển xuống dưới"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[11px] font-mono text-gray-400 hidden sm:inline mr-1">
                  Thứ tự: {stage.sortOrder || idx + 1}
                </span>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(stage)}
                  title="Chỉnh sửa chi tiết giai đoạn"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>

                {/* Delete Button */}
                {stages.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(stage.id, stage.name)}
                    title="Xóa giai đoạn này"
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT STAGE MODAL (F095) */}
      {editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-gray-100 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Chỉnh Sửa Giai Đoạn Bán Hàng</h3>
                  <p className="text-[11px] text-gray-400">Thay đổi tên, màu nhận diện và thứ tự hiển thị</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStage(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Stage Name */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Tên giai đoạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Khách hàng mới, Đang liên hệ, Thương lượng..."
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                />
              </div>

              {/* Stage Color Picker & Presets */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
                  <span>Màu sắc nhận diện</span>
                  <span className="font-mono text-gray-500 font-normal">{editForm.color}</span>
                </label>

                {/* Preset Color Swatches */}
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {PRESET_COLORS.map(c => {
                    const isSelected = editForm.color.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color: c.hex })}
                        title={c.name}
                        className={`h-8 rounded-lg flex items-center justify-center transition border ${
                          isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 border-white shadow-xs' : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer p-0.5 border border-gray-200"
                  />
                  <span className="text-[11px] text-gray-500">Hoặc chọn mã màu tùy biến theo nhận diện thương hiệu</span>
                </div>
              </div>

              {/* Sort Order Selector */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Thứ tự giai đoạn trong quy trình
                </label>
                <select
                  value={editForm.sortOrder}
                  onChange={e => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs font-medium bg-white"
                >
                  {stages.map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Vị trí {i + 1} {i === 0 ? '(Giai đoạn mở đầu)' : i === stages.length - 1 ? '(Giai đoạn kết thúc)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-500 block">Xem trước hiển thị:</span>
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-gray-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {editForm.sortOrder}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-2xs"
                    style={{ backgroundColor: editForm.color }}
                  />
                  <span className="font-bold text-gray-900 text-xs">
                    {editForm.name || 'Tên giai đoạn'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAGE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Thêm Giai Đoạn Bán Hàng</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStage} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên giai đoạn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Gửi hợp đồng mẫu, Khảo sát nhu cầu"
                  value={newStage.name}
                  onChange={e => setNewStage({ ...newStage, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mã màu nhận diện</label>
                {/* Preset colors */}
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewStage({ ...newStage, color: c.hex })}
                      className={`h-7 rounded-lg transition border ${
                        newStage.color.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-indigo-500 border-white' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newStage.color}
                    onChange={e => setNewStage({ ...newStage, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border border-gray-200"
                  />
                  <span className="font-mono text-gray-500">{newStage.color}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Đang thêm...' : 'Thêm Giai Đoạn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PIPELINE MODAL (F094) */}
      {isAddPipelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Tạo Kênh Bán Hàng Mới (F094)</h3>
              <button onClick={() => setIsAddPipelineModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên kênh bán hàng / Pipeline *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quy trình Bán B2B Doanh Nghiệp, Khách Lẻ..."
                  value={newPipelineName}
                  onChange={e => setNewPipelineName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <p className="text-[11px] text-gray-500">
                Kênh mới sẽ được khởi tạo kèm 5 giai đoạn chuyển đổi mặc định và bạn có thể tùy biến các giai đoạn bất kỳ lúc nào.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsAddPipelineModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Đang tạo...' : 'Tạo Kênh'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
