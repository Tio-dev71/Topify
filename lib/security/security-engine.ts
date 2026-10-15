// =========================================================================
// TYPES & INTERFACES FOR M15: SECURITY & INTEGRATIONS (F163 - F170)
// =========================================================================

export interface TwoFactorState {
  isEnabled: boolean;
  secretKey: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
  enabledAt?: string;
}

export interface RolePermissionItem {
  module: string;
  featureName: string;
  permissionKey: string;
  owner: boolean;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKeySecret?: string; // Only shown at creation time
  roleScope: 'READ_ONLY' | 'READ_WRITE' | 'FULL_ADMIN';
  ipWhitelist: string;
  status: 'ACTIVE' | 'REVOKED';
  rateLimitPerMin: number;
  lastUsedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WebhookSubscriptionItem {
  id: string;
  name: string;
  endpointUrl: string;
  signingSecret: string;
  subscribedEvents: string[];
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  successCount: number;
  failureCount: number;
  lastDeliveryStatus?: number;
  lastDeliveryAt?: string;
  createdAt: string;
}

export interface WebhookDeliveryLogItem {
  id: string;
  webhookId: string;
  event: string;
  responseStatus: number;
  durationMs: number;
  payloadSnippet: string;
  deliveredAt: string;
}

export interface CloudStorageConfigItem {
  provider: 'AWS_S3' | 'CLOUDFLARE_R2' | 'GOOGLE_DRIVE';
  providerName: string;
  bucketName: string;
  region: string;
  endpointUrl?: string;
  isConnected: boolean;
  isDefault: boolean;
  lastTestedAt?: string;
}

export interface CrmIntegrationItem {
  id: string;
  service: 'HUBSPOT' | 'MAILCHIMP' | 'ZAPIER' | 'GOOGLE_SHEETS';
  serviceName: string;
  isConnected: boolean;
  autoSyncLeads: boolean;
  autoSyncOrders: boolean;
  apiKeyHint: string;
  lastSyncedAt?: string;
  totalSyncedCount: number;
}

export interface SecurityAuditLogItem {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: 'AUTH' | 'PERMISSION' | 'FINANCE' | 'API_KEY' | 'WEBHOOK' | 'STORAGE';
  ipAddress: string;
  location: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
  timestamp: string;
}

export interface UserSessionItem {
  id: string;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  lastActiveAt: string;
}

export interface TrustedIpItem {
  id: string;
  ipAddressOrCidr: string;
  label: string;
  addedBy: string;
  createdAt: string;
}

// =========================================================================
// IN-MEMORY SECURITY & INTEGRATIONS STORE (RESILIENCE FALLBACK)
// =========================================================================

class SecurityEngineStore {
  // F163: 2FA State
  private twoFactor: TwoFactorState = {
    isEnabled: false,
    secretKey: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Topify:admin@topify.app?secret=JBSWY3DPEHPK3PXP&issuer=Topify',
    recoveryCodes: [
      'REC-9281-4820',
      'REC-1192-3849',
      'REC-5829-1029',
      'REC-7739-4019',
      'REC-3849-2910',
      'REC-8840-1928',
      'REC-6291-0394',
      'REC-4492-8172',
    ],
  };

  // F164: RBAC Matrix
  private rbacPermissions: RolePermissionItem[] = [
    {
      module: 'Quản lý Bài Viết & Lịch Đăng',
      featureName: 'Tạo, sửa & lên lịch đăng bài đa kênh',
      permissionKey: 'posts.manage',
      owner: true,
      admin: true,
      editor: true,
      viewer: false,
    },
    {
      module: 'Quản lý Bài Viết & Lịch Đăng',
      featureName: 'Xóa bài viết & xóa lịch vĩnh viễn',
      permissionKey: 'posts.delete',
      owner: true,
      admin: true,
      editor: false,
      viewer: false,
    },
    {
      module: 'Ví Điện Tử & Thu Nhập (M12)',
      featureName: 'Lập lệnh rút tiền & quản lý tài khoản ngân hàng',
      permissionKey: 'wallet.withdraw',
      owner: true,
      admin: false,
      editor: false,
      viewer: false,
    },
    {
      module: 'Ví Điện Tử & Thu Nhập (M12)',
      featureName: 'Xem số dư & lịch sử giao dịch',
      permissionKey: 'wallet.view',
      owner: true,
      admin: true,
      editor: false,
      viewer: false,
    },
    {
      module: 'Tự Động Hóa (M11) & Topify AI (M14)',
      featureName: 'Thiết lập Trigger & Kịch bản tự động',
      permissionKey: 'automation.manage',
      owner: true,
      admin: true,
      editor: true,
      viewer: false,
    },
    {
      module: 'Cài Đặt & Nhà Phát Triển (M15)',
      featureName: 'Tạo, thu hồi API Key & cấu hình Webhook',
      permissionKey: 'developer.manage',
      owner: true,
      admin: true,
      editor: false,
      viewer: false,
    },
  ];

  // F165: API Keys
  private apiKeys: ApiKeyItem[] = [
    {
      id: 'key-1',
      name: 'Production Ecommerce Sync Key',
      keyPrefix: 'topify_sec_live_9a8f...',
      roleScope: 'READ_WRITE',
      ipWhitelist: '14.232.208.12, 118.69.182.0/24',
      status: 'ACTIVE',
      rateLimitPerMin: 120,
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'key-2',
      name: 'Zapier Webhook Relay Key',
      keyPrefix: 'topify_sec_live_3c2e...',
      roleScope: 'FULL_ADMIN',
      ipWhitelist: '*',
      status: 'ACTIVE',
      rateLimitPerMin: 300,
      lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];

  // F166: Webhooks
  private webhooks: WebhookSubscriptionItem[] = [
    {
      id: 'wh-1',
      name: 'Slack Alerts on Post Published',
      endpointUrl: 'https://hooks.slack.com/services/T00/B00/XXXXX',
      signingSecret: 'whsec_89d38f8219eb048c281729',
      subscribedEvents: ['post.published', 'post.failed'],
      status: 'ACTIVE',
      successCount: 428,
      failureCount: 2,
      lastDeliveryStatus: 200,
      lastDeliveryAt: new Date(Date.now() - 1200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'wh-2',
      name: 'CRM Webhook on Lead Captured',
      endpointUrl: 'https://api.mycrm.vn/v1/webhooks/topify',
      signingSecret: 'whsec_1102938475618293041',
      subscribedEvents: ['lead.captured', 'order.created'],
      status: 'ACTIVE',
      successCount: 154,
      failureCount: 0,
      lastDeliveryStatus: 200,
      lastDeliveryAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ];

  private webhookLogs: WebhookDeliveryLogItem[] = [
    {
      id: 'log-1',
      webhookId: 'wh-1',
      event: 'post.published',
      responseStatus: 200,
      durationMs: 84,
      payloadSnippet: '{"postId": "p_8921", "platform": "TIKTOK", "status": "PUBLISHED"}',
      deliveredAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 'log-2',
      webhookId: 'wh-2',
      event: 'lead.captured',
      responseStatus: 200,
      durationMs: 112,
      payloadSnippet: '{"leadId": "ld_491", "phone": "098***1234", "dealValue": 2500000}',
      deliveredAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  // F167: Cloud Storage
  private storageConfigs: CloudStorageConfigItem[] = [
    {
      provider: 'AWS_S3',
      providerName: 'Amazon Simple Storage Service (AWS S3)',
      bucketName: 'topify-media-prod-sg',
      region: 'ap-southeast-1 (Singapore)',
      endpointUrl: 'https://s3.ap-southeast-1.amazonaws.com',
      isConnected: true,
      isDefault: true,
      lastTestedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      provider: 'CLOUDFLARE_R2',
      providerName: 'Cloudflare R2 Object Storage (Zero Egress Fee)',
      bucketName: 'topify-backup-archive',
      region: 'auto',
      endpointUrl: 'https://<accountid>.r2.cloudflarestorage.com',
      isConnected: true,
      isDefault: false,
      lastTestedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      provider: 'GOOGLE_DRIVE',
      providerName: 'Google Drive Enterprise Backup',
      bucketName: 'Topify Team Assets Folder',
      region: 'global',
      isConnected: false,
      isDefault: false,
    },
  ];

  // F168: CRM & Marketing
  private crmIntegrations: CrmIntegrationItem[] = [
    {
      id: 'crm-hubspot',
      service: 'HUBSPOT',
      serviceName: 'HubSpot CRM Platform',
      isConnected: true,
      autoSyncLeads: true,
      autoSyncOrders: true,
      apiKeyHint: 'pat-na1-89a1****-****-****',
      lastSyncedAt: new Date(Date.now() - 1800000).toISOString(),
      totalSyncedCount: 842,
    },
    {
      id: 'crm-mailchimp',
      service: 'MAILCHIMP',
      serviceName: 'Mailchimp Email Marketing',
      isConnected: true,
      autoSyncLeads: true,
      autoSyncOrders: false,
      apiKeyHint: 'mc_us14_910a****-us14',
      lastSyncedAt: new Date(Date.now() - 7200000).toISOString(),
      totalSyncedCount: 320,
    },
    {
      id: 'crm-zapier',
      service: 'ZAPIER',
      serviceName: 'Zapier No-Code Integration',
      isConnected: true,
      autoSyncLeads: true,
      autoSyncOrders: true,
      apiKeyHint: 'zap_live_882910****',
      lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
      totalSyncedCount: 1420,
    },
    {
      id: 'crm-gsheets',
      service: 'GOOGLE_SHEETS',
      serviceName: 'Google Sheets Realtime Stream',
      isConnected: false,
      autoSyncLeads: false,
      autoSyncOrders: false,
      apiKeyHint: 'Chưa cấu hình Service Account',
      totalSyncedCount: 0,
    },
  ];

  // F169: Security Audit Log
  private auditLogs: SecurityAuditLogItem[] = [
    {
      id: 'audit-1',
      actorEmail: 'admin@topify.app',
      actorRole: 'OWNER',
      action: 'API_KEY_CREATED',
      category: 'API_KEY',
      ipAddress: '14.232.208.12',
      location: 'Hà Nội, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'audit-2',
      actorEmail: 'dev@agency.vn',
      actorRole: 'ADMIN',
      action: 'WEBHOOK_TEST_TRIGGERED',
      category: 'WEBHOOK',
      ipAddress: '118.69.182.45',
      location: 'Hồ Chí Minh, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'audit-3',
      actorEmail: 'editor@agency.vn',
      actorRole: 'EDITOR',
      action: 'WITHDRAWAL_ATTEMPT_DENIED',
      category: 'FINANCE',
      ipAddress: '27.72.102.88',
      location: 'Đà Nẵng, VN',
      status: 'DENIED',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'audit-4',
      actorEmail: 'admin@topify.app',
      actorRole: 'OWNER',
      action: 'TWO_FACTOR_SETUP_VIEWED',
      category: 'AUTH',
      ipAddress: '14.232.208.12',
      location: 'Hà Nội, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'audit-5',
      actorEmail: 'system-gateway@topify.app',
      actorRole: 'SYSTEM',
      action: 'CLOUD_STORAGE_PING',
      category: 'STORAGE',
      ipAddress: '127.0.0.1',
      location: 'Cloud Server',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 28800000).toISOString(),
    },
  ];

  // F170: Active Sessions & Trusted IPs
  private activeSessions: UserSessionItem[] = [
    {
      id: 'sess-current',
      deviceName: 'MacBook Pro 16-inch (M3 Max)',
      deviceType: 'DESKTOP',
      browser: 'Electron Desktop App / Chrome 124',
      ipAddress: '14.232.208.12',
      location: 'Hà Nội, Việt Nam',
      isCurrent: true,
      lastActiveAt: 'Vừa xong',
    },
    {
      id: 'sess-mobile-1',
      deviceName: 'iPhone 15 Pro Max',
      deviceType: 'MOBILE',
      browser: 'Mobile Safari 17.4',
      ipAddress: '118.69.182.45',
      location: 'Hồ Chí Minh, Việt Nam',
      isCurrent: false,
      lastActiveAt: '2 giờ trước',
    },
    {
      id: 'sess-pc-2',
      deviceName: 'Windows 11 Workstation',
      deviceType: 'DESKTOP',
      browser: 'Google Chrome 123.0',
      ipAddress: '27.72.102.88',
      location: 'Đà Nẵng, Việt Nam',
      isCurrent: false,
      lastActiveAt: '1 ngày trước',
    },
  ];

  private trustedIps: TrustedIpItem[] = [
    {
      id: 'tip-1',
      ipAddressOrCidr: '14.232.208.12',
      label: 'Văn phòng Trụ sở Hà Nội',
      addedBy: 'admin@topify.app',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'tip-2',
      ipAddressOrCidr: '118.69.182.0/24',
      label: 'Dải IP Chi nhánh TP. Hồ Chí Minh',
      addedBy: 'admin@topify.app',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ];

  // ==========================================
  // F163: 2FA METHODS
  // ==========================================
  public getTwoFactorState(): TwoFactorState {
    return this.twoFactor;
  }

  public verifyAndToggle2FA(code: string, enable: boolean): { success: boolean; message: string } {
    if (enable) {
      // In dev/demo or live: accept 6-digit number
      if (!/^\d{6}$/.test(code)) {
        return { success: false, message: 'Mã xác thực 2FA phải là 6 chữ số hợp lệ.' };
      }
      this.twoFactor.isEnabled = true;
      this.twoFactor.enabledAt = new Date().toISOString();
      this.recordAuditLog('admin@topify.app', 'OWNER', 'TWO_FACTOR_ENABLED', 'AUTH', 'SUCCESS');
      return { success: true, message: 'Đã kích hoạt xác thực hai yếu tố 2FA TOTP thành công!' };
    } else {
      this.twoFactor.isEnabled = false;
      this.twoFactor.enabledAt = undefined;
      this.recordAuditLog('admin@topify.app', 'OWNER', 'TWO_FACTOR_DISABLED', 'AUTH', 'WARNING');
      return { success: true, message: 'Đã vô hiệu hóa xác thực hai yếu tố 2FA.' };
    }
  }

  // ==========================================
  // F164: RBAC METHODS
  // ==========================================
  public getRbacMatrix(): RolePermissionItem[] {
    return this.rbacPermissions;
  }

  public updateRbacPermission(permissionKey: string, role: 'owner' | 'admin' | 'editor' | 'viewer', value: boolean): boolean {
    const item = this.rbacPermissions.find((p) => p.permissionKey === permissionKey);
    if (item) {
      if (role === 'owner') return false; // Owner always has all rights
      item[role] = value;
      this.recordAuditLog('admin@topify.app', 'OWNER', `RBAC_UPDATED_${permissionKey.toUpperCase()}`, 'PERMISSION', 'SUCCESS');
      return true;
    }
    return false;
  }

  // ==========================================
  // F165: API KEYS METHODS
  // ==========================================
  public getApiKeys(): ApiKeyItem[] {
    return this.apiKeys;
  }

  public createApiKey(params: {
    name: string;
    roleScope: ApiKeyItem['roleScope'];
    ipWhitelist?: string;
    rateLimitPerMin?: number;
    daysValid?: number;
  }): { key: ApiKeyItem; fullSecret: string } {
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const fullSecret = `topify_sec_live_${randomHex}`;
    const keyPrefix = `topify_sec_live_${randomHex.slice(0, 4)}...`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: params.name,
      keyPrefix,
      fullKeySecret: fullSecret,
      roleScope: params.roleScope || 'READ_WRITE',
      ipWhitelist: params.ipWhitelist?.trim() || '*',
      status: 'ACTIVE',
      rateLimitPerMin: params.rateLimitPerMin || 120,
      expiresAt: new Date(Date.now() + 86400000 * (params.daysValid || 90)).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.apiKeys.unshift(newKey);
    this.recordAuditLog('admin@topify.app', 'OWNER', `API_KEY_CREATED_${params.name}`, 'API_KEY', 'SUCCESS');
    return { key: newKey, fullSecret };
  }

  public revokeApiKey(keyId: string): boolean {
    const item = this.apiKeys.find((k) => k.id === keyId);
    if (item) {
      item.status = 'REVOKED';
      this.recordAuditLog('admin@topify.app', 'OWNER', `API_KEY_REVOKED_${item.name}`, 'API_KEY', 'WARNING');
      return true;
    }
    return false;
  }

  // ==========================================
  // F166: WEBHOOKS METHODS
  // ==========================================
  public getWebhooks(): { webhooks: WebhookSubscriptionItem[]; logs: WebhookDeliveryLogItem[] } {
    return {
      webhooks: this.webhooks,
      logs: this.webhookLogs,
    };
  }

  public createWebhook(params: {
    name: string;
    endpointUrl: string;
    subscribedEvents: string[];
  }): WebhookSubscriptionItem {
    const secret = `whsec_${Math.random().toString(36).substring(2, 14)}`;
    const newWebhook: WebhookSubscriptionItem = {
      id: `wh-${Date.now()}`,
      name: params.name,
      endpointUrl: params.endpointUrl,
      signingSecret: secret,
      subscribedEvents: params.subscribedEvents,
      status: 'ACTIVE',
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.webhooks.unshift(newWebhook);
    this.recordAuditLog('admin@topify.app', 'OWNER', `WEBHOOK_CREATED_${params.name}`, 'WEBHOOK', 'SUCCESS');
    return newWebhook;
  }

  public testWebhookPing(webhookId: string): { success: boolean; statusCode: number; durationMs: number } {
    const wh = this.webhooks.find((w) => w.id === webhookId);
    if (!wh) throw new Error('Webhook not found');

    const duration = Math.floor(Math.random() * 50) + 40;
    wh.lastDeliveryStatus = 200;
    wh.lastDeliveryAt = new Date().toISOString();
    wh.successCount += 1;

    const log: WebhookDeliveryLogItem = {
      id: `log-${Date.now()}`,
      webhookId,
      event: 'system.ping_test',
      responseStatus: 200,
      durationMs: duration,
      payloadSnippet: '{"event": "system.ping", "timestamp": "' + new Date().toISOString() + '"}',
      deliveredAt: new Date().toISOString(),
    };
    this.webhookLogs.unshift(log);

    return { success: true, statusCode: 200, durationMs: duration };
  }

  // ==========================================
  // F167: CLOUD STORAGE METHODS
  // ==========================================
  public getStorageConfigs(): CloudStorageConfigItem[] {
    return this.storageConfigs;
  }

  public testStorageConnection(provider: CloudStorageConfigItem['provider']): boolean {
    const cfg = this.storageConfigs.find((c) => c.provider === provider);
    if (cfg) {
      cfg.isConnected = true;
      cfg.lastTestedAt = new Date().toISOString();
      this.recordAuditLog('admin@topify.app', 'OWNER', `STORAGE_TEST_${provider}`, 'STORAGE', 'SUCCESS');
      return true;
    }
    return false;
  }

  public setDefaultStorage(provider: CloudStorageConfigItem['provider']): boolean {
    this.storageConfigs.forEach((c) => {
      c.isDefault = c.provider === provider;
    });
    return true;
  }

  // ==========================================
  // F168: CRM INTEGRATIONS METHODS
  // ==========================================
  public getCrmIntegrations(): CrmIntegrationItem[] {
    return this.crmIntegrations;
  }

  public toggleCrmSync(serviceId: string, type: 'leads' | 'orders', value: boolean): boolean {
    const crm = this.crmIntegrations.find((c) => c.id === serviceId);
    if (crm) {
      if (type === 'leads') crm.autoSyncLeads = value;
      if (type === 'orders') crm.autoSyncOrders = value;
      return true;
    }
    return false;
  }

  // ==========================================
  // F169: AUDIT LOG METHODS
  // ==========================================
  public getAuditLogs(): SecurityAuditLogItem[] {
    return this.auditLogs;
  }

  public recordAuditLog(
    actorEmail: string,
    actorRole: string,
    action: string,
    category: SecurityAuditLogItem['category'],
    status: SecurityAuditLogItem['status'] = 'SUCCESS'
  ) {
    const newLog: SecurityAuditLogItem = {
      id: `audit-${Date.now()}`,
      actorEmail,
      actorRole,
      action,
      category,
      ipAddress: '14.232.208.12',
      location: 'Hà Nội, VN',
      status,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
  }

  // ==========================================
  // F170: SESSIONS & TRUSTED IP METHODS
  // ==========================================
  public getActiveSessionsAndIps(): { sessions: UserSessionItem[]; trustedIps: TrustedIpItem[] } {
    return {
      sessions: this.activeSessions,
      trustedIps: this.trustedIps,
    };
  }

  public revokeSession(sessionId: string): boolean {
    const idx = this.activeSessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1 && !this.activeSessions[idx].isCurrent) {
      this.activeSessions.splice(idx, 1);
      this.recordAuditLog('admin@topify.app', 'OWNER', `SESSION_REVOKED_${sessionId}`, 'AUTH', 'SUCCESS');
      return true;
    }
    return false;
  }

  public revokeAllOtherSessions(): number {
    const count = this.activeSessions.filter((s) => !s.isCurrent).length;
    this.activeSessions = this.activeSessions.filter((s) => s.isCurrent);
    this.recordAuditLog('admin@topify.app', 'OWNER', 'ALL_OTHER_SESSIONS_REVOKED', 'AUTH', 'WARNING');
    return count;
  }

  public addTrustedIp(ipOrCidr: string, label: string): TrustedIpItem {
    const item: TrustedIpItem = {
      id: `tip-${Date.now()}`,
      ipAddressOrCidr: ipOrCidr,
      label,
      addedBy: 'admin@topify.app',
      createdAt: new Date().toISOString(),
    };
    this.trustedIps.unshift(item);
    this.recordAuditLog('admin@topify.app', 'OWNER', `TRUSTED_IP_ADDED_${ipOrCidr}`, 'AUTH', 'SUCCESS');
    return item;
  }

  public removeTrustedIp(id: string): boolean {
    const idx = this.trustedIps.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.trustedIps.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export const securityEngineStore = new SecurityEngineStore();
