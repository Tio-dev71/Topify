import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proxies = await prisma.proxy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ proxies });
  } catch (error) {
    console.error('[PROXIES_GET]', error);
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
    const { protocol, host, port, username, password } = body;

    if (!host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const proxy = await prisma.proxy.create({
      data: {
        protocol: protocol || 'http',
        host,
        port: parseInt(port),
        username: username || null,
        password: password || null,
        status: 'ACTIVE'
      }
    });

    await recordAuditLog({
      action: 'PROXY.CREATE',
      entityType: 'Proxy',
      entityId: proxy.id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Thêm Proxy mới: ${protocol || 'http'}://${host}:${port}`,
        host,
        port
      },
    });

    return NextResponse.json(proxy);
  } catch (error) {
    console.error('[PROXIES_POST]', error);
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
    const { id, protocol, host, port, username, password, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Proxy ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (protocol !== undefined) updateData.protocol = protocol;
    if (host !== undefined) updateData.host = host.trim();
    if (port !== undefined) updateData.port = parseInt(port);
    if (username !== undefined) updateData.username = username ? username.trim() : null;
    if (password !== undefined) updateData.password = password ? password : null;
    if (status !== undefined) updateData.status = status;

    const proxy = await prisma.proxy.update({
      where: { id },
      data: updateData
    });

    await recordAuditLog({
      action: 'PROXY.UPDATE',
      entityType: 'Proxy',
      entityId: id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Cập nhật Proxy: ${proxy.host}:${proxy.port}`,
        status: proxy.status
      },
    });

    return NextResponse.json(proxy);
  } catch (error) {
    console.error('[PROXIES_PATCH]', error);
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
      return NextResponse.json({ error: 'Proxy ID is required' }, { status: 400 });
    }

    const existing = await prisma.proxy.findUnique({
      where: { id },
      select: { host: true, port: true },
    });

    await prisma.proxy.delete({
      where: { id }
    });

    await recordAuditLog({
      action: 'PROXY.DELETE',
      entityType: 'Proxy',
      entityId: id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Xóa Proxy: ${existing ? `${existing.host}:${existing.port}` : id}` 
      },
    });

    return NextResponse.json({ message: 'Proxy deleted' });
  } catch (error) {
    console.error('[PROXIES_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
