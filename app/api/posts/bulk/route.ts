import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/posts/bulk — Create multiple posts at once
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { posts } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'posts array is required' }, { status: 400 });
    }

    if (posts.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 posts per batch' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      try {
        const post = await prisma.post.create({
          data: {
            title: p.title || `Bài viết ${i + 1}`,
            caption: p.caption,
            firstComment: p.firstComment,
            hashtags: p.hashtags,
            postType: p.postType || 'FEED',
            videoAssetId: p.videoAssetId || null,
            createdById: session.user.id,
            workspaceId: (session.user as any).workspaceId,
            status: p.scheduledAt ? 'SCHEDULED' : 'DRAFT',
            scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : null,
            platforms: p.platforms ? {
              create: p.platforms.map((platform: string) => ({
                platform,
                status: 'PENDING',
              })),
            } : undefined,
          },
          include: { platforms: true },
        });
        results.push(post);
      } catch (err: any) {
        errors.push({ index: i, error: err.message });
      }
    }

    return NextResponse.json({
      created: results.length,
      failed: errors.length,
      results,
      errors,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
