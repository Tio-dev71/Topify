import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

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
    const resolvedWorkspaceId = workspaceId || (session.user as any).workspaceId;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const page = await prisma.competitorPage.create({
      data: {
        url,
        name: name || null,
        avatar: avatar || null,
        workspaceId: resolvedWorkspaceId || null
      }
    });

    await recordAuditLog({
      action: 'COMPETITOR.CREATE',
      entityType: 'CompetitorPage',
      entityId: page.id,
      userId: session.user.id,
      workspaceId: resolvedWorkspaceId,
      req,
      metadata: { 
        message: `Thêm đối thủ theo dõi: ${name || url}`,
        url,
        name
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('[COMPETITORS_POST]', error);
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
    const { id, name, url, avatar } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim() || null;
    if (url !== undefined) {
      let targetUrl = url.trim();
      if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }
      updateData.url = targetUrl;
    }
    if (avatar !== undefined) updateData.avatar = avatar.trim() || null;

    const page = await prisma.competitorPage.update({
      where: { id },
      data: updateData
    });

    await recordAuditLog({
      action: 'COMPETITOR.UPDATE',
      entityType: 'CompetitorPage',
      entityId: id,
      userId: session.user.id,
      workspaceId: page.workspaceId || workspaceId,
      req,
      metadata: { 
        message: `Cập nhật thông tin đối thủ: ${page.name || page.url}`,
        url: page.url,
        name: page.name
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('[COMPETITORS_PATCH]', error);
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
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const existing = await prisma.competitorPage.findUnique({
      where: { id },
      select: { name: true, url: true, workspaceId: true },
    });

    await prisma.competitorPage.delete({
      where: { id }
    });

    await recordAuditLog({
      action: 'COMPETITOR.DELETE',
      entityType: 'CompetitorPage',
      entityId: id,
      userId: session.user.id,
      workspaceId: existing?.workspaceId || workspaceId,
      req,
      metadata: { 
        message: `Xóa đối thủ theo dõi: ${existing?.name || existing?.url || id}` 
      },
    });

    return NextResponse.json({ message: 'Page deleted' });
  } catch (error) {
    console.error('[COMPETITORS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
