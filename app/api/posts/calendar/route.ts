import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/posts/calendar - Get posts for calendar view
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    let startDate = url.searchParams.get('start');
    let endDate = url.searchParams.get('end');
    const month = url.searchParams.get('month');
    const workspaceIdParam = url.searchParams.get('workspaceId');
    const userWorkspaceId = (session.user as any).workspaceId;
    const userRole = session.user.role;

    // Support ?month=YYYY-MM if start/end are not provided
    if (month && (!startDate || !endDate)) {
      const [yearStr, monthStr] = month.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1; // 0-indexed month
      if (!isNaN(y) && !isNaN(m)) {
        // Expand window to cover preceding and succeeding weeks shown on calendar grid
        startDate = new Date(Date.UTC(y, m - 1, 20)).toISOString();
        endDate = new Date(Date.UTC(y, m + 1, 10)).toISOString();
      }
    }

    // Permission filter aligned with GET /api/posts
    const andConditions: any[] = [];
    if (userRole === 'SUPER_ADMIN') {
      if (workspaceIdParam && workspaceIdParam !== 'all') {
        andConditions.push({ workspaceId: workspaceIdParam });
      } else if (workspaceIdParam !== 'all' && userWorkspaceId) {
        andConditions.push({ workspaceId: userWorkspaceId });
      }
      // Otherwise SUPER_ADMIN sees all
    } else if (userWorkspaceId) {
      andConditions.push({
        OR: [
          { workspaceId: userWorkspaceId },
          { createdById: session.user.id },
        ],
      });
      if (userRole === 'STAFF') {
        andConditions.push({ createdById: session.user.id });
      }
    } else {
      andConditions.push({ createdById: session.user.id });
    }

    // Date range filter
    if (startDate && endDate) {
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      andConditions.push({
        OR: [
          { scheduledAt: { gte: startD, lte: endD } },
          { publishedAt: { gte: startD, lte: endD } },
          { createdAt: { gte: startD, lte: endD }, scheduledAt: null },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        caption: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
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

    // Format for calendar (both events for web FullCalendar and posts for Desktop app)
    const events = posts.map((post) => ({
      id: post.id,
      title: post.title || post.caption?.substring(0, 50) || 'Chưa có tiêu đề',
      start: post.scheduledAt?.toISOString() || post.publishedAt?.toISOString() || post.createdAt?.toISOString(),
      scheduledAt: post.scheduledAt?.toISOString() || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt?.toISOString(),
      status: post.status,
      type: post.postType,
      caption: post.caption || '',
      content: post.caption || '',
      platforms: post.platforms.map((t) => t.platform),
      platformStatuses: post.platforms.map((t) => ({
        platform: t.platform,
        status: t.status,
      })),
    }));

    const safePosts = posts.map((post) => ({
      id: post.id,
      title: post.title || post.caption?.substring(0, 50) || 'Chưa có tiêu đề',
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt?.toISOString(),
      content: post.caption || '',
      caption: post.caption || '',
      platform: post.platforms.map((t) => t.platform).join(', '),
      platforms: post.platforms.map((t) => t.platform),
    }));

    return NextResponse.json({ events, posts: safePosts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

