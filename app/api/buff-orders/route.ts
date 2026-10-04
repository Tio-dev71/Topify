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

    const orders = await prisma.buffOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[BUFF_ORDERS_GET]', error);
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
    const { url, actionType, targetCount, config } = body;

    if (!url || !actionType || !targetCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.buffOrder.create({
      data: {
        url,
        actionType,
        targetCount: parseInt(targetCount),
        config: config || {},
        status: 'PENDING'
      }
    });

    await recordAuditLog({
      action: 'BUFF_ORDER.CREATE',
      entityType: 'BuffOrder',
      entityId: order.id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Tạo đơn Buff dịch vụ: ${actionType} (${targetCount})`,
        url,
        actionType,
        targetCount
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('[BUFF_ORDERS_POST]', error);
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
    const { id, url, actionType, targetCount, currentCount, status, config } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (url) data.url = url;
    if (actionType) data.actionType = actionType;
    if (targetCount !== undefined) data.targetCount = parseInt(targetCount);
    if (currentCount !== undefined) data.currentCount = parseInt(currentCount);
    if (status) data.status = status;
    if (config !== undefined) data.config = config;

    const updated = await prisma.buffOrder.update({
      where: { id },
      data,
    });

    await recordAuditLog({
      action: 'BUFF_ORDER.UPDATE',
      entityType: 'BuffOrder',
      entityId: id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Cập nhật đơn Buff dịch vụ: ${updated.actionType} (${updated.targetCount})`,
        url: updated.url,
        status: updated.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[BUFF_ORDERS_PATCH]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await prisma.buffOrder.findUnique({
      where: { id },
      select: { actionType: true, targetCount: true, url: true },
    });

    await prisma.buffOrder.delete({
      where: { id }
    });

    await recordAuditLog({
      action: 'BUFF_ORDER.DELETE',
      entityType: 'BuffOrder',
      entityId: id,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Hủy đơn Buff dịch vụ: ${existing ? `${existing.actionType} (${existing.targetCount})` : id}` 
      },
    });

    return NextResponse.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('[BUFF_ORDERS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
