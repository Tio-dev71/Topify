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
    const oaId = url.searchParams.get('oa_id');
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
        `<html>
          <head><meta charset="utf-8" /><title>${isError ? 'Lỗi kết nối' : 'Kết nối thành công'}</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="font-size: 48px; margin-bottom: 12px;">${isError ? '❌' : '✅'}</div>
              <h2 style="color: ${color}; margin-bottom: 8px;">${msg}</h2>
              ${detail ? `<p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">${detail}</p>` : ''}
              <p style="color: #4B5563; font-size: 14px;">Bạn có thể đóng cửa sổ này và quay lại ứng dụng.</p>
              <button onclick="window.close()" style="margin-top: 16px; background: #0068FF; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Đóng cửa sổ</button>
            </div>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: '${isError ? 'OAUTH_ERROR' : 'OAUTH_SUCCESS'}', provider: 'ZALO', error: ${JSON.stringify(msg)} }, '*');
                }
              } catch(e) {}
              ${!isError ? 'setTimeout(() => { window.close(); }, 2000);' : ''}
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: isError ? 400 : 200 }
      );
    };

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state_zalo')?.value;
    const codeVerifier = cookieStore.get('oauth_pkce_zalo')?.value;

    const [csrfState, originalStateParam] = state.split('::');

    const isDesktopClient = originalStateParam && originalStateParam.startsWith('zalo_');

    if (!isDesktopClient && (!storedState || storedState !== csrfState)) {
      return NextResponse.redirect(new URL('/dashboard/settings/social?error=Invalid_state_parameter', req.url));
    }

    cookieStore.delete('oauth_state_zalo');
    cookieStore.delete('oauth_pkce_zalo');

    let userId: string | undefined;
    let workspaceId: string | undefined;

    if (originalStateParam && originalStateParam.startsWith('zalo_')) {
      const token = originalStateParam.replace('zalo_', '');
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
    const appId = credentials.ZALO_APP_ID;
    const secretKey = credentials.ZALO_APP_SECRET;

    if (!appId || !secretKey || !codeVerifier) {
      if (isDesktopClient) return renderDesktopHtml('Thiếu cấu hình Zalo App ID hoặc Secret Key', true);
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
      const errDetail = tokenData.error_name || tokenData.message || 'Token exchange failed';
      if (isDesktopClient) return renderDesktopHtml('Lỗi đổi token Zalo', true, errDetail);
      return NextResponse.redirect(new URL(`/dashboard/settings/social?error=${encodeURIComponent(errDetail)}`, req.url));
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = parseInt(tokenData.expires_in, 10) || 86400;

    // Fetch OA Info to get name
    let accountName = 'Zalo OA Account';
    let retrievedOaId = oaId || 'unknown';

    try {
      const oaInfoResponse = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
        method: 'GET',
        headers: {
          'access_token': accessToken,
        }
      });
      const oaInfoData = await oaInfoResponse.json();
      if (oaInfoData.error === 0 && oaInfoData.data) {
        accountName = oaInfoData.data.name || accountName;
        retrievedOaId = oaInfoData.data.oa_id || retrievedOaId;
      }
    } catch (e) {
      console.warn('Failed to fetch Zalo OA info:', e);
    }

    // Save or update SocialAccount
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

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
        workspaceId: workspaceId || undefined,
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
        workspaceId,
      },
    });

    if (isDesktopClient) {
      return renderDesktopHtml(`Kết nối Zalo thành công: ${accountName}`, false);
    }
    return NextResponse.redirect(new URL('/dashboard/settings/social?success=zalo_connected', req.url));

  } catch (error: any) {
    console.error('Zalo callback exception:', error);
    const stateParam = new URL(req.url).searchParams.get('state') || '';
    if (stateParam.includes('zalo_')) {
       return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Lỗi kết nối Zalo</h2>
            <p style="color: #6B7280;">${error.message}</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_ERROR', provider: 'ZALO', error: ${JSON.stringify(error.message)} }, '*');
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

