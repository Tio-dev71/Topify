import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceUsageAndQuota, PLAN_LIMITS } from '@/lib/workspace/quota';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

export async function GET(req: NextRequest) {
  try {
    let wsId: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7).trim();
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        wsId = decoded.workspaceId;
        const userId = decoded.sub || decoded.id;
        if (!wsId && userId && prisma.user?.findUnique) {
          const u = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } });
          if (u?.workspaceId) wsId = u.workspaceId;
        }
      } catch {}
    }
    if (!wsId) {
      const session = await auth().catch(() => null);
      wsId = (session?.user as any)?.workspaceId;
    }

    if (!wsId && prisma.workspace?.findFirst) {
      const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
      if (firstWs) wsId = firstWs.id;
    }

    const quota = await getWorkspaceUsageAndQuota(wsId || 'default-workspace');
    return NextResponse.json({
      success: true,
      data: quota,
      allPlans: PLAN_LIMITS,
    });
  } catch (error: any) {
    console.error('[API_QUOTA_GET]', error);
    return NextResponse.json({ error: 'Không thể tải thông tin định mức sử dụng' }, { status: 500 });
  }
}
