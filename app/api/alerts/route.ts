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
    const workspaceId = (session.user as { workspaceId?: string })?.workspaceId || searchParams.get('workspaceId');
    const keyword = searchParams.get('keyword');
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Record<string, unknown> = {};

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (keyword && keyword !== 'all') {
      where.keyword = { equals: keyword, mode: 'insensitive' };
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [
        ...existingAnd,
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { message: { contains: searchTerm, mode: 'insensitive' } },
            { keyword: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const alerts = await prisma.mentionAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[ALERTS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isRead, title, message, keyword } = body;

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (title !== undefined) updateData.title = title.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (keyword !== undefined) updateData.keyword = keyword.trim();

    const alert = await prisma.mentionAlert.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('[ALERTS_PATCH]', error);
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
    const deleteAll = searchParams.get('all') === 'true';
    const keyword = searchParams.get('keyword');
    const workspaceId = (session.user as { workspaceId?: string })?.workspaceId || searchParams.get('workspaceId');

    if (deleteAll) {
      const deleteWhere: Record<string, unknown> = {};
      if (workspaceId) {
        deleteWhere.workspaceId = workspaceId;
      }
      await prisma.mentionAlert.deleteMany({
        where: deleteWhere
      });
      return NextResponse.json({ message: 'Tất cả cảnh báo đã được xóa' });
    }

    if (keyword) {
      const deleteWhere: Record<string, unknown> = {
        keyword: { equals: keyword, mode: 'insensitive' }
      };
      if (workspaceId) {
        deleteWhere.workspaceId = workspaceId;
      }
      await prisma.mentionAlert.deleteMany({
        where: deleteWhere
      });
      return NextResponse.json({ message: `Đã xóa cảnh báo của từ khóa ${keyword}` });
    }

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    await prisma.mentionAlert.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('[ALERTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

