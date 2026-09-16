import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/posts/[id]/approve — Approve or reject a post
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only admins can approve posts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reason } = body; // action: 'approve' | 'reject'

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'Post is not pending review' }, { status: 400 });
    }

    if (action === 'approve') {
      const nextStatus = post.scheduledAt ? 'SCHEDULED' : 'PUBLISHING';
      const updated = await prisma.post.update({
        where: { id },
        data: {
          status: nextStatus,
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });

      if (nextStatus === 'PUBLISHING') {
        const { enqueuePublish } = await import('@/lib/queue');
        await enqueuePublish(updated.id);
      } else if (nextStatus === 'SCHEDULED' && updated.scheduledAt) {
        const { schedulePublish } = await import('@/lib/queue');
        await schedulePublish(updated.id, updated.scheduledAt);
      }

      return NextResponse.json(updated);
    } else if (action === 'reject') {
      const updated = await prisma.post.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
