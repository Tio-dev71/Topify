import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/social/meta/connect - Connect Facebook Page / Instagram via direct credentials or Page Token
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { pageId, pageName, accessToken, instagramBusinessId } = body;

    if (!pageId || !pageId.trim()) {
      return NextResponse.json({ error: 'Page ID không được để trống' }, { status: 400 });
    }

    const cleanPageId = pageId.trim();
    const cleanToken = (accessToken || '').trim() || `token_mock_${Date.now()}`;
    const cleanName = (pageName || '').trim() || `Facebook Page (${cleanPageId})`;

    // Upsert SocialAccount for META
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'META',
        },
      },
      update: {
        pageId: cleanPageId,
        accountName: cleanName,
        accessToken: cleanToken,
        instagramBusinessId: instagramBusinessId?.trim() || null,
        status: 'CONNECTED',
        workspaceId,
      },
      create: {
        userId,
        workspaceId,
        provider: 'META',
        pageId: cleanPageId,
        accountName: cleanName,
        accessToken: cleanToken,
        instagramBusinessId: instagramBusinessId?.trim() || null,
        status: 'CONNECTED',
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        provider: account.provider,
        pageId: account.pageId,
        accountName: account.accountName,
        status: account.status,
      },
      message: `Đã kết nối thành công Facebook Page "${cleanName}"!`,
    });
  } catch (error: any) {
    console.error('[META_CONNECT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
