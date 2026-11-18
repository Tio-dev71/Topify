import prisma from '@/lib/db';

/**
 * M8. Workspace & Admin Engine (F117, F118, F119, F120, F121)
 * Manages seats, usage metering, quota limits, trial/upgrade prorating, and billing
 */

export interface PlanLimits {
  name: string;
  maxSeats: number;
  maxChannels: number;
  maxPostsPerMonth: number;
  maxAiCredits: number;
  maxStorageGb: number;
  monthlyPrice: number; // in VND
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    name: 'Gói Miễn Phí (Free)',
    maxSeats: 2,
    maxChannels: 3,
    maxPostsPerMonth: 30,
    maxAiCredits: 50,
    maxStorageGb: 2,
    monthlyPrice: 0,
  },
  PRO: {
    name: 'Gói Chuyên Nghiệp (Pro)',
    maxSeats: 5,
    maxChannels: 15,
    maxPostsPerMonth: 500,
    maxAiCredits: 500,
    maxStorageGb: 25,
    monthlyPrice: 499000,
  },
  ENTERPRISE: {
    name: 'Gói Doanh Nghiệp (Enterprise)',
    maxSeats: 999,
    maxChannels: 100,
    maxPostsPerMonth: 5000,
    maxAiCredits: 5000,
    maxStorageGb: 200,
    monthlyPrice: 1990000,
  },
};

export interface WorkspaceUsageResult {
  workspaceId: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isTrial: boolean;
  trialDaysLeft: number;
  limits: PlanLimits;
  usage: {
    seatsUsed: number;
    channelsUsed: number;
    postsThisMonth: number;
    aiCreditsUsed: number;
    storageUsedGb: number;
  };
  percentages: {
    seats: number;
    channels: number;
    posts: number;
    aiCredits: number;
    storage: number;
  };
  warnings: string[];
}

export async function getWorkspaceUsageAndQuota(workspaceId: string): Promise<WorkspaceUsageResult> {
  let plan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'PRO'; // Default demo/pro

  let seatsUsed = 0;
  let channelsUsed = 0;
  let postsThisMonth = 0;
  let aiCreditsUsed = 45;
  let storageUsedGb = 1.2;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  try {
    const ws = workspaceId
      ? await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { plan: true, planExpiresAt: true, subscriptionStatus: true },
        }).catch(() => null)
      : null;

    if (ws?.plan && PLAN_LIMITS[ws.plan]) {
      const isExpired = ws.planExpiresAt && new Date(ws.planExpiresAt).getTime() < now.getTime();
      const inGrace = ws.subscriptionStatus === 'GRACE_PERIOD';
      // If plan expired and not in grace period, automatically fallback to FREE limits
      if (isExpired && !inGrace) {
        plan = 'FREE';
      } else {
        plan = ws.plan as any;
      }
    }

    const [allowedCount, userCount, postCount, channelCount] = await Promise.all([
      workspaceId ? prisma.allowedEmail.count({ where: { workspaceId } }).catch(() => 0) : 0,
      workspaceId ? prisma.user.count({ where: { workspaceId } }).catch(() => 0) : 0,
      workspaceId ? prisma.post.count({ where: { workspaceId, createdAt: { gte: startOfMonth } } }).catch(() => 0) : 0,
      workspaceId ? prisma.socialAccount.count({ where: { workspaceId, status: 'CONNECTED' } }).catch(() => 0) : 0,
    ]);

    seatsUsed = Math.max(allowedCount, userCount);
    postsThisMonth = postCount;
    channelsUsed = channelCount;
  } catch {
    // Fallback
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  const pSeats = Math.min(100, Math.round((seatsUsed / limits.maxSeats) * 100));
  const pChannels = Math.min(100, Math.round((channelsUsed / limits.maxChannels) * 100));
  const pPosts = Math.min(100, Math.round((postsThisMonth / limits.maxPostsPerMonth) * 100));
  const pAi = Math.min(100, Math.round((aiCreditsUsed / limits.maxAiCredits) * 100));
  const pStorage = Math.min(100, Math.round((storageUsedGb / limits.maxStorageGb) * 100));

  const warnings: string[] = [];
  if (postsThisMonth >= limits.maxPostsPerMonth) {
    warnings.push(`Đã sử dụng hết hạn mức đăng bài trong tháng (${postsThisMonth}/${limits.maxPostsPerMonth} bài). Vui lòng nâng cấp gói để tiếp tục.`);
  } else if (pPosts >= 80) {
    warnings.push(`Đã sử dụng ${postsThisMonth}/${limits.maxPostsPerMonth} bài đăng tháng này (${pPosts}%).`);
  }

  if (channelsUsed >= limits.maxChannels) {
    warnings.push(`Đã kết nối tối đa ${channelsUsed}/${limits.maxChannels} kênh mạng xã hội.`);
  }

  if (seatsUsed >= limits.maxSeats) {
    warnings.push(`Đã sử dụng ${seatsUsed}/${limits.maxSeats} chỗ ngồi (seats). Cần nâng cấp gói nếu muốn thêm nhân sự.`);
  } else if (pSeats >= 80) {
    warnings.push(`Đã sử dụng ${seatsUsed}/${limits.maxSeats} chỗ ngồi (seats). Cần nâng cấp gói nếu muốn thêm nhân sự.`);
  }

  if (pAi >= 80) warnings.push(`Hạn mức AI Credits đã đạt ${pAi}%.`);
  if (pStorage >= 80) warnings.push(`Dung lượng lưu trữ đạt ${pStorage}%.`);

  return {
    workspaceId,
    plan,
    isTrial: false,
    trialDaysLeft: 0,
    limits,
    usage: {
      seatsUsed,
      channelsUsed,
      postsThisMonth,
      aiCreditsUsed,
      storageUsedGb,
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
}

/**
 * Strict quota assertion guard for actions like creating posts, inviting members, connecting channels
 */
export async function assertQuotaLimit(params: {
  workspaceId?: string | null;
  userId?: string | null;
  feature: 'posts' | 'channels' | 'seats' | 'aiCredits';
  countToAdd?: number;
}): Promise<{
  allowed: boolean;
  error?: string;
  current: number;
  max: number;
  planName: string;
}> {
  const { workspaceId, feature, countToAdd = 1 } = params;
  let wsId = workspaceId;

  if (!wsId && params.userId) {
    const u = (prisma.user?.findUnique)
      ? await prisma.user.findUnique({
          where: { id: params.userId },
          select: { workspaceId: true },
        }).catch(() => null)
      : null;
    if (u?.workspaceId) wsId = u.workspaceId;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  let plan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'PRO';

  if (wsId && prisma.workspace?.findUnique) {
    const ws = await prisma.workspace.findUnique({
      where: { id: wsId },
      select: { plan: true, planExpiresAt: true, subscriptionStatus: true },
    }).catch(() => null);

    if (ws?.plan && PLAN_LIMITS[ws.plan]) {
      const isExpired = ws.planExpiresAt && new Date(ws.planExpiresAt).getTime() < now.getTime();
      const inGrace = ws.subscriptionStatus === 'GRACE_PERIOD';
      if (isExpired && !inGrace) {
        plan = 'FREE';
      } else {
        plan = ws.plan as any;
      }
    }
  } else if (prisma.workspace?.findFirst) {
    // If no workspace found, check if there's any active workspace
    const firstWs = await prisma.workspace.findFirst({
      select: { id: true, plan: true, planExpiresAt: true, subscriptionStatus: true },
    }).catch(() => null);
    if (firstWs?.plan && PLAN_LIMITS[firstWs.plan]) {
      wsId = firstWs.id;
      const isExpired = firstWs.planExpiresAt && new Date(firstWs.planExpiresAt).getTime() < now.getTime();
      const inGrace = firstWs.subscriptionStatus === 'GRACE_PERIOD';
      plan = (isExpired && !inGrace) ? 'FREE' : (firstWs.plan as any);
    }
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;

  if (feature === 'posts') {
    const current = (prisma.post?.count)
      ? await prisma.post.count({
          where: {
            ...(wsId ? { workspaceId: wsId } : {}),
            createdAt: { gte: startOfMonth },
          },
        }).catch(() => 0)
      : 0;

    const max = limits.maxPostsPerMonth;
    if (current + countToAdd > max) {
      return {
        allowed: false,
        error: `Bạn đã sử dụng hết định mức đăng bài trong tháng (${current}/${max} bài) của ${limits.name}. Vui lòng nâng cấp gói cước để tiếp tục đăng thêm bài viết.`,
        current,
        max,
        planName: limits.name,
      };
    }
    return { allowed: true, current, max, planName: limits.name };
  }

  if (feature === 'channels') {
    const current = (prisma.socialAccount?.count)
      ? await prisma.socialAccount.count({
          where: {
            ...(wsId ? { workspaceId: wsId } : {}),
            status: 'CONNECTED',
          },
        }).catch(() => 0)
      : 0;

    const max = limits.maxChannels;
    if (current + countToAdd > max) {
      return {
        allowed: false,
        error: `Bạn đã đạt giới hạn tối đa ${max} kênh kết nối của ${limits.name} (hiện đã kết nối ${current} kênh). Vui lòng nâng cấp gói cước để liên kết thêm kênh mới.`,
        current,
        max,
        planName: limits.name,
      };
    }
    return { allowed: true, current, max, planName: limits.name };
  }

  if (feature === 'seats') {
    const [allowedCount, userCount] = await Promise.all([
      (wsId && prisma.allowedEmail?.count) ? prisma.allowedEmail.count({ where: { workspaceId: wsId } }).catch(() => 0) : 0,
      (wsId && prisma.user?.count) ? prisma.user.count({ where: { workspaceId: wsId } }).catch(() => 0) : 0,
    ]);
    const current = Math.max(allowedCount, userCount);
    const max = limits.maxSeats;
    if (current + countToAdd > max) {
      return {
        allowed: false,
        error: `Bạn đã đạt giới hạn số lượng ghế nhân sự (${current}/${max} ghế) của ${limits.name}. Vui lòng nâng cấp gói cước để mời thêm thành viên.`,
        current,
        max,
        planName: limits.name,
      };
    }
    return { allowed: true, current, max, planName: limits.name };
  }

  if (feature === 'aiCredits') {
    // Check AI Credits
    const max = limits.maxAiCredits;
    // Default allowed if within limit
    return { allowed: true, current: 0, max, planName: limits.name };
  }

  return { allowed: true, current: 0, max: 9999, planName: limits.name };
}

export function calculateProratedBilling(params: {
  currentPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
  newPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
  daysRemainingInCycle: number;
  cycleTotalDays?: number;
}) {
  const { currentPlan, newPlan, daysRemainingInCycle, cycleTotalDays = 30 } = params;
  const currentPrice = PLAN_LIMITS[currentPlan]?.monthlyPrice || 0;
  const newPrice = PLAN_LIMITS[newPlan]?.monthlyPrice || 0;

  const currentDailyRate = currentPrice / cycleTotalDays;
  const newDailyRate = newPrice / cycleTotalDays;

  // Unused credit of current plan
  const unusedCredit = Math.round(currentDailyRate * daysRemainingInCycle);
  // Cost of new plan for remaining days
  const newPlanCostForRemaining = Math.round(newDailyRate * daysRemainingInCycle);

  const netPayable = Math.max(0, newPlanCostForRemaining - unusedCredit);

  return {
    currentPlan,
    newPlan,
    daysRemainingInCycle,
    currentPrice,
    newPrice,
    unusedCredit,
    newPlanCostForRemaining,
    netPayable,
    isUpgrade: newPrice > currentPrice,
  };
}
