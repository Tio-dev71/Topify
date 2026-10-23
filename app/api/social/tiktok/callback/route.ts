import { NextRequest, NextResponse } from 'next/server';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { auth } from '@/lib/auth';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

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

    const renderDesktopHtml = (msg: string, isError: boolean, detail?: string) => {
      const color = isError ? '#EF4444' : '#10B981';
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${isError ? 'Lỗi kết nối TikTok' : 'Kết nối TikTok thành công'}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #f9fafb; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
              .card { max-width: 480px; width: 100%; margin: 0 auto; background: white; padding: 36px 32px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #F3F4F6; box-sizing: border-box; }
              .badge { width: 64px; height: 64px; background: ${isError ? '#FEE2E2' : '#ECFDF5'}; color: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; border: 1px solid ${isError ? '#FECACA' : '#D1FAE5'}; }
              h2 { color: #111827; margin: 0 0 10px; font-size: 22px; font-weight: 700; }
              .btn { display: inline-flex; align-items: center; justify-content: center; background: ${isError ? '#111827' : '#000000'}; color: white; font-weight: 600; padding: 14px 28px; border-radius: 12px; text-decoration: none; cursor: pointer; border: none; font-size: 15px; width: 100%; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); box-sizing: border-box; }
              .btn:hover { background: #1F2937; }
              .note { font-size: 13px; color: #6B7280; margin-top: 14px; line-height: 1.4; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">${isError ? '✕' : '✓'}</div>
              <h2>${msg}</h2>
              ${detail ? `<p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${detail}</p>` : ''}
              <div style="margin-top: 24px;">
                <button id="actionBtn" class="btn" onclick="returnToApp()">${isError ? 'Đóng & Quay lại Topify' : 'Đóng trang & Quay lại Topify'}</button>
                <p id="noteText" class="note">${isError ? 'Nhấn để quay lại ứng dụng.' : 'Cửa sổ sẽ tự động chuyển về Topify Automation sau vài giây...'}</p>
              </div>
            </div>
            <script>
              var hasTriggered = false;
              function returnToApp() {
                if (hasTriggered) return;
                hasTriggered = true;

                var btn = document.getElementById('actionBtn');
                var note = document.getElementById('noteText');
                if (btn && !${isError}) {
                  btn.innerHTML = '<span style="margin-right:6px">✓</span> Đang quay lại Topify Automation...';
                  btn.style.background = '#10B981';
                }
                if (note && !${isError}) {
                  note.innerHTML = 'Đã kích hoạt ứng dụng Topify Automation! Bạn có thể đóng tab này thủ công.';
                  note.style.color = '#059669';
                }

                try {
                  if (window.opener) {
                    window.opener.postMessage({ type: '${isError ? 'OAUTH_ERROR' : 'OAUTH_SUCCESS'}', provider: 'TIKTOK', error: ${JSON.stringify(msg)} }, '*');
                  }
                } catch(e) {}

                try {
                  window.location.href = 'topify://${isError ? 'oauth-error' : 'oauth-success'}?provider=TIKTOK';
                } catch(e) {}

                setTimeout(function() {
                  try { window.open('', '_self', ''); window.close(); } catch(e) {}
                }, 500);
              }

              ${!isError ? 'setTimeout(function() { returnToApp(); }, 1200);' : ''}
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

    let userId: string | undefined;
    let workspaceId: string | undefined;

    if (originalStateParam && originalStateParam.startsWith('tiktok_')) {
      const token = originalStateParam.replace('tiktok_', '');
      try {
        const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
        userId = decoded.sub || decoded.id;
        workspaceId = decoded.workspaceId;
      } catch (e) {
        console.error('Invalid token in state', e);
      }
    }

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
      workspaceId = (session?.user as any)?.workspaceId;
    }

    if (!userId) {
      if (isDesktopClient) return renderDesktopHtml('Vui lòng đăng nhập lại trên ứng dụng', true);
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Unauthorized', req.url));
    }

    if (!workspaceId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      workspaceId = user?.workspaceId || undefined;
    }

    const credentials = await getCredentials(userId);
    const clientKey = credentials.TIKTOK_CLIENT_KEY;
    const clientSecret = credentials.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${req.nextUrl.origin}/api/social/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      if (isDesktopClient) return renderDesktopHtml('Thiếu cấu hình TikTok Client Key hoặc Secret', true);
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
      const errDetail = tokenData.error_description || tokenData.message || 'Token exchange failed';
      if (isDesktopClient) return renderDesktopHtml('Lỗi đổi token TikTok', true, errDetail);
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(errDetail)}`, req.url));
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const openId = tokenData.open_id;
    const expiresIn = tokenData.expires_in || 86400;

    // Get user info to get display name
    let accountName = 'TikTok Account';
    try {
      const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      const userInfoData = await userInfoResponse.json();
      if (userInfoResponse.ok && userInfoData.data?.user) {
        accountName = userInfoData.data.user.display_name || accountName;
      }
    } catch (e) {
      console.warn('Failed to fetch TikTok user info:', e);
    }

    // Save or update SocialAccount
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

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
        workspaceId: workspaceId || undefined,
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
        workspaceId,
      },
    });

    if (isDesktopClient) {
      return renderDesktopHtml(`Kết nối TikTok thành công: ${accountName}`, false);
    }
    return NextResponse.redirect(new URL('/dashboard/settings/social?success=tiktok_connected', req.url));

  } catch (error: any) {
    console.error('TikTok callback exception:', error);
    const stateParam = new URL(req.url).searchParams.get('state') || '';
    if (stateParam.includes('tiktok_')) {
       return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Lỗi kết nối TikTok</h2>
            <p style="color: #6B7280;">${error.message}</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_ERROR', provider: 'TIKTOK', error: ${JSON.stringify(error.message)} }, '*');
                }
              } catch(e) {}
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }
    return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(error.message)}`, req.url));
  }
}

