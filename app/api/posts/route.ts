import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().nullable().optional(),
  firstComment: z.string().nullable().optional(),
  hashtags: z.string().nullable().optional(),
  videoAssetId: z.string().min(1),
  platforms: z.array(z.enum(['FACEBOOK_REELS', 'INSTAGRAM_REELS', 'YOUTUBE_SHORTS'])).min(1),
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

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {
      workspaceId: (session.user as any).workspaceId,
    };

    // Staff can only see their own posts, unless they are ADMIN or SUPER_ADMIN
    if (session.user.role === 'STAFF') {
      where.createdById = session.user.id;
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

    return NextResponse.json({ posts });
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

    // Enqueue job if not requesting approval
    if (publishMode === 'now') {
      await enqueuePublish(post.id);
    } else if (publishMode === 'schedule' && scheduledAt) {
      await schedulePublish(post.id, new Date(scheduledAt));
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
