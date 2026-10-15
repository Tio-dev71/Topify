import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getWorkspaceUsageAndQuota } from '@/lib/workspace/quota';

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
    const quota = await getWorkspaceUsageAndQuota('default-workspace');
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

    const quota = await getWorkspaceUsageAndQuota('default-workspace');
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
        email,
        role,
        status: 'PENDING',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
      pendingInvites.unshift(invite);

      return NextResponse.json({
        success: true,
        message: `Đã gửi lời mời tới ${email}`,
        invite,
      });
    }

    if (action === 'revoke') {
      const { id } = body;
      pendingInvites = pendingInvites.map((i) => (i.id === id ? { ...i, status: 'REVOKED' } : i));
      return NextResponse.json({ success: true, message: 'Đã thu hồi lời mời' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_SEATS_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý lời mời thành viên' }, { status: 500 });
  }
}
