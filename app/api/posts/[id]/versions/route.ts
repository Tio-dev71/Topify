import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// GET /api/posts/[id]/versions — List post versions
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      if (userWorkspaceId && post.workspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }
    }

    let versions = await prisma.postVersion.findMany({
      where: { postId: id },
      include: { editedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (versions.length === 0 && post) {
      try {
        const initialVersion = await prisma.postVersion.create({
          data: {
            postId: id,
            title: post.title,
            caption: post.caption,
            hashtags: post.hashtags,
            editedById: post.createdById || session.user.id,
            createdAt: post.createdAt,
            snapshot: { reason: 'Phiên bản khởi tạo ban đầu' },
          },
          include: { editedBy: { select: { name: true, email: true } } },
        });
        versions = [initialVersion];
      } catch {}
    }

    return NextResponse.json({ versions }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/posts/[id]/versions — Restore a version or create a new snapshot (F081)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthContext();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const { id } = await params;
    const body = await req.json();
    const { versionId, title, caption, hashtags } = body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId && post.workspaceId && post.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
      }
      if (session.user.role === 'STAFF' && post.createdById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }
    }

    if (versionId) {
      // 1. Restore specific version
      const targetVersion = await prisma.postVersion.findUnique({
        where: { id: versionId },
      });

      if (!targetVersion || targetVersion.postId !== id) {
        return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404, headers: corsHeaders });
      }

      // Save a backup snapshot of current post before restoring
      await prisma.postVersion.create({
        data: {
          postId: id,
          title: post.title,
          caption: post.caption,
          hashtags: post.hashtags,
          editedById: session.user.id,
          snapshot: {
            restoredFromVersionId: versionId,
            reason: 'Tự động sao lưu trước khi khôi phục',
          },
        },
      });

      // Update post with the restored version data
      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          title: targetVersion.title,
          caption: targetVersion.caption,
          hashtags: targetVersion.hashtags,
        },
        include: {
          platforms: true,
          createdBy: { select: { name: true, email: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục thành công về phiên bản ngày ${new Date(targetVersion.createdAt).toLocaleString('vi-VN')}`,
        post: updatedPost,
      }, { headers: corsHeaders });
    } else {
      // 2. Create manual version snapshot
      const newVersion = await prisma.postVersion.create({
        data: {
          postId: id,
          title: title || post.title,
          caption: caption !== undefined ? caption : post.caption,
          hashtags: hashtags !== undefined ? hashtags : post.hashtags,
          editedById: session.user.id,
        },
        include: {
          editedBy: { select: { name: true, email: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã lưu phiên bản mới thành công',
        version: newVersion,
      }, { headers: corsHeaders });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
