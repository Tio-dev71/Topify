import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/content/hashtags
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const category = url.searchParams.get('category'); // 'HASHTAG' or 'CTA'

    const where: any = { workspaceId: (session.user as any).workspaceId };
    if (category) where.category = category;

    const items = await prisma.hashtagLibrary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content/hashtags
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, hashtags, category } = body;

    if (!name || !hashtags) return NextResponse.json({ error: 'Name and hashtags are required' }, { status: 400 });

    const item = await prisma.hashtagLibrary.create({
      data: {
        name,
        hashtags,
        category: category || 'HASHTAG',
        workspaceId: (session.user as any).workspaceId,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content/hashtags?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.hashtagLibrary.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.hashtagLibrary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
