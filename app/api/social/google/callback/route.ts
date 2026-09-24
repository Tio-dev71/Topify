import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { cookies } from 'next/headers';

// GET /api/social/google/callback — Handle Google OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = new URL(req.url).origin;
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const rawState = url.searchParams.get('state') || '';
    const error = url.searchParams.get('error');

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
    const storedState = cookieStore.get('oauth_state_google')?.value;

    const [csrfState, ...restState] = rawState.split('::');
    const state = restState.join('::');

    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;
    let isDesktopClient = false;
    let providerState = state;

    if (state.startsWith('youtube_') || state.startsWith('google_drive_')) {
      isDesktopClient = true;
      const isYoutube = state.startsWith('youtube_');
      const token = state.replace(isYoutube ? 'youtube_' : 'google_drive_', '');
      providerState = isYoutube ? 'youtube' : 'google_drive';
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
        console.error('Invalid token in google state:', err);
      }
    }

    if (!isDesktopClient && (!storedState || storedState !== csrfState)) {
      console.error('CSRF validation failed for Google OAuth');
      return NextResponse.redirect(new URL('/dashboard/settings?error=csrf_validation_failed', baseUrl));
    }

    if (!userId) {
      if (isDesktopClient) return renderDesktopError('Vui lòng đăng nhập lại trên ứng dụng');
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    if (error || !code) {
      if (isDesktopClient) return renderDesktopError('Lỗi xác thực Google: ' + (error || 'Không có mã xác thực'));
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=google_auth_failed', baseUrl)
      );
    }

    const credentials = await getCredentials(userId);
    const clientId = credentials.GOOGLE_CLIENT_ID!;
    const clientSecret = credentials.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/social/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', baseUrl)
      );
    }

    const provider = providerState === 'google_drive' ? 'GOOGLE_DRIVE' : 'YOUTUBE';

    let accountName = 'Google Account';
    let youtubeChannelId = null;

    if (provider === 'YOUTUBE') {
      // Get channel info
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (channel) {
        accountName = channel.snippet.title;
        youtubeChannelId = channel.id;
      }
    } else {
      // Get user info for Drive
      const userRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const userData = await userRes.json();
      accountName = userData.name || userData.email || 'Google Drive';
    }

    // Calculate expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;

    // Save to database
    await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: provider as any,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken || undefined,
        expiresAt,
        accountName,
        youtubeChannelId: provider === 'YOUTUBE' ? youtubeChannelId : undefined,
      },
      create: {
        userId: userId,
        workspaceId: workspaceId,
        provider: provider as any,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        accountName,
        youtubeChannelId: provider === 'YOUTUBE' ? youtubeChannelId : null,
      },
    });

    if (isDesktopClient) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #10B981;">Kết nối ${provider} thành công!</h2>
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
      new URL(`/dashboard/settings?success=${provider.toLowerCase()}`, baseUrl)
    );
  } catch (error: any) {
    console.error('Google callback error:', error);
    const stateParam = new URL(req.url).searchParams.get('state') || '';
    if (stateParam.includes('youtube_') || stateParam.includes('google_drive_')) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Lỗi kết nối Google</h2>
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
      new URL('/dashboard/settings?error=google_callback_error', baseUrl)
    );
  }
}
