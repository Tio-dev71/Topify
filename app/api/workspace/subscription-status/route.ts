import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/workspace/quota';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceIdParam = searchParams.get('workspaceId');

    let workspace = null;
    if (workspaceIdParam) {
      workspace = await prisma.workspace.findUnique({
        where: { id: workspaceIdParam },
      });
    }

    if (!workspace) {
      workspace = await prisma.workspace.findFirst();
    }

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Topify Workspace',
          plan: 'FREE',
        },
      });
    }

    const now = new Date();
    const expiresAt = workspace.planExpiresAt ? new Date(workspace.planExpiresAt) : null;
    const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;
    
    const isGracePeriod = workspace.subscriptionStatus === 'GRACE_PERIOD';
    let graceDaysRemaining = 0;
    if (workspace.gracePeriodEndsAt) {
      graceDaysRemaining = Math.max(0, Math.ceil((new Date(workspace.gracePeriodEndsAt).getTime() - now.getTime()) / (1000 * 3600 * 24)));
    }

    let alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE' = 'NONE';
    let alertMessage = '';

    const planName = PLAN_LIMITS[workspace.plan]?.name || 'Gói dịch vụ';

    if (workspace.plan !== 'FREE') {
      if (isGracePeriod) {
        alertLevel = 'GRACE';
        alertMessage = `Gói ${planName} đã hết hạn! Bạn đang trong ${graceDaysRemaining} ngày ân hạn trước khi hệ thống chuyển về gói Miễn Phí.`;
      } else if (daysRemaining <= 1) {
        alertLevel = 'URGENT';
        alertMessage = `Gói ${planName} của bạn sắp hết hạn trong ngày hôm nay! Vui lòng gia hạn để không bị gián đoạn.`;
      } else if (daysRemaining <= 7) {
        alertLevel = 'WARNING';
        alertMessage = `Gói ${planName} còn ${daysRemaining} ngày nữa sẽ hết hạn (${expiresAt?.toLocaleDateString('vi-VN')}). Gia hạn ngay để duy trì hạn mức!`;
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        workspaceId: workspace.id,
        plan: workspace.plan,
        planName,
        status: workspace.subscriptionStatus,
        planExpiresAt: workspace.planExpiresAt?.toISOString() || null,
        daysRemaining: Math.max(0, daysRemaining),
        isGracePeriod,
        gracePeriodEndsAt: workspace.gracePeriodEndsAt?.toISOString() || null,
        graceDaysRemaining,
        alertLevel,
        alertMessage,
      },
    });
  } catch (error: any) {
    console.error('[API_SUBSCRIPTION_STATUS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin trạng thái thuê bao' },
      { status: 500 }
    );
  }
}
