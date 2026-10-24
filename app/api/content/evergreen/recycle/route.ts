import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';
import { recordAuditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// POST /api/content/evergreen/recycle - Recycle / repost an evergreen post
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      postId,
      newTitle,
      newCaption,
      newScheduledAt,
      publishMode = 'schedule', // 'now' | 'schedule' | 'draft'
      platforms,
    } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        platforms: true,
        media: true,
      },
    });

    if (!originalPost) {
      return NextResponse.json({ error: 'Original post not found' }, { status: 404 });
    }

    const targetPlatforms: string[] = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : originalPost.platforms.map(p => p.platform);

    if (publishMode !== 'draft' && targetPlatforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required to publish' }, { status: 400 });
    }

    let postStatus: any = 'DRAFT';
    if (publishMode === 'now') {
      postStatus = 'PUBLISHING';
    } else if (publishMode === 'schedule') {
      postStatus = 'SCHEDULED';
    }

    const scheduledDate = newScheduledAt ? new Date(newScheduledAt) : null;

    // 1. Create the new cloned/recycled post
    const recycledPost = await prisma.post.create({
      data: {
        title: (newTitle || originalPost.title).trim(),
        caption: (newCaption !== undefined ? newCaption : originalPost.caption) || null,
        firstComment: originalPost.firstComment,
        hashtags: originalPost.hashtags,
        videoAssetId: originalPost.videoAssetId,
        postType: originalPost.postType,
        createdById: session.user.id,
        workspaceId: originalPost.workspaceId || (session.user as any).workspaceId || null,
        status: postStatus,
        scheduledAt: scheduledDate,
        originalPostId: originalPost.id,
        isEvergreen: false, // recycled child is not marked evergreen by default
        platforms: {
          create: targetPlatforms.map((platform: any) => ({
            platform,
            status: 'PENDING',
          })),
        },
        media: originalPost.media.length > 0 ? {
          create: originalPost.media.map(m => ({
            mediaAssetId: m.mediaAssetId,
            sortOrder: m.sortOrder,
            caption: m.caption,
          })),
        } : undefined,
      },
      include: {
        platforms: true,
        media: true,
      },
    });

    // 2. Update stats on the original evergreen post
    await prisma.post.update({
      where: { id: originalPost.id },
      data: {
        lastRecycledAt: new Date(),
        recycleCount: { increment: 1 },
      },
    });

    // 3. Queue or execute publishing
    try {
      if (publishMode === 'now') {
        await enqueuePublish(recycledPost.id);
      } else if (publishMode === 'schedule' && scheduledDate) {
        await schedulePublish(recycledPost.id, scheduledDate);
        if (scheduledDate <= new Date()) {
          checkAndPublishDuePosts().catch(console.error);
        }
      }
    } catch (queueErr: any) {
      console.warn('⚠️ [RECYCLE-API] Queue warning:', queueErr.message);
      if (publishMode === 'now') {
        const { publishPostDirectly } = await import('@/lib/queue/publisher-service');
        publishPostDirectly(recycledPost.id).catch(console.error);
      }
    }

    // 4. Audit Log
    await recordAuditLog({
      action: 'POST.CREATE',
      metadata: {
        source: 'EVERGREEN_RECYCLE',
        originalPostId: originalPost.id,
        recycledPostId: recycledPost.id,
        title: recycledPost.title,
        publishMode,
      },
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
    });

    return NextResponse.json({
      success: true,
      message: 'Bài viết đã được tái bản thành công!',
      recycledPost,
    });
  } catch (error: any) {
    console.error('❌ [RECYCLE-API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
