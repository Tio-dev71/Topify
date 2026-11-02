import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish } from '@/lib/queue';

// POST /api/posts/[id]/retry — Retry failed platforms
export async function POST(
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
      include: { platforms: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if ((session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') && post.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (post.status !== 'FAILED' && post.status !== 'PARTIAL_FAILED') {
      return NextResponse.json(
        { error: 'Only failed posts can be retried' },
        { status: 400 }
      );
    }

    const requiresVideo = post.platforms.some((p: any) =>
      ['YOUTUBE_SHORTS', 'YOUTUBE', 'TIKTOK_VIDEO', 'FACEBOOK_REELS', 'INSTAGRAM_REELS', 'INSTAGRAM_STORY'].includes(p.platform)
    );
    if (requiresVideo && !post.videoAssetId) {
      return NextResponse.json(
        { error: 'Bài viết chưa có tệp video. Vui lòng tải video lên bài viết trước khi thử lại đăng bài.' },
        { status: 400 }
      );
    }

    // Reset failed platforms to PENDING
    await prisma.postPlatform.updateMany({
      where: {
        postId: id,
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });

    // Update post status
    await prisma.post.update({
      where: { id },
      data: { status: 'PUBLISHING' },
    });

    // Enqueue for publishing
    await enqueuePublish(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
