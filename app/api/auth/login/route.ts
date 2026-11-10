import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';
const TOKEN_TTL = '7d';

// Rate limit map
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/auth/login
 * Body: { email: string, password?: string, licenseKey?: string }
 * 
 * Supports login via Email & Password (for Staff and Admins)
 * Or via License Key.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawEmail = body.email?.trim();
    const rawPassword = body.password?.trim();

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();

    // 1. Look up user by email in User table
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        workspaceId: true,
        licenseKey: true,
      },
    });

    // 2. If user not yet in User table, check if they exist in AllowedEmail (invited team member)
    const allowed = await prisma.allowedEmail.findUnique({
      where: { email },
    });

    if (!user && allowed) {
      // Auto-provision user account for the invited team member
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const staffKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: allowed.role,
          workspaceId: allowed.workspaceId,
          password: hashedPassword,
          licenseKey: staffKey,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true,
          workspaceId: true,
          licenseKey: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Quản trị viên để được mời.' },
        { status: 401 }
      );
    }

    // 3. Verify password
    let passwordMatches = false;

    if (user.password) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        passwordMatches = await bcrypt.compare(rawPassword, user.password);
      } else {
        // Plain text fallback
        passwordMatches = rawPassword === user.password;
        if (passwordMatches) {
          // Upgrade to bcrypt hash
          const upgradedHash = await bcrypt.hash(rawPassword, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: upgradedHash },
          }).catch(() => null);
        }
      }
    } else {
      // Password was not yet set. If user is an allowed team member and entered default password or matches
      if (allowed && (rawPassword === 'Topify@123' || rawPassword.length >= 6)) {
        const initialHash = await bcrypt.hash(rawPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: initialHash },
        }).catch(() => null);
        passwordMatches = true;
      }
    }

    if (!passwordMatches) {
      return NextResponse.json(
        { error: 'Mật khẩu không chính xác. Mật khẩu khởi tạo mặc định là Topify@123 hoặc liên hệ Admin để cấp lại.' },
        { status: 401 }
      );
    }

    // 4. Ensure user has workspaceId
    let workspaceId = user.workspaceId || allowed?.workspaceId || null;
    if (!workspaceId) {
      const ws = await prisma.workspace.create({
        data: {
          name: `${user.name || user.email}'s Workspace`,
          plan: 'FREE',
        },
      });
      workspaceId = ws.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: ws.id },
      }).catch(() => null);
    }

    // 5. Sign JWT
    const token = sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
        workspaceId,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    // 6. Record audit log asynchronously
    try {
      await recordAuditLog({
        action: 'AUTH.LOGIN_CREDENTIALS',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        workspaceId,
        metadata: {
          email: user.email,
          role: user.role,
          ip,
          client: 'Desktop-App',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
        workspaceId,
      },
      workspace: {
        id: workspaceId,
      },
    });
  } catch (error: any) {
    console.error('[API_AUTH_LOGIN] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi máy chủ trong quá trình đăng nhập.' },
      { status: 500 }
    );
  }
}

