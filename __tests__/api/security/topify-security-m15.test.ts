import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

describe('M15 Security & Integrations - F163 to F170 Test Suite', () => {
  // =========================================================================
  // F163: 2FA (Two-Factor Authentication)
  // =========================================================================
  describe('F163 2FA (Two-Factor Authentication)', () => {
    it('GET /api/security/2fa returns current 2FA status, secret key, qr code and backup codes', async () => {
      const { GET } = await import('@/app/api/security/2fa/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.twoFactor).toBeDefined();
      expect(typeof json.twoFactor.isEnabled).toBe('boolean');
      expect(json.twoFactor.secretKey).toBeDefined();
      expect(json.twoFactor.qrCodeUrl).toContain('otpauth://totp/');
      expect(Array.isArray(json.twoFactor.recoveryCodes)).toBe(true);
      expect(json.twoFactor.recoveryCodes.length).toBe(8);
    });

    it('POST /api/security/2fa enables 2FA with 6-digit verification code', async () => {
      const { POST } = await import('@/app/api/security/2fa/route');
      const req = new NextRequest('http://localhost:3000/api/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '123456', enable: true }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.twoFactor.isEnabled).toBe(true);
    });

    it('POST /api/security/2fa disables 2FA', async () => {
      const { POST } = await import('@/app/api/security/2fa/route');
      const req = new NextRequest('http://localhost:3000/api/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: false }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.twoFactor.isEnabled).toBe(false);
    });
  });

  // =========================================================================
  // F164: LOGIN HISTORY & ACTIVE SESSIONS
  // =========================================================================
  describe('F164 Login History & Active Session', () => {
    it('GET /api/security/sessions-ip returns active sessions, trusted IPs, and login history', async () => {
      const { GET } = await import('@/app/api/security/sessions-ip/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(json.sessions)).toBe(true);
      expect(json.sessions.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(json.trustedIps)).toBe(true);
      expect(Array.isArray(json.loginHistory)).toBe(true);
      expect(json.loginHistory.length).toBeGreaterThanOrEqual(2);

      const hist = json.loginHistory[0];
      expect(hist.id).toBeDefined();
      expect(hist.actorEmail).toBeDefined();
      expect(hist.ipAddress).toBeDefined();
      expect(hist.status).toBeDefined();
    });

    it('POST /api/security/sessions-ip adds and manages trusted IPs', async () => {
      const { POST } = await import('@/app/api/security/sessions-ip/route');
      const req = new NextRequest('http://localhost:3000/api/security/sessions-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_trusted_ip',
          ipAddressOrCidr: '118.69.182.50',
          label: 'Văn phòng Đà Nẵng',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      const added = json.trustedIps.find((ip: any) => ip.ipAddressOrCidr === '118.69.182.50');
      expect(added).toBeDefined();
      expect(added.label).toBe('Văn phòng Đà Nẵng');
    });
  });

  // =========================================================================
  // F165: SUSPICIOUS LOGIN ALERTS
  // =========================================================================
  describe('F165 Suspicious Login Alert', () => {
    it('GET /api/security/suspicious-alerts returns anomaly alerts and threshold config', async () => {
      const { GET } = await import('@/app/api/security/suspicious-alerts/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.alerts)).toBe(true);
      expect(json.data.alerts.length).toBeGreaterThanOrEqual(1);
      expect(json.data.config).toBeDefined();
      expect(json.data.config.geoVelocityLimitKmh).toBeGreaterThan(0);
    });

    it('POST /api/security/suspicious-alerts resolves an alert by blocking session', async () => {
      const { POST } = await import('@/app/api/security/suspicious-alerts/route');
      const req = new NextRequest('http://localhost:3000/api/security/suspicious-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          alertId: 'sus-alert-1',
          resolution: 'BLOCKED',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.alert.status).toBe('BLOCKED');
    });
  });

  // =========================================================================
  // F166: OAUTH PERMISSION AUDIT
  // =========================================================================
  describe('F166 OAuth Permission Audit', () => {
    it('GET /api/security/oauth-audit audits social accounts, token health and missing scopes', async () => {
      const { GET } = await import('@/app/api/security/oauth-audit/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.accounts)).toBe(true);
      expect(json.data.accounts.length).toBeGreaterThanOrEqual(3);
      expect(typeof json.data.averageHealthScore).toBe('number');

      const fb = json.data.accounts.find((a: any) => a.provider === 'FACEBOOK');
      expect(fb).toBeDefined();
      expect(fb.grantedScopes).toBeDefined();
    });

    it('POST /api/security/oauth-audit rechecks and refreshes account tokens', async () => {
      const { POST } = await import('@/app/api/security/oauth-audit/route');
      const req = new NextRequest('http://localhost:3000/api/security/oauth-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recheck',
          accountId: 'oauth-fb-1',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.account.healthScore).toBe(100);
    });
  });

  // =========================================================================
  // F167: API KEY MANAGEMENT
  // =========================================================================
  describe('F167 API Key Management', () => {
    let createdKeyId = '';

    it('POST /api/security/api-keys creates a new API key with prefix and secret', async () => {
      const { POST } = await import('@/app/api/security/api-keys/route');
      const req = new NextRequest('http://localhost:3000/api/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: 'Vitest Automated Sync Key',
          roleScope: 'READ_WRITE',
          ipWhitelist: '10.0.0.1/24',
          daysValid: 90,
          rateLimitPerMin: 120,
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.key.name).toBe('Vitest Automated Sync Key');
      expect(json.key.keyPrefix).toBeDefined();
      expect(json.fullSecret).toContain('topify_sec_live_');
      createdKeyId = json.key.id;
    });

    it('POST /api/security/api-keys rotates key with 24h grace period', async () => {
      const { POST } = await import('@/app/api/security/api-keys/route');
      const req = new NextRequest('http://localhost:3000/api/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rotate',
          keyId: createdKeyId,
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.newSecret).toBeDefined();
    });

    it('POST /api/security/api-keys revokes key', async () => {
      const { POST } = await import('@/app/api/security/api-keys/route');
      const req = new NextRequest('http://localhost:3000/api/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          keyId: createdKeyId,
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      const revokedKey = json.apiKeys.find((k: any) => k.id === createdKeyId);
      expect(revokedKey.status).toBe('REVOKED');
    });
  });

  // =========================================================================
  // F168: WEBHOOK GATEWAY
  // =========================================================================
  describe('F168 Webhook Gateway', () => {
    let testWebhookId = '';

    it('POST /api/security/webhooks creates webhook with HMAC-SHA256 signing secret', async () => {
      const { POST } = await import('@/app/api/security/webhooks/route');
      const req = new NextRequest('http://localhost:3000/api/security/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: 'Vitest Test Webhook',
          endpointUrl: 'https://test-server.app/webhook',
          subscribedEvents: ['lead.created', 'post.published'],
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.webhook.secret || json.webhook.signingSecret).toContain('whsec_');
      testWebhookId = json.webhook?.id || 'wh-1';
    });

    it('POST /api/security/webhooks sends test ping payload', async () => {
      const { POST } = await import('@/app/api/security/webhooks/route');
      const req = new NextRequest('http://localhost:3000/api/security/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_ping',
          webhookId: testWebhookId || 'wh-1',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.pingResult.statusCode).toBe(200);
    });

    it('POST /api/security/webhooks retries failed delivery log', async () => {
      const { POST } = await import('@/app/api/security/webhooks/route');
      const req = new NextRequest('http://localhost:3000/api/security/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry',
          logId: 'log-1',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.retryResult.statusCode || json.retryResult.log.responseStatus).toBe(200);
    });
  });

  // =========================================================================
  // F169: PUBLIC API CATALOG & SANDBOX
  // =========================================================================
  describe('F169 Public REST API', () => {
    it('GET /api/security/public-api returns catalog for Channels, Content, CRM, Tasks, Analytics and quota', async () => {
      const { GET } = await import('@/app/api/security/public-api/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.endpoints)).toBe(true);
      expect(json.data.endpoints.length).toBeGreaterThanOrEqual(5);
      expect(json.data.quotaInfo).toBeDefined();
      expect(json.data.quotaInfo.monthlyQuotaRequests).toBe(200000);
    });

    it('POST /api/security/public-api executes sandbox test call', async () => {
      const { POST } = await import('@/app/api/security/public-api/route');
      const req = new NextRequest('http://localhost:3000/api/security/public-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointPath: '/api/v1/channels',
          method: 'GET',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.statusCode).toBe(200);
      expect(json.data.executionTimeMs).toBeGreaterThan(0);
      expect(json.data.responseBody.success).toBe(true);
    });
  });

  // =========================================================================
  // F170: DATA RETENTION & BACKUP
  // =========================================================================
  describe('F170 Data Retention & Backup', () => {
    it('GET /api/security/backup returns retention policies, snapshot backups and summary', async () => {
      const { GET } = await import('@/app/api/security/backup/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.policies)).toBe(true);
      expect(json.data.policies.length).toBe(4);
      expect(Array.isArray(json.data.backups)).toBe(true);
      expect(json.data.summary.totalBackups).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/security/backup updates retention policy duration and auto-purge', async () => {
      const { POST } = await import('@/app/api/security/backup/route');
      const req = new NextRequest('http://localhost:3000/api/security/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_retention',
          category: 'AUDIT_LOGS',
          retentionDays: 180,
          autoPurge: true,
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.policy.retentionDays).toBe(180);
    });

    it('POST /api/security/backup creates 1-click snapshot backup and restores it', async () => {
      const { POST } = await import('@/app/api/security/backup/route');
      // Create snapshot
      const createReq = new NextRequest('http://localhost:3000/api/security/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_backup',
          name: 'Vitest Full Database Snapshot',
        }),
      });
      const createRes = await POST(createReq);
      const createJson = await createRes.json();

      expect(createRes.status).toBe(200);
      expect(createJson.success).toBe(true);
      const snapshotId = createJson.data.snapshot.id;
      expect(snapshotId).toBeDefined();

      // Restore snapshot
      const restoreReq = new NextRequest('http://localhost:3000/api/security/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_backup',
          backupId: snapshotId,
        }),
      });
      const restoreRes = await POST(restoreReq);
      const restoreJson = await restoreRes.json();

      expect(restoreRes.status).toBe(200);
      expect(restoreJson.success).toBe(true);
      expect(restoreJson.message).toMatch(/phục hồi|Khôi phục/i);
    });
  });
});
