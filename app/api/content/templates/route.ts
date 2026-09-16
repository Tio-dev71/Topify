import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/content/templates
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await prisma.contentTemplate.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content/templates
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, description, postType, caption, hashtags, cta, platform } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const template = await prisma.contentTemplate.create({
      data: {
        name,
        description,
        postType: postType || 'FEED',
        caption,
        hashtags,
        cta,
        platform,
        workspaceId: (session.user as any).workspaceId,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/content/templates (update by id in body)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = await prisma.contentTemplate.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.contentTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content/templates?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = await prisma.contentTemplate.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.contentTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
