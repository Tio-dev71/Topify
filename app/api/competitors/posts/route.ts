import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const posts = await prisma.competitorPost.findMany({
      where: pageId ? { pageId } : {},
      orderBy: { postedAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[COMPETITOR_POSTS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pageId, externalId, content, mediaUrl, likesCount, commentsCount, sharesCount, postedAt } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const post = await prisma.competitorPost.create({
      data: {
        pageId,
        externalId: externalId || null,
        content: content || null,
        mediaUrl: mediaUrl || null,
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        sharesCount: sharesCount || 0,
        postedAt: postedAt ? new Date(postedAt) : null,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('[COMPETITOR_POSTS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
