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
    const workspaceId = searchParams.get('workspaceId');

    const pages = await prisma.competitorPage.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('[COMPETITORS_GET]', error);
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
    const { url, name, avatar, workspaceId } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const page = await prisma.competitorPage.create({
      data: {
        url,
        name: name || null,
        avatar: avatar || null,
        workspaceId: workspaceId || null
      }
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('[COMPETITORS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    await prisma.competitorPage.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Page deleted' });
  } catch (error) {
    console.error('[COMPETITORS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
