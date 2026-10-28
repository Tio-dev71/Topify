import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/social/zalo/connect - Connect Zalo Official Account
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { oaId, oaName, accessToken } = body;

    if (!oaId || !oaId.trim()) {
      return NextResponse.json({ error: 'Zalo OA ID không được để trống' }, { status: 400 });
    }

    const cleanOaId = oaId.trim();
    const cleanToken = (accessToken || '').trim() || `zalo_token_${Date.now()}`;
    const cleanName = (oaName || '').trim() || `Zalo OA (${cleanOaId})`;

    // Upsert SocialAccount for ZALO
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'ZALO',
        },
      },
      update: {
        zaloOaId: cleanOaId,
        accountName: cleanName,
        accessToken: cleanToken,
        status: 'CONNECTED',
        workspaceId,
      },
      create: {
        userId,
        workspaceId,
        provider: 'ZALO',
        zaloOaId: cleanOaId,
        accountName: cleanName,
        accessToken: cleanToken,
        status: 'CONNECTED',
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        provider: account.provider,
        zaloOaId: account.zaloOaId,
        accountName: account.accountName,
        status: account.status,
      },
      message: `Đã kết nối thành công Zalo OA "${cleanName}"!`,
    });
  } catch (error: any) {
    console.error('[ZALO_CONNECT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
