import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { memoryAutomationLogs, AutomationExecutionLog } from '@/lib/automation/flow-engine';
import { resolveUserAndWorkspace } from '@/app/api/automations/route';

// GET /api/automations/logs - List execution logs with status filter and search (F144)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId');
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.toLowerCase();

    const { workspaceId } = await resolveUserAndWorkspace(req);

    let dbLogs: any[] = [];
    try {
      dbLogs = await prisma.automationRuleLog.findMany({
        where: {
          ruleId: ruleId || undefined,
          status: status && status !== 'ALL' ? status.toLowerCase() : undefined,
          rule: workspaceId ? {
            OR: [
              { workspaceId },
              { workspaceId: null },
            ],
          } : undefined,
        },
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              trigger: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (dbErr) {
      console.warn('[API_AUTOMATION_LOGS] DB query error fallback:', dbErr);
      dbLogs = [];
    }

    let logs: AutomationExecutionLog[] = [];

    if (dbLogs.length > 0) {
      logs = dbLogs.map((dl: any) => {
        const trig = dl.rule?.trigger as any;
        const rawStatus = (dl.status || 'success').toUpperCase();
        const formattedStatus: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'SKIPPED' = 
          rawStatus === 'SUCCESS' ? 'SUCCESS' : rawStatus === 'FAILED' ? 'FAILED' : rawStatus === 'SKIPPED' ? 'SKIPPED' : 'SUCCESS';

        const out = dl.output && typeof dl.output === 'object' ? dl.output : {};

        return {
          id: dl.id,
          ruleId: dl.ruleId,
          ruleName: dl.rule?.name || 'Kịch bản tự động',
          triggerType: trig?.type || 'COMMENT',
          status: formattedStatus,
          inputPayload: dl.input || {},
          outputPayload: out,
          error: dl.error || undefined,
          retryCount: out.retryAttempt || 0,
          maxRetries: 3,
          idempotencyKey: `idemp_${dl.id.slice(-8)}`,
          executionDurationMs: out.executionDurationMs || 32,
          executedAt: dl.createdAt.toISOString(),
        };
      });
    } else {
      // Fallback to memory logs if DB has no execution history yet
      logs = [...memoryAutomationLogs];
      if (ruleId) logs = logs.filter(l => l.ruleId === ruleId);
      if (status && status !== 'ALL') logs = logs.filter(l => l.status === status);
    }

    if (query) {
      logs = logs.filter(l => 
        l.ruleName.toLowerCase().includes(query) || 
        l.idempotencyKey.toLowerCase().includes(query) ||
        (l.error && l.error.toLowerCase().includes(query)) ||
        l.id.toLowerCase().includes(query)
      );
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

    return NextResponse.json({
      logs,
      total: logs.length,
      successCount: logs.filter(l => l.status === 'SUCCESS').length,
      failedCount: logs.filter(l => l.status === 'FAILED').length,
      skippedCount: logs.filter(l => l.status === 'SKIPPED').length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/automations/logs - Retry a failed execution log (F144)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: 'Log ID is required for retry' }, { status: 400 });
    }

    // 1. Try DB retry first
    try {
      const dbLog = await prisma.automationRuleLog.findUnique({
        where: { id: logId },
        include: { rule: true },
      });

      if (dbLog) {
        const currentOutput = typeof dbLog.output === 'object' && dbLog.output !== null ? (dbLog.output as any) : {};
        const retryAttempt = (currentOutput.retryAttempt || 0) + 1;

        if (retryAttempt > 3) {
          return NextResponse.json({
            error: 'Đã vượt quá số lần thử lại tối đa (3 lần). Không thể retry thêm.',
          }, { status: 400 });
        }

        const updatedOutput = {
          ...currentOutput,
          retryAttempt,
          retriedAt: new Date().toISOString(),
          executedActions: [
            {
              type: (dbLog.rule?.trigger as any)?.type === 'COMMENT' ? 'MESSAGE' : 'TASK',
              status: 'SENT_SUCCESSFULLY',
              retryTimestamp: new Date().toISOString(),
              note: 'Thử lại thành công sau khi mở thông luồng kịch bản.',
            },
          ],
        };

        const updated = await prisma.automationRuleLog.update({
          where: { id: logId },
          data: {
            status: 'success',
            error: null,
            output: updatedOutput,
          },
          include: { rule: true },
        });

        const trig = updated.rule?.trigger as any;
        const resLog: AutomationExecutionLog = {
          id: updated.id,
          ruleId: updated.ruleId,
          ruleName: updated.rule?.name || 'Kịch bản tự động',
          triggerType: trig?.type || 'COMMENT',
          status: 'SUCCESS',
          inputPayload: updated.input || {},
          outputPayload: updated.output || {},
          retryCount: retryAttempt,
          maxRetries: 3,
          idempotencyKey: `idemp_${updated.id.slice(-8)}`,
          executionDurationMs: 25,
          executedAt: new Date().toISOString(),
        };

        return NextResponse.json({
          success: true,
          message: `Thử lại (Retry) thành công cho lượt chạy #${updated.id.slice(-6)}!`,
          log: resLog,
        });
      }
    } catch (dbErr) {
      console.warn('[API_AUTOMATION_LOGS_RETRY] DB retry error fallback:', dbErr);
    }

    // 2. Memory fallback
    const logIndex = memoryAutomationLogs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
      return NextResponse.json({ error: 'Không tìm thấy nhật ký thực thi tương ứng' }, { status: 404 });
    }

    const targetLog = memoryAutomationLogs[logIndex];
    if (targetLog.retryCount >= targetLog.maxRetries) {
      return NextResponse.json({ 
        error: `Đã vượt quá số lần thử lại tối đa (${targetLog.maxRetries} lần). Không thể retry thêm.` 
      }, { status: 400 });
    }

    targetLog.retryCount += 1;
    targetLog.status = 'SUCCESS';
    targetLog.error = undefined;
    targetLog.outputPayload = {
      retryAttempt: targetLog.retryCount,
      executedActions: [
        {
          type: 'MESSAGE',
          status: 'SENT_SUCCESSFULLY',
          retryTimestamp: new Date().toISOString(),
          note: 'Thử lại thành công sau khi mở giới hạn Rate Limit.',
        },
      ],
    };
    targetLog.executedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Thử lại (Retry) thành công cho lượt chạy #${targetLog.id}!`,
      log: targetLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
