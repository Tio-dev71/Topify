import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit-log';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const userWorkspaceId = (session.user as any).workspaceId;
    const existing = await prisma.automationTask.findFirst({
      where: session.user.role === 'SUPER_ADMIN' || !userWorkspaceId 
        ? { id } 
        : { id, workspaceId: userWorkspaceId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    await prisma.automationTask.delete({
      where: { id },
    });

    await recordAuditLog({
      action: 'AUTOMATION.DELETE',
      entityType: 'AutomationTask',
      entityId: id,
      userId: session.user.id,
      workspaceId: existing.workspaceId || userWorkspaceId,
      req,
      metadata: { 
        message: `Xóa tác vụ tự động hóa: ${existing.name}` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.automationTask.findFirst({
        where: { id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
      }
    }

    const task = await prisma.automationTask.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        config: body.config,
        profileIds: body.profileIds
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
