import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/campaigns/route';
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
});
