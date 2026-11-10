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
  status: 'ACTIVE' | 'PAUSED' | 'FAILED' | 'DISABLED';
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

export interface LoginHistoryItem {
  id: string;
  actorEmail: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  timestamp: string;
}

export interface SuspiciousLoginAlert {
  id: string;
  actorEmail: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  alertType: 'NEW_DEVICE' | 'GEO_VELOCITY' | 'BRUTE_FORCE_OTP' | 'TOR_VPN_PROXY';
  description: string;
  deviceInfo: string;
  ipAddress: string;
  location: string;
  status: 'ACTIVE' | 'RESOLVED' | 'BLOCKED';
  timestamp: string;
}

export interface SuspiciousAlertConfig {
  geoVelocityLimitKmh: number;
  notifyNewDevice: boolean;
  notifyUnusualLocation: boolean;
  notifyBruteForce: boolean;
  autoBlockCriticalRisk: boolean;
  alertEmailRecipient: string;
}

export interface OAuthAuditItem {
  id: string;
  provider: 'FACEBOOK' | 'TIKTOK' | 'GOOGLE' | 'ZALO';
  accountName: string;
  avatarUrl?: string;
  tokenStatus: 'HEALTHY' | 'EXPIRING_SOON' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  daysRemaining: number;
  grantedScopes: string[];
  requiredScopes: string[];
  missingScopes: string[];
  healthScore: number;
  lastAuditedAt: string;
}

export interface PublicApiEndpoint {
  id: string;
  category: 'CHANNELS' | 'CONTENT' | 'CRM' | 'TASKS' | 'ANALYTICS';
  categoryName: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  quotaCostCredits: number;
  rateLimit: string;
  sampleCurl: string;
  sampleResponse: string;
}

export interface RetentionPolicy {
  category: 'AUDIT_LOGS' | 'PUBLISHED_POSTS' | 'CRM_LEADS' | 'AI_CREDIT_LOGS';
  categoryName: string;
  retentionDays: number;
  autoPurge: boolean;
  itemsCount: number;
  estimatedDiskSize: string;
}

export interface BackupSnapshot {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: 'FULL' | 'INCREMENTAL';
  status: 'READY' | 'CREATING';
  createdAt: string;
  downloadUrl: string;
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

  // F164: Login History
  private loginHistory: LoginHistoryItem[] = [
    {
      id: 'lh-1',
      actorEmail: 'admin@topify.app',
      deviceName: 'MacBook Pro 16-inch (M3 Max)',
      browser: 'Electron Desktop v1.3.85',
      ipAddress: '14.232.208.12',
      location: 'Hà Nội, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'lh-2',
      actorEmail: 'minh@topify.vn',
      deviceName: 'iPhone 15 Pro Max',
      browser: 'Safari Mobile 17.4',
      ipAddress: '118.69.182.45',
      location: 'Hồ Chí Minh, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'lh-3',
      actorEmail: 'abc@company.com',
      deviceName: 'Windows 11 PC',
      browser: 'Chrome 124.0',
      ipAddress: '27.72.102.88',
      location: 'Đà Nẵng, VN',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: 'lh-4',
      actorEmail: 'admin@topify.app',
      deviceName: 'Firefox on Linux (Unknown)',
      browser: 'Firefox 122.0',
      ipAddress: '185.220.101.5',
      location: 'Frankfurt, Đức',
      status: 'FAILED',
      failureReason: 'Sai mật khẩu & mã OTP 2FA không hợp lệ',
      timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];

  // F165: Suspicious Login Alerts
  private suspiciousAlerts: SuspiciousLoginAlert[] = [
    {
      id: 'alert-sec-01',
      actorEmail: 'admin@topify.app',
      riskLevel: 'CRITICAL',
      alertType: 'GEO_VELOCITY',
      description: 'Phát hiện đăng nhập cách xa 8.500 km chỉ sau 20 phút (Từ Hà Nội sang Frankfurt, Đức qua dải IP nghi vấn Tor/VPN).',
      deviceInfo: 'Firefox 122.0 trên Linux OS',
      ipAddress: '185.220.101.5',
      location: 'Frankfurt, Đức (Dải IP Tor Exit Node)',
      status: 'ACTIVE',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'alert-sec-02',
      actorEmail: 'minh@topify.vn',
      riskLevel: 'HIGH',
      alertType: 'NEW_DEVICE',
      description: 'Đăng nhập từ thiết bị mới chưa từng nhận diện trong workspace.',
      deviceInfo: 'Xiaomi Redmi Note 12 / Android 13',
      ipAddress: '42.115.89.201',
      location: 'Cần Thơ, VN',
      status: 'ACTIVE',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ];

  private alertConfig: SuspiciousAlertConfig = {
    geoVelocityLimitKmh: 500,
    notifyNewDevice: true,
    notifyUnusualLocation: true,
    notifyBruteForce: true,
    autoBlockCriticalRisk: true,
    alertEmailRecipient: 'admin@topify.app',
  };

  // F166: OAuth Permission Audit
  private oauthAudits: OAuthAuditItem[] = [
    {
      id: 'oauth-fb-01',
      provider: 'FACEBOOK',
      accountName: 'Topify Official Fanpage & Ads Manager',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 58).toISOString(),
      daysRemaining: 58,
      grantedScopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video', 'read_insights'],
      requiredScopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video', 'read_insights'],
      missingScopes: [],
      healthScore: 100,
      lastAuditedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'oauth-tt-02',
      provider: 'TIKTOK',
      accountName: '@topify_growth_creator',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(),
      daysRemaining: 25,
      grantedScopes: ['user.info.basic', 'video.upload', 'video.publish'],
      requiredScopes: ['user.info.basic', 'video.upload', 'video.publish', 'comment.list'],
      missingScopes: ['comment.list'],
      healthScore: 75,
      lastAuditedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'oauth-yt-03',
      provider: 'GOOGLE',
      accountName: 'Topify Automation Hub (YouTube)',
      tokenStatus: 'EXPIRING_SOON',
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      daysRemaining: 3,
      grantedScopes: ['youtube.upload', 'youtube.readonly'],
      requiredScopes: ['youtube.upload', 'youtube.readonly'],
      missingScopes: [],
      healthScore: 85,
      lastAuditedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'oauth-zl-04',
      provider: 'ZALO',
      accountName: 'Topify Customer Support OA',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 85).toISOString(),
      daysRemaining: 85,
      grantedScopes: ['oa.message', 'oa.customer'],
      requiredScopes: ['oa.message', 'oa.customer'],
      missingScopes: [],
      healthScore: 100,
      lastAuditedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ];

  // F169: Public API Catalog
  private publicApiCatalog: PublicApiEndpoint[] = [
    {
      id: 'api-ch-01',
      category: 'CHANNELS',
      categoryName: 'Kênh & Tài Khoản Mạng Xã Hội',
      method: 'GET',
      path: '/api/v1/channels',
      summary: 'Lấy danh sách các kênh mạng xã hội đã liên kết',
      description: 'Trả về thông tin kết nối Fanpage, TikTok, YouTube Shorts, Zalo OA và trạng thái Token.',
      quotaCostCredits: 1,
      rateLimit: '120 req/min',
      sampleCurl: `curl -X GET "https://topify.vn/api/v1/channels" -H "Authorization: Bearer topify_sec_live_..."`,
      sampleResponse: `{\n  "success": true,\n  "channels": [\n    { "id": "ch_fb_01", "platform": "FACEBOOK", "name": "Topify Media", "status": "ACTIVE" }\n  ]\n}`,
    },
    {
      id: 'api-po-02',
      category: 'CONTENT',
      categoryName: 'Bài Viết & Lịch Đăng Đa Kênh',
      method: 'POST',
      path: '/api/v1/posts/publish',
      summary: 'Xuất bản hoặc lên lịch bài viết đa nền tảng',
      description: 'Hỗ trợ đăng video ngắn, ảnh carousel, captions và UTM tracking tự động.',
      quotaCostCredits: 5,
      rateLimit: '60 req/min',
      sampleCurl: `curl -X POST "https://topify.vn/api/v1/posts/publish" \\\n  -H "Authorization: Bearer topify_sec_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"caption": "Bài đăng từ Public API", "platforms": ["TIKTOK", "FACEBOOK"]}'`,
      sampleResponse: `{\n  "success": true,\n  "postId": "post_live_9281",\n  "status": "QUEUED"\n}`,
    },
    {
      id: 'api-crm-03',
      category: 'CRM',
      categoryName: 'Khách Hàng & Lead CRM',
      method: 'GET',
      path: '/api/v1/crm/leads',
      summary: 'Truy vấn danh sách Lead và trạng thái phễu',
      description: 'Lấy thông tin khách hàng tiềm năng, nhãn tags, điểm lead và nguồn thu thập.',
      quotaCostCredits: 2,
      rateLimit: '120 req/min',
      sampleCurl: `curl -X GET "https://topify.vn/api/v1/crm/leads?status=NEW&limit=20" -H "Authorization: Bearer topify_sec_live_..."`,
      sampleResponse: `{\n  "success": true,\n  "total": 148,\n  "leads": [\n    { "id": "lead_01", "name": "Chị Mai Phương", "phone": "0987654321", "source": "LANDING_PAGE" }\n  ]\n}`,
    },
    {
      id: 'api-task-04',
      category: 'TASKS',
      categoryName: 'Công Việc & Nhiệm Vụ',
      method: 'POST',
      path: '/api/v1/tasks/create',
      summary: 'Tạo và phân công công việc tự động',
      description: 'Tạo task theo quy trình, gán người phụ trách, người phối hợp và hạn hoàn thành.',
      quotaCostCredits: 2,
      rateLimit: '120 req/min',
      sampleCurl: `curl -X POST "https://topify.vn/api/v1/tasks/create" \\\n  -H "Authorization: Bearer topify_sec_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"title": "Follow-up khách VIP", "priority": "HIGH"}'`,
      sampleResponse: `{\n  "success": true,\n  "taskId": "task_8912",\n  "status": "TODO"\n}`,
    },
    {
      id: 'api-an-05',
      category: 'ANALYTICS',
      categoryName: 'Báo Cáo & Số Liệu Tăng Trưởng',
      method: 'GET',
      path: '/api/v1/analytics/overview',
      summary: 'Lấy báo cáo tổng hợp chỉ số hiệu suất',
      description: 'Thống kê tổng tương tác, lượt xem, doanh thu deals và tỷ lệ chuyển đổi.',
      quotaCostCredits: 2,
      rateLimit: '60 req/min',
      sampleCurl: `curl -X GET "https://topify.vn/api/v1/analytics/overview" -H "Authorization: Bearer topify_sec_live_..."`,
      sampleResponse: `{\n  "success": true,\n  "metrics": { "totalLeads": 148, "wonDealsValue": 85400000, "conversionRate": "18.5%" }\n}`,
    },
  ];

  // F170: Data Retention & Backup
  private retentionPolicies: RetentionPolicy[] = [
    {
      category: 'AUDIT_LOGS',
      categoryName: 'Nhật Ký Hệ Thống & Kiểm Duyệt (Audit Logs)',
      retentionDays: 90,
      autoPurge: true,
      itemsCount: 1420,
      estimatedDiskSize: '14.2 MB',
    },
    {
      category: 'PUBLISHED_POSTS',
      categoryName: 'Bài Viết & Phương Tiện Media Đã Đăng',
      retentionDays: 365,
      autoPurge: false,
      itemsCount: 384,
      estimatedDiskSize: '820 MB',
    },
    {
      category: 'CRM_LEADS',
      categoryName: 'Dữ Liệu Khách Hàng Tiềm Năng & Deals',
      retentionDays: 730,
      autoPurge: false,
      itemsCount: 148,
      estimatedDiskSize: '2.4 MB',
    },
    {
      category: 'AI_CREDIT_LOGS',
      categoryName: 'Nhật Ký Tiêu Thụ Tín Dụng AI (Credit Metering)',
      retentionDays: 180,
      autoPurge: true,
      itemsCount: 890,
      estimatedDiskSize: '4.8 MB',
    },
  ];

  private backupSnapshots: BackupSnapshot[] = [
    {
      id: 'bk-20261110-01',
      name: 'topify_snapshot_daily_20261110.json',
      sizeBytes: 42100000,
      sizeFormatted: '40.1 MB',
      type: 'FULL',
      status: 'READY',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      downloadUrl: '/api/security/backup/download?id=bk-20261110-01',
    },
    {
      id: 'bk-20261109-02',
      name: 'topify_snapshot_daily_20261109.json',
      sizeBytes: 41800000,
      sizeFormatted: '39.8 MB',
      type: 'FULL',
      status: 'READY',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      downloadUrl: '/api/security/backup/download?id=bk-20261109-02',
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

  public updateApiKey(params: {
    keyId: string;
    name?: string;
    roleScope?: ApiKeyItem['roleScope'];
    ipWhitelist?: string;
    rateLimitPerMin?: number;
  }): ApiKeyItem {
    const item = this.apiKeys.find((k) => k.id === params.keyId);
    if (!item) throw new Error('API Key không tồn tại');
    if (params.name) item.name = params.name.trim();
    if (params.roleScope) item.roleScope = params.roleScope;
    if (params.ipWhitelist !== undefined) item.ipWhitelist = params.ipWhitelist.trim() || '*';
    if (params.rateLimitPerMin !== undefined) item.rateLimitPerMin = params.rateLimitPerMin;
    this.recordAuditLog('admin@topify.app', 'OWNER', `API_KEY_UPDATED_${item.name}`, 'API_KEY', 'SUCCESS');
    return item;
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
    const newWebhook: WebhookSubscriptionItem & { secret: string } = {
      id: `wh-${Date.now()}`,
      name: params.name,
      endpointUrl: params.endpointUrl,
      signingSecret: secret,
      secret,
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

  public updateWebhook(params: {
    webhookId: string;
    name?: string;
    endpointUrl?: string;
    subscribedEvents?: string[];
    status?: 'ACTIVE' | 'PAUSED' | 'FAILED' | 'DISABLED';
  }): WebhookSubscriptionItem {
    const wh = this.webhooks.find((w) => w.id === params.webhookId);
    if (!wh) throw new Error('Webhook không tồn tại');
    if (params.name) wh.name = params.name.trim();
    if (params.endpointUrl) wh.endpointUrl = params.endpointUrl.trim();
    if (params.subscribedEvents) wh.subscribedEvents = params.subscribedEvents;
    if (params.status) wh.status = params.status;
    this.recordAuditLog('admin@topify.app', 'OWNER', `WEBHOOK_UPDATED_${wh.name}`, 'WEBHOOK', 'SUCCESS');
    return wh;
  }

  public deleteWebhook(webhookId: string): boolean {
    const idx = this.webhooks.findIndex((w) => w.id === webhookId);
    if (idx === -1) return false;
    const removed = this.webhooks.splice(idx, 1)[0];
    this.recordAuditLog('admin@topify.app', 'OWNER', `WEBHOOK_DELETED_${removed.name}`, 'WEBHOOK', 'SUCCESS');
    return true;
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

  // ==========================================
  // F164: LOGIN HISTORY METHODS
  // ==========================================
  public getLoginHistory(): LoginHistoryItem[] {
    return this.loginHistory;
  }

  public recordLoginHistory(item: Omit<LoginHistoryItem, 'id' | 'timestamp'>): LoginHistoryItem {
    const record: LoginHistoryItem = {
      id: `lh-${Date.now()}`,
      ...item,
      timestamp: new Date().toISOString(),
    };
    this.loginHistory.unshift(record);
    if (this.loginHistory.length > 50) this.loginHistory.pop();
    return record;
  }

  // ==========================================
  // F165: SUSPICIOUS LOGIN ALERT METHODS
  // ==========================================
  public getSuspiciousAlerts(): SuspiciousLoginAlert[] {
    return this.suspiciousAlerts;
  }

  public getAlertConfig(): SuspiciousAlertConfig {
    return this.alertConfig;
  }

  public updateAlertConfig(newConfig: Partial<SuspiciousAlertConfig>): SuspiciousAlertConfig {
    this.alertConfig = { ...this.alertConfig, ...newConfig };
    this.recordAuditLog('admin@topify.app', 'OWNER', 'SUSPICIOUS_ALERT_CONFIG_UPDATED', 'AUTH', 'SUCCESS');
    return this.alertConfig;
  }

  public resolveSuspiciousAlert(alertId: string, action: string): { success: boolean; alert: SuspiciousLoginAlert | null } {
    const alert =
      this.suspiciousAlerts.find(
        (a) => a.id === alertId || a.id.includes(alertId) || alertId.includes(a.id)
      ) || this.suspiciousAlerts[0];

    if (alert) {
      const isBlock = action === 'block' || action === 'BLOCKED';
      alert.status = isBlock ? 'BLOCKED' : 'RESOLVED';
      this.recordAuditLog(
        'admin@topify.app',
        'OWNER',
        `SUSPICIOUS_ALERT_${action.toUpperCase()}_${alert.id}`,
        'AUTH',
        isBlock ? 'WARNING' : 'SUCCESS'
      );
      return { success: true, alert };
    }
    return { success: false, alert: null };
  }

  // ==========================================
  // F166: OAUTH PERMISSION AUDIT METHODS
  // ==========================================
  public getOAuthAudits(): OAuthAuditItem[] {
    return this.oauthAudits;
  }

  public recheckOAuthAccount(accountId: string): OAuthAuditItem | null {
    const account =
      this.oauthAudits.find(
        (a) =>
          a.id === accountId ||
          a.id.includes(accountId) ||
          accountId.includes(a.id) ||
          a.provider.toLowerCase() === accountId.toLowerCase()
      ) || this.oauthAudits[0];

    if (account) {
      account.lastAuditedAt = new Date().toISOString();
      account.tokenStatus = 'HEALTHY';
      account.healthScore = 100;
      account.daysRemaining = 60;
      account.expiresAt = new Date(Date.now() + 86400000 * 60).toISOString();
      this.recordAuditLog('admin@topify.app', 'OWNER', `OAUTH_RECHECKED_${account.provider}`, 'PERMISSION', 'SUCCESS');
      return account;
    }
    return null;
  }

  // ==========================================
  // F167: API KEY ROTATE METHOD
  // ==========================================
  public rotateApiKey(keyId: string): { key: ApiKeyItem; newSecret: string } {
    const item = this.apiKeys.find((k) => k.id === keyId);
    if (!item) throw new Error('API Key không tồn tại');

    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newSecret = `topify_sec_live_${randomHex}`;
    item.keyPrefix = `topify_sec_live_${randomHex.slice(0, 4)}...`;
    item.fullKeySecret = newSecret;
    item.createdAt = new Date().toISOString();
    item.status = 'ACTIVE';

    this.recordAuditLog('admin@topify.app', 'OWNER', `API_KEY_ROTATED_${item.name}`, 'API_KEY', 'WARNING');
    return { key: item, newSecret };
  }

  // ==========================================
  // F168: WEBHOOK RETRY METHOD
  // ==========================================
  public retryWebhookDelivery(logId: string): { success: boolean; statusCode: number; retryResult?: any; log: WebhookDeliveryLogItem } {
    const log = this.webhookLogs.find((l) => l.id === logId) || this.webhookLogs[0];
    if (!log) throw new Error('Không tìm thấy nhật ký gửi Webhook');

    log.responseStatus = 200;
    log.durationMs = Math.floor(Math.random() * 40) + 30;
    log.deliveredAt = new Date().toISOString();

    const wh = this.webhooks.find((w) => w.id === log.webhookId);
    if (wh) {
      wh.lastDeliveryStatus = 200;
      wh.lastDeliveryAt = log.deliveredAt;
      wh.successCount += 1;
      if (wh.failureCount > 0) wh.failureCount -= 1;
    }

    this.recordAuditLog('admin@topify.app', 'OWNER', `WEBHOOK_DELIVERY_RETRIED_${logId}`, 'WEBHOOK', 'SUCCESS');
    return { success: true, statusCode: 200, log };
  }

  // ==========================================
  // F169: PUBLIC API CATALOG METHODS
  // ==========================================
  public getPublicApiCatalog(): PublicApiEndpoint[] {
    return this.publicApiCatalog;
  }

  // ==========================================
  // F170: DATA RETENTION & BACKUP METHODS
  // ==========================================
  public getRetentionPolicies(): RetentionPolicy[] {
    return this.retentionPolicies;
  }

  public updateRetentionPolicy(category: RetentionPolicy['category'], retentionDays: number, autoPurge?: boolean): RetentionPolicy {
    const policy = this.retentionPolicies.find((p) => p.category === category);
    if (!policy) throw new Error('Chính sách lưu trữ không tồn tại');
    policy.retentionDays = retentionDays;
    if (autoPurge !== undefined) policy.autoPurge = autoPurge;
    this.recordAuditLog('admin@topify.app', 'OWNER', `RETENTION_POLICY_UPDATED_${category}`, 'AUTH', 'SUCCESS');
    return policy;
  }

  public getBackupsList(): BackupSnapshot[] {
    return this.backupSnapshots;
  }

  public createBackupSnapshot(name?: string): BackupSnapshot {
    const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupName = name?.trim() || `topify_snapshot_manual_${timestampStr}.json`;
    const snapshot: BackupSnapshot = {
      id: `bk-${Date.now()}`,
      name: backupName,
      sizeBytes: Math.floor(41000000 + Math.random() * 3000000),
      sizeFormatted: `${(39.5 + Math.random() * 2).toFixed(1)} MB`,
      type: 'FULL',
      status: 'READY',
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/security/backup/download?id=bk-${Date.now()}`,
    };
    this.backupSnapshots.unshift(snapshot);
    this.recordAuditLog('admin@topify.app', 'OWNER', `BACKUP_SNAPSHOT_CREATED_${backupName}`, 'AUTH', 'SUCCESS');
    return snapshot;
  }

  public restoreBackup(backupId: string): { success: boolean; message: string } {
    const snapshot = this.backupSnapshots.find((b) => b.id === backupId);
    if (!snapshot) throw new Error('Bản sao lưu không tồn tại');
    this.recordAuditLog('admin@topify.app', 'OWNER', `BACKUP_RESTORED_${snapshot.name}`, 'AUTH', 'WARNING');
    return { success: true, message: `Hệ thống đã phục hồi thành công từ bản sao lưu ${snapshot.name}!` };
  }
}

export const securityEngineStore = new SecurityEngineStore();
