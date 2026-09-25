import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const [
      totalUsers,
      totalWorkspaces,
      activeWorkspaces,
      totalPosts,
      publishedPosts,
      totalSocialAccounts,
      totalCustomers,
      totalDeals,
      totalCampaigns,
      usersByRole,
      workspacesByPlan,
      recentUsers,
      recentWorkspaces,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.workspace.count({ where: { isActive: true } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.socialAccount.count(),
      prisma.customer.count(),
      prisma.deal.count(),
      prisma.campaign.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.workspace.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          workspace: { select: { name: true } },
        },
      }),
      prisma.workspace.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, posts: true } },
        },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalWorkspaces,
        activeWorkspaces,
        totalPosts,
        publishedPosts,
        totalSocialAccounts,
        totalCustomers,
        totalDeals,
        totalCampaigns,
      },
      distribution: {
        roles: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
        plans: workspacesByPlan.map(p => ({ plan: p.plan, count: p._count.id })),
      },
      recentUsers,
      recentWorkspaces,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
