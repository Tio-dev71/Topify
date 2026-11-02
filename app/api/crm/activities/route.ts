import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET /api/crm/activities - List CRM activities & follow-ups (F098)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const type = searchParams.get('type');
    const isDoneParam = searchParams.get('isDone');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (customerId) where.customerId = customerId;
    if (type && type !== 'ALL') where.type = type;
    if (isDoneParam !== null && isDoneParam !== undefined && isDoneParam !== '') {
      where.isDone = isDoneParam === 'true';
    }

    const activities = await prisma.crmActivity.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, avatar: true, source: true } },
        createdBy: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: [{ isDone: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    const stats = {
      total: activities.length,
      pending: activities.filter(a => !a.isDone).length,
      done: activities.filter(a => a.isDone).length,
      callCount: activities.filter(a => a.type === 'CALL').length,
      meetingCount: activities.filter(a => a.type === 'MEETING').length,
      taskCount: activities.filter(a => a.type === 'TASK').length,
      reminderCount: activities.filter(a => a.type === 'NOTE' || a.type === 'MESSAGE').length,
    };

    return NextResponse.json({ activities, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/activities - Create activity or follow-up (F098)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type = 'CALL', title, description, customerId, dueDate, isDone = false } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tiêu đề hoạt động là bắt buộc' }, { status: 400 });
    }

    // Validate customer belongs to workspace if customerId provided
    if (customerId) {
      const cust = await prisma.customer.findFirst({
        where: { id: customerId, workspaceId },
      });
      if (!cust) {
        return NextResponse.json({ error: 'Khách hàng không tồn tại trong workspace' }, { status: 404 });
      }
    }

    const validTypes = ['CALL', 'MEETING', 'MESSAGE', 'TASK', 'NOTE'];
    const finalType = validTypes.includes(type) ? type : 'CALL';

    const activity = await prisma.crmActivity.create({
      data: {
        type: finalType as any,
        title: title.trim(),
        description: description?.trim() || null,
        customerId: customerId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isDone: Boolean(isDone),
        createdById: session.user.id,
        workspaceId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, avatar: true, source: true } },
        createdBy: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    await recordAuditLog({
      action: 'ACTIVITY.CREATE',
      entityType: 'CrmActivity',
      entityId: activity.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Tạo hoạt động CRM [${finalType}]: ${title}`,
        type: finalType,
        customerId,
      },
    });

    return NextResponse.json({ activity, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/crm/activities - Toggle done / update activity (F098)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isDone, title, description, dueDate, type } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const existing = await prisma.crmActivity.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hoạt động' }, { status: 404 });
    }

    const data: any = {};
    if (isDone !== undefined) data.isDone = Boolean(isDone);
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (type !== undefined) data.type = type;

    const activity = await prisma.crmActivity.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, avatar: true, source: true } },
        createdBy: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    await recordAuditLog({
      action: isDone !== undefined ? 'ACTIVITY.STATUS_TOGGLE' : 'ACTIVITY.UPDATE',
      entityType: 'CrmActivity',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Cập nhật hoạt động: ${activity.title} (Trạng thái: ${activity.isDone ? 'Đã hoàn thành' : 'Đang chờ'})`,
        isDone: activity.isDone,
      },
    });

    return NextResponse.json({ activity, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/activities?id=...
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
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const existing = await prisma.crmActivity.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hoạt động' }, { status: 404 });
    }

    await prisma.crmActivity.delete({
      where: { id },
    });

    await recordAuditLog({
      action: 'ACTIVITY.DELETE',
      entityType: 'CrmActivity',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Xóa hoạt động: ${existing.title}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa hoạt động thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
