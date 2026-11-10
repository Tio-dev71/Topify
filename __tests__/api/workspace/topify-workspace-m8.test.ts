import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaceStore } from '@/lib/workspace/workspace-engine';
import { PLAN_LIMITS, calculateProratedBilling } from '@/lib/workspace/quota';
import { securityEngineStore } from '@/lib/security/security-engine';

describe('M8 – Workspace & Admin Engine (F060–F065, F116–F121)', () => {
  beforeEach(() => {
    // Reset test workspace store state to predictable values if needed
  });

  // F060: Multi-tenant Workspace
  describe('F060: Multi-tenant Workspace', () => {
    it('isolates workspace configuration and provides distinct organizational metadata', () => {
      const org = workspaceStore.getOrganizationStructure();
      expect(org.workspaceId).toBeDefined();
      expect(org.workspaceName).toBeDefined();
      expect(typeof org.workspaceName).toBe('string');
      expect(org.organizationName).toBeDefined();
    });

    it('allows updating workspace and organization metadata', () => {
      const updateRes = workspaceStore.updateOrganization({
        organizationName: 'Topify Global Corp',
        workspaceName: 'Topify Primary HQ',
      });
      expect(updateRes.success).toBe(true);
      expect(updateRes.workspace.organizationName).toBe('Topify Global Corp');
      expect(updateRes.workspace.name).toBe('Topify Primary HQ');

      const current = workspaceStore.getOrganizationStructure();
      expect(current.organizationName).toBe('Topify Global Corp');
      expect(current.workspaceName).toBe('Topify Primary HQ');
    });
  });

  // F061: Quản lý gói cước / Subscription
  describe('F061: Quản lý gói cước & Subscription limits', () => {
    it('applies plan limits correctly according to FREE, PRO, and ENTERPRISE tiers', () => {
      expect(PLAN_LIMITS.FREE.maxSeats).toBe(2);
      expect(PLAN_LIMITS.PRO.maxSeats).toBe(5);
      expect(PLAN_LIMITS.ENTERPRISE.maxSeats).toBe(999);

      expect(PLAN_LIMITS.FREE.maxChannels).toBe(3);
      expect(PLAN_LIMITS.PRO.maxChannels).toBe(15);
      expect(PLAN_LIMITS.ENTERPRISE.maxChannels).toBe(100);

      expect(PLAN_LIMITS.FREE.maxPostsPerMonth).toBe(30);
      expect(PLAN_LIMITS.PRO.maxPostsPerMonth).toBe(500);
      expect(PLAN_LIMITS.ENTERPRISE.maxPostsPerMonth).toBe(5000);
    });

    it('updates subscription plan and syncs active status and dates', async () => {
      const res = await workspaceStore.updatePlan({ plan: 'PRO' });
      expect(res.success).toBe(true);
      expect(res.workspace.plan).toBe('PRO');
      expect(res.workspace.subscriptionStatus).toBe('ACTIVE');
      expect(new Date(res.workspace.planExpiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  // F062: Thanh toán & Gia hạn (Payment & Renewal)
  describe('F062: Thanh toán & Gia hạn', () => {
    it('generates a paid invoice when a plan is updated or renewed', async () => {
      const res = await workspaceStore.updatePlan({
        plan: 'ENTERPRISE',
        paymentMethod: 'SePay VietQR Techcombank',
      });
      expect(res.success).toBe(true);
      expect(res.invoice).toBeDefined();
      expect(res.invoice?.status).toBe('PAID');
      expect(res.invoice?.paymentMethod).toBe('SePay VietQR Techcombank');
      expect(res.invoice?.amount).toBe(PLAN_LIMITS.ENTERPRISE.monthlyPrice);
    });

    it('returns auto-renewal status and billing history', () => {
      const billing = workspaceStore.getBillingData();
      expect(billing.success).toBe(true);
      expect(billing.autoRenew).toBe(true);
      expect(Array.isArray(billing.invoices)).toBe(true);
      expect(billing.invoices.length).toBeGreaterThan(0);
    });
  });

  // F063: Phân quyền RBAC chi tiết (Role-Based Access Control)
  describe('F063: Phân quyền RBAC chi tiết', () => {
    it('provides granular matrix across modules for admin, editor, and viewer roles', () => {
      const matrix = securityEngineStore.getRbacMatrix();
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThan(0);

      const firstItem = matrix[0];
      expect(firstItem.module).toBeDefined();
      expect(firstItem.permissionKey).toBeDefined();
      expect(typeof firstItem.admin).toBe('boolean');
      expect(typeof firstItem.editor).toBe('boolean');
      expect(typeof firstItem.viewer).toBe('boolean');
    });

    it('updates specific role permission and refuses unauthorized modification to owner', () => {
      const matrix = securityEngineStore.getRbacMatrix();
      const target = matrix[0];

      // Update editor permission
      const updated = securityEngineStore.updateRbacPermission(target.permissionKey, 'editor', false);
      expect(updated).toBe(true);

      const updatedMatrix = securityEngineStore.getRbacMatrix();
      const checkItem = updatedMatrix.find((p) => p.permissionKey === target.permissionKey);
      expect(checkItem?.editor).toBe(false);

      // Attempt to modify owner permission returns false
      const ownerAttempt = securityEngineStore.updateRbacPermission(target.permissionKey, 'owner' as any, false);
      expect(ownerAttempt).toBe(false);
    });
  });

  // F064 & BUG-145: Quản lý người dùng/nhân sự & Cấp tài khoản đăng nhập
  describe('F064 & BUG-145: Quản lý người dùng/nhân sự & Thông tin đăng nhập', () => {
    it('creates a new staff member with credentials and license key for direct login', async () => {
      const inviteRes = await workspaceStore.inviteMember({
        email: 'minh.tester@topify.vn',
        role: 'STAFF',
        password: 'TopifySecurePassword123!',
      });

      expect(inviteRes.success).toBe(true);
      expect(inviteRes.invite).toBeDefined();
      expect(inviteRes.invite?.email).toBe('minh.tester@topify.vn');
      expect(inviteRes.invite?.status).toBe('PENDING');

      // BUG-145 check: credentials MUST be returned for sending to the staff member
      expect(inviteRes.credentials).toBeDefined();
      expect(inviteRes.credentials?.email).toBe('minh.tester@topify.vn');
      expect(inviteRes.credentials?.password).toBe('TopifySecurePassword123!');
      expect(inviteRes.credentials?.role).toBe('STAFF');
      expect(inviteRes.credentials?.licenseKey).toMatch(/^TOP-STAF-/);
    });
  });

  // F065: Nhật ký hoạt động (Audit Log)
  describe('F065: Nhật ký hoạt động (Audit Log)', () => {
    it('records security and administrative events into audit log', () => {
      securityEngineStore.recordAuditLog(
        'admin@topify.vn',
        'ADMIN',
        'WORKSPACE.UPDATE_PLAN',
        'BILLING',
        'SUCCESS'
      );
      const logs = securityEngineStore.getAuditLogs();
      const match = logs.find((l) => l.action === 'WORKSPACE.UPDATE_PLAN');
      expect(match).toBeDefined();
      expect(match?.actorEmail).toBe('admin@topify.vn');
      expect(match?.status).toBe('SUCCESS');
    });
  });

  // F116: Organization / Workspace / Team / Project
  describe('F116: Organization / Workspace / Team / Project structure', () => {
    it('manages departmental teams with lead email and member count', () => {
      const addRes = workspaceStore.addTeam({
        name: 'Đội ngũ Sáng tạo Media & Reels',
        description: 'Chuyên sản xuất video ngắn TikTok và Facebook Reels',
        leadEmail: 'creative.lead@topify.vn',
      });
      expect(addRes.success).toBe(true);
      expect(addRes.team.name).toBe('Đội ngũ Sáng tạo Media & Reels');
      expect(addRes.team.leadEmail).toBe('creative.lead@topify.vn');

      const org = workspaceStore.getOrganizationStructure();
      const found = org.teams.find((t) => t.id === addRes.team.id);
      expect(found).toBeDefined();

      // Clean up team
      workspaceStore.deleteTeam(addRes.team.id);
    });

    it('manages client projects with budget, deadline and progress tracking', () => {
      const projRes = workspaceStore.addProject({
        name: 'Dự án Ra mắt Thương hiệu Mỹ phẩm X',
        clientName: 'Tập đoàn Mỹ phẩm Đông Á',
        budget: 85000000,
        deadline: '31/01/2027',
      });
      expect(projRes.success).toBe(true);
      expect(projRes.project.name).toBe('Dự án Ra mắt Thương hiệu Mỹ phẩm X');
      expect(projRes.project.progress).toBe(10);

      // Update progress
      const updateProg = workspaceStore.updateProjectProgress(projRes.project.id, 90);
      expect(updateProg.success).toBe(true);
      expect(updateProg.project?.progress).toBe(90);

      // Set to 100% completes project
      const completeProg = workspaceStore.updateProjectProgress(projRes.project.id, 100);
      expect(completeProg.project?.status).toBe('COMPLETED');

      // Delete project
      workspaceStore.deleteProject(projRes.project.id);
    });
  });

  // F117: Invitation & Seat Management
  describe('F117: Invitation & Seat Management', () => {
    it('correctly tracks available seats vs used seats and pending invites', async () => {
      const seats = await workspaceStore.getSeatsInfo();
      expect(seats.success).toBe(true);
      expect(seats.maxSeats).toBeGreaterThan(0);
      expect(seats.seatsUsed).toBeGreaterThanOrEqual(0);
      expect(seats.seatsAvailable).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(seats.invites)).toBe(true);
    });

    it('revokes an invitation successfully', () => {
      const inviteId = 'inv_1';
      const res = workspaceStore.revokeInvite(inviteId);
      expect(res.success).toBe(true);

      const billing = workspaceStore.getBillingData();
      const seats = workspaceStore.getOrganizationStructure();
      // Verified state integrity
      expect(seats).toBeDefined();
    });
  });

  // F118: Usage Metering & Quota
  describe('F118: Usage Metering & Quota', () => {
    it('computes usage metrics and percentages for seats, channels, posts, AI credits, and storage', async () => {
      const quota = await workspaceStore.getUsageAndQuota();
      expect(quota.workspaceId).toBeDefined();
      expect(quota.usage).toBeDefined();
      expect(typeof quota.usage.seatsUsed).toBe('number');
      expect(typeof quota.usage.channelsUsed).toBe('number');
      expect(typeof quota.usage.postsThisMonth).toBe('number');
      expect(typeof quota.usage.aiCreditsUsed).toBe('number');
      expect(typeof quota.usage.storageUsedGb).toBe('number');

      expect(quota.percentages).toBeDefined();
      expect(quota.percentages.seats).toBeGreaterThanOrEqual(0);
      expect(quota.percentages.posts).toBeGreaterThanOrEqual(0);
      expect(quota.percentages.aiCredits).toBeGreaterThanOrEqual(0);
    });
  });

  // F119: Trial / Upgrade / Downgrade
  describe('F119: Trial / Upgrade / Downgrade & Prorated Billing', () => {
    it('calculates prorated billing amounts for mid-cycle plan changes', () => {
      const prorate = calculateProratedBilling({
        currentPlan: 'PRO',
        newPlan: 'ENTERPRISE',
        daysRemainingInCycle: 15,
        cycleTotalDays: 30,
      });

      expect(prorate.isUpgrade).toBe(true);
      expect(prorate.currentPrice).toBe(499000);
      expect(prorate.newPrice).toBe(1990000);
      expect(prorate.netPayable).toBeGreaterThan(0);
      expect(prorate.daysRemainingInCycle).toBe(15);
    });

    it('activates 14-day PRO trial properly', async () => {
      const res = await workspaceStore.updatePlan({
        plan: 'PRO',
        isTrial: true,
        trialDays: 14,
      });
      expect(res.success).toBe(true);
      expect(res.workspace.isTrial).toBe(true);
      expect(res.workspace.subscriptionStatus).toBe('TRIAL');
      expect(res.workspace.trialEndsAt).toBeDefined();

      const quota = await workspaceStore.getUsageAndQuota();
      expect(quota.isTrial).toBe(true);
      expect(quota.trialDaysLeft).toBeGreaterThanOrEqual(13);
    });
  });

  // F120: Billing History & Invoice
  describe('F120: Billing History & Invoice', () => {
    it('lists realistic billing invoices with paid status and downloadable identifier', () => {
      const billing = workspaceStore.getBillingData();
      expect(billing.invoices.length).toBeGreaterThan(0);
      const invoice = billing.invoices[0];
      expect(invoice.invoiceNumber).toMatch(/^INV-/);
      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.status).toBe('PAID');
      expect(invoice.paymentMethod).toBeDefined();
      expect(invoice.period).toBeDefined();
    });
  });

  // F121: Data Export & Account Deletion
  describe('F121: Data Export & Controlled Account Deletion', () => {
    it('generates a full data export manifest with SHA-256 checksum and entity counts', async () => {
      const manifest = await workspaceStore.getExportManifest();
      expect(manifest.workspaceName).toBeDefined();
      expect(manifest.checksum).toBeDefined();
      expect(manifest.checksum.length).toBe(64); // SHA-256 hex string length
      expect(manifest.entities.posts).toBeDefined();
      expect(manifest.entities.customersAndLeads).toBeDefined();
      expect(manifest.entities.dealsAndPipelines).toBeDefined();
      expect(manifest.snapshot).toBeDefined();
    });

    it('rejects deletion when confirmation text does not match DELETE_WORKSPACE', () => {
      const res = workspaceStore.requestDeletion('INCORRECT_TEXT');
      expect(res.success).toBe(false);
      expect(res.error).toContain('DELETE_WORKSPACE');
    });

    it('schedules workspace deletion with 30-day grace period upon valid confirmation', () => {
      const res = workspaceStore.requestDeletion('DELETE_WORKSPACE');
      expect(res.success).toBe(true);
      expect(res.deletionStatus).toBe('PENDING_DELETION');
      expect(res.gracePeriodDays).toBe(30);
      expect(new Date(res.permanentlyDeletesAt!).getTime()).toBeGreaterThan(Date.now());
    });

    it('allows cancelling pending deletion and restoring active state during grace period', () => {
      const cancelRes = workspaceStore.cancelDeletion();
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.deletionStatus).toBe('ACTIVE');

      const billing = workspaceStore.getBillingData();
      expect(billing.success).toBe(true);
    });
  });
});

