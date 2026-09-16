import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/automations - List automation rules
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automations = await prisma.automationRule.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ automations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/automations - Create automation rule
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, trigger, conditions, actions } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json({ error: 'Name, trigger, and actions are required' }, { status: 400 });
    }

    const automation = await prisma.automationRule.create({
      data: {
        name,
        description,
        trigger,
        conditions,
        actions,
        workspaceId: (session.user as any).workspaceId,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/automations - Toggle automation active/inactive
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    const automation = await prisma.automationRule.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ automation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
