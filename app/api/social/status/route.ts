import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getCredentials } from '@/lib/credentials';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthUser(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user;
  } catch {}

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7).trim();
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.id || decoded?.sub) {
        return {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role,
          workspaceId: decoded.workspaceId,
        };
      }
    } catch {}
  }
  return null;
}

// GET /api/social/status — Get connection status for all providers
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (user as any).workspaceId;

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
        telegramBotUsername: true,
        telegramBotToken: true,
        zaloOaId: true,
        expiresAt: true,
        status: true,
        refreshToken: true,
        accessToken: true,
        userId: true,
        workspaceId: true,
      },
    });

    const connections: any[] = [];
    const now = Date.now();

    for (const account of socialAccounts) {
      const isConnectedStatus = (account.status as string) === 'CONNECTED' || (account.status as string) === 'active';
      const isExpiredTime = account.expiresAt ? new Date(account.expiresAt).getTime() < now : false;
      const daysRemaining = account.expiresAt
        ? Math.max(0, Math.ceil((new Date(account.expiresAt).getTime() - now) / (24 * 3600 * 1000)))
        : null;

      let effectiveStatus = account.status as string;
      if (isExpiredTime) {
        effectiveStatus = 'EXPIRED';
      }

      connections.push({
        id: account.id,
        provider: account.provider,
        accountName: account.accountName,
        pageId: account.pageId,
        instagramBusinessId: account.instagramBusinessId,
        youtubeChannelId: account.youtubeChannelId,
        telegramBotUsername: account.telegramBotUsername,
        telegramBotToken: account.telegramBotToken ? `${account.telegramBotToken.slice(0, 8)}...` : undefined,
        zaloOaId: account.zaloOaId,
        expiresAt: account.expiresAt,
        daysRemaining,
        isExpired: isExpiredTime || effectiveStatus === 'EXPIRED',
        status: effectiveStatus,
        connected: isConnectedStatus && !isExpiredTime,
      });

      // Also expose GOOGLE as YOUTUBE if applicable
      if ((account.provider as string) === 'GOOGLE') {
        connections.push({
          id: account.id,
          provider: 'YOUTUBE',
          accountName: account.accountName,
          pageId: account.pageId,
          instagramBusinessId: account.instagramBusinessId,
          youtubeChannelId: account.youtubeChannelId,
          expiresAt: account.expiresAt,
          daysRemaining,
          isExpired: isExpiredTime || effectiveStatus === 'EXPIRED',
          status: effectiveStatus,
          connected: isConnectedStatus && !isExpiredTime,
        });
      }
    }

    // Fetch credentials
    let credentials: Record<string, string | undefined> = {};
    try {
      credentials = await getCredentials(user.id);
    } catch {}

    const envStatus: Record<string, boolean> = {
      META_APP_ID: !!credentials.META_APP_ID,
      META_APP_SECRET: !!credentials.META_APP_SECRET,
      GOOGLE_CLIENT_ID: !!credentials.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!credentials.GOOGLE_CLIENT_SECRET,
    };

    return NextResponse.json({
      connections,
      connected: connections.filter(c => c.connected).length,
      envStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
