import { NextRequest, NextResponse } from 'next/server';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const oaId = url.searchParams.get('oa_id');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(error)}`, req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Missing_code_or_state', req.url));
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state_zalo')?.value;
    const codeVerifier = cookieStore.get('oauth_pkce_zalo')?.value;

    const [csrfState, originalStateParam] = state.split('::');

    if (!storedState || storedState !== csrfState) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Invalid_state_parameter', req.url));
    }

    cookieStore.delete('oauth_state_zalo');
    cookieStore.delete('oauth_pkce_zalo');

    let userId;
    let role;

    if (originalStateParam && originalStateParam.startsWith('zalo_')) {
      const token = originalStateParam.replace('zalo_', '');
      try {
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (secret) {
          const decoded = jwtPackage.verify(token, secret) as any;
          userId = decoded.sub || decoded.id;
          role = decoded.role;
        }
      } catch (e) {
        console.error('Invalid token in state', e);
      }
    }

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
      role = session?.user?.role;
    }

    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Unauthorized', req.url));
    }

    const credentials = await getCredentials(userId);
    const appId = credentials.ZALO_APP_ID;
    const secretKey = credentials.ZALO_APP_SECRET;

    if (!appId || !secretKey || !codeVerifier) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Missing_Zalo_credentials_or_PKCE', req.url));
    }

    // Exchange code for Zalo access token
    const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': secretKey,
      },
      body: new URLSearchParams({
        code,
        app_id: appId,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Zalo token error:', tokenData);
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(tokenData.error_name || tokenData.message || 'Token exchange failed')}`, req.url));
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = parseInt(tokenData.expires_in, 10);

    // Fetch OA Info to get name
    const oaInfoResponse = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
      method: 'GET',
      headers: {
        'access_token': accessToken,
      }
    });

    const oaInfoData = await oaInfoResponse.json();
    let accountName = 'Zalo OA Account';
    let retrievedOaId = oaId || 'unknown';

    if (oaInfoData.error === 0 && oaInfoData.data) {
      accountName = oaInfoData.data.name || accountName;
      retrievedOaId = oaInfoData.data.oa_id || retrievedOaId;
    }

    // Save or update SocialAccount
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const workspace = await prisma.workspace.findFirst({
      where: { users: { some: { id: userId } } }
    });

    await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'ZALO',
        },
      },
      update: {
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : undefined,
        expiresAt,
        accountName,
        pageId: retrievedOaId,
        status: 'CONNECTED',
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'ZALO',
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : null,
        expiresAt,
        accountName,
        pageId: retrievedOaId,
        status: 'CONNECTED',
        workspaceId: workspace?.id,
      },
    });

    return NextResponse.redirect(new URL('/dashboard/settings/social?success=zalo_connected', req.url));

  } catch (error: any) {
    console.error('Zalo callback exception:', error);
    return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(error.message)}`, req.url));
  }
}
