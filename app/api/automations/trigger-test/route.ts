import { NextRequest, NextResponse } from 'next/server';
import { 
  memoryAutomationRules, 
  memoryAutomationLogs, 
  evaluateConditions, 
  executeActions,
  AutomationExecutionLog 
} from '@/lib/automation/flow-engine';

// POST /api/automations/trigger-test - Test trigger a rule with custom payload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, payload } = body;

    const rule = memoryAutomationRules.find(r => r.id === ruleId);
    if (!rule) {
      return NextResponse.json({ error: 'Không tìm thấy kịch bản quy tắc để chạy thử' }, { status: 404 });
    }

    const testPayload = payload || {
      author: 'Khách hàng thử nghiệm',
      channel: rule.trigger.config.channel || 'FACEBOOK',
      text: 'Shop ơi áo này giá bao nhiêu và có ship không?',
      source: 'test_console',
      status: 'NEW',
      tag: 'VIP',
    };

    const startTime = Date.now();
    const isMatched = evaluateConditions(rule.conditions, testPayload);

    let executionStatus: 'SUCCESS' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
    let outputData: Record<string, any> = {};

    if (!rule.isActive) {
      outputData = { reason: 'Kịch bản đang ở trạng thái TẮT (Inactive).' };
    } else if (!isMatched) {
      outputData = { reason: 'Điều kiện không thỏa mãn (Conditions not matched).' };
    } else {
      outputData = executeActions(rule.actions, testPayload);
      executionStatus = 'SUCCESS';
      rule.executionCount += 1;
      rule.lastExecutedAt = new Date().toISOString();
    }

    const duration = Date.now() - startTime;
    const newLog: AutomationExecutionLog = {
      id: `log_test_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: rule.trigger.type,
      status: executionStatus,
      inputPayload: testPayload,
      outputPayload: outputData,
      retryCount: 0,
      maxRetries: 3,
      idempotencyKey: `idemp_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      executionDurationMs: duration,
      executedAt: new Date().toISOString(),
    };

    memoryAutomationLogs.unshift(newLog);

    return NextResponse.json({
      success: true,
      message: executionStatus === 'SUCCESS' 
        ? `Kịch bản "${rule.name}" đã kích hoạt và thực thi thành công!`
        : `Kịch bản "${rule.name}" đã bỏ qua (Không thỏa điều kiện).`,
      matched: isMatched,
      status: executionStatus,
      log: newLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
