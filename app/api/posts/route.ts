import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';
import { recordAuditLog } from '@/lib/audit-log';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().nullable().optional(),
  firstComment: z.string().nullable().optional(),
  hashtags: z.string().nullable().optional(),
  videoAssetId: z.string().min(1),
  platforms: z.array(z.enum([
    'FACEBOOK_REELS',
    'FACEBOOK_POST',
    'INSTAGRAM_REELS',
    'INSTAGRAM_CAROUSEL',
    'INSTAGRAM_STORY',
    'YOUTUBE_SHORTS',
    'TIKTOK_VIDEO',
    'ZALO_POST',
    'ZALO_ARTICLE'
  ])).min(1),
  publishMode: z.enum(['now', 'schedule', 'request_approval']),
  scheduledAt: z.string().nullable().optional(),
});

// GET /api/posts - List posts
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-check and publish any overdue scheduled posts before listing
    if (process.env.NODE_ENV !== 'test') {
      checkAndPublishDuePosts().catch((e) => {
        console.warn('Auto check due posts error in GET /api/posts:', e.message);
      });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const workspaceIdParam = url.searchParams.get('workspaceId');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role === 'SUPER_ADMIN') {
      if (workspaceIdParam && workspaceIdParam !== 'all') {
        where.workspaceId = workspaceIdParam;
      } else if (workspaceIdParam !== 'all' && userWorkspaceId) {
        where.workspaceId = userWorkspaceId;
      }
    } else {
      where.workspaceId = userWorkspaceId || 'none';
      if (session.user.role === 'STAFF') {
        where.createdById = session.user.id;
      }
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.OR = [
        { scheduledAt: { gte: new Date(startDate), lte: new Date(endDate) } },
        { createdAt: { gte: new Date(startDate), lte: new Date(endDate) }, scheduledAt: null }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        videoAsset: {
          select: { originalFileName: true, storageUrl: true },
        },
        platforms: {
          select: { platform: true, status: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Provide safe defaults so older client app builds don't crash on null properties
    const safePosts = posts.map((p) => ({
      ...p,
      videoAsset: p.videoAsset || {
        originalFileName: p.title || 'Untitled',
        storageUrl: '',
      },
      platforms: p.platforms || [],
    }));

    return NextResponse.json({ posts: safePosts });
  } catch (error: any) {
    console.error('List posts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/posts - Create post
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, caption, firstComment, hashtags, videoAssetId, platforms, publishMode, scheduledAt } = parsed.data;

    // Verify video asset exists and belongs to workspace
    const videoAsset = await prisma.videoAsset.findUnique({
      where: { id: videoAssetId },
    });

    if (!videoAsset || videoAsset.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Video asset not found in your workspace' }, { status: 404 });
    }

    if (platforms.includes('YOUTUBE_SHORTS') && videoAsset.duration && videoAsset.duration > 180) {
      return NextResponse.json(
        { error: `Video cho YouTube Shorts có thời lượng tối đa 3 phút (180 giây). Video hiện tại dài ${videoAsset.duration}s nên sẽ bị YouTube tự động chuyển thành video thường.` },
        { status: 400 }
      );
    }

    // Create post with platforms
    const post = await prisma.post.create({
      data: {
        title,
        caption,
        firstComment,
        hashtags,
        videoAssetId,
        createdById: session.user.id,
        workspaceId: (session.user as any).workspaceId,
        status: publishMode === 'request_approval' ? 'PENDING_REVIEW' : publishMode === 'now' ? 'PUBLISHING' : 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        platforms: {
          create: platforms.map((platform) => ({
            platform,
            status: 'PENDING',
          })),
        },
      },
      include: {
        platforms: true,
      },
    });

    try {
      // Enqueue job if not requesting approval
      if (publishMode === 'now') {
        await enqueuePublish(post.id);
      } else if (publishMode === 'schedule' && scheduledAt) {
        await schedulePublish(post.id, new Date(scheduledAt));
        if (new Date(scheduledAt) <= new Date()) {
          checkAndPublishDuePosts().catch(console.error);
        }
      }
    } catch (queueError: any) {
      console.warn('Queue publish job warning:', queueError.message);
      if (publishMode === 'now') {
        const { publishPostDirectly } = await import('@/lib/queue/publisher-service');
        publishPostDirectly(post.id).catch(console.error);
      }
    }

    await recordAuditLog({
      action: 'POST.CREATE',
      entityType: 'Post',
      entityId: post.id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Tạo bài viết mới: ${title}`,
        platforms,
        publishMode,
        status: post.status
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
