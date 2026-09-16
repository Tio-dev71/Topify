import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/posts/calendar - Get posts for calendar view
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };

    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        caption: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        postType: true,
        platforms: {
          select: {
            id: true,
            platform: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Format for calendar
    const events = posts.map(post => ({
      id: post.id,
      title: post.title || post.caption?.substring(0, 50) || 'Untitled',
      start: post.scheduledAt?.toISOString() || post.publishedAt?.toISOString(),
      status: post.status,
      type: post.postType,
      platforms: post.platforms.map(t => t.platform),
      platformStatuses: post.platforms.map(t => ({
        platform: t.platform,
        status: t.status,
      })),
    }));

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
