import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { memoryAutomationRules, AutomationRuleItem } from '@/lib/automation/flow-engine';

// GET /api/automations - List automation rules
export async function GET(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const workspaceId = (session?.user as any)?.workspaceId;

    let automations: any[] = [];

    try {
      if (workspaceId) {
        automations = await prisma.automationRule.findMany({
          where: { workspaceId },
          include: { _count: { select: { logs: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        automations = await prisma.automationRule.findMany({
          take: 50,
          include: { _count: { select: { logs: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (dbErr) {
      // Fallback to in-memory store
      automations = [];
    }

    const sourceRules = (!automations || automations.length === 0) 
      ? memoryAutomationRules 
      : automations;

    const formattedAutomations = sourceRules.map((rule: any) => ({
      ...rule,
      executionCount: rule._count?.logs ?? rule.executionCount ?? 0,
    }));

    return NextResponse.json({ automations: formattedAutomations, success: true });
  } catch (error: any) {
    const formattedFallback = memoryAutomationRules.map(r => ({
      ...r,
      executionCount: r.executionCount || 0,
    }));
    return NextResponse.json({ automations: formattedFallback, success: true, fallback: true });
  }
}

// POST /api/automations - Create automation rule
export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const body = await req.json();
    const { name, description, trigger, conditions, actions, isActive = true } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json({ error: 'Tên, nguồn kích hoạt (trigger) và hành động (actions) là bắt buộc' }, { status: 400 });
    }

    const workspaceId = (session?.user as any)?.workspaceId || 'ws_default';

    const newRule: AutomationRuleItem = {
      id: `rule_${Date.now()}`,
      name,
      description: description || '',
      trigger,
      conditions: conditions || [],
      actions: Array.isArray(actions) ? actions : [actions],
      isActive: isActive !== false,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      workspaceId,
    };

    try {
      const created = await prisma.automationRule.create({
        data: {
          name,
          description,
          trigger,
          conditions,
          actions,
          isActive: newRule.isActive,
          workspaceId: workspaceId !== 'ws_default' ? workspaceId : null,
        },
      });
      newRule.id = created.id;
    } catch (e) {
      // Keep memory rule
    }

    memoryAutomationRules.unshift(newRule);

    return NextResponse.json({ automation: newRule, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/automations - Toggle automation active/inactive or update details
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, name, description, trigger, conditions, actions } = body;

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    let updated: any = null;

    try {
      const updateData: any = {};
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (trigger) updateData.trigger = trigger;
      if (conditions) updateData.conditions = conditions;
      if (actions) updateData.actions = actions;

      updated = await prisma.automationRule.update({
        where: { id },
        data: updateData,
      });
    } catch (e) {
      // Fallback update in-memory
    }

    const memIndex = memoryAutomationRules.findIndex(r => r.id === id);
    if (memIndex !== -1) {
      if (typeof isActive === 'boolean') memoryAutomationRules[memIndex].isActive = isActive;
      if (name) memoryAutomationRules[memIndex].name = name;
      if (description !== undefined) memoryAutomationRules[memIndex].description = description;
      if (trigger) memoryAutomationRules[memIndex].trigger = trigger;
      if (conditions) memoryAutomationRules[memIndex].conditions = conditions;
      if (actions) memoryAutomationRules[memIndex].actions = actions;
      memoryAutomationRules[memIndex].updatedAt = new Date().toISOString();
      updated = memoryAutomationRules[memIndex];
    }

    return NextResponse.json({ automation: updated || { id, isActive }, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/automations - Delete automation rule
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    try {
      await prisma.automationRule.delete({
        where: { id },
      });
    } catch (e) {
      // Ignore DB error
    }

    const memIndex = memoryAutomationRules.findIndex(r => r.id === id);
    if (memIndex !== -1) {
      memoryAutomationRules.splice(memIndex, 1);
    }

    return NextResponse.json({ success: true, message: 'Đã xóa kịch bản tự động hóa' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
