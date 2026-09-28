import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaceId = (session.user as { workspaceId?: string }).workspaceId;
    const where: Record<string, unknown> = {};

    if (session.user.role === 'SUPER_ADMIN') {
      const wsParam = req.nextUrl.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      }
    } else {
      where.workspaceId = userWorkspaceId || 'none';
    }

    const tasks = await prisma.automationTask.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[AUTOMATION_TASKS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, profileIds, config } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as { workspaceId?: string }).workspaceId;

    const task = await prisma.automationTask.create({
      data: {
        name,
        type,
        profileIds: profileIds || [],
        config: config || {},
        status: 'IDLE',
        workspaceId: userWorkspaceId || null,
        userId: session.user.id || null,
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[AUTOMATION_TASKS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, type, profileIds, config, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.automationTask.findFirst({
        where: { id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (profileIds !== undefined) updateData.profileIds = profileIds;
    if (config !== undefined) updateData.config = config;
    if (status !== undefined) updateData.status = status;

    const task = await prisma.automationTask.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[AUTOMATION_TASKS_PATCH]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.automationTask.findFirst({
        where: { id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
      }
    }

    await prisma.automationTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('[AUTOMATION_TASKS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
