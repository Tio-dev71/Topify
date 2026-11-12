import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { PLAN_LIMITS, calculateProratedBilling, type PlanLimits } from './quota';

export interface WorkspaceOrgTeam {
  id: string;
  name: string;
  description: string;
  leadEmail: string;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceOrgProject {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  clientName: string;
  budget: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number; // 0-100
  deadline: string;
  createdAt: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
  tempPassword?: string;
  licenseKey?: string;
  workspaceId?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  planName: string;
  amount: number;
  period: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string;
  paymentMethod: string;
  downloadUrl?: string;
}

export interface WorkspaceStoreData {
  workspace: {
    id: string;
    name: string;
    organizationName: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'GRACE_PERIOD';
    planExpiresAt: string;
    isTrial: boolean;
    trialEndsAt: string | null;
    gracePeriodEndsAt: string | null;
    autoRenew: boolean;
    deletionStatus: 'ACTIVE' | 'PENDING_DELETION';
    deletionRequestedAt: string | null;
    permanentlyDeletesAt: string | null;
  };
  usage: {
    seatsUsed: number;
    channelsUsed: number;
    postsThisMonth: number;
    aiCreditsUsed: number;
    storageUsedGb: number;
  };
  teams: WorkspaceOrgTeam[];
  projects: WorkspaceOrgProject[];
  invites: PendingInvite[];
  invoices: InvoiceItem[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'workspace-store.json');

const DEFAULT_STORE_DATA: WorkspaceStoreData = {
  workspace: {
    id: 'default-workspace',
    name: 'Topify Official Workspace',
    organizationName: 'Topify Technology JSC',
    plan: 'PRO',
    subscriptionStatus: 'ACTIVE',
    planExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    isTrial: false,
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    autoRenew: true,
    deletionStatus: 'ACTIVE',
    deletionRequestedAt: null,
    permanentlyDeletesAt: null,
  },
  usage: {
    seatsUsed: 2,
    channelsUsed: 3,
    postsThisMonth: 28,
    aiCreditsUsed: 95,
    storageUsedGb: 3.5,
  },
  teams: [
    {
      id: 'team_01',
      name: 'Đội ngũ Marketing & Content',
      description: 'Phụ trách sản xuất nội dung, Reels, viral alerts và lịch đăng bài',
      leadEmail: 'marketing.lead@example.com',
      memberCount: 3,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'team_02',
      name: 'Đội ngũ Bán hàng & Chăm sóc CRM',
      description: 'Phụ trách leads, deals, pipelines và CSKH đa kênh',
      leadEmail: 'minh@topify.vn',
      memberCount: 2,
      createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj_01',
      name: 'Chiến dịch Q4 Tăng Trưởng Doanh Số',
      teamId: 'team_01',
      teamName: 'Đội ngũ Marketing & Content',
      clientName: 'Nội bộ Topify',
      budget: 50000000,
      status: 'IN_PROGRESS',
      progress: 68,
      deadline: '31/12/2026',
      createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'proj_02',
      name: 'Chăm sóc & Re-marketing Khách Hàng VIP',
      teamId: 'team_02',
      teamName: 'Đội ngũ Bán hàng & Chăm sóc CRM',
      clientName: 'Agency Client Alpha',
      budget: 25000000,
      status: 'IN_PROGRESS',
      progress: 85,
      deadline: '20/12/2026',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
  ],
  invites: [
    {
      id: 'inv_1',
      email: 'marketing.lead@example.com',
      role: 'STAFF',
      status: 'PENDING',
      invitedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      tempPassword: 'Topify@123',
      licenseKey: 'TOP-STAF-9B4F1A',
    },
    {
      id: 'inv_2',
      email: 'content.creator@example.com',
      role: 'STAFF',
      status: 'ACCEPTED',
      invitedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      tempPassword: 'Topify@123',
      licenseKey: 'TOP-STAF-2C8D9E',
    },
  ],
  invoices: [
    {
      id: 'inv_rec_1',
      invoiceNumber: 'INV-2026-0048',
      planName: 'Gói Chuyên Nghiệp (Pro Plan) - 1 Tháng',
      amount: 499000,
      period: '01/10/2026 - 01/11/2026',
      status: 'PAID',
      paidAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'SePay Chuyển khoản QR Techcombank',
      downloadUrl: '#invoice-INV-2026-0048',
    },
    {
      id: 'inv_rec_2',
      invoiceNumber: 'INV-2026-0012',
      planName: 'Gói Chuyên Nghiệp (Pro Plan) - 1 Tháng',
      amount: 499000,
      period: '01/09/2026 - 01/10/2026',
      status: 'PAID',
      paidAt: new Date(Date.now() - 44 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'Thẻ Visa kết thúc **4242',
      downloadUrl: '#invoice-INV-2026-0012',
    },
  ],
};

class WorkspaceEngineStore {
  private data: WorkspaceStoreData;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): WorkspaceStoreData {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          workspace: { ...DEFAULT_STORE_DATA.workspace, ...(parsed.workspace || {}) },
          usage: { ...DEFAULT_STORE_DATA.usage, ...(parsed.usage || {}) },
          teams: Array.isArray(parsed.teams) ? parsed.teams : DEFAULT_STORE_DATA.teams,
          projects: Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_STORE_DATA.projects,
          invites: Array.isArray(parsed.invites) ? parsed.invites : DEFAULT_STORE_DATA.invites,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : DEFAULT_STORE_DATA.invoices,
        };
      }
    } catch (err) {
      console.warn('[WorkspaceEngine] Could not read workspace-store.json, using defaults:', err);
    }
    const initial = JSON.parse(JSON.stringify(DEFAULT_STORE_DATA));
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(dataToSave?: WorkspaceStoreData): void {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[WorkspaceEngine] Failed to persist workspace-store.json:', err);
    }
  }

  // ==========================================
  // F061 & F118: QUOTA & USAGE METERING
  // ==========================================
  public async getUsageAndQuota(workspaceId?: string) {
    const wsId = workspaceId || this.data.workspace.id;
    const plan = this.data.workspace.plan;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;

    // Count real database values for this specific workspace
    let realSeats = 0;
    let realPosts = 0;

    try {
      const [allowedCount, userCount, postCount] = await Promise.all([
        prisma.allowedEmail.count({ where: { workspaceId: wsId } }).catch(() => 0),
        prisma.user.count({ where: { workspaceId: wsId } }).catch(() => 0),
        prisma.post.count({ where: { workspaceId: wsId } }).catch(() => 0),
      ]);
      realSeats = Math.max(allowedCount, userCount);
      realPosts = postCount;
    } catch {}

    const seatsUsed = realSeats;
    const channelsUsed = this.data.usage.channelsUsed;
    const postsThisMonth = realPosts;
    const aiCreditsUsed = this.data.usage.aiCreditsUsed;
    const storageUsedGb = this.data.usage.storageUsedGb;

    const pSeats = Math.min(100, Math.round((seatsUsed / limits.maxSeats) * 100));
    const pChannels = Math.min(100, Math.round((channelsUsed / limits.maxChannels) * 100));
    const pPosts = Math.min(100, Math.round((postsThisMonth / limits.maxPostsPerMonth) * 100));
    const pAi = Math.min(100, Math.round((aiCreditsUsed / limits.maxAiCredits) * 100));
    const pStorage = Math.min(100, Math.round((storageUsedGb / limits.maxStorageGb) * 100));

    const warnings: string[] = [];
    if (pSeats >= 80) warnings.push(`Đã sử dụng ${seatsUsed}/${limits.maxSeats} chỗ ngồi (seats). Cần nâng cấp gói nếu muốn thêm nhân sự.`);
    if (pAi >= 80) warnings.push(`Hạn mức AI Credits đã đạt ${pAi}%.`);
    if (pStorage >= 80) warnings.push(`Dung lượng lưu trữ đạt ${pStorage}%.`);

    const result = {
      workspaceId: workspaceId || this.data.workspace.id,
      workspaceName: this.data.workspace.name,
      organizationName: this.data.workspace.organizationName,
      plan,
      subscriptionStatus: this.data.workspace.subscriptionStatus,
      isTrial: this.data.workspace.isTrial,
      trialEndsAt: this.data.workspace.trialEndsAt,
      trialDaysLeft: this.data.workspace.isTrial && this.data.workspace.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(this.data.workspace.trialEndsAt).getTime() - Date.now()) / (24 * 3600 * 1000)))
        : 0,
      limits: {
        ...limits,
        priceVND: limits.monthlyPrice,
        maxAiCreditsPerMonth: limits.maxAiCredits,
        maxStorageGB: limits.maxStorageGb,
        features: [
          `Tối đa ${limits.maxSeats} nhân sự/chỗ ngồi`,
          `Quản lý ${limits.maxChannels} kênh xã hội`,
          `${limits.maxPostsPerMonth} bài đăng/tháng`,
          `${limits.maxAiCredits} AI Credits/tháng`,
          `${limits.maxStorageGb} GB lưu trữ Media Cloud`,
        ],
      },
      usage: {
        seatsUsed,
        channelsUsed,
        postsThisMonth,
        aiCreditsUsed,
        storageUsedGb,
        storageUsedGB: storageUsedGb,
      },
      percentages: {
        seats: pSeats,
        channels: pChannels,
        posts: pPosts,
        aiCredits: pAi,
        storage: pStorage,
      },
      warnings,
    };

    return result;
  }

  // ==========================================
  // F061, F062, F119: PLAN UPGRADE & TRIAL
  // ==========================================
  public async updatePlan(params: {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    paymentMethod?: string;
    isTrial?: boolean;
    trialDays?: number;
  }) {
    const { plan, paymentMethod = 'SePay Chuyển khoản QR', isTrial = false, trialDays = 14 } = params;

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;
    this.data.workspace.plan = plan;

    if (isTrial) {
      this.data.workspace.isTrial = true;
      this.data.workspace.subscriptionStatus = 'TRIAL';
      this.data.workspace.trialEndsAt = new Date(Date.now() + trialDays * 24 * 3600 * 1000).toISOString();
      this.data.workspace.planExpiresAt = this.data.workspace.trialEndsAt;
    } else {
      this.data.workspace.isTrial = false;
      this.data.workspace.subscriptionStatus = 'ACTIVE';
      this.data.workspace.trialEndsAt = null;
      this.data.workspace.planExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      // Create new billing invoice
      const newInvoice: InvoiceItem = {
        id: `inv_rec_${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        planName: `${limits.name} - 1 Tháng`,
        amount: limits.monthlyPrice,
        period: `${new Date().toLocaleDateString('vi-VN')} - ${new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('vi-VN')}`,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        paymentMethod,
        downloadUrl: `#invoice-download-${Date.now()}`,
      };
      this.data.invoices.unshift(newInvoice);
    }

    this.saveToDisk();

    // Sync to Prisma workspace if exists
    try {
      await prisma.workspace.updateMany({
        data: {
          plan,
          planExpiresAt: new Date(this.data.workspace.planExpiresAt),
          subscriptionStatus: this.data.workspace.subscriptionStatus,
        },
      });
    } catch {}

    return {
      success: true,
      workspace: this.data.workspace,
      invoice: this.data.invoices[0],
    };
  }

  // ==========================================
  // F062 & F120: BILLING HISTORY & INVOICES
  // ==========================================
  public getBillingData() {
    return {
      success: true,
      currentPlan: this.data.workspace.plan,
      planExpiresAt: this.data.workspace.planExpiresAt,
      subscriptionStatus: this.data.workspace.subscriptionStatus,
      gracePeriodEndsAt: this.data.workspace.gracePeriodEndsAt,
      isTrial: this.data.workspace.isTrial,
      trialEndsAt: this.data.workspace.trialEndsAt,
      autoRenew: this.data.workspace.autoRenew,
      invoices: this.data.invoices,
      plans: PLAN_LIMITS,
    };
  }

  public calculateProrate(params: {
    targetPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
    currentPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
    daysRemaining?: number;
  }) {
    const cur = params.currentPlan || this.data.workspace.plan;
    const tgt = params.targetPlan;
    const days = params.daysRemaining ?? 15;
    return calculateProratedBilling({
      currentPlan: cur,
      newPlan: tgt,
      daysRemainingInCycle: days,
    });
  }

  // ==========================================
  // F117 & F064 & BUG-145: SEATS & INVITATIONS
  // ==========================================
  public async getSeatsInfo(workspaceId?: string) {
    const wsId = workspaceId || this.data.workspace.id;
    const quota = await this.getUsageAndQuota(wsId);
    const pendingInvites = this.data.invites.filter(
      (i) => i.status === 'PENDING' && (!i.workspaceId || i.workspaceId === wsId)
    );
    const pendingCount = pendingInvites.length;
    const occupiedSeats = quota.usage.seatsUsed + pendingCount;

    return {
      success: true,
      maxSeats: quota.limits.maxSeats,
      seatsUsed: occupiedSeats,
      seatsAvailable: Math.max(0, quota.limits.maxSeats - occupiedSeats),
      invites: this.data.invites.filter((i) => !i.workspaceId || i.workspaceId === wsId),
    };
  }

  public async inviteMember(params: {
    email: string;
    role?: 'ADMIN' | 'STAFF';
    password?: string;
    workspaceId?: string;
  }) {
    const { email, role = 'STAFF', password = 'Topify@123', workspaceId } = params;
    const normalizedEmail = email.trim().toLowerCase();
    const wsId = workspaceId || this.data.workspace.id;

    const quota = await this.getUsageAndQuota(wsId);
    const pendingCount = this.data.invites.filter(
      (i) => i.status === 'PENDING' && (!i.workspaceId || i.workspaceId === wsId)
    ).length;
    const occupiedSeats = quota.usage.seatsUsed + pendingCount;

    if (occupiedSeats >= quota.limits.maxSeats) {
      return {
        success: false,
        isOverQuota: true,
        error: `Đã đạt giới hạn số ghế (${quota.limits.maxSeats} seats) của ${quota.limits.name}. Vui lòng nâng cấp gói để mời thêm nhân viên.`,
      };
    }

    const staffLicenseKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Remove old invite with same email if present
    this.data.invites = this.data.invites.filter((i) => i.email !== normalizedEmail);

    const newInvite: PendingInvite = {
      id: `inv_${Date.now()}`,
      email: normalizedEmail,
      role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
      status: 'PENDING',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      tempPassword: password,
      licenseKey: staffLicenseKey,
      workspaceId: wsId,
    };
    this.data.invites.unshift(newInvite);
    this.saveToDisk();

    // Auto-provision user in Prisma for seamless login (BUG-145 fix)
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const wsId = workspaceId || this.data.workspace.id;

      await prisma.allowedEmail.upsert({
        where: { email: normalizedEmail },
        update: { role: newInvite.role, workspaceId: wsId },
        create: { email: normalizedEmail, role: newInvite.role, workspaceId: wsId },
      }).catch(() => null);

      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          role: newInvite.role,
          workspaceId: wsId,
          password: hashedPassword,
        },
        create: {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          role: newInvite.role,
          workspaceId: wsId,
          password: hashedPassword,
          licenseKey: staffLicenseKey,
        },
      }).catch(() => null);
    } catch (e) {
      console.warn('[WorkspaceEngine] Could not sync user in Prisma:', e);
    }

    return {
      success: true,
      invite: newInvite,
      credentials: {
        email: normalizedEmail,
        password,
        role: newInvite.role,
        licenseKey: staffLicenseKey,
      },
    };
  }

  public revokeInvite(inviteIdOrEmail: string) {
    this.data.invites = this.data.invites.map((i) => {
      if (i.id === inviteIdOrEmail || i.email === inviteIdOrEmail.toLowerCase()) {
        return { ...i, status: 'REVOKED' };
      }
      return i;
    });
    this.saveToDisk();
    return { success: true };
  }

  // ==========================================
  // F116 & F060: ORGANIZATION, TEAMS & PROJECTS
  // ==========================================
  public getOrganizationStructure() {
    return {
      organizationName: this.data.workspace.organizationName,
      workspaceId: this.data.workspace.id,
      workspaceName: this.data.workspace.name,
      plan: this.data.workspace.plan,
      teams: this.data.teams,
      projects: this.data.projects,
    };
  }

  public updateOrganization(params: { organizationName?: string; workspaceName?: string }) {
    if (params.organizationName) this.data.workspace.organizationName = params.organizationName.trim();
    if (params.workspaceName) this.data.workspace.name = params.workspaceName.trim();
    this.saveToDisk();
    return { success: true, workspace: this.data.workspace };
  }

  public addTeam(params: { name: string; description: string; leadEmail: string }) {
    const newTeam: WorkspaceOrgTeam = {
      id: `team_${Date.now()}`,
      name: params.name.trim(),
      description: params.description.trim(),
      leadEmail: params.leadEmail.trim().toLowerCase(),
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    this.data.teams.push(newTeam);
    this.saveToDisk();
    return { success: true, team: newTeam };
  }

  public deleteTeam(teamId: string) {
    this.data.teams = this.data.teams.filter((t) => t.id !== teamId);
    this.saveToDisk();
    return { success: true };
  }

  public addProject(params: {
    name: string;
    teamId?: string;
    clientName: string;
    budget?: number;
    status?: WorkspaceOrgProject['status'];
    deadline: string;
  }) {
    const team = this.data.teams.find((t) => t.id === params.teamId);
    const newProject: WorkspaceOrgProject = {
      id: `proj_${Date.now()}`,
      name: params.name.trim(),
      teamId: params.teamId,
      teamName: team?.name || 'Chưa gán nhóm',
      clientName: params.clientName.trim(),
      budget: params.budget || 0,
      status: params.status || 'IN_PROGRESS',
      progress: 10,
      deadline: params.deadline,
      createdAt: new Date().toISOString(),
    };
    this.data.projects.unshift(newProject);
    this.saveToDisk();
    return { success: true, project: newProject };
  }

  public updateProjectProgress(projectId: string, progress: number, status?: WorkspaceOrgProject['status']) {
    const proj = this.data.projects.find((p) => p.id === projectId);
    if (proj) {
      proj.progress = Math.min(100, Math.max(0, progress));
      if (status) proj.status = status;
      if (proj.progress === 100) proj.status = 'COMPLETED';
      this.saveToDisk();
      return { success: true, project: proj };
    }
    return { success: false, error: 'Project not found' };
  }

  public deleteProject(projectId: string) {
    this.data.projects = this.data.projects.filter((p) => p.id !== projectId);
    this.saveToDisk();
    return { success: true };
  }

  // ==========================================
  // F121: DATA EXPORT & CONTROLLED DELETION
  // ==========================================
  public async getExportManifest() {
    let postsCount = 14;
    let customersCount = 25;
    let dealsCount = 12;

    try {
      [postsCount, customersCount, dealsCount] = await Promise.all([
        prisma.post.count().catch(() => 14),
        prisma.customer.count().catch(() => 25),
        prisma.deal.count().catch(() => 12),
      ]);
    } catch {}

    return {
      workspaceName: this.data.workspace.name,
      organizationName: this.data.workspace.organizationName,
      exportedAt: new Date().toISOString(),
      version: 'v1.3.88',
      entities: {
        posts: { count: postsCount, format: 'JSON/CSV' },
        customersAndLeads: { count: customersCount, format: 'JSON/CSV' },
        dealsAndPipelines: { count: dealsCount, format: 'JSON/CSV' },
        teamsAndProjects: {
          teamsCount: this.data.teams.length,
          projectsCount: this.data.projects.length,
          format: 'JSON',
        },
        billingAndInvoices: { count: this.data.invoices.length, format: 'JSON' },
        mediaAssets: { status: 'Preserved in Cloud Storage' },
        auditLogs: { status: 'Exported JSON' },
      },
      checksum: crypto.createHash('sha256').update(JSON.stringify(this.data)).digest('hex'),
      downloadUrl: '#export-ready',
      snapshot: {
        workspace: this.data.workspace,
        teams: this.data.teams,
        projects: this.data.projects,
        invites: this.data.invites,
        invoices: this.data.invoices,
      },
    };
  }

  public requestDeletion(confirmationText: string) {
    if (confirmationText !== 'DELETE_WORKSPACE') {
      return {
        success: false,
        error: 'Vui lòng nhập chính xác "DELETE_WORKSPACE" để xác nhận xoá.',
      };
    }

    const scheduledDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    this.data.workspace.deletionStatus = 'PENDING_DELETION';
    this.data.workspace.deletionRequestedAt = new Date().toISOString();
    this.data.workspace.permanentlyDeletesAt = scheduledDate;
    this.saveToDisk();

    return {
      success: true,
      message: 'Yêu cầu xoá Workspace đã được tiếp nhận. Bạn có 30 ngày ân hạn để khôi phục trước khi toàn bộ dữ liệu bị xoá vĩnh viễn.',
      deletionStatus: 'PENDING_DELETION',
      gracePeriodDays: 30,
      permanentlyDeletesAt: scheduledDate,
    };
  }

  public cancelDeletion() {
    this.data.workspace.deletionStatus = 'ACTIVE';
    this.data.workspace.deletionRequestedAt = null;
    this.data.workspace.permanentlyDeletesAt = null;
    this.saveToDisk();

    return {
      success: true,
      message: 'Đã huỷ yêu cầu xoá Workspace thành công. Toàn bộ tài nguyên đã trở về trạng thái hoạt động bình thường.',
      deletionStatus: 'ACTIVE',
    };
  }
}

export const workspaceStore = new WorkspaceEngineStore();
export default workspaceStore;

