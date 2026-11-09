import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from '@/app/api/campaigns/route';
import { GET as GET_ASSETS, POST as POST_ASSETS, PATCH as PATCH_ASSETS } from '@/app/api/campaigns/assets/route';
import { NextRequest } from 'next/server';
import { SAMPLE_CAMPAIGNS } from '@/lib/campaigns/engine';

// Mock auth and prisma
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/db', () => ({
  default: {
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({
        id: 'camp_db_123',
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
        budget: data.budget,
        spent: data.spent,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'user_1', defaultWorkspaceId: 'ws_1' }),
    },
    workspace: {
      findFirst: vi.fn().mockResolvedValue({ id: 'ws_1' }),
    },
  },
}));

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

describe('Campaigns API & Planning Data Integrity', () => {
  it('GET /api/campaigns returns all campaigns', async () => {
    const req = new NextRequest('http://localhost:3000/api/campaigns');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.campaigns)).toBe(true);
    expect(data.campaigns.length).toBeGreaterThanOrEqual(3);
  });

  it('verifies camp_2 in PLANNING status has 0 spent and 0 leads', async () => {
    const req = new NextRequest('http://localhost:3000/api/campaigns?status=PLANNING');
    const res = await GET(req);
    const data = await res.json();

    const camp2 = data.campaigns.find((c: any) => c.id === 'camp_2');
    expect(camp2).toBeDefined();
    expect(camp2.status).toBe('PLANNING');
    expect(camp2.totalSpent).toBe(0);

    // Primary KPI should have 0 currentValue and 0% completionRate
    const primaryKpi = camp2.kpis[0];
    expect(primaryKpi.currentValue).toBe(0);
    expect(primaryKpi.completionRate).toBe(0);

    // Financial summary for planning should have 0 actual spend and 0 revenue
    expect(camp2.financialSummary.totalActualSpend).toBe(0);
    expect(camp2.financialSummary.totalRevenue).toBe(0);
    expect(camp2.financialSummary.totalLeads).toBe(0);
  });

  it('verifies date ranges and channels exist on all sample campaigns', () => {
    for (const camp of SAMPLE_CAMPAIGNS) {
      expect(camp.startDate).toBeDefined();
      expect(camp.endDate).toBeDefined();
      expect(new Date(camp.startDate).getFullYear()).toBeGreaterThanOrEqual(2025);
      expect(new Date(camp.endDate).getFullYear()).toBeGreaterThanOrEqual(2025);
      expect(Array.isArray(camp.channels)).toBe(true);
      expect(camp.channels.length).toBeGreaterThan(0);
    }
  });

  it('POST /api/campaigns creates and persists a new campaign', async () => {
    const payload = {
      name: 'Chiến dịch Test Tự Động F132',
      description: 'Mô tả chiến dịch test thực tế',
      objectiveType: 'REVENUE',
      totalBudget: 45000000,
      channels: ['TIKTOK', 'FACEBOOK'],
      ownerName: 'yến ngô (Admin)',
      kpis: [
        {
          id: 'kpi_test',
          name: 'Doanh thu mục tiêu',
          metricType: 'REVENUE',
          targetValue: 120000000,
          currentValue: 0,
          unit: 'đ',
          completionRate: 0,
        },
      ],
      budgetCategories: [],
      phases: [],
    };

    const req = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.campaign).toBeDefined();
    expect(data.campaign.name).toBe('Chiến dịch Test Tự Động F132');
    expect(data.campaign.status).toBe('PLANNING');
    expect(data.campaign.totalSpent).toBe(0);
  });

  it('Asset workflow (F137): POST, GET, and PATCH approval status', async () => {
    // 1. Upload asset
    const postReq = new NextRequest('http://localhost:3000/api/campaigns/assets', {
      method: 'POST',
      body: JSON.stringify({
        campaignId: 'camp_test_asset',
        name: 'Video Teaser M10 Test.mp4',
        type: 'VIDEO',
        fileSize: 15000000,
      }),
    });
    const postRes = await POST_ASSETS(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.asset.name).toBe('Video Teaser M10 Test.mp4');
    expect(postData.asset.approvalStatus).toBe('PENDING_REVIEW');

    const assetId = postData.asset.id;

    // 2. Query assets filtered by campaign
    const getReq = new NextRequest(`http://localhost:3000/api/campaigns/assets?campaignId=camp_test_asset`);
    const getRes = await GET_ASSETS(getReq);
    const getData = await getRes.json();
    expect(getData.assets.some((a: any) => a.id === assetId)).toBe(true);

    // 3. Approve asset
    const patchReq = new NextRequest('http://localhost:3000/api/campaigns/assets', {
      method: 'PATCH',
      body: JSON.stringify({
        id: assetId,
        approvalStatus: 'APPROVED',
        reviewerNote: 'Đã duyệt đạt chuẩn 9:16',
        reviewedBy: 'yến ngô (Quản trị)',
      }),
    });
    const patchRes = await PATCH_ASSETS(patchReq);
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.success).toBe(true);
    expect(patchData.asset.approvalStatus).toBe('APPROVED');
    expect(patchData.asset.reviewedBy).toBe('yến ngô (Quản trị)');
  });
});
