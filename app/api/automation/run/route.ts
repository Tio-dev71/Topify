import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AutomationEngine, TaskConfig } from '@/lib/automation/engine';
import { recordAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountIds, config, taskId } = await req.json() as { accountIds: string[], config: TaskConfig, taskId?: string };
    
    if (!accountIds || accountIds.length === 0 || !config || !config.type) {
      return NextResponse.json({ error: 'Missing accountIds or config' }, { status: 400 });
    }

    if ((config.type === 'fb_add_friends_group' || config.type === 'fb_invite_to_group') && (!config.targetUrl || config.targetUrl.trim() === '')) {
      return NextResponse.json({ error: 'Vui lòng điền Target URL (Link Group) vào kịch bản này trước khi chạy!' }, { status: 400 });
    }

    if (taskId) {
      await prisma.automationTask.update({
        where: { id: taskId },
        data: { status: 'RUNNING' }
      });
    }

    await recordAuditLog({
      action: 'AUTOMATION.RUN',
      entityType: 'AutomationTask',
      entityId: taskId || undefined,
      userId: session.user.id,
      workspaceId: (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Chạy kịch bản tự động hóa: ${config.type}`,
        taskType: config.type,
        accountsCount: accountIds.length,
        taskId
      },
    });

    processBackgroundAutomation(accountIds, config, taskId).catch(e => {
      console.error('[Background Automation Error]', e);
    });

    return NextResponse.json({ success: true, message: 'Automation task started in background' });

  } catch (error: any) {
    console.error('Failed to start automation task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function processBackgroundAutomation(accountIds: string[], config: TaskConfig, taskId?: string) {
  await Promise.all(accountIds.map(async (accountId) => {
    const account = await prisma.facebookAccount.findUnique({ where: { id: accountId } });
    if (!account) return;

    console.log(`[Automation Runner] Starting task ${config.type} for account ${account.name}`);
    try {
      await AutomationEngine.runTask(account.profileId, config);
      console.log(`[Automation Runner] Completed task for account ${account.name}`);
    } catch (e) {
      console.error(`[Automation Runner] Failed for account ${account.name}:`, e);
    }
  }));

  if (taskId) {
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'DONE' }
    });
  }
}
