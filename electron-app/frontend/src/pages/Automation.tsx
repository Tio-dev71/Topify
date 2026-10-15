import { useState } from 'react';
import { 
  Zap, 
  History, 
  Share2, 
  Plus, 
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WorkflowRulesTab, type AutomationRule } from '../components/automation/WorkflowRulesTab';
import { ExecutionLogsTab } from '../components/automation/ExecutionLogsTab';
import { SocialInteractTab } from '../components/automation/SocialInteractTab';
import { RuleBuilderModal } from '../components/automation/RuleBuilderModal';
import { TemplatesModal } from '../components/automation/TemplatesModal';

export default function Automation() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'logs' | 'social'>('workflows');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Tự Động Hóa Đa Phân Hệ (Automation Flow)
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  M11 Core
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Xây dựng quy trình kích hoạt (F141), điều kiện lọc (F142), hành động liên module (F143) và theo dõi nhật ký thực thi (F144).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Mẫu Quy Trình (1-Click)
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Tạo Kịch Bản Mới
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'workflows'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <Zap className="w-4 h-4" />
          Kịch Bản Tự Động (Flow Rules)
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
            F141-F143
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <History className="w-4 h-4" />
          Nhật Ký Thực Thi & Thử Lại (Logs & Retry)
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
            F144
          </span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'social'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Tương Tác Mạng Xã Hội (Social Auto-Interact)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'workflows' && (
          <WorkflowRulesTab
            key={`rules_${refreshKey}`}
            onOpenCreateModal={handleOpenCreateModal}
            onOpenTemplatesModal={() => setShowTemplatesModal(true)}
            onEditRule={handleEditRule}
            onRefreshLogs={handleRefresh}
          />
        )}

        {activeTab === 'logs' && (
          <ExecutionLogsTab key={`logs_${refreshKey}`} />
        )}

        {activeTab === 'social' && (
          <SocialInteractTab />
        )}
      </div>

      {/* Modals */}
      <RuleBuilderModal
        isOpen={showRuleModal}
        ruleToEdit={editingRule}
        onClose={() => {
          setShowRuleModal(false);
          setEditingRule(null);
        }}
        onSuccess={handleRefresh}
      />

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onAppliedSuccess={handleRefresh}
      />
    </div>
  );
}
