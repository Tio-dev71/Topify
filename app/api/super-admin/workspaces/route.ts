import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const workspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: { users: true, posts: true, socialAccounts: true },
        },
        allowedEmails: {
          where: { role: 'ADMIN' },
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ workspaces });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, adminEmail } = body;

    if (!name || !adminEmail) {
      return NextResponse.json({ error: 'Name and Admin Email are required' }, { status: 400 });
    }

    // Check if email already used
    const existing = await prisma.allowedEmail.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already assigned to a team' }, { status: 400 });
    }

    // Create Workspace and AllowedEmail in transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name },
      });

      await tx.allowedEmail.create({
        data: {
          email: adminEmail.toLowerCase(),
          role: 'ADMIN',
          invitedById: session.user.id!,
          workspaceId: ws.id,
        },
      });

      return ws;
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    if (id === 'default-workspace') {
      return NextResponse.json({ error: 'Cannot delete the default workspace' }, { status: 400 });
    }

    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/super-admin/workspaces - Update workspace plan, active status, name
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, plan, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (name) data.name = name;
    if (plan) data.plan = plan;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
