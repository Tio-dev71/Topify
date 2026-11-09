import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  History, 
  Share2, 
  Plus, 
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  ThumbsUp
} from 'lucide-react';
import { WorkflowRulesTab, type AutomationRule } from '../components/automation/WorkflowRulesTab';
import { ExecutionLogsTab } from '../components/automation/ExecutionLogsTab';
import { TemplatesTab } from '../components/automation/TemplatesTab';
import { SocialInteractTab } from '../components/automation/SocialInteractTab';
import { FacebookPostAutomationTab } from '../components/automation/FacebookPostAutomationTab';
import { RuleBuilderModal } from '../components/automation/RuleBuilderModal';
import { TemplatesModal } from '../components/automation/TemplatesModal';

type AutomationTabKey = 'workflows' | 'templates' | 'logs' | 'fb_posts' | 'social';

export default function Automation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as AutomationTabKey | null;
  const [activeTab, setActiveTab] = useState<AutomationTabKey>('workflows');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (tabFromQuery && ['workflows', 'templates', 'logs', 'social', 'fb_posts'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const handleTabChange = (tab: AutomationTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Tự Động Hóa Đa Phân Hệ (Automation Flow)
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0 whitespace-nowrap">
                M11 Core
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 sm:line-clamp-none">
              Trình tạo Trigger → Condition → Action (F140), nguồn kích hoạt (F141), điều kiện lọc (F142), hành động liên module (F143), theo dõi nhật ký thực thi & retry (F144) và mẫu kịch bản (F145).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-stretch sm:self-auto">
          <button
            onClick={() => handleTabChange('templates')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Mẫu Quy Trình (F145)</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md shadow-purple-200 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tạo Kịch Bản Mới (F140)</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 px-2 overflow-x-auto">
        {/* Tab 1: Workflows (F140 - F143) */}
        <button
          onClick={() => handleTabChange('workflows')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'workflows'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Kịch Bản Tự Động (Flow Rules)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
            F140-F143
          </span>
        </button>

        {/* Tab 2: Templates (F145) */}
        <button
          onClick={() => handleTabChange('templates')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'templates'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Mẫu Tự Động Hóa (Templates)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
            F145
          </span>
        </button>

        {/* Tab 3: Logs & Retry (F144) */}
        <button
          onClick={() => handleTabChange('logs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Thực Thi & Retry</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
            F144
          </span>
        </button>

        {/* Tab 4: FB Post Interactions */}
        <button
          onClick={() => handleTabChange('fb_posts')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'fb_posts'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <ThumbsUp className="w-4 h-4 text-purple-600" />
          <span>Quét & Tương Tác FB Post</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
            Like · Cmt
          </span>
        </button>

        {/* Tab 5: Social Auto-Interact */}
        <button
          onClick={() => handleTabChange('social')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'social'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Tương Tác Nuôi Nick</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'workflows' && (
          <WorkflowRulesTab
            key={`rules_${refreshKey}`}
            onOpenCreateModal={handleOpenCreateModal}
            onOpenTemplatesModal={() => handleTabChange('templates')}
            onEditRule={handleEditRule}
            onRefreshLogs={handleRefresh}
            onNavigateToLogs={() => handleTabChange('logs')}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            onAppliedSuccess={handleRefresh}
            onNavigateToWorkflows={() => handleTabChange('workflows')}
          />
        )}

        {activeTab === 'logs' && (
          <ExecutionLogsTab key={`logs_${refreshKey}`} />
        )}

        {activeTab === 'fb_posts' && (
          <FacebookPostAutomationTab />
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
