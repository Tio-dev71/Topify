import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/content/evergreen - Get evergreen posts & recycle suggestions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'suggestions'; // 'suggestions' | 'library' | 'all'
    const search = searchParams.get('search') || '';

    const workspaceId = (session.user as any).workspaceId;
    const baseWhere: any = {
      isEvergreen: true,
    };

    if (workspaceId) {
      baseWhere.workspaceId = workspaceId;
    } else {
      baseWhere.createdById = session.user.id;
    }

    if (search.trim()) {
      baseWhere.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { caption: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Fetch all evergreen posts for this workspace
    const evergreenPosts = await prisma.post.findMany({
      where: baseWhere,
      include: {
        videoAsset: {
          select: {
            id: true,
            originalFileName: true,
            storageUrl: true,
          },
        },
        media: {
          include: {
            mediaAsset: {
              select: {
                id: true,
                storageUrl: true,
                mediaType: true,
              },
            },
          },
        },
        platforms: {
          select: {
            platform: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = Date.now();
    let totalRecycledCount = 0;
    const suggestions: any[] = [];
    const library: any[] = [];

    const evergreenPostIds = evergreenPosts.map((p) => p.id);
    const recycledPosts = evergreenPostIds.length > 0
      ? await prisma.post.findMany({
          where: {
            originalPostId: { in: evergreenPostIds },
          },
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            originalPostId: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    for (const post of evergreenPosts) {
      totalRecycledCount += post.recycleCount || 0;

      // Base reference date for recycling is the latest between publishedAt and lastRecycledAt, or createdAt
      const referenceDate = post.lastRecycledAt 
        ? new Date(post.lastRecycledAt).getTime() 
        : (post.publishedAt ? new Date(post.publishedAt).getTime() : new Date(post.createdAt).getTime());

      const daysSinceLastPublished = Math.max(0, Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24)));
      const interval = post.recycleIntervalDays || 30;
      const isDue = post.status === 'PUBLISHED' && daysSinceLastPublished >= interval;
      const daysOverdue = isDue ? daysSinceLastPublished - interval : 0;

      const nextRecycleTime = referenceDate + (interval * 24 * 60 * 60 * 1000);
      const nextRecycleDate = new Date(nextRecycleTime).toISOString();
      const daysUntilRecycle = Math.max(0, Math.ceil((nextRecycleTime - now) / (1000 * 60 * 60 * 24)));

      const postRecycledChildren = recycledPosts.filter((rp) => rp.originalPostId === post.id);

      const postWithMeta = {
        ...post,
        media: post.media?.map((m: any) => ({
          id: m.id,
          url: m.mediaAsset?.storageUrl || '',
          type: m.mediaAsset?.mediaType || '',
        })) || [],
        daysSinceLastPublished,
        isDue,
        daysOverdue,
        nextRecycleDate,
        daysUntilRecycle,
        recycledPosts: postRecycledChildren,
      };

      library.push(postWithMeta);

      if (isDue) {
        suggestions.push(postWithMeta);
      }
    }

    // Sort suggestions by days overdue descending (most urgent first)
    suggestions.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return NextResponse.json({
      metrics: {
        totalEvergreen: evergreenPosts.length,
        dueCount: suggestions.length,
        totalRecycled: totalRecycledCount,
      },
      suggestions: tab === 'library' ? [] : suggestions,
      library: tab === 'suggestions' ? [] : library,
      items: tab === 'suggestions' ? suggestions : library,
    });
  } catch (error: any) {
    console.error('❌ [EVERGREEN-API] Error in GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
