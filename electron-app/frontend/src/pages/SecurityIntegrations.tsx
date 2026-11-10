import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Laptop,
  AlertTriangle,
  Globe,
  Key,
  Webhook,
  Terminal,
  Database,
  Download,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

// Import M15 Sub-Feature Tabs F163 - F170
import TwoFactorTab from '../components/security/TwoFactorTab';
import LoginSessionsTab from '../components/security/LoginSessionsTab';
import SuspiciousAlertsTab from '../components/security/SuspiciousAlertsTab';
import OAuthAuditTab from '../components/security/OAuthAuditTab';
import ApiKeysTab from '../components/security/ApiKeysTab';
import WebhooksTab from '../components/security/WebhooksTab';
import PublicApiTab from '../components/security/PublicApiTab';
import DataRetentionBackupTab from '../components/security/DataRetentionBackupTab';

export type SecurityTabId =
  | '2fa'
  | 'sessions'
  | 'alerts'
  | 'oauth_audit'
  | 'api_keys'
  | 'webhooks'
  | 'public_api'
  | 'backup_retention';

export default function SecurityIntegrations() {
  const [activeTab, setActiveTab] = useState<SecurityTabId>('2fa');

  useEffect(() => {
    const saved = localStorage.getItem('topify_active_security_tab') as SecurityTabId | null;
    if (saved && [
      '2fa',
      'sessions',
      'alerts',
      'oauth_audit',
      'api_keys',
      'webhooks',
      'public_api',
      'backup_retention',
    ].includes(saved)) {
      setActiveTab(saved);
    }
  }, []);

  const handleTabChange = (tab: SecurityTabId) => {
    setActiveTab(tab);
    localStorage.setItem('topify_active_security_tab', tab);
  };

  const handleExportAuditReport = () => {
    window.open('/api/security/audit-log?format=csv', '_blank');
    toast.success('Đang xuất báo cáo kiểm toán bảo mật chuẩn ISO 27001 / SOC 2...');
  };

  const tabsConfig = [
    {
      id: '2fa' as SecurityTabId,
      label: 'F163 2FA',
      subLabel: 'Xác thực hai lớp',
      icon: ShieldCheck,
      badge: 'Bảo mật',
    },
    {
      id: 'sessions' as SecurityTabId,
      label: 'F164 Phiên & Lịch Sử',
      subLabel: 'Session & IP',
      icon: Laptop,
      badge: 'Hoạt động',
    },
    {
      id: 'alerts' as SecurityTabId,
      label: 'F165 Cảnh Báo An Ninh',
      subLabel: 'Đăng nhập lạ',
      icon: AlertTriangle,
      badge: 'Rủi ro',
    },
    {
      id: 'oauth_audit' as SecurityTabId,
      label: 'F166 Kiểm Toán OAuth',
      subLabel: 'Scope & Token',
      icon: Globe,
      badge: 'Mạng xã hội',
    },
    {
      id: 'api_keys' as SecurityTabId,
      label: 'F167 Quản Lý API Key',
      subLabel: 'Tạo, thu hồi, rotate',
      icon: Key,
      badge: 'Tích hợp',
    },
    {
      id: 'webhooks' as SecurityTabId,
      label: 'F168 Webhook Gateway',
      subLabel: 'HMAC, retry, log',
      icon: Webhook,
      badge: 'Real-time',
    },
    {
      id: 'public_api' as SecurityTabId,
      label: 'F169 Public REST API',
      subLabel: 'Docs & Sandbox',
      icon: Terminal,
      badge: 'Quota',
    },
    {
      id: 'backup_retention' as SecurityTabId,
      label: 'F170 Lưu Trữ & Backup',
      subLabel: 'Snapshot & Retention',
      icon: Database,
      badge: 'Dự phòng',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-14 px-2 sm:px-4">
      {/* Top Main Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-500 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Bảo Mật & Tích Hợp Hệ Thống (M15)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
                SOC 2 / ISO 27001
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Trung tâm kiểm soát an ninh đa tầng: 2FA TOTP, giám sát phiên & IP, phát hiện bất thường, rà soát quyền OAuth, API Keys & Webhook gateway, Public API Sandbox và sao lưu dự phòng snapshot.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportAuditReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition font-medium self-start md:self-auto shadow-sm"
        >
          <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Xuất Nhật Ký Kiểm Toán (CSV)
        </button>
      </div>

      {/* Tabs Navigation Bar (8 Checklist Items F163 - F170) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-2.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div className="font-bold text-xs truncate">{tab.label}</div>
              <div
                className={`text-[10px] truncate ${
                  isActive ? 'text-purple-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {tab.subLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels Content */}
      <div className="mt-4">
        {activeTab === '2fa' && <TwoFactorTab />}
        {activeTab === 'sessions' && <LoginSessionsTab />}
        {activeTab === 'alerts' && <SuspiciousAlertsTab />}
        {activeTab === 'oauth_audit' && <OAuthAuditTab />}
        {activeTab === 'api_keys' && <ApiKeysTab />}
        {activeTab === 'webhooks' && <WebhooksTab />}
        {activeTab === 'public_api' && <PublicApiTab />}
        {activeTab === 'backup_retention' && <DataRetentionBackupTab />}
      </div>
    </div>
  );
}
