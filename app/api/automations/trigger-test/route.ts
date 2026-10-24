import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { 
  memoryAutomationRules, 
  memoryAutomationLogs, 
  evaluateConditionsDetailed, 
  executeActions,
  AutomationExecutionLog,
  AutomationRuleItem
} from '@/lib/automation/flow-engine';

// POST /api/automations/trigger-test - Test trigger a rule with custom payload or diagnostic report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, payload, autoMatch = false } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId là bắt buộc để chạy thử nghiệm' }, { status: 400 });
    }

    // 1. Search in memory first, then database
    let rule: AutomationRuleItem | undefined = memoryAutomationRules.find(r => r.id === ruleId);
    let isDbRule = false;

    if (!rule) {
      try {
        const dbRule = await prisma.automationRule.findUnique({
          where: { id: ruleId },
          include: { _count: { select: { logs: true } } },
        });

        if (dbRule) {
          isDbRule = true;
          rule = {
            id: dbRule.id,
            name: dbRule.name,
            description: dbRule.description || '',
            trigger: dbRule.trigger as any,
            conditions: (dbRule.conditions as any) || [],
            actions: (dbRule.actions as any) || [],
            isActive: dbRule.isActive,
            executionCount: (dbRule as any)._count?.logs ?? 0,
            createdAt: dbRule.createdAt.toISOString(),
          };
        }
      } catch (err) {
        // Continue with memory fallback
      }
    }

    if (!rule) {
      return NextResponse.json({ error: 'Không tìm thấy kịch bản quy tắc để chạy thử' }, { status: 404 });
    }

    // 2. Build test payload
    let testPayload: Record<string, any>;

    if (autoMatch) {
      // Intelligently generate a payload that satisfies 100% of the rule's conditions
      const keywordCondition = rule.conditions?.find(c => c.field === 'keyword');
      let targetKeyword = 'giá bao nhiêu';
      if (keywordCondition) {
        if (Array.isArray(keywordCondition.value) && keywordCondition.value.length > 0) {
          targetKeyword = String(keywordCondition.value[0]);
        } else if (typeof keywordCondition.value === 'string') {
          targetKeyword = keywordCondition.value.split(',')[0].trim();
        }
      }

      const tagCondition = rule.conditions?.find(c => c.field === 'tag');
      const targetTag = tagCondition 
        ? (Array.isArray(tagCondition.value) ? String(tagCondition.value[0]) : String(tagCondition.value).split(',')[0].trim())
        : 'VIP';

      const statusCondition = rule.conditions?.find(c => c.field === 'status');
      const targetStatus = statusCondition ? String(statusCondition.value) : 'NEW';

      const sourceCondition = rule.conditions?.find(c => c.field === 'source');
      const targetSource = sourceCondition ? String(sourceCondition.value) : 'test_console';

      testPayload = {
        author: 'Khách hàng thử nghiệm (Auto-Match)',
        channel: rule.trigger?.config?.channel && rule.trigger.config.channel !== 'ALL' 
          ? rule.trigger.config.channel 
          : 'FACEBOOK',
        text: `Chào shop! Tôi đang cần hỏi về ${targetKeyword}, tư vấn giúp tôi nhé!`,
        source: targetSource,
        status: targetStatus,
        tag: targetTag,
      };
    } else if (payload) {
      testPayload = payload;
    } else {
      // Default sample test payload
      testPayload = {
        author: 'Khách hàng thử nghiệm',
        channel: rule.trigger?.config?.channel && rule.trigger.config.channel !== 'ALL' 
          ? rule.trigger.config.channel 
          : 'FACEBOOK',
        text: 'Shop ơi áo này giá bao nhiêu và có ship không?',
        source: 'test_console',
        status: 'NEW',
        tag: 'VIP',
      };
    }

    // 3. Evaluate conditions with detailed breakdown
    const startTime = Date.now();
    const evalResult = evaluateConditionsDetailed(rule.conditions || [], testPayload);

    let executionStatus: 'SUCCESS' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
    let outputData: Record<string, any> = {};
    let skipReason = '';

    if (!rule.isActive) {
      skipReason = 'Kịch bản hiện đang ở trạng thái TẮT (Inactive). Hãy bật công tắc trên thẻ để quy trình xử lý sự kiện.';
      outputData = { reason: skipReason };
    } else if (!evalResult.isMatched) {
      skipReason = evalResult.explanation;
      outputData = { 
        reason: 'Điều kiện không thỏa mãn (Conditions not matched).',
        failedConditions: evalResult.failedConditions,
      };
    } else {
      outputData = executeActions(rule.actions || [], testPayload);
      executionStatus = 'SUCCESS';
      rule.executionCount = (rule.executionCount || 0) + 1;
      rule.lastExecutedAt = new Date().toISOString();

      // If rule is stored in DB, persist execution log to Prisma
      if (isDbRule) {
        try {
          await prisma.automationRuleLog.create({
            data: {
              ruleId: rule.id,
              status: 'success',
              input: testPayload,
              output: outputData,
            },
          });
        } catch (dbErr) {
          console.warn('[trigger-test] Could not persist log to DB, using memory:', dbErr);
        }
      }
    }

    const duration = Date.now() - startTime;
    const newLog: AutomationExecutionLog = {
      id: `log_test_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: rule.trigger?.type || 'COMMENT',
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

    // Build how to pass advice
    let howToPass = 'Kịch bản đã sẵn sàng hoạt động với các điều kiện hiện tại.';
    if (!rule.isActive) {
      howToPass = 'Bật công tắc kích hoạt của kịch bản trước khi chạy thử.';
    } else if (evalResult.failedConditions.length > 0) {
      const tips: string[] = [];
      for (const f of evalResult.failedConditions) {
        if (f.condition.field === 'keyword') {
          tips.push(`Nội dung gửi đến (tin nhắn/bình luận) cần chứa một trong các từ khóa: "${f.expectedValue}"`);
        } else {
          tips.push(`Trường "${f.condition.field}" cần thỏa mãn điều kiện [${f.condition.operator} "${f.expectedValue}"] (giá trị hiện tại là "${f.actualValue}")`);
        }
      }
      howToPass = tips.join('; ') + '. Hoặc bấm nút "Chạy Thử Với Dữ Liệu Khớp 100%" để tự động kích hoạt ngay lập tức.';
    }

    return NextResponse.json({
      success: true,
      status: executionStatus,
      matched: evalResult.isMatched,
      message: executionStatus === 'SUCCESS' 
        ? `Kịch bản "${rule.name}" đã kích hoạt và thực thi thành công ${(outputData.executedActions || []).length} hành động!`
        : `Kịch bản "${rule.name}" đã bỏ qua do chưa thỏa mãn điều kiện lọc.`,
      purpose: 'Mục đích tính năng Test: Cho phép bạn giả lập sự kiện (Comment/Tin nhắn/Lead) để kiểm tra quy trình phản hồi tự động trước khi triển khai thực tế tới khách hàng thật.',
      diagnostic: {
        ruleId: rule.id,
        ruleName: rule.name,
        isActive: rule.isActive,
        triggerType: rule.trigger?.type,
        testPayload,
        isMatched: evalResult.isMatched,
        results: evalResult.results,
        failedConditions: evalResult.failedConditions,
        skipReason,
        howToPass,
        executedActions: outputData.executedActions || [],
      },
      log: newLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
