import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

// GET /api/crm/customers
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (tag) where.tags = { contains: tag };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { deals: { select: { id: true, title: true, value: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({ customers, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/customers
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        tags: body.tags,
        source: body.source,
        notes: body.notes,
        customData: body.customData,
        workspaceId,
      },
    });

    await recordAuditLog({
      action: 'CUSTOMER.CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Thêm khách hàng mới: ${body.name}`,
        email: body.email,
        phone: body.phone,
        source: body.source
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/customers?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { name: true },
    });

    await prisma.customer.delete({
      where: { id },
    });

    await recordAuditLog({
      action: 'CUSTOMER.DELETE',
      entityType: 'Customer',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Xóa thông tin khách hàng: ${existing?.name || id}` 
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khách hàng' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
