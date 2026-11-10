import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

/**
 * Helper to resolve Admin session from cookies or Bearer token
 */
async function getAdminUser(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.id && (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
      return session.user;
    }
  } catch {}

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.role === 'ADMIN' || decoded?.role === 'SUPER_ADMIN') {
        return {
          id: decoded.sub || decoded.id,
          role: decoded.role,
          email: decoded.email,
          workspaceId: decoded.workspaceId,
        };
      }
    } catch {}
  }

  return null;
}

/**
 * GET /api/team/credentials?email=...
 * Admin retrieves login credentials / license key status for a team member
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: 'Yêu cầu quyền Quản trị viên (Admin)' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Thiếu tham số email' }, { status: 400 });
    }

    const workspaceId = (admin as any).workspaceId;

    // Check member in workspace
    const member = await prisma.allowedEmail.findUnique({
      where: { email },
    });

    if (!member || (workspaceId && member.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Thành viên không thuộc Workspace này' }, { status: 404 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        licenseKey: true,
        password: true,
      },
    });

    // Auto-provision if User does not exist yet
    if (!user) {
      const defaultPassword = 'Topify@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const staffKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: member.role,
          workspaceId: member.workspaceId,
          password: hashedPassword,
          licenseKey: staffKey,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          licenseKey: true,
          password: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      credentials: {
        email: user.email,
        name: user.name,
        role: user.role,
        licenseKey: user.licenseKey || `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        hasPassword: !!user.password,
        defaultPassword: 'Topify@123',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/team/credentials
 * Admin updates / resets password for a team member
 * Body: { email: string, password?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: 'Yêu cầu quyền Quản trị viên (Admin)' }, { status: 403 });
    }

    const body = await req.json();
    const rawEmail = body.email?.trim().toLowerCase();
    const newPassword = body.password?.trim() || 'Topify@123';

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email là bắt buộc' }, { status: 400 });
    }

    const workspaceId = (admin as any).workspaceId;

    const member = await prisma.allowedEmail.findUnique({
      where: { email: rawEmail },
    });

    if (!member || (workspaceId && member.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Thành viên không thuộc Workspace này' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const staffKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const user = await prisma.user.upsert({
      where: { email: rawEmail },
      update: {
        password: hashedPassword,
        workspaceId: member.workspaceId,
        role: member.role,
      },
      create: {
        email: rawEmail,
        name: rawEmail.split('@')[0],
        role: member.role,
        workspaceId: member.workspaceId,
        password: hashedPassword,
        licenseKey: staffKey,
      },
      select: {
        id: true,
        email: true,
        role: true,
        licenseKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật mật khẩu cho ${rawEmail} thành công.`,
      credentials: {
        email: user.email,
        password: newPassword,
        role: user.role,
        licenseKey: user.licenseKey,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

