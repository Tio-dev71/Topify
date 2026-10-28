import { useState, useEffect } from 'react';
import { Kanban, Plus, Trash2, Edit2, X, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

type Stage = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

const DEFAULT_STAGES: Stage[] = [
  { id: 'stage_1', name: 'Tiếp cận ban đầu', color: '#6366F1', sortOrder: 1 },
  { id: 'stage_2', name: 'Tư vấn & Báo giá', color: '#3B82F6', sortOrder: 2 },
  { id: 'stage_3', name: 'Đàm phán chốt hợp đồng', color: '#F59E0B', sortOrder: 3 },
  { id: 'stage_4', name: 'Thành công (Won)', color: '#10B981', sortOrder: 4 },
];

export default function Pipelines() {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', color: '#5B3DF5' });

  const fetchPipelines = async () => {
    try {
      const res = await api.get('/crm/pipelines');
      if (res.data?.pipelines?.[0]?.stages) {
        setStages(res.data.pipelines[0].stages);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStage.name.trim()) return;

    const item: Stage = {
      id: Date.now().toString(),
      name: newStage.name,
      color: newStage.color,
      sortOrder: stages.length + 1
    };
    setStages([...stages, item]);
    toast.success(`Đã thêm giai đoạn "${newStage.name}"`);
    setNewStage({ name: '', color: '#5B3DF5' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    toast.success('Đã xóa giai đoạn');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kênh bán hàng & Giai đoạn (Pipelines - F094 | Stages - F095)</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý pipeline bán hàng theo workspace/team (F094) và tùy biến các giai đoạn của quy trình chuyển đổi (F095)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Giai Đoạn</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs space-y-4">
        <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Kanban className="w-4 h-4 text-indigo-600" />
          <span>Quy trình chuyển đổi chuẩn ({stages.length} giai đoạn)</span>
        </h2>

        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                  {idx + 1}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-2xs"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-bold text-sm text-gray-900">{stage.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-gray-400">Thứ tự: {idx + 1}</span>
                {stages.length > 2 && (
                  <button
                    onClick={() => handleDelete(stage.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Thêm Giai Đoạn Bán Hàng</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mã màu nhận diện</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newStage.color}
                    onChange={e => setNewStage({ ...newStage, color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-gray-200"
                  />
                  <span className="font-mono text-gray-500">{newStage.color}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl font-semibold"
                >
                  Thêm Giai Đoạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
