import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspaceUsageAndQuota } from '@/lib/workspace/quota';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthWorkspaceId(req: NextRequest) {
  let workspaceId: string | undefined;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      workspaceId = decoded.workspaceId;
    } catch (e) {}
  }
  if (!workspaceId) {
    const session = await auth();
    workspaceId = (session?.user as any)?.workspaceId;
  }
  if (!workspaceId) {
    const defaultWs = await prisma.workspace.findFirst();
    workspaceId = defaultWs?.id || 'default-workspace';
  }
  return workspaceId;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
}

let pendingInvites: PendingInvite[] = [
  {
    id: 'inv_1',
    email: 'marketing.lead@example.com',
    role: 'STAFF',
    status: 'PENDING',
    invitedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv_2',
    email: 'content.creator@example.com',
    role: 'STAFF',
    status: 'ACCEPTED',
    invitedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getAuthWorkspaceId(req);
    const quota = await getWorkspaceUsageAndQuota(workspaceId);
    return NextResponse.json({
      success: true,
      maxSeats: quota.limits.maxSeats,
      seatsUsed: quota.usage.seatsUsed,
      seatsAvailable: Math.max(0, quota.limits.maxSeats - quota.usage.seatsUsed),
      invites: pendingInvites,
    });
  } catch (error: any) {
    console.error('[API_SEATS_GET]', error);
    return NextResponse.json({ error: 'Không thể tải thông tin ghế ngồi và lời mời' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'invite';

    const workspaceId = await getAuthWorkspaceId(req);
    const quota = await getWorkspaceUsageAndQuota(workspaceId);
    const totalOccupied = quota.usage.seatsUsed + pendingInvites.filter((i) => i.status === 'PENDING').length;

    if (action === 'invite') {
      const { email, role = 'STAFF' } = body;
      if (!email) {
        return NextResponse.json({ error: 'Vui lòng cung cấp email mời' }, { status: 400 });
      }

      if (totalOccupied >= quota.limits.maxSeats) {
        return NextResponse.json(
          {
            error: `Đã đạt giới hạn số ghế (${quota.limits.maxSeats} seats) của ${quota.limits.name}. Vui lòng nâng cấp gói để mời thêm thành viên.`,
            isOverQuota: true,
          },
          { status: 403 }
        );
      }

      const invite: PendingInvite = {
        id: `inv_${Date.now()}`,
        email: email.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        status: 'PENDING',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
      pendingInvites.unshift(invite);

      // Persist to AllowedEmail and User accounts
      const initialPassword = body.password?.trim() || 'Topify@123';
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      const staffKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const normalizedEmail = email.trim().toLowerCase();

      if (workspaceId && workspaceId !== 'default-workspace') {
        await prisma.allowedEmail.upsert({
          where: { email: normalizedEmail },
          update: { role: role === 'ADMIN' ? 'ADMIN' : 'STAFF', workspaceId },
          create: { email: normalizedEmail, role: role === 'ADMIN' ? 'ADMIN' : 'STAFF', workspaceId },
        }).catch(() => null);

        await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: {
            role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
            workspaceId,
            password: hashedPassword,
          },
          create: {
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
            workspaceId,
            password: hashedPassword,
            licenseKey: staffKey,
          },
        }).catch(() => null);
      }

      return NextResponse.json({
        success: true,
        message: `Đã gửi lời mời và kích hoạt tài khoản cho ${email}`,
        invite,
        credentials: {
          email: normalizedEmail,
          password: initialPassword,
          role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
          licenseKey: staffKey,
        },
      });
    }

    if (action === 'revoke') {
      const targetId = body.id || body.inviteId;
      const targetEmail = body.email;
      pendingInvites = pendingInvites.map((i) =>
        i.id === targetId || (targetEmail && i.email === targetEmail)
          ? { ...i, status: 'REVOKED' }
          : i
      );
      if (targetEmail) {
        await prisma.allowedEmail.deleteMany({
          where: { email: targetEmail.trim().toLowerCase() },
        }).catch(() => null);
      }
      return NextResponse.json({ success: true, message: 'Đã thu hồi lời mời' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_SEATS_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý lời mời thành viên' }, { status: 500 });
  }
}
