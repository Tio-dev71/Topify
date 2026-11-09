import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import { memoryAutomationRules, AutomationRuleItem } from '@/lib/automation/flow-engine';
import jwtPackage from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'topify-jwt-secret-key-32-chars-min!';

export async function resolveUserAndWorkspace(req: NextRequest) {
  let userId: string | null = null;
  let workspaceId: string | null = null;
  let userName = 'Người dùng';

  try {
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
      workspaceId = (session.user as any)?.workspaceId || null;
      userName = session.user.name || userName;
    }
  } catch {}

  if (!userId || !workspaceId) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
        userId = decoded.sub || decoded.id || userId;
        workspaceId = decoded.workspaceId || workspaceId;
        if (decoded.name) userName = decoded.name;
      }
    } catch {}
  }

  const customWsHeader = req.headers.get('x-workspace-id');
  if (customWsHeader) {
    workspaceId = customWsHeader;
  }

  if (!workspaceId && userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, name: true },
      });
      workspaceId = dbUser?.workspaceId || null;
      if (dbUser?.name) userName = dbUser.name;
    } catch {}
  }

  if (!workspaceId) {
    try {
      const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
      workspaceId = firstWs?.id || null;
    } catch {}
  }

  if (!userId) {
    try {
      const firstUser = await prisma.user.findFirst({
        where: workspaceId ? { workspaceId } : undefined,
        select: { id: true, name: true },
      }) || await prisma.user.findFirst({ select: { id: true, name: true } });
      if (firstUser) {
        userId = firstUser.id;
        if (firstUser.name) userName = firstUser.name;
      }
    } catch {}
  }

  return { userId, workspaceId, userName };
}

// GET /api/automations - List automation rules
export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = await resolveUserAndWorkspace(req);

    let automations: any[] = [];

    try {
      automations = await prisma.automationRule.findMany({
        where: workspaceId ? {
          OR: [
            { workspaceId },
            { workspaceId: null },
          ],
        } : undefined,
        include: { _count: { select: { logs: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (automations.length === 0 && workspaceId) {
        const fallbackDbAutomations = await prisma.automationRule.findMany({
          include: { _count: { select: { logs: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        if (fallbackDbAutomations.length > 0) {
          automations = fallbackDbAutomations;
        }
      }
    } catch (dbErr) {
      console.warn('[API_AUTOMATIONS_GET] DB query error:', dbErr);
      automations = [];
    }

    // Merge DB automations with memory automations (avoiding duplicate IDs)
    const existingDbIds = new Set(automations.map(a => a.id));
    const extraMemoryRules = memoryAutomationRules.filter(r => !existingDbIds.has(r.id));
    
    // If DB has records, prioritize them. If DB is empty, use memory rules.
    const sourceRules = automations.length > 0 
      ? [...automations, ...extraMemoryRules.filter(r => r.workspaceId === workspaceId || !r.workspaceId)]
      : (extraMemoryRules.length > 0 ? extraMemoryRules : memoryAutomationRules);

    const formattedAutomations = sourceRules.map((rule: any) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      trigger: rule.trigger,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      isActive: rule.isActive ?? true,
      executionCount: rule._count?.logs ?? rule.executionCount ?? 0,
      createdAt: rule.createdAt ? (rule.createdAt instanceof Date ? rule.createdAt.toISOString() : rule.createdAt) : new Date().toISOString(),
      updatedAt: rule.updatedAt ? (rule.updatedAt instanceof Date ? rule.updatedAt.toISOString() : rule.updatedAt) : undefined,
      workspaceId: rule.workspaceId || workspaceId,
    }));

    return NextResponse.json({ automations: formattedAutomations, success: true });
  } catch (error: any) {
    console.error('[API_AUTOMATIONS_GET] Error:', error);
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
    const { userId, workspaceId } = await resolveUserAndWorkspace(req);
    const body = await req.json();
    const { name, description, trigger, conditions, actions, isActive = true } = body;

    if (!name?.trim() || !trigger || !actions) {
      return NextResponse.json({ error: 'Tên, nguồn kích hoạt (trigger) và hành động (actions) là bắt buộc' }, { status: 400 });
    }

    const newRule: AutomationRuleItem = {
      id: `rule_${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      trigger,
      conditions: Array.isArray(conditions) ? conditions : [],
      actions: Array.isArray(actions) ? actions : [actions],
      isActive: isActive !== false,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      workspaceId: workspaceId || undefined,
    };

    try {
      const created = await prisma.automationRule.create({
        data: {
          name: newRule.name,
          description: newRule.description,
          trigger: newRule.trigger as any,
          conditions: newRule.conditions as any,
          actions: newRule.actions as any,
          isActive: newRule.isActive,
          workspaceId: workspaceId || null,
        },
      });
      newRule.id = created.id;
      newRule.createdAt = created.createdAt.toISOString();

      if (userId && workspaceId) {
        try {
          await recordAuditLog({
            action: 'AUTOMATION.CREATE',
            entityType: 'AutomationRule',
            entityId: created.id,
            userId,
            workspaceId,
            req,
            metadata: { name: created.name },
          });
        } catch {}
      }
    } catch (e) {
      console.warn('[API_AUTOMATIONS_POST] DB create error, falling back to memory:', e);
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
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (trigger) updateData.trigger = trigger;
      if (conditions) updateData.conditions = conditions;
      if (actions) updateData.actions = actions;

      const dbUpdated = await prisma.automationRule.update({
        where: { id },
        data: updateData,
        include: { _count: { select: { logs: true } } },
      });

      updated = {
        id: dbUpdated.id,
        name: dbUpdated.name,
        description: dbUpdated.description || '',
        trigger: dbUpdated.trigger,
        conditions: dbUpdated.conditions || [],
        actions: dbUpdated.actions || [],
        isActive: dbUpdated.isActive,
        executionCount: dbUpdated._count?.logs ?? 0,
        createdAt: dbUpdated.createdAt.toISOString(),
        updatedAt: dbUpdated.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn('[API_AUTOMATIONS_PATCH] DB update fallback:', e);
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
      if (!updated) updated = memoryAutomationRules[memIndex];
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
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    try {
      await prisma.automationRule.delete({
        where: { id },
      });
    } catch (e) {
      console.warn('[API_AUTOMATIONS_DELETE] DB delete fallback:', e);
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
