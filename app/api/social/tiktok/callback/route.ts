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
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(error)}`, req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Missing_code_or_state', req.url));
    }

    const renderDesktopHtml = (msg: string, isError: boolean) => {
      const color = isError ? '#EF4444' : '#10B981';
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: ${color};">${msg}</h2>
            <p>Bạn có thể đóng cửa sổ này và quay lại ứng dụng.</p>
            <script>
              setTimeout(() => { window.close(); }, 2000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: isError ? 400 : 200 }
      );
    };

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state_tiktok')?.value;

    const [csrfState, originalStateParam] = state.split('::');
    
    const isDesktopClient = originalStateParam && originalStateParam.startsWith('tiktok_');

    if (!isDesktopClient && (!storedState || storedState !== csrfState)) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Invalid_state_parameter', req.url));
    }

    cookieStore.delete('oauth_state_tiktok');

    let userId;
    let role;

    if (originalStateParam && originalStateParam.startsWith('tiktok_')) {
      const token = originalStateParam.replace('tiktok_', '');
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
      if (isDesktopClient) return renderDesktopHtml('Vui lòng đăng nhập lại trên ứng dụng', true);
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Unauthorized', req.url));
    }

    const credentials = await getCredentials(userId);
    const clientKey = credentials.TIKTOK_CLIENT_KEY;
    const clientSecret = credentials.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.AUTH_URL || 'http://localhost:3000'}/api/social/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Missing_TikTok_credentials', req.url));
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('TikTok token error:', tokenData);
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(tokenData.error_description || tokenData.message || 'Token exchange failed')}`, req.url));
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const openId = tokenData.open_id;
    const expiresIn = tokenData.expires_in;

    // Get user info to get display name
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const userInfoData = await userInfoResponse.json();
    let accountName = 'TikTok Account';
    
    if (userInfoResponse.ok && userInfoData.data?.user) {
      accountName = userInfoData.data.user.display_name || accountName;
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
          provider: 'TIKTOK',
        },
      },
      update: {
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : undefined,
        expiresAt,
        accountName,
        pageId: openId,
        status: 'CONNECTED',
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'TIKTOK',
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : null,
        expiresAt,
        accountName,
        pageId: openId,
        status: 'CONNECTED',
        workspaceId: workspace?.id,
      },
    });

    if (isDesktopClient) {
      return renderDesktopHtml('Kết nối TikTok thành công!', false);
    }
    return NextResponse.redirect(new URL('/dashboard/settings/social?success=tiktok_connected', req.url));

  } catch (error: any) {
    console.error('TikTok callback exception:', error);
    const stateParam = new URL(req.url).searchParams.get('state') || '';
    if (stateParam.includes('tiktok_')) {
       return new NextResponse(
        `<html><head><meta charset="utf-8" /></head><body style="text-align: center; padding: 50px;"><h2 style="color: #EF4444;">Lỗi kết nối TikTok</h2><script>setTimeout(() => { window.close(); }, 3000);</script></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }
    return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(error.message)}`, req.url));
  }
}
