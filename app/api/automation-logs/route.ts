import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userWorkspaceId = session?.user ? (session.user as any).workspaceId : null;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const actionType = searchParams.get('actionType');

    const where: any = actionType ? { actionType } : {};
    const taskWhere: any = { status: 'RUNNING' };

    if (session?.user && session.user.role !== 'SUPER_ADMIN') {
      const accounts = await prisma.facebookAccount.findMany({
        where: { workspaceId: userWorkspaceId || 'none' },
        select: { profileId: true },
      });
      const profileIds = accounts.map(a => a.profileId);
      where.profileId = { in: profileIds };
      taskWhere.workspaceId = userWorkspaceId || 'none';
    }

    const [logs, total, runningTasksCount, totalComments, totalPosts] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.automationLog.count({ where }),
      prisma.automationTask.count({ where: taskWhere }),
      prisma.automationLog.count({ where: { ...where, actionType: 'COMMENT' } }),
      prisma.automationLog.count({ where: { ...where, actionType: { in: ['POST_REEL', 'POST_GROUP', 'POST'] } } })
    ]);
    
    return NextResponse.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      stats: {
        runningTasks: runningTasksCount,
        totalComments,
        totalPosts
      }
    });
  } catch (error: any) {
    console.error('Error fetching automation logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const log = await prisma.automationLog.create({
      data: {
        profileId: data.profileId,
        accountName: data.accountName,
        actionType: data.actionType,
        link: data.link,
        message: data.message,
      }
    });
    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Error creating automation log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
