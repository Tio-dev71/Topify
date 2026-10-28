import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

// GET /api/crm/deals - List deals with pipeline/stage info
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pipelineId = url.searchParams.get('pipelineId');
    const status = url.searchParams.get('status');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (pipelineId) where.pipelineId = pipelineId;
    if (status) where.status = status;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        stage: { select: { name: true, color: true, sortOrder: true } },
        pipeline: { select: { name: true } },
        owner: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ deals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/deals
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      value,
      customerId,
      newCustomer,
      customerName,
      customerPhone,
      customerEmail,
      customerSource,
      customerNotes,
      pipelineId,
      stageId,
      expectedClose
    } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!title || !pipelineId || !stageId) {
      return NextResponse.json({ error: 'Title, pipeline, and stage are required' }, { status: 400 });
    }

    let finalCustomerId = customerId || null;
    let createdCustomer: any = null;

    // Check if new customer should be created and synced to CRM
    const newName = (newCustomer?.name || customerName || '').trim();
    if (!finalCustomerId && newName) {
      createdCustomer = await prisma.customer.create({
        data: {
          name: newName,
          phone: (newCustomer?.phone || customerPhone || '').trim() || null,
          email: (newCustomer?.email || customerEmail || '').trim() || null,
          source: (newCustomer?.source || customerSource || 'MANUAL').trim(),
          notes: (newCustomer?.notes || customerNotes || `Khách hàng tạo từ cơ hội bán hàng: ${title}`).trim() || null,
          workspaceId,
        },
      });
      finalCustomerId = createdCustomer.id;
    } else if (finalCustomerId && workspaceId) {
      // Validate customerId belongs to this workspace
      const existingCust = await prisma.customer.findFirst({
        where: { id: finalCustomerId, workspaceId },
        select: { id: true, name: true },
      });
      if (!existingCust) {
        finalCustomerId = null;
      }
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: typeof value === 'string' ? parseFloat(value) || 0 : (value || 0),
        customerId: finalCustomerId,
        pipelineId,
        stageId,
        ownerId: session.user.id,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        workspaceId,
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        stage: { select: { name: true, color: true } },
        pipeline: { select: { name: true } },
      },
    });

    await recordAuditLog({
      action: 'DEAL.CREATE',
      entityType: 'Deal',
      entityId: deal.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: createdCustomer 
          ? `Tạo cơ hội (Deal) mới: ${title} (Đồng bộ khách hàng mới vào CRM: ${createdCustomer.name})`
          : `Tạo cơ hội (Deal) mới: ${title}`,
        value: deal.value,
        stage: deal.stage?.name,
        customerId: finalCustomerId,
        createdCustomerId: createdCustomer?.id,
      },
    });

    return NextResponse.json({
      ...deal,
      deal,
      customer: deal.customer,
      createdCustomer,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/crm/deals - Move deal between stages (drag and drop support)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const id = body.dealId || body.id;
    const { title, value, customerId, stageId, status, expectedClose } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (value !== undefined) data.value = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (customerId !== undefined) data.customerId = customerId || null;
    if (stageId) data.stageId = stageId;
    if (expectedClose !== undefined) data.expectedClose = expectedClose ? new Date(expectedClose) : null;
    if (status) {
      data.status = status;
      if (status === 'WON' || status === 'LOST') data.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data,
      include: {
        stage: { select: { name: true, color: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    await recordAuditLog({
      action: stageId && !title ? 'DEAL.UPDATE_STAGE' : 'DEAL.UPDATE',
      entityType: 'Deal',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: stageId && !title
          ? `Chuyển giai đoạn cơ hội: ${deal.title} -> ${deal.stage?.name || stageId}`
          : `Cập nhật thông tin cơ hội: ${deal.title}`,
        stage: deal.stage?.name,
        status: deal.status,
        value: deal.value,
      },
    });

    return NextResponse.json({ ...deal, deal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/deals?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const existing = await prisma.deal.findFirst({
      where: { id, workspaceId },
      select: { title: true },
    });

    await prisma.deal.deleteMany({
      where: { id, workspaceId },
    });

    await recordAuditLog({
      action: 'DEAL.DELETE',
      entityType: 'Deal',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Xóa cơ hội (Deal: ${existing?.title || id})` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
