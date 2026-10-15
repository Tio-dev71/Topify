import { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Users, 
  CheckSquare, 
  Bell, 
  Clock, 
  Tag, 
  Globe,
  Sliders
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import type { AutomationRule } from './WorkflowRulesTab';

interface RuleBuilderModalProps {
  isOpen: boolean;
  ruleToEdit?: AutomationRule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RuleBuilderModal({ isOpen, ruleToEdit, onClose, onSuccess }: RuleBuilderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('COMMENT');
  const [triggerChannel, setTriggerChannel] = useState('ALL');
  const [triggerEvent, setTriggerEvent] = useState('NEW_COMMENT');
  const [cronSchedule, setCronSchedule] = useState('0 9 * * *');
  const [webhookSource, setWebhookSource] = useState('landing_page');

  // Conditions (F142)
  const [conditions, setConditions] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: 'keyword', operator: 'contains', value: 'giá, bao nhiêu, ib' },
  ]);

  // Actions (F143)
  const [actions, setActions] = useState<Array<{ type: string; config: any }>>([
    { type: 'MESSAGE', config: { templateText: 'Chào bạn! Topify đã gửi thông tin chi tiết qua tin nhắn rồi ạ!' } },
    { type: 'TAG', config: { tag: 'Hoi_Gia_Tieng_Nang' } },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name || '');
      setDescription(ruleToEdit.description || '');
      setTriggerType(ruleToEdit.trigger?.type || 'COMMENT');
      setTriggerChannel(ruleToEdit.trigger?.config?.channel || 'ALL');
      setTriggerEvent(ruleToEdit.trigger?.config?.event || 'NEW_COMMENT');
      setCronSchedule(ruleToEdit.trigger?.config?.cronSchedule || '0 9 * * *');
      setWebhookSource(ruleToEdit.trigger?.config?.source || 'landing_page');
      setConditions(ruleToEdit.conditions || []);
      setActions(ruleToEdit.actions || []);
    } else {
      resetForm();
    }
  }, [ruleToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('COMMENT');
    setTriggerChannel('ALL');
    setTriggerEvent('NEW_COMMENT');
    setConditions([{ field: 'keyword', operator: 'contains', value: 'giá, bao nhiêu, ib' }]);
    setActions([
      { type: 'MESSAGE', config: { templateText: 'Chào bạn! Topify đã gửi thông tin chi tiết qua tin nhắn rồi ạ!' } },
      { type: 'TAG', config: { tag: 'Hoi_Gia_Tieng_Nang' } },
    ]);
  };

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions(prev => [...prev, { field: 'keyword', operator: 'contains', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAction = (type: string) => {
    let defaultConfig: any = {};
    switch (type) {
      case 'MESSAGE': defaultConfig = { templateText: 'Dạ shop chào bạn! Chuyên viên tư vấn sẽ hỗ trợ bạn ngay.' }; break;
      case 'TAG': defaultConfig = { tag: 'Khach_VIP' }; break;
      case 'LEAD': defaultConfig = { leadStatus: 'QUALIFIED' }; break;
      case 'TASK': defaultConfig = { taskTitle: 'Gọi chăm sóc khách hàng', taskPriority: 'HIGH', assigneeName: 'Sale' }; break;
      case 'ASSIGN': defaultConfig = { assigneeName: 'Sale Trực Ca' }; break;
      case 'NOTIFY': defaultConfig = { notificationTitle: 'Thông báo kịch bản', notificationBody: 'Đã kích hoạt hành động tự động.' }; break;
    }
    setActions(prev => [...prev, { type, config: defaultConfig }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kịch bản tự động hóa');
      return;
    }

    if (actions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 hành động thực thi');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name,
        description,
        trigger: {
          type: triggerType,
          config: {
            channel: triggerChannel,
            event: triggerEvent,
            cronSchedule: triggerType === 'TIME' ? cronSchedule : undefined,
            source: triggerType === 'WEBHOOK' ? webhookSource : undefined,
          },
        },
        conditions,
        actions,
        isActive: true,
      };

      if (ruleToEdit) {
        await api.patch('/automations', { id: ruleToEdit.id, ...payload });
        toast.success('Đã cập nhật kịch bản thành công');
      } else {
        await api.post('/automations', payload);
        toast.success('Đã tạo kịch bản tự động hóa mới thành công');
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi lưu kịch bản');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              {ruleToEdit ? 'Chỉnh Sửa Kịch Bản Tự Động Hóa' : 'Tạo Kịch Bản Tự Động Hóa Mới (Flow Builder)'}
            </h2>
            <p className="text-xs text-gray-500">
              Thiết lập liên hoàn: Nguồn kích hoạt (F141) $\rightarrow$ Điều kiện lọc (F142) $\rightarrow$ Hành động liên module (F143)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* General Information */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-500" />
              1. Thông tin kịch bản
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên kịch bản <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tự động trả lời comment hỏi giá và gắn thẻ VIP"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Mô tả mục tiêu</label>
                <input
                  type="text"
                  placeholder="Mô tả tóm tắt mục tiêu hoặc đối tượng áp dụng..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Trigger Section (F141) */}
          <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                2. Nguồn kích hoạt (Trigger - F141)
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Sự kiện bắt đầu luồng
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: 'COMMENT', label: 'Bình luận', icon: MessageSquare },
                { type: 'MESSAGE', label: 'Tin nhắn Inbox', icon: MessageSquare },
                { type: 'LEAD', label: 'Lead CRM', icon: Users },
                { type: 'TIME', label: 'Lịch Cron', icon: Clock },
                { type: 'WEBHOOK', label: 'Webhook', icon: Globe },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = triggerType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setTriggerType(item.type)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-white border-amber-500 text-amber-800 shadow-sm ring-2 ring-amber-400'
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Trigger Config Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {['COMMENT', 'MESSAGE'].includes(triggerType) && (
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Kênh truyền thông</label>
                  <select
                    value={triggerChannel}
                    onChange={e => setTriggerChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium"
                  >
                    <option value="ALL">Tất cả kênh (TikTok, Facebook, Shopee)</option>
                    <option value="FACEBOOK">Facebook Fanpage / Post</option>
                    <option value="TIKTOK">TikTok Account / Livestream</option>
                    <option value="SHOPEE">Shopee Chat</option>
                  </select>
                </div>
              )}

              {triggerType === 'TIME' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Biểu thức Cron</label>
                  <input
                    type="text"
                    value={cronSchedule}
                    onChange={e => setCronSchedule(e.target.value)}
                    placeholder="VD: 0 9 * * * (Hàng ngày lúc 09:00)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 font-mono"
                  />
                </div>
              )}

              {triggerType === 'WEBHOOK' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nguồn Webhook (Source identifier)</label>
                  <input
                    type="text"
                    value={webhookSource}
                    onChange={e => setWebhookSource(e.target.value)}
                    placeholder="landing_page, crm_sync, pos..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Condition Builder (F142) */}
          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                3. Bộ điều kiện lọc (Condition Builder - F142)
              </h3>
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm điều kiện
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-gray-500 italic text-xs">Không có điều kiện lọc (Mặc định luôn chạy mọi sự kiện).</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                    <select
                      value={cond.field}
                      onChange={e => {
                        const val = e.target.value;
                        setConditions(prev => prev.map((c, i) => i === idx ? { ...c, field: val } : c));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-medium text-xs text-gray-700"
                    >
                      <option value="keyword">Từ khóa (Keyword)</option>
                      <option value="tag">Thẻ tag (Tag)</option>
                      <option value="source">Nguồn (Source)</option>
                      <option value="status">Trạng thái (Status)</option>
                      <option value="message_contains">Nội dung tin nhắn</option>
                    </select>

                    <select
                      value={cond.operator}
                      onChange={e => {
                        const val = e.target.value;
                        setConditions(prev => prev.map((c, i) => i === idx ? { ...c, operator: val } : c));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-medium text-xs text-gray-700"
                    >
                      <option value="contains">Chứa từ (contains)</option>
                      <option value="equals">Bằng chính xác (equals)</option>
                      <option value="not_equals">Khác với (not equals)</option>
                      <option value="starts_with">Bắt đầu bằng (starts with)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Giá trị kiểm tra (VD: giá, ship, VIP)..."
                      value={cond.value}
                      onChange={e => {
                        const val = e.target.value;
                        setConditions(prev => prev.map((c, i) => i === idx ? { ...c, value: val } : c));
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Xóa điều kiện này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Chain (F143) */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                4. Chuỗi hành động liên module (Actions - F143)
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Thêm:</span>
                {(['MESSAGE', 'TAG', 'LEAD', 'TASK', 'ASSIGN', 'NOTIFY'] as const).map(actType => (
                  <button
                    key={actType}
                    type="button"
                    onClick={() => handleAddAction(actType)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    +{actType}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {actions.map((act, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      Hành động: {act.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {act.type === 'MESSAGE' && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">Mẫu tin nhắn phản hồi</label>
                      <input
                        type="text"
                        value={act.config.templateText || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, templateText: val } } : a));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                  )}

                  {act.type === 'TAG' && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">Tên thẻ tag CRM gán cho khách hàng</label>
                      <input
                        type="text"
                        value={act.config.tag || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, tag: val } } : a));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                  )}

                  {act.type === 'LEAD' && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">Trạng thái Lead CRM</label>
                      <select
                        value={act.config.leadStatus || 'NEW'}
                        onChange={e => {
                          const val = e.target.value;
                          setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, leadStatus: val } } : a));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      >
                        <option value="NEW">Mới (NEW)</option>
                        <option value="QUALIFIED">Đã xác thực (QUALIFIED)</option>
                        <option value="VIP">Khách VIP (VIP)</option>
                      </select>
                    </div>
                  )}

                  {act.type === 'TASK' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 text-[11px] mb-1">Tiêu đề Task (M9)</label>
                        <input
                          type="text"
                          value={act.config.taskTitle || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, taskTitle: val } } : a));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[11px] mb-1">Độ ưu tiên</label>
                        <select
                          value={act.config.taskPriority || 'HIGH'}
                          onChange={e => {
                            const val = e.target.value;
                            setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, taskPriority: val } } : a));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        >
                          <option value="URGENT">Khẩn cấp (URGENT)</option>
                          <option value="HIGH">Cao (HIGH)</option>
                          <option value="MEDIUM">Trung bình (MEDIUM)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {act.type === 'ASSIGN' && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">Gán người phụ trách</label>
                      <input
                        type="text"
                        value={act.config.assigneeName || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, assigneeName: val } } : a));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                  )}

                  {act.type === 'NOTIFY' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 text-[11px] mb-1">Tiêu đề thông báo</label>
                        <input
                          type="text"
                          value={act.config.notificationTitle || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, notificationTitle: val } } : a));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[11px] mb-1">Nội dung</label>
                        <input
                          type="text"
                          value={act.config.notificationBody || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, notificationBody: val } } : a));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {saving ? 'Đang lưu...' : (ruleToEdit ? 'Lưu Thay Đổi' : 'Khởi Tạo Kịch Bản')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
