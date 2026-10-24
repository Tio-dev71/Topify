import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/posts/[id]/versions — List post versions
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const versions = await prisma.postVersion.findMany({
      where: { postId: id },
      include: { editedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/posts/[id]/versions — Restore a version or create a new snapshot (F081)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { versionId, title, caption, hashtags } = body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (versionId) {
      // 1. Restore specific version
      const targetVersion = await prisma.postVersion.findUnique({
        where: { id: versionId },
      });

      if (!targetVersion || targetVersion.postId !== id) {
        return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404 });
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
      });
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
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
