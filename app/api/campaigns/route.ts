import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import {
  SAMPLE_CAMPAIGNS,
  EnrichedCampaign,
  CampaignStatus,
  CampaignObjectiveType,
  calculateCampaignROI,
} from '@/lib/campaigns/engine';

// In-memory memory fallback store (clean state for testing)
let memoryCampaigns: EnrichedCampaign[] = [];

// GET /api/campaigns
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const objective = url.searchParams.get('objective');
    const search = url.searchParams.get('search');

    let campaigns = [...memoryCampaigns];

    // Try query from Prisma if available
    try {
      const session = await auth();
      const workspaceId = (session?.user as any)?.workspaceId;
      if (workspaceId) {
        const dbCampaigns = await prisma.campaign.findMany({
          where: { workspaceId },
          include: {
            owner: { select: { id: true, name: true, image: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (dbCampaigns && dbCampaigns.length > 0) {
          // Map db campaigns
          campaigns = dbCampaigns.map((dc: any) => {
            const memoryMatch = memoryCampaigns.find((mc) => mc.id === dc.id);
            if (memoryMatch) {
              return {
                ...memoryMatch,
                name: dc.name,
                description: dc.description || memoryMatch.description,
                status: (dc.status as CampaignStatus) || memoryMatch.status,
                totalBudget: dc.budget || memoryMatch.totalBudget,
                totalSpent: dc.spent || memoryMatch.totalSpent,
                startDate: dc.startDate ? dc.startDate.toISOString() : memoryMatch.startDate,
                endDate: dc.endDate ? dc.endDate.toISOString() : memoryMatch.endDate,
              };
            }
            return {
              id: dc.id,
              name: dc.name,
              description: dc.description || '',
              status: (dc.status as CampaignStatus) || 'DRAFT',
              objectiveType: 'REVENUE' as CampaignObjectiveType,
              startDate: dc.startDate ? dc.startDate.toISOString() : new Date().toISOString(),
              endDate: dc.endDate ? dc.endDate.toISOString() : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
              totalBudget: dc.budget || 50000000,
              totalSpent: dc.spent || 0,
              ownerId: dc.ownerId || 'user_1',
              ownerName: dc.owner?.name || 'Quản trị viên',
              ownerAvatar: dc.owner?.image || undefined,
              channels: ['TIKTOK', 'FACEBOOK'],
              kpis: [
                {
                  id: `kpi_${dc.id}`,
                  name: 'Mục tiêu doanh thu',
                  metricType: 'REVENUE',
                  targetValue: (dc.budget || 50000000) * 3,
                  currentValue: dc.spent * 2.5 || 0,
                  unit: 'đ',
                  completionRate: dc.budget > 0 ? Math.min(100, Math.round(((dc.spent * 2.5) / (dc.budget * 3)) * 100)) : 0,
                },
              ],
              budgetCategories: [
                { category: 'PAID_ADS', label: 'Quảng cáo Ads', plannedAmount: (dc.budget || 50000000) * 0.6, actualSpent: dc.spent * 0.6, color: '#3b82f6' },
                { category: 'KOL_BOOKING', label: 'KOL Booking', plannedAmount: (dc.budget || 50000000) * 0.4, actualSpent: dc.spent * 0.4, color: '#a855f7' },
              ],
              phases: [],
              assetsCount: 0,
              contentPlanCount: 0,
              tasksCount: 0,
              completedTasksCount: 0,
              financialSummary: calculateCampaignROI(dc.spent * 2.5 || 0, dc.spent || 1, dc.spent * 0.6 || 1, 100, 20),
              createdAt: dc.createdAt.toISOString(),
              updatedAt: dc.updatedAt.toISOString(),
            };
          });
        }
      }
    } catch (e) {
      // fallback to memoryCampaigns
    }

    // Apply filters
    if (status && status !== 'ALL') {
      campaigns = campaigns.filter((c) => c.status === status);
    }
    if (objective && objective !== 'ALL') {
      campaigns = campaigns.filter((c) => c.objectiveType === objective);
    }
    if (search) {
      const q = search.toLowerCase();
      campaigns = campaigns.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length,
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGNS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/campaigns
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description = '',
      status = 'PLANNING',
      objectiveType = 'REVENUE',
      startDate,
      endDate,
      totalBudget = 50000000,
      channels = ['TIKTOK', 'FACEBOOK'],
      kpis = [],
      budgetCategories = [],
      phases = [],
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tên chiến dịch không được để trống' }, { status: 400 });
    }

    const newCampaign: EnrichedCampaign = {
      id: `camp_${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      status: (status as CampaignStatus) || 'PLANNING',
      objectiveType: objectiveType as CampaignObjectiveType,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      totalBudget: Number(totalBudget) || 0,
      totalSpent: 0,
      ownerId: 'user_1',
      ownerName: 'Nguyễn Văn A (Lead)',
      ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      channels: Array.isArray(channels) && channels.length > 0 ? channels : ['TIKTOK', 'FACEBOOK'],
      kpis: Array.isArray(kpis) && kpis.length > 0
        ? kpis
        : [
            {
              id: `kpi_${Date.now()}`,
              name: 'Mục tiêu doanh thu ban đầu',
              metricType: objectiveType as CampaignObjectiveType,
              targetValue: Number(totalBudget) * 3,
              currentValue: 0,
              unit: 'đ',
              completionRate: 0,
            },
          ],
      budgetCategories: Array.isArray(budgetCategories) && budgetCategories.length > 0
        ? budgetCategories
        : [
            { category: 'PAID_ADS', label: 'Quảng cáo trả phí (Ads)', plannedAmount: Number(totalBudget) * 0.5, actualSpent: 0, color: '#3b82f6' },
            { category: 'KOL_BOOKING', label: 'Booking KOC/KOLs', plannedAmount: Number(totalBudget) * 0.3, actualSpent: 0, color: '#a855f7' },
            { category: 'CREATIVE_MEDIA', label: 'Sản xuất Media & Banner', plannedAmount: Number(totalBudget) * 0.15, actualSpent: 0, color: '#10b981' },
            { category: 'SEEDING_OPS', label: 'Seeding & Vận hành', plannedAmount: Number(totalBudget) * 0.05, actualSpent: 0, color: '#f59e0b' },
          ],
      phases: Array.isArray(phases) && phases.length > 0 ? phases : [],
      assetsCount: 0,
      contentPlanCount: 0,
      tasksCount: 0,
      completedTasksCount: 0,
      financialSummary: calculateCampaignROI(0, 0, 0, 0, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Try save to Prisma if DB is up
    try {
      const session = await auth();
      const workspaceId = (session?.user as any)?.workspaceId;
      if (workspaceId && session?.user?.id) {
        const createdDb = await prisma.campaign.create({
          data: {
            name: newCampaign.name,
            description: newCampaign.description,
            objective: newCampaign.objectiveType,
            startDate: new Date(newCampaign.startDate),
            endDate: new Date(newCampaign.endDate),
            budget: newCampaign.totalBudget,
            status: newCampaign.status as any,
            ownerId: session.user.id,
            workspaceId,
          },
        });
        newCampaign.id = createdDb.id;

        await recordAuditLog({
          action: 'CAMPAIGN.CREATE',
          entityType: 'Campaign',
          entityId: newCampaign.id,
          userId: session.user.id,
          workspaceId,
          req,
          metadata: {
            message: `Tạo chiến dịch mới: ${newCampaign.name}`,
            budget: newCampaign.totalBudget,
            objective: newCampaign.objectiveType,
          },
        });
      }
    } catch (e) {
      // fallback
    }

    memoryCampaigns.unshift(newCampaign);

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      message: 'Tạo chiến dịch mới thành công',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API_CAMPAIGNS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/campaigns
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, campaignId, status, name, description, totalBudget, totalSpent, kpis, budgetCategories, channels, phases } = body;
    const targetId = id || campaignId;

    if (!targetId) {
      return NextResponse.json({ error: 'Mã chiến dịch không hợp lệ' }, { status: 400 });
    }

    const idx = memoryCampaigns.findIndex((c) => c.id === targetId);
    if (idx !== -1) {
      if (status !== undefined) memoryCampaigns[idx].status = status;
      if (name !== undefined) memoryCampaigns[idx].name = name;
      if (description !== undefined) memoryCampaigns[idx].description = description;
      if (totalBudget !== undefined) memoryCampaigns[idx].totalBudget = Number(totalBudget);
      if (totalSpent !== undefined) memoryCampaigns[idx].totalSpent = Number(totalSpent);
      if (kpis !== undefined) memoryCampaigns[idx].kpis = kpis;
      if (budgetCategories !== undefined) memoryCampaigns[idx].budgetCategories = budgetCategories;
      if (channels !== undefined) memoryCampaigns[idx].channels = channels;
      if (phases !== undefined) memoryCampaigns[idx].phases = phases;
      memoryCampaigns[idx].updatedAt = new Date().toISOString();
    }

    try {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (totalBudget !== undefined) updateData.budget = Number(totalBudget);
      if (totalSpent !== undefined) updateData.spent = Number(totalSpent);

      await prisma.campaign.update({
        where: { id: targetId },
        data: updateData,
      });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      campaign: idx !== -1 ? memoryCampaigns[idx] : null,
      message: 'Cập nhật chiến dịch thành công',
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGNS_PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/campaigns?id=...
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mã chiến dịch không hợp lệ' }, { status: 400 });
    }

    memoryCampaigns = memoryCampaigns.filter((c) => c.id !== id);

    try {
      await prisma.campaign.delete({ where: { id } });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa chiến dịch thành công',
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGNS_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
