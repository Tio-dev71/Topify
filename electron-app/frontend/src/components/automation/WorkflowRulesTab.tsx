import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Search, 
  ArrowRight,
  MessageSquare,
  Users,
  CheckSquare,
  Bell,
  Clock,
  Tag,
  Globe
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    config: any;
  };
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    config: any;
  }>;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

interface WorkflowRulesTabProps {
  onOpenCreateModal: () => void;
  onOpenTemplatesModal: () => void;
  onEditRule: (rule: AutomationRule) => void;
  onRefreshLogs: () => void;
}

export function WorkflowRulesTab({
  onOpenCreateModal,
  onOpenTemplatesModal,
  onEditRule,
  onRefreshLogs,
}: WorkflowRulesTabProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrigger, setFilterTrigger] = useState('ALL');
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/automations');
      if (res.data?.automations) {
        setRules(res.data.automations);
      }
    } catch (e: any) {
      console.error('Error fetching automations', e);
      toast.error('Không thể tải danh sách kịch bản tự động hóa');
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleActive = async (rule: AutomationRule) => {
    const newStatus = !rule.isActive;
    try {
      await api.patch('/automations', { id: rule.id, isActive: newStatus });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: newStatus } : r));
      toast.success(newStatus ? `Đã kích hoạt kịch bản "${rule.name}"` : `Đã tạm dừng kịch bản "${rule.name}"`);
    } catch (e) {
      toast.error('Lỗi khi thay đổi trạng thái kịch bản');
    }
  };

  const deleteRule = async (ruleId: string, ruleName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kịch bản "${ruleName}"?`)) return;
    try {
      await api.delete(`/automations?id=${ruleId}`);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success('Đã xóa kịch bản thành công');
    } catch (e) {
      toast.error('Không thể xóa kịch bản');
    }
  };

  const handleTestTrigger = async (rule: AutomationRule) => {
    try {
      setTestingRuleId(rule.id);
      const res = await api.post('/automations/trigger-test', { ruleId: rule.id });
      if (res.data?.success) {
        toast.success(res.data.message || 'Kịch bản chạy thử thành công!');
        fetchRules();
        onRefreshLogs();
      } else {
        toast.error(res.data?.error || 'Kịch bản thử nghiệm không khớp');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi chạy thử kịch bản');
    } finally {
      setTestingRuleId(null);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTrigger = filterTrigger === 'ALL' || r.trigger?.type === filterTrigger;
    return matchesSearch && matchesTrigger;
  });

  const getTriggerBadge = (type: string) => {
    switch (type) {
      case 'COMMENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><MessageSquare className="w-3 h-3" /> Comment MXH</span>;
      case 'MESSAGE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><MessageSquare className="w-3 h-3" /> Tin nhắn Inbox</span>;
      case 'LEAD':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><Users className="w-3 h-3" /> Lead CRM</span>;
      case 'TIME':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Lịch trình Cron</span>;
      case 'WEBHOOK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Globe className="w-3 h-3" /> Inbound Webhook</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare className="w-3.5 h-3.5 text-blue-600" />;
      case 'TAG': return <Tag className="w-3.5 h-3.5 text-emerald-600" />;
      case 'LEAD': return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'TASK': return <CheckSquare className="w-3.5 h-3.5 text-amber-600" />;
      case 'ASSIGN': return <Users className="w-3.5 h-3.5 text-cyan-600" />;
      case 'NOTIFY': return <Bell className="w-3.5 h-3.5 text-rose-600" />;
      default: return <Zap className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const activeCount = rules.filter(r => r.isActive).length;
  const totalExecutions = rules.reduce((acc, r) => acc + (r.executionCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Tổng kịch bản</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{rules.length}</span>
            <span className="text-xs text-gray-400">quy trình</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Đang kích hoạt</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-gray-400">/ {rules.length} kịch bản</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Tổng lượt kích hoạt</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{totalExecutions.toLocaleString()}</span>
            <span className="text-xs text-gray-400">lượt tự động</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Thời gian phản hồi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">~85ms</span>
            <span className="text-xs text-emerald-600 font-medium">Tức thì</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm kịch bản tự động hóa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={filterTrigger}
            onChange={e => setFilterTrigger(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Tất cả nguồn kích hoạt</option>
            <option value="COMMENT">Comment mạng xã hội</option>
            <option value="MESSAGE">Tin nhắn Inbox</option>
            <option value="LEAD">Lead CRM</option>
            <option value="TIME">Lịch trình Cron</option>
            <option value="WEBHOOK">Webhook</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTemplatesModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mẫu Kịch Bản (Templates)
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            Tạo Kịch Bản Mới
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Đang tải danh sách kịch bản...</div>
      ) : filteredRules.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-gray-800">Chưa có kịch bản tự động hóa nào</div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Tạo kịch bản mới hoặc sử dụng thư viện mẫu có sẵn để tự động phản hồi khách hàng, phân loại lead và giao việc cho đội ngũ.
          </p>
          <button
            onClick={onOpenTemplatesModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Xem Thư Viện Mẫu 1-Click
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(rule => (
            <div 
              key={rule.id}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                rule.isActive 
                  ? 'border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md' 
                  : 'border-gray-100 bg-gray-50/50 opacity-75'
              }`}
            >
              <div className="space-y-3">
                {/* Header & Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTriggerBadge(rule.trigger?.type)}
                      <span className="text-[11px] font-mono text-gray-400">#{rule.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{rule.name}</h3>
                  </div>

                  {/* Switch Active */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={rule.isActive} 
                      onChange={() => toggleRuleActive(rule)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {rule.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{rule.description}</p>
                )}

                {/* Workflow Visualization */}
                <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
                  {/* Step 1: Trigger */}
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Kích hoạt khi:
                    </span>
                    <span className="text-gray-500 font-medium">
                      {rule.trigger?.config?.event || rule.trigger?.type}
                    </span>
                  </div>

                  {/* Step 2: Conditions */}
                  {rule.conditions && rule.conditions.length > 0 && (
                    <div className="flex items-start justify-between text-gray-600 pt-1 border-t border-gray-100">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        Điều kiện:
                      </span>
                      <span className="text-gray-500 font-mono text-[11px] truncate max-w-[150px]">
                        {rule.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Step 3: Actions */}
                  <div className="pt-1 border-t border-gray-100">
                    <div className="font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Hành động ({rule.actions?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(rule.actions || []).map((act, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[11px] font-medium text-gray-700">
                          {getActionIcon(act.type)}
                          {act.type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  Đã chạy: <span className="font-bold text-gray-700">{rule.executionCount || 0}</span> lượt
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestTrigger(rule)}
                    disabled={testingRuleId === rule.id}
                    title="Chạy thử nghiệm kịch bản với payload mẫu"
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Play className={`w-3.5 h-3.5 ${testingRuleId === rule.id ? 'animate-spin' : ''}`} />
                    Test
                  </button>

                  <button
                    onClick={() => onEditRule(rule)}
                    title="Chỉnh sửa kịch bản"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteRule(rule.id, rule.name)}
                    title="Xóa kịch bản"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
