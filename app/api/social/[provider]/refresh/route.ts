import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { SocialAccountStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const resolvedParams = await params;
    const provider = resolvedParams.provider.toUpperCase();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const credentials = await getCredentials(session.user.id);

    if (provider === 'GOOGLE' || account.provider === 'YOUTUBE' || account.provider === 'GOOGLE_DRIVE') {
      if (!account.refreshToken) {
        return NextResponse.json({ error: 'No refresh token available. Please reconnect.' }, { status: 400 });
      }

      const refreshToken = decryptToken(account.refreshToken);
      const clientId = credentials.GOOGLE_CLIENT_ID;
      const clientSecret = credentials.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Google credentials not configured' }, { status: 400 });
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        // Token refresh failed, mark as EXPIRED
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({ error: 'Failed to refresh token', details: tokenData }, { status: 400 });
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(tokenData.access_token),
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({ success: true, expiresAt });
    } else if (provider === 'META') {
      const accessToken = decryptToken(account.accessToken);
      const clientId = credentials.META_APP_ID;
      const clientSecret = credentials.META_APP_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 400 });
      }

      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
      );
      
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({ error: 'Failed to refresh Meta token', details: tokenData }, { status: 400 });
      }

      // Meta tokens are typically valid for ~60 days from refresh
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(tokenData.access_token),
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({ success: true, expiresAt });
    } else {
      return NextResponse.json({ error: 'Unsupported provider for refresh' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
