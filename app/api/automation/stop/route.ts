import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { browserManager } from '@/lib/automation/browserManager';
import { recordAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });

    const task = await prisma.automationTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Stop the task for all profiles
    const profileIds = (task.profileIds as string[]) || [];
    if (profileIds.length > 0) {
      for (const accountId of profileIds) {
        const account = await prisma.facebookAccount.findUnique({ where: { id: accountId } });
        if (account && account.profileId) {
          // Set the stop flag
          browserManager.stopTask(account.profileId);
        }
      }
    }

    // Update DB status to STOPPED
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'DONE' }
    });

    await recordAuditLog({
      action: 'AUTOMATION.STOP',
      entityType: 'AutomationTask',
      entityId: taskId,
      userId: session.user.id,
      workspaceId: task.workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Dừng tác vụ tự động hóa: ${task.name}`,
        taskType: task.type,
        taskId
      },
    });

    return NextResponse.json({ success: true, message: 'Task stopped' });
  } catch (error: any) {
    console.error('Failed to stop task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
