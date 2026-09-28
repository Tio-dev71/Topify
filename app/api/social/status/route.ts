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

    const workspaceId = (session.user as any).workspaceId;

    // Get connected accounts for the workspace (or user)
    let socialAccounts = await prisma.socialAccount.findMany({
      where: workspaceId ? { workspaceId } : { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        accountName: true,
        pageId: true,
        instagramBusinessId: true,
        youtubeChannelId: true,
        expiresAt: true,
      },
    });

    if (socialAccounts.length === 0 && workspaceId) {
      socialAccounts = await prisma.socialAccount.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          provider: true,
          accountName: true,
          pageId: true,
          instagramBusinessId: true,
          youtubeChannelId: true,
          expiresAt: true,
        },
      });
    }

    const connections: any[] = socialAccounts.map((account: any) => ({
      ...account,
      connected: account.status ? account.status === 'CONNECTED' : true,
    }));

    // If Facebook accounts are configured in Topify, also expose META as connected
    const liveFbCount = (prisma as any).facebookAccount?.count
      ? await (prisma as any).facebookAccount.count({
          where: {
            status: 'LIVE',
            workspaceId: workspaceId || 'none',
          },
        }).catch(() => 0)
      : 0;

    if (liveFbCount > 0 && !connections.some((c: any) => c.provider === 'META' && c.connected)) {
      connections.push({
        id: 'fb-accounts-live',
        provider: 'META',
        accountName: `Facebook Profiles (${liveFbCount})`,
        connected: true,
      });
    }

    // Include TikTok as available if any TikTok account or mock is active
    const tiktokCount = (prisma as any).socialAccount?.count
      ? await (prisma as any).socialAccount.count({
          where: { provider: 'TIKTOK' },
        }).catch(() => 0)
      : 0;
    if (tiktokCount > 0 && !connections.some((c: any) => c.provider === 'TIKTOK' && c.connected)) {
      connections.push({
        id: 'tiktok-account-connected',
        provider: 'TIKTOK',
        accountName: 'TikTok Channel',
        connected: true,
      });
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
