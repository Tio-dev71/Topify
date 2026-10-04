import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getCredentials } from '@/lib/credentials';

// GET /api/social/status — Get connection status for all providers
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const workspaceId = user.workspaceId;

    // Get accounts for the workspace OR user
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        OR: [
          ...(workspaceId ? [{ workspaceId }] : []),
          { userId: user.id }
        ]
      },
      select: {
        id: true,
        provider: true,
        accountName: true,
        pageId: true,
        instagramBusinessId: true,
        youtubeChannelId: true,
        expiresAt: true,
        status: true,
        refreshToken: true,
        accessToken: true,
        userId: true,
        workspaceId: true,
      },
    });

    const connections: any[] = [];

    for (const account of socialAccounts) {
      const isConnectedStatus = account.status === 'CONNECTED' || account.status === 'active';
      const isExpiredTime = account.expiresAt ? new Date(account.expiresAt).getTime() < Date.now() : false;

      if (isConnectedStatus && !isExpiredTime) {
        connections.push({
          id: account.id,
          provider: account.provider,
          accountName: account.accountName,
          pageId: account.pageId,
          instagramBusinessId: account.instagramBusinessId,
          youtubeChannelId: account.youtubeChannelId,
          expiresAt: account.expiresAt,
          status: 'CONNECTED',
          connected: true,
        });

        // Also expose GOOGLE as YOUTUBE if applicable
        if (account.provider === 'GOOGLE') {
          connections.push({
            id: account.id,
            provider: 'YOUTUBE',
            accountName: account.accountName,
            pageId: account.pageId,
            instagramBusinessId: account.instagramBusinessId,
            youtubeChannelId: account.youtubeChannelId,
            expiresAt: account.expiresAt,
            status: 'CONNECTED',
            connected: true,
          });
        }
      } else if (account.refreshToken && (account.provider === 'GOOGLE' || account.provider === 'YOUTUBE')) {
        // Attempt on-the-fly token refresh if expired but has refresh token
        try {
          const { getValidAccessToken } = await import('@/lib/publishers/googleAuth');
          await getValidAccessToken(account as any);

          connections.push({
            id: account.id,
            provider: 'YOUTUBE',
            accountName: account.accountName,
            pageId: account.pageId,
            instagramBusinessId: account.instagramBusinessId,
            youtubeChannelId: account.youtubeChannelId,
            expiresAt: account.expiresAt,
            status: 'CONNECTED',
            connected: true,
          });
        } catch (err: any) {
          console.warn(`[social/status] YouTube token refresh failed for ${account.id}:`, err?.message || err);
          if (account.status !== 'EXPIRED') {
            await prisma.socialAccount.update({
              where: { id: account.id },
              data: { status: 'EXPIRED' }
            }).catch(() => {});
          }
        }
      }
    }

    // Fetch credentials properly using the fallback chain
    const credentials = await getCredentials(session.user.id);

    // Check environment variables
    const envStatus: Record<string, boolean> = {
      META_APP_ID: !!credentials.META_APP_ID,
      META_APP_SECRET: !!credentials.META_APP_SECRET,
      GOOGLE_CLIENT_ID: !!credentials.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!credentials.GOOGLE_CLIENT_SECRET,
    };

    return NextResponse.json({
      connections,
      connected: connections.length,
      envStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
