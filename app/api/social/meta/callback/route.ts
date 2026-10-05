import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { cookies } from 'next/headers';
import * as jwtPackage from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

// GET /api/social/meta/callback — Handle Meta OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = new URL(req.url).origin;
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');
    const errorDescription = url.searchParams.get('error_description');
    const rawState = url.searchParams.get('state') || '';

    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;
    let isDesktopClient = false;

    const renderDesktopError = (msg: string, detail?: string) => {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Lỗi xác thực Meta</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f9fafb; color: #1f2937;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="font-size: 40px; margin-bottom: 12px;">❌</div>
              <h2 style="color: #EF4444; margin-bottom: 8px;">${msg}</h2>
              ${detail ? `<p style="color: #6B7280; font-size: 13px; line-height: 1.5; background: #FEF2F2; padding: 12px; border-radius: 8px; margin-bottom: 20px;">${detail}</p>` : ''}
              <p style="color: #4B5563; font-size: 14px; margin-bottom: 24px;">Vui lòng đóng cửa sổ này và thử lại trên ứng dụng.</p>
              <button onclick="window.close()" style="background: #4B5563; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Đóng cửa sổ</button>
            </div>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_ERROR', provider: 'META', error: ${JSON.stringify(msg)} }, '*');
                }
              } catch(e) {}
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
        const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
        // Prioritize desktop client user credentials over web session cookies
        userId = decoded.sub || decoded.id;
        workspaceId = decoded.workspaceId;
      } catch (err) {
        console.error('Invalid token in state:', err);
      }
    }

    if (!isDesktopClient && (!storedState || storedState !== csrfState)) {
      console.error('CSRF validation failed for Meta OAuth');
      return NextResponse.redirect(new URL('/dashboard/settings?error=csrf_validation_failed', baseUrl));
    }

    if (!userId) {
      if (isDesktopClient) return renderDesktopError('Phiên đăng nhập ứng dụng không hợp lệ hoặc đã hết hạn.');
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    if (!workspaceId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      workspaceId = user?.workspaceId;
    }

    if (error || !code) {
      const fullError = errorDescription || errorReason || error || 'Người dùng đã hủy hoặc không có mã xác thực';
      if (isDesktopClient) return renderDesktopError('Lỗi xác thực Meta', fullError);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(fullError)}`, baseUrl)
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
      const errMsg = tokenData.error?.message || 'Không thể đổi mã truy cập với Meta';
      if (isDesktopClient) {
        return renderDesktopError('Đổi mã truy cập Meta thất bại', errMsg);
      }
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', baseUrl)
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
    const accountDisplayName = page?.name || 'Meta Account';

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
        accountName: accountDisplayName,
        pageId: page?.id || null,
        instagramBusinessId,
        status: 'CONNECTED',
        workspaceId: workspaceId || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        workspaceId: workspaceId,
        provider: 'META',
        accessToken: encryptedAccessToken,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        accountName: accountDisplayName,
        pageId: page?.id || null,
        instagramBusinessId,
        status: 'CONNECTED',
      },
    });

    if (isDesktopClient) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Kết nối thành công</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <h2 style="color: #10B981; margin: 0 0 10px;">Kết nối Meta thành công!</h2>
              <p style="color: #374151; font-weight: 500;">Tài khoản: <strong>${accountDisplayName}</strong></p>
              ${page ? `<p style="color: #059669; font-size: 13px;">Fanpage: ${page.name}</p>` : '<p style="color: #D97706; font-size: 13px;">Lưu ý: Chưa tìm thấy Fanpage nào được cấp quyền. Bạn có thể cấp quyền Fanpage trong cài đặt Facebook.</p>'}
              <p style="color: #6B7280; font-size: 14px; margin-top: 16px;">Bạn có thể đóng tab trình duyệt này và quay lại ứng dụng Topify.</p>
            </div>
            <script>
              setTimeout(() => { window.close(); }, 2000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=meta', baseUrl)
    );
  } catch (error: any) {
    console.error('Meta callback error:', error);
    if (new URL(req.url).searchParams.get('state')?.includes('meta_')) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Lỗi kết nối Meta</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Lỗi kết nối Meta</h2>
            <p style="color: #6B7280; font-size: 14px;">${error.message || 'Đã xảy ra sự cố trong quá trình xử lý.'}</p>
            <p>Vui lòng đóng cửa sổ này và thử lại.</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_ERROR', provider: 'META', error: ${JSON.stringify(error.message)} }, '*');
                }
              } catch(e) {}
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=meta_callback_error', baseUrl)
    );
  }
}

