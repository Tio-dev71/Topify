import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const assigneeId = url.searchParams.get('assigneeId');
    const priority = url.searchParams.get('priority');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId, parentId: null }; // top-level only by default
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { name: true, email: true, image: true } },
        createdBy: { select: { name: true } },
        children: {
          include: { assignee: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, dueDate, assigneeId, parentId } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        parentId,
        createdById: session.user.id,
        workspaceId,
      },
      include: {
        assignee: { select: { name: true, image: true } },
      },
    });

    await recordAuditLog({
      action: 'TASK.CREATE',
      entityType: 'Task',
      entityId: task.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Tạo công việc mới: ${title}`,
        priority: priority || 'MEDIUM',
        dueDate
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tasks - Update task status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, status, priority, assigneeId } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: { select: { name: true, image: true } },
      },
    });

    await recordAuditLog({
      action: status ? 'TASK.UPDATE_STATUS' : 'TASK.UPDATE',
      entityType: 'Task',
      entityId: taskId,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: status 
          ? `Cập nhật trạng thái công việc: ${task.title} -> ${status}`
          : `Cập nhật công việc: ${task.title}`,
        status,
        priority
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks?id=...
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
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: { id, workspaceId },
      select: { title: true },
    });

    await prisma.task.deleteMany({
      where: { id, workspaceId },
    });

    await recordAuditLog({
      action: 'TASK.DELETE',
      entityType: 'Task',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Xóa công việc: ${existing?.title || id}` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
