import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    const where: any = {};

    if (session.user.role === 'SUPER_ADMIN') {
      const wsParam = req.nextUrl.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      }
    } else {
      where.workspaceId = userWorkspaceId || 'none';
    }

    const tasks = await prisma.automationTask.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    
    if (!data.name || !data.type || !data.profileIds || !Array.isArray(data.profileIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;

    const task = await prisma.automationTask.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config || {},
        profileIds: data.profileIds,
        status: 'IDLE',
        workspaceId: userWorkspaceId || null,
        userId: session.user.id || null,
      }
    });

    await recordAuditLog({
      action: 'AUTOMATION.CREATE',
      entityType: 'AutomationTask',
      entityId: task.id,
      userId: session.user.id,
      workspaceId: userWorkspaceId,
      req,
      metadata: { 
        message: `Tạo tác vụ tự động hóa: ${data.name}`,
        type: data.type,
        accountsCount: data.profileIds.length
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    if (!data.id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.automationTask.findFirst({
        where: { id: data.id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
      }
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.profileIds !== undefined) updateData.profileIds = data.profileIds;

    const task = await prisma.automationTask.update({
      where: { id: data.id },
      data: updateData
    });

    await recordAuditLog({
      action: 'AUTOMATION.UPDATE',
      entityType: 'AutomationTask',
      entityId: task.id,
      userId: session.user.id,
      workspaceId: task.workspaceId || userWorkspaceId,
      req,
      metadata: { 
        message: `Cập nhật tác vụ tự động hóa: ${task.name}`,
        status: task.status
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
