import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/workspace/members - List all members (active users & invited emails) in the workspace
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    let workspaceId = currentUser.workspaceId;

    if (!workspaceId) {
      // Find workspace by user record
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { workspaceId: true },
      });
      workspaceId = dbUser?.workspaceId || 'default-workspace';
    }

    // 1. Fetch registered users in this workspace
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { workspaceId },
          { id: currentUser.id }, // always include current user
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch pending / invited allowed emails in this workspace
    const allowedEmails = await prisma.allowedEmail.findMany({
      where: { workspaceId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Merge and deduplicate
    const memberMap = new Map<string, any>();

    for (const u of users) {
      const emailKey = u.email.toLowerCase();
      memberMap.set(emailKey, {
        id: u.id,
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: u.role,
        avatar: u.image || null,
        isRegistered: true,
        isCurrentUser: u.id === currentUser.id,
        createdAt: u.createdAt,
      });
    }

    for (const a of allowedEmails) {
      const emailKey = a.email.toLowerCase();
      if (!memberMap.has(emailKey)) {
        memberMap.set(emailKey, {
          id: a.id,
          name: a.email.split('@')[0],
          email: a.email,
          role: a.role,
          avatar: null,
          isRegistered: false,
          isCurrentUser: false,
          createdAt: a.createdAt,
        });
      }
    }

    const members = Array.from(memberMap.values());

    return NextResponse.json({
      success: true,
      workspaceId,
      total: members.length,
      members,
    });
  } catch (error: any) {
    console.error('[WORKSPACE_MEMBERS_GET_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workspace/members - Quick invite/add a member to the workspace
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    let workspaceId = currentUser.workspaceId;

    if (!workspaceId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { workspaceId: true },
      });
      workspaceId = dbUser?.workspaceId || 'default-workspace';
    }

    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();
    const role = (body.role || 'STAFF').toUpperCase();
    const name = body.name?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    // 1. Create or update AllowedEmail
    const invite = await prisma.allowedEmail.upsert({
      where: { email },
      update: {
        role: role as any,
        workspaceId,
        invitedById: currentUser.id,
      },
      create: {
        email,
        role: role as any,
        workspaceId,
        invitedById: currentUser.id,
      },
    });

    // 2. If a User already exists with this email, attach them to this workspace
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          workspaceId,
          ...(name && !existingUser.name ? { name } : {}),
        },
      });
    }

    const member = {
      id: existingUser?.id || invite.id,
      name: name || existingUser?.name || email.split('@')[0],
      email,
      role,
      avatar: existingUser?.image || null,
      isRegistered: !!existingUser,
      isCurrentUser: existingUser?.id === currentUser.id,
    };

    return NextResponse.json({
      success: true,
      member,
      message: `Đã thêm thành viên ${email} vào nhóm thành công!`,
    });
  } catch (error: any) {
    console.error('[WORKSPACE_MEMBERS_POST_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
