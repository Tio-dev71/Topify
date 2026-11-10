import { NextRequest, NextResponse } from 'next/server';
import { workspaceStore } from '@/lib/workspace/workspace-engine';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

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
    try {
      const session = await auth();
      workspaceId = (session?.user as any)?.workspaceId;
    } catch {}
  }
  return workspaceId || 'default-workspace';
}

export async function GET(req: NextRequest) {
  try {
    const seatsInfo = await workspaceStore.getSeatsInfo();
    return NextResponse.json(seatsInfo);
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

    if (action === 'invite') {
      const { email, role = 'STAFF', password = 'Topify@123' } = body;
      if (!email) {
        return NextResponse.json({ error: 'Vui lòng cung cấp email mời' }, { status: 400 });
      }

      const res = await workspaceStore.inviteMember({
        email,
        role,
        password,
        workspaceId,
      });

      if (!res.success) {
        return NextResponse.json(
          { error: res.error, isOverQuota: res.isOverQuota },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã gửi lời mời và kích hoạt tài khoản cho ${email}`,
        invite: res.invite,
        credentials: res.credentials,
      });
    }

    if (action === 'revoke') {
      const targetId = body.id || body.inviteId || body.email;
      if (!targetId) {
        return NextResponse.json({ error: 'Thiếu inviteId hoặc email để thu hồi' }, { status: 400 });
      }
      workspaceStore.revokeInvite(targetId);
      return NextResponse.json({ success: true, message: 'Đã thu hồi lời mời' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_SEATS_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý lời mời thành viên' }, { status: 500 });
  }
}
