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
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Topify - Lỗi kết nối Google</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F9FA; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; color: #111827; }
              .card { background: white; border-radius: 20px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #E5E7EB; }
              .badge { width: 64px; height: 64px; background: #FEE2E2; color: #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px; }
              h2 { margin: 0 0 10px; color: #111827; font-size: 20px; font-weight: 700; }
              p { margin: 0 0 20px; color: #4B5563; font-size: 14px; line-height: 1.5; }
              .btn { display: inline-block; background: #111827; color: white; font-weight: 600; padding: 10px 24px; border-radius: 12px; text-decoration: none; cursor: pointer; border: none; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✕</div>
              <h2>Kết nối thất bại</h2>
              <p>${msg}</p>
              <button class="btn" onclick="window.close()">Đóng cửa sổ này</button>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    };

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state_google')?.value;

    const [csrfState, ...restState] = rawState.split('::');
    const state = restState.join('::');

    let userId: string | undefined;
    let workspaceId: string | undefined;
    let isDesktopClient = false;
    let providerState = state;

    if (state.startsWith('youtube_') || state.startsWith('google_drive_')) {
      isDesktopClient = true;
      const isYoutube = state.startsWith('youtube_');
      const token = state.replace(isYoutube ? 'youtube_' : 'google_drive_', '');
      providerState = isYoutube ? 'youtube' : 'google_drive';
      try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';
        const decoded = jwt.verify(token, secret) as any;
        if (decoded?.sub || decoded?.id) {
          userId = decoded.sub || decoded.id;
          workspaceId = decoded.workspaceId;
        }
      } catch (err) {
        console.error('Invalid token in google state:', err);
      }
    }

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
      workspaceId = (session?.user as any)?.workspaceId;
    }

    if (!isDesktopClient && (!storedState || storedState !== csrfState)) {
      console.error('CSRF validation failed for Google OAuth');
      return NextResponse.redirect(new URL('/dashboard/settings?error=csrf_validation_failed', baseUrl));
    }

    if (!userId) {
      if (isDesktopClient) return renderDesktopError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại trên ứng dụng.');
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    if (!workspaceId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      workspaceId = dbUser?.workspaceId || undefined;
    }

    if (error || !code) {
      if (isDesktopClient) return renderDesktopError('Lỗi xác thực Google: ' + (error || 'Không nhận được mã xác thực code'));
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=google_auth_failed', baseUrl)
      );
    }

    const credentials = await getCredentials(userId);
    const clientId = credentials.GOOGLE_CLIENT_ID?.trim()!;
    const clientSecret = credentials.GOOGLE_CLIENT_SECRET?.trim()!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `${baseUrl}/api/social/google/callback`;

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
      if (isDesktopClient) {
        return renderDesktopError(`Lỗi đổi mã truy cập Google: ${tokenData.error_description || tokenData.error || 'Thất bại'}`);
      }
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', baseUrl)
      );
    }

    const provider = providerState === 'google_drive' ? 'GOOGLE_DRIVE' : 'YOUTUBE';

    let accountName = 'Google Account';
    let youtubeChannelId = null;

    if (provider === 'YOUTUBE') {
      try {
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
          accountName = channel.snippet?.title || 'YouTube Channel';
          youtubeChannelId = channel.id;
        } else if (channelData.error) {
          console.warn('YouTube channel fetch notice:', channelData.error);
        }
      } catch (chErr) {
        console.error('Error fetching youtube channel snippet:', chErr);
      }

      // Nếu không lấy được tên kênh từ YouTube API, lấy tên từ UserInfo
      if (accountName === 'Google Account') {
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userRes.json();
          if (userData.name || userData.email) {
            accountName = `${userData.name || userData.email}`;
          }
        } catch (uErr) {}
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

    // Save to database with status CONNECTED
    await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: provider as any,
        },
      },
      update: {
        workspaceId: workspaceId || undefined,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken || undefined,
        expiresAt,
        accountName,
        youtubeChannelId: provider === 'YOUTUBE' ? youtubeChannelId : undefined,
        status: 'CONNECTED',
        updatedAt: new Date(),
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
        status: 'CONNECTED',
      },
    });

    if (isDesktopClient) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Topify - Kết nối YouTube thành công</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F9FA; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; color: #111827; }
              .card { background: white; border-radius: 24px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #F3F4F6; }
              .badge { width: 64px; height: 64px; background: #ECFDF5; color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; border: 1px solid #D1FAE5; }
              h2 { margin: 0 0 12px; color: #111827; font-size: 22px; font-weight: 700; }
              p { margin: 0 0 16px; color: #4B5563; font-size: 14px; line-height: 1.5; }
              .account-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 14px; padding: 14px 18px; margin: 16px 0 24px; text-align: left; }
              .account-label { font-size: 12px; color: #6B7280; margin-bottom: 4px; font-weight: 500; }
              .account-val { font-size: 15px; color: #111827; font-weight: 600; display: flex; align-items: center; gap: 8px; }
              .channel-id { font-family: monospace; font-size: 12px; background: #E5E7EB; padding: 2px 6px; border-radius: 6px; color: #374151; }
              .btn { display: inline-flex; align-items: center; justify-content: center; background: #5B3DF5; color: white; font-weight: 600; padding: 12px 28px; border-radius: 12px; text-decoration: none; cursor: pointer; border: none; font-size: 14px; width: 100%; transition: all 0.2s; box-shadow: 0 2px 4px rgba(91,61,245,0.2); }
              .btn:hover { background: #4A2DE0; }
              .note { font-size: 12px; color: #9CA3AF; margin-top: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✓</div>
              <h2>Kết nối ${provider === 'YOUTUBE' ? 'YouTube' : 'Google Drive'} thành công!</h2>
              <p>Tài khoản đã được liên kết với ứng dụng Topify Automation.</p>
              <div class="account-box">
                <div class="account-label">Tài khoản Google / Kênh:</div>
                <div class="account-val">
                  <span>${accountName}</span>
                  ${youtubeChannelId ? `<span class="channel-id">ID: ${youtubeChannelId}</span>` : ''}
                </div>
              </div>
              ${!youtubeChannelId && provider === 'YOUTUBE' ? '<p style="color: #D97706; font-size: 13px; text-align: left; background: #FFFBEB; padding: 10px; border-radius: 10px; margin-bottom: 16px;">⚠️ Lưu ý: Chưa tìm thấy kênh YouTube mặc định trên tài khoản này. Bạn có thể vào studio.youtube.com để tạo kênh nếu cần đăng video.</p>' : ''}
              <button class="btn" onclick="window.close()">Đóng trang & Quay lại Topify</button>
              <p class="note">Cửa sổ sẽ tự động đóng sau vài giây...</p>
            </div>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}' }, '*');
                }
              } catch(e) {}
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 4000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return NextResponse.redirect(
      new URL(`/dashboard/settings?tab=social&success=${provider.toLowerCase()}`, baseUrl)
    );
  } catch (error: any) {
    console.error('Google callback error:', error);
    const stateParam = new URL(req.url).searchParams.get('state') || '';
    if (stateParam.includes('youtube_') || stateParam.includes('google_drive_')) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Topify - Lỗi kết nối Google</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F9FA; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; color: #111827; }
              .card { background: white; border-radius: 20px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #E5E7EB; }
              .badge { width: 64px; height: 64px; background: #FEE2E2; color: #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px; }
              h2 { margin: 0 0 10px; color: #111827; font-size: 20px; font-weight: 700; }
              p { margin: 0 0 20px; color: #4B5563; font-size: 14px; }
              .btn { display: inline-block; background: #111827; color: white; font-weight: 600; padding: 10px 24px; border-radius: 12px; text-decoration: none; cursor: pointer; border: none; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✕</div>
              <h2>Lỗi kết nối Google</h2>
              <p>Đã xảy ra sự cố trong quá trình liên kết tài khoản. Vui lòng đóng cửa sổ và thử lại.</p>
              <button class="btn" onclick="window.close()">Đóng cửa sổ này</button>
            </div>
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
