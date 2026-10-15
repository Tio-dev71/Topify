import { NextRequest, NextResponse } from 'next/server';
import { memoryAutomationLogs, AutomationExecutionLog } from '@/lib/automation/flow-engine';

// GET /api/automations/logs - List execution logs with status filter and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId');
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.toLowerCase();

    let logs = [...memoryAutomationLogs];

    if (ruleId) {
      logs = logs.filter(l => l.ruleId === ruleId);
    }

    if (status && status !== 'ALL') {
      logs = logs.filter(l => l.status === status);
    }

    if (query) {
      logs = logs.filter(l => 
        l.ruleName.toLowerCase().includes(query) || 
        l.idempotencyKey.toLowerCase().includes(query) ||
        (l.error && l.error.toLowerCase().includes(query))
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

    const logIndex = memoryAutomationLogs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
      return NextResponse.json({ error: 'Execution log not found' }, { status: 404 });
    }

    const targetLog = memoryAutomationLogs[logIndex];
    if (targetLog.retryCount >= targetLog.maxRetries) {
      return NextResponse.json({ 
        error: `Đã vượt quá số lần thử lại tối đa (${targetLog.maxRetries} lần). Không thể retry thêm.` 
      }, { status: 400 });
    }

    // Perform simulated retry with success
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
