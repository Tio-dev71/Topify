import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { cookies } from 'next/headers';

// GET /api/social/meta/callback — Handle Meta OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = new URL(req.url).origin;
  try {
    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;
    let isDesktopClient = false;

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const rawState = url.searchParams.get('state') || '';

    const renderDesktopError = (msg: string) => {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">${msg}</h2>
            <p>Vui lòng đóng cửa sổ này và thử lại.</p>
            <script>
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    };

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state_meta')?.value;

    const [csrfState, ...restState] = rawState.split('::');
    const state = restState.join('::');

    if (state && state.startsWith('meta_')) {
      isDesktopClient = true;
      const token = state.replace('meta_', '');
      try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error('Missing AUTH_SECRET');
        const decoded = jwt.verify(token, secret) as any;
        if (!userId) {
          userId = decoded.sub || decoded.id;
          workspaceId = decoded.workspaceId;
        }
      } catch (err) {
        console.error('Invalid token in state:', err);
      }
    }

    if (!storedState || storedState !== csrfState) {
      console.error('CSRF validation failed for Meta OAuth');
      if (isDesktopClient) {
        return renderDesktopError('Lỗi kết nối Meta (CSRF validation failed)');
      }
      return NextResponse.redirect(new URL('/settings?error=csrf_validation_failed', baseUrl));
    }

    if (!userId) {
      if (isDesktopClient) return renderDesktopError('Vui lòng đăng nhập lại trên ứng dụng');
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    if (error || !code) {
      if (isDesktopClient) return renderDesktopError('Lỗi xác thực Meta: ' + (error || 'Không có mã xác thực'));
      return NextResponse.redirect(
        new URL('/settings?error=meta_auth_failed', baseUrl)
      );
    }

    const credentials = await getCredentials(userId);
    const clientId = credentials.META_APP_ID!;
    const clientSecret = credentials.META_APP_SECRET!;
    const redirectUri = process.env.META_REDIRECT_URI || `${baseUrl}/api/social/meta/callback`;

    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Meta token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', baseUrl)
      );
    }

    // Get long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || tokenData.access_token;

    // Get user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    console.log('DEBUG_META_PAGES:', JSON.stringify(pagesData, null, 2));
    const page = pagesData.data?.[0]; // Use first page

    // Get Instagram Business Account
    let instagramBusinessId = null;
    if (page) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      instagramBusinessId = igData.instagram_business_account?.id || null;
    }

    // Encrypt the tokens before saving
    const encryptedAccessToken = encryptToken(page?.access_token || accessToken);

    // Save to database
    await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: 'META',
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: null,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
        accountName: page?.name || 'Meta Account',
        pageId: page?.id || null,
        instagramBusinessId,
      },
      create: {
        userId: userId,
        workspaceId: workspaceId,
        provider: 'META',
        accessToken: encryptedAccessToken,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        accountName: page?.name || 'Meta Account',
        pageId: page?.id || null,
        instagramBusinessId,
      },
    });

    if (isDesktopClient) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #10B981;">Kết nối Meta thành công!</h2>
            <p>Bạn có thể đóng cửa sổ này và quay lại ứng dụng.</p>
            <script>
              setTimeout(() => { window.close(); }, 2000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return NextResponse.redirect(
      new URL('/settings?success=meta', baseUrl)
    );
  } catch (error: any) {
    console.error('Meta callback error:', error);
    if (new URL(req.url).searchParams.get('state')?.includes('meta_')) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Lỗi kết nối Meta</h2>
            <p>Vui lòng đóng cửa sổ này và thử lại.</p>
            <script>
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }
    return NextResponse.redirect(
      new URL('/settings?error=meta_callback_error', baseUrl)
    );
  }
}
