import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import { sanitizeUtf8, sanitizeUtf8Nullable } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function getAuthContext() {
  let session = await auth();
  if (session?.user?.id) return session;

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      return {
        user: {
          id: mockUser.id,
          role: mockUser.role,
          name: mockUser.name,
          email: mockUser.email,
          workspaceId: mockUser.workspaceId,
        },
      } as any;
    }
  }
  return null;
}

// GET /api/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthContext();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404, headers: corsHeaders });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }
    }

    const safePost = {
      ...post,
      videoAsset: post.videoAsset || {
        originalFileName: post.title || 'Untitled',
        storageUrl: '',
        duration: null,
        size: 0,
        mimeType: 'video/mp4',
      },
      platforms: post.platforms || [],
    };

    return NextResponse.json(safePost, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/posts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthContext();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const body = await req.json();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404, headers: corsHeaders });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }
    }

    // Only allow updating certain fields (sanitized against lone surrogates)
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = sanitizeUtf8(body.title) || post.title;
    if (body.caption !== undefined) updateData.caption = sanitizeUtf8Nullable(body.caption);
    if (body.hashtags !== undefined) updateData.hashtags = sanitizeUtf8Nullable(body.hashtags);
    if (body.firstComment !== undefined) updateData.firstComment = sanitizeUtf8Nullable(body.firstComment);
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

    // Auto-save previous version snapshot if content changed (F081)
    const contentChanged =
      (updateData.title && updateData.title !== post.title) ||
      (updateData.caption !== undefined && updateData.caption !== post.caption) ||
      (updateData.hashtags !== undefined && updateData.hashtags !== post.hashtags);

    if (contentChanged) {
      await prisma.postVersion.create({
        data: {
          postId: id,
          title: post.title,
          caption: post.caption,
          hashtags: post.hashtags,
          editedById: session.user.id,
          snapshot: {
            reason: 'Tự động sao lưu phiên bản trước khi chỉnh sửa',
          },
        },
      }).catch((e) => console.warn('Could not auto-save post version:', e));
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

    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthContext();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404, headers: corsHeaders });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
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

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
