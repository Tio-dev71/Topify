'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical,
  GripVertical,
  Settings2,
  Trash2,
  Edit2
} from 'lucide-react';

const MOCK_PIPELINES = [
  {
    id: 'pipe-1',
    name: 'Quy trình Bán hàng chuẩn',
    isDefault: true,
    stages: [
      { id: 'stage-1', name: 'Khách hàng mới', color: 'bg-blue-500' },
      { id: 'stage-2', name: 'Đang liên hệ', color: 'bg-yellow-500' },
      { id: 'stage-3', name: 'Thương lượng', color: 'bg-purple-500' },
      { id: 'stage-4', name: 'Đã gửi báo giá', color: 'bg-indigo-500' },
      { id: 'stage-5', name: 'Thành công', color: 'bg-green-500' },
    ]
  },
  {
    id: 'pipe-2',
    name: 'Quy trình Bán sỉ (B2B)',
    isDefault: false,
    stages: [
      { id: 'stage-6', name: 'Tiếp cận ban đầu', color: 'bg-blue-500' },
      { id: 'stage-7', name: 'Gặp mặt/Demo', color: 'bg-yellow-500' },
      { id: 'stage-8', name: 'Đàm phán hợp đồng', color: 'bg-purple-500' },
      { id: 'stage-9', name: 'Chốt Hợp đồng', color: 'bg-green-500' },
    ]
  }
];

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState(MOCK_PIPELINES);
  const [activePipeline, setActivePipeline] = useState(MOCK_PIPELINES[0]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex-none p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Phễu bán hàng (Pipelines)</h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Cấu hình các quy trình bán hàng và các bước (Stages)</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Tạo đường ống mới
          </button>
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
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {pipelines.map(pipeline => (
              <button
                key={pipeline.id}
                onClick={() => setActivePipeline(pipeline)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  activePipeline.id === pipeline.id
                    ? 'bg-white dark:bg-[#1a1b1e] border-[var(--color-primary)] shadow-sm'
                    : 'border-transparent hover:bg-[var(--color-muted)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${activePipeline.id === pipeline.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`}>
                    {pipeline.name}
                  </span>
                  {pipeline.isDefault && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">
                      Mặc định
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {pipeline.stages.length} bước (stages)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Edit Stages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Cấu hình bước (Stages)</h2>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Kéo thả để sắp xếp lại các bước trong quy trình <strong>{activePipeline.name}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-muted-foreground)]">
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activePipeline.stages.map((stage, index) => (
                <div 
                  key={stage.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1b1e] group"
                >
                  <button className="cursor-grab active:cursor-grabbing text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </button>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        defaultValue={stage.name}
                        className="font-medium text-[var(--color-foreground)] bg-transparent focus:outline-none focus:border-b border-[var(--color-primary)] px-1 py-0.5"
                      />
                    </div>
                    <div className={`w-4 h-4 rounded-full ${stage.color}`} title="Màu sắc đại diện" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] font-medium">
                <Plus className="w-4 h-4" />
                Thêm bước mới
              </button>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
