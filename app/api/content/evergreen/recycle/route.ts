import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';
import { recordAuditLog } from '@/lib/audit-log';
import { sanitizeUtf8, sanitizeUtf8Nullable } from '@/lib/utils';
import { assertQuotaLimit } from '@/lib/workspace/quota';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7).trim();
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded?.sub || decoded?.id;
      if (userId) {
        let dbUser = (prisma.user?.findUnique)
          ? await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, workspaceId: true, role: true, name: true, email: true },
            }).catch(() => null)
          : null;

        if (!dbUser && decoded.email && prisma.user?.findUnique) {
          dbUser = await prisma.user.findUnique({
            where: { email: decoded.email },
            select: { id: true, workspaceId: true, role: true, name: true, email: true },
          }).catch(() => null);
        }

        return {
          id: dbUser?.id || userId,
          role: dbUser?.role || decoded.role || 'STAFF',
          name: dbUser?.name || decoded.name || 'User',
          email: dbUser?.email || decoded.email,
          workspaceId: dbUser?.workspaceId || decoded.workspaceId || 'default-workspace',
        };
      }
    } catch {}
  }
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      role: session.user.role || 'ADMIN',
      name: session.user.name,
      email: session.user.email,
      workspaceId: (session.user as any).workspaceId || 'default-workspace',
    };
  }
  return null;
}

export const dynamic = 'force-dynamic';

// POST /api/content/evergreen/recycle - Recycle / repost an evergreen post
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
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

    const workspaceId = originalPost.workspaceId || user.workspaceId;

    // Quota Enforcement: Check monthly post limit
    const quotaCheck = await assertQuotaLimit({
      workspaceId,
      userId: user.id,
      feature: 'posts',
      countToAdd: 1,
    });
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.error }, { status: 403 });
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

    // 1. Create the new cloned/recycled post (sanitized against lone surrogates)
    const rawRecycledTitle = newTitle || originalPost.title;
    const rawRecycledCaption = newCaption !== undefined ? newCaption : originalPost.caption;
    const recycledPost = await prisma.post.create({
      data: {
        title: sanitizeUtf8(rawRecycledTitle) || originalPost.title,
        caption: sanitizeUtf8Nullable(rawRecycledCaption),
        firstComment: originalPost.firstComment,
        hashtags: originalPost.hashtags,
        videoAssetId: originalPost.videoAssetId,
        postType: originalPost.postType,
        createdById: user.id,
        workspaceId,
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
