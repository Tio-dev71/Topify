import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/posts/stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    const where: any = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId) {
        where.workspaceId = userWorkspaceId;
      }
      if (session.user.role === 'STAFF') {
        where.createdById = session.user.id;
      }
    }

    const [scheduled, published, failed, total] = await Promise.all([
      prisma.post.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.post.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.post.count({
        where: { ...where, status: { in: ['FAILED', 'PARTIAL_FAILED'] } },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ scheduled, published, failed, total });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
