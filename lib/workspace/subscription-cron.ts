import { prisma } from '@/lib/db';

export async function processExpiringSubscriptions() {
  const now = new Date();
  let checkedCount = 0;
  let gracePeriodCount = 0;
  let downgradedCount = 0;

  try {
    // Tìm tất cả các Workspace có gói cước trả phí hoặc đang trong thời gian ân hạn
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { plan: { not: 'FREE' } },
          { subscriptionStatus: 'GRACE_PERIOD' },
        ],
      },
    });

    checkedCount = workspaces.length;

    for (const ws of workspaces) {
      const expiresAt = ws.planExpiresAt ? new Date(ws.planExpiresAt) : null;
      const graceEndsAt = ws.gracePeriodEndsAt ? new Date(ws.gracePeriodEndsAt) : null;

      // Trường hợp 1: Đã hết hạn nhưng chưa được chuyển sang ân hạn 3 ngày
      if (
        expiresAt &&
        expiresAt < now &&
        ws.subscriptionStatus !== 'GRACE_PERIOD' &&
        ws.subscriptionStatus !== 'EXPIRED'
      ) {
        const gracePeriodEndsAt = new Date(now.getTime() + 3 * 24 * 3600 * 1000); // 3 ngày ân hạn
        await prisma.workspace.update({
          where: { id: ws.id },
          data: {
            subscriptionStatus: 'GRACE_PERIOD',
            gracePeriodEndsAt,
          },
        });

        // Ghi Audit Log cảnh báo
        await prisma.auditLog.create({
          data: {
            action: 'subscription.grace_period_started',
            entityType: 'Workspace',
            entityId: ws.id,
            workspaceId: ws.id,
            metadata: {
              plan: ws.plan,
              expiredAt: expiresAt.toISOString(),
              gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
            },
          },
        }).catch(() => null);

        gracePeriodCount++;
        console.log(`[SUBSCRIPTION_CRON] Workspace ${ws.id} entered GRACE_PERIOD until ${gracePeriodEndsAt.toISOString()}`);
        continue;
      }

      // Trường hợp 2: Đang trong ân hạn nhưng đã quá 3 ngày mà chưa thanh toán gia hạn
      if (
        ws.subscriptionStatus === 'GRACE_PERIOD' &&
        graceEndsAt &&
        now >= graceEndsAt
      ) {
        await prisma.workspace.update({
          where: { id: ws.id },
          data: {
            plan: 'FREE',
            subscriptionStatus: 'EXPIRED',
          },
        });

        // Ghi Audit Log hạ gói cước
        await prisma.auditLog.create({
          data: {
            action: 'subscription.downgraded_to_free',
            entityType: 'Workspace',
            entityId: ws.id,
            workspaceId: ws.id,
            metadata: {
              previousPlan: ws.plan,
              downgradedAt: now.toISOString(),
              reason: 'grace_period_expired',
            },
          },
        }).catch(() => null);

        downgradedCount++;
        console.log(`[SUBSCRIPTION_CRON] Workspace ${ws.id} grace period expired. Downgraded to FREE.`);
      }
    }

    return {
      success: true,
      timestamp: now.toISOString(),
      checkedCount,
      gracePeriodCount,
      downgradedCount,
    };
  } catch (error: any) {
    console.error('[PROCESS_EXPIRING_SUBSCRIPTIONS_ERROR]', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi quét hạn dùng thuê bao',
    };
  }
}

export interface SubscriptionAlertResult {
  daysRemaining: number;
  isGracePeriod: boolean;
  graceDaysRemaining: number;
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE';
  alertMessage: string;
  isExpired: boolean;
}

export function computeSubscriptionAlert(params: {
  plan: string;
  subscriptionStatus: string;
  planExpiresAt: Date | string | null;
  gracePeriodEndsAt?: Date | string | null;
  now?: Date;
}): SubscriptionAlertResult {
  const now = params.now || new Date();
  const expiresAt = params.planExpiresAt ? new Date(params.planExpiresAt) : null;
  const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24))) : 0;
  
  const isGracePeriod = params.subscriptionStatus === 'GRACE_PERIOD';
  let graceDaysRemaining = 0;
  if (params.gracePeriodEndsAt) {
    graceDaysRemaining = Math.max(0, Math.ceil((new Date(params.gracePeriodEndsAt).getTime() - now.getTime()) / (1000 * 3600 * 24)));
  }

  const isExpired = params.subscriptionStatus === 'EXPIRED' || (expiresAt !== null && expiresAt < now && !isGracePeriod && params.plan === 'FREE');

  let alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE' = 'NONE';
  let alertMessage = '';

  if (params.plan !== 'FREE') {
    if (isGracePeriod) {
      alertLevel = 'GRACE';
      alertMessage = `Gói dịch vụ đã hết hạn! Bạn đang trong ${graceDaysRemaining} ngày ân hạn trước khi hệ thống chuyển về gói Miễn Phí.`;
    } else if (daysRemaining <= 1) {
      alertLevel = 'URGENT';
      alertMessage = `Gói dịch vụ của bạn sắp hết hạn trong ngày hôm nay! Vui lòng gia hạn để không bị gián đoạn.`;
    } else if (daysRemaining <= 7) {
      alertLevel = 'WARNING';
      alertMessage = `Gói dịch vụ còn ${daysRemaining} ngày nữa sẽ hết hạn. Gia hạn ngay để duy trì hạn mức!`;
    }
  }

  return {
    daysRemaining,
    isGracePeriod,
    graceDaysRemaining,
    alertLevel,
    alertMessage,
    isExpired,
  };
}

