import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Web (VPS) no longer handles Playwright automation.
  // This route is deprecated for POST requests.
  return NextResponse.json({ 
    error: 'Tính năng tự động hoá đã được chuyển sang Desktop App để đảm bảo an toàn cho tài khoản của bạn. Vui lòng tải Desktop App để tiếp tục.' 
  }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, cookie } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.facebookAccount.findFirst({
        where: { id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
      }
    }

    await prisma.facebookAccount.update({
      where: { id },
      data: { 
        status,
        ...(cookie ? { cookie } : {})
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[FB Login API] PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

