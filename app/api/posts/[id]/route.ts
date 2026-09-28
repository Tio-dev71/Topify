import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET /api/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        videoAsset: true,
        platforms: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const safePost = {
      ...post,
      videoAsset: post.videoAsset || {
        originalFileName: post.title || 'Untitled',
        storageUrl: '',
      },
      platforms: post.platforms || [],
    };

    return NextResponse.json(safePost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/posts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Only allow updating certain fields
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.caption !== undefined) updateData.caption = body.caption;
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags;
    if (body.firstComment !== undefined) updateData.firstComment = body.firstComment;
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      if (body.scheduledAt && post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING') {
        updateData.status = 'SCHEDULED';
      }
    }
    if (body.status === 'DRAFT' && post.status === 'SCHEDULED') {
      updateData.status = 'DRAFT';
      updateData.scheduledAt = null;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      action: 'POST.UPDATE',
      entityType: 'Post',
      entityId: id,
      userId: session.user.id,
      workspaceId: post.workspaceId,
      req,
      metadata: { 
        message: `Cập nhật bài viết: ${updated.title}`,
        status: updated.status,
        scheduledAt: updated.scheduledAt
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.post.delete({ where: { id } });

    await recordAuditLog({
      action: 'POST.DELETE',
      entityType: 'Post',
      entityId: id,
      userId: session.user.id,
      workspaceId: post.workspaceId,
      req,
      metadata: { 
        message: `Xóa bài viết: ${post.title}` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
