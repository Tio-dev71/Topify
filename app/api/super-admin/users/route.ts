import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/super-admin/users - List all users across the system
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const role = url.searchParams.get('role');
    const workspaceId = url.searchParams.get('workspaceId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where: any = {};
    if (role) where.role = role;
    if (workspaceId) where.workspaceId = workspaceId;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          licenseKey: true,
          createdAt: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true,
              plan: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              posts: true,
              socialAccounts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/super-admin/users - Create/provision a new user in a workspace
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role, workspaceId, licenseKey } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || undefined,
        role: role || 'STAFF',
        workspaceId: workspaceId || undefined,
        licenseKey: licenseKey || undefined,
      },
      include: {
        workspace: { select: { name: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/super-admin/users - Update user details, role, workspace
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, workspaceId, licenseKey, name } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (role) data.role = role;
    if (workspaceId !== undefined) data.workspaceId = workspaceId;
    if (licenseKey !== undefined) data.licenseKey = licenseKey || null;
    if (name !== undefined) data.name = name;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        workspace: { select: { name: true, plan: true } },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/super-admin/users - Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
