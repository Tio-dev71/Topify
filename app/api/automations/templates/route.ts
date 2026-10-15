import { NextRequest, NextResponse } from 'next/server';
import { 
  INITIAL_AUTOMATION_TEMPLATES, 
  memoryAutomationRules, 
  AutomationRuleItem 
} from '@/lib/automation/flow-engine';

// GET /api/automations/templates - List all pre-built automation templates (F145)
export async function GET() {
  try {
    return NextResponse.json({
      templates: INITIAL_AUTOMATION_TEMPLATES,
      total: INITIAL_AUTOMATION_TEMPLATES.length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/automations/templates - 1-Click Apply template to create a new active rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, customName } = body;

    const tpl = INITIAL_AUTOMATION_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) {
      return NextResponse.json({ error: 'Mẫu quy trình không tồn tại' }, { status: 404 });
    }

    const newRule: AutomationRuleItem = {
      id: `rule_from_${tpl.id}_${Date.now()}`,
      name: customName || tpl.name,
      description: tpl.description,
      trigger: JSON.parse(JSON.stringify(tpl.trigger)),
      conditions: JSON.parse(JSON.stringify(tpl.conditions)),
      actions: JSON.parse(JSON.stringify(tpl.actions)),
      isActive: true,
      executionCount: 0,
      createdAt: new Date().toISOString(),
    };

    memoryAutomationRules.unshift(newRule);

    return NextResponse.json({
      success: true,
      message: `Đã áp dụng thành công mẫu "${tpl.name}" vào danh sách kịch bản tự động!`,
      rule: newRule,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
