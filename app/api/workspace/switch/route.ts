import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';
const TOKEN_TTL = '7d';

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.sub || decoded?.id) {
        return {
          id: decoded.sub || decoded.id,
          role: decoded.role,
          email: decoded.email,
          name: decoded.name,
          workspaceId: decoded.workspaceId,
        };
      }
    } catch {}
  }
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
        name: session.user.name,
        workspaceId: (session.user as any).workspaceId,
      };
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN and ADMIN are permitted to switch workspaces.
    // STAFF is strictly bound to their assigned workspace.
    if (user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Nhân viên (STAFF) không có quyền chuyển đổi không gian làm việc.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Vui lòng cung cấp workspaceId' }, { status: 400 });
    }

    const targetWs = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        allowedEmails: true,
      },
    });

    if (!targetWs) {
      return NextResponse.json({ error: 'Không tìm thấy không gian làm việc này' }, { status: 404 });
    }

    // Permission check: SUPER_ADMIN can switch to any workspace.
    // Regular users can only switch to workspaces where they belong or are invited.
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    let userRoleInWorkspace = user.role;

    if (!isSuperAdmin) {
      const isAllowed = targetWs.allowedEmails.some(
        (a) => a.email.toLowerCase() === (user.email || '').toLowerCase()
      );
      const isOwner = user.workspaceId === targetWs.id;

      if (!isAllowed && !isOwner) {
        return NextResponse.json(
          { error: 'Bạn không có quyền truy cập vào không gian làm việc này' },
          { status: 403 }
        );
      }

      // Check specific role in that workspace
      const matchedAllowed = targetWs.allowedEmails.find(
        (a) => a.email.toLowerCase() === (user.email || '').toLowerCase()
      );
      if (matchedAllowed) {
        userRoleInWorkspace = matchedAllowed.role;
      }
    }

    // Update user workspace in database
    await prisma.user.update({
      where: { id: user.id },
      data: { workspaceId: targetWs.id },
    }).catch(() => null);

    // Sign new JWT token with updated workspaceId
    const newToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0],
        role: userRoleInWorkspace,
        workspaceId: targetWs.id,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    return NextResponse.json({
      success: true,
      message: `Đã chuyển sang không gian làm việc: ${targetWs.name}`,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0],
        role: userRoleInWorkspace,
        workspaceId: targetWs.id,
      },
      workspace: {
        id: targetWs.id,
        name: targetWs.name,
        plan: targetWs.plan,
      },
    });
  } catch (error: any) {
    console.error('[API_WORKSPACE_SWITCH]', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi chuyển không gian làm việc' }, { status: 500 });
  }
}

