import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { SocialAccountStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthUser(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user;
    }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const resolvedParams = await params;
    const provider = resolvedParams.provider.toUpperCase();

    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Vui lòng đăng nhập lại' }, { status: 401 });
    }

    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        OR: [
          { userId: user.id },
          ...(user.workspaceId ? [{ workspaceId: user.workspaceId }] : [])
        ]
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản mạng xã hội' }, { status: 404 });
    }

    const credentials = await getCredentials(user.id);

    // 1. GOOGLE / YOUTUBE
    if (provider === 'GOOGLE' || account.provider === 'YOUTUBE' || account.provider === 'GOOGLE_DRIVE') {
      if (!account.refreshToken) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Không có Refresh Token cho tài khoản Google/YouTube. Vui lòng kết nối lại tài khoản.',
          status: 'EXPIRED'
        }, { status: 400 });
      }

      const refreshToken = decryptToken(account.refreshToken);
      const clientId = credentials.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = credentials.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Google credentials chưa được cấu hình' }, { status: 400 });
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
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Làm mới token Google thất bại: ' + (tokenData.error_description || tokenData.error || 'Token đã hết hạn hoàn toàn'),
          status: 'EXPIRED',
          details: tokenData,
        }, { status: 400 });
      }

      const expiresInSeconds = tokenData.expires_in || 3600;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(tokenData.access_token),
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã làm mới Access Token Google/YouTube thành công!',
        expiresAt: expiresAt.toISOString(),
        status: 'CONNECTED',
      });

    // 2. META (Facebook & Instagram)
    } else if (provider === 'META') {
      const accessToken = decryptToken(account.accessToken);
      const clientId = credentials.META_APP_ID || process.env.META_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const clientSecret = credentials.META_APP_SECRET || process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Meta credentials chưa được cấu hình' }, { status: 400 });
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
        return NextResponse.json({
          error: 'Làm mới token Meta thất bại. Token có thể đã hết hạn hoặc bị thu hồi trên Facebook. Vui lòng kết nối lại.',
          status: 'EXPIRED',
          details: tokenData,
        }, { status: 400 });
      }

      // Meta tokens typically valid for ~60 days from exchange
      const expiresInSeconds = tokenData.expires_in || (60 * 24 * 3600);
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(tokenData.access_token),
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã làm mới Access Token Meta (Facebook/Instagram) thành công!',
        expiresAt: expiresAt.toISOString(),
        status: 'CONNECTED',
      });

    // 3. TIKTOK
    } else if (provider === 'TIKTOK') {
      if (!account.refreshToken) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Không có Refresh Token cho tài khoản TikTok. Vui lòng kết nối lại tài khoản.',
          status: 'EXPIRED'
        }, { status: 400 });
      }

      const clientKey = credentials.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = credentials.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET;
      const rawRefresh = decryptToken(account.refreshToken);

      if (!clientKey || !clientSecret) {
        return NextResponse.json({ error: 'TikTok credentials chưa được cấu hình' }, { status: 400 });
      }

      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: rawRefresh,
        }),
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.data?.access_token || tokenData.access_token;
      const newRefreshToken = tokenData.data?.refresh_token || tokenData.refresh_token;

      if (!accessToken) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Làm mới token TikTok thất bại. Vui lòng kết nối lại tài khoản.',
          status: 'EXPIRED',
          details: tokenData,
        }, { status: 400 });
      }

      const expiresInSeconds = tokenData.data?.expires_in || tokenData.expires_in || 86400;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(accessToken),
          refreshToken: newRefreshToken ? encryptToken(newRefreshToken) : undefined,
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã làm mới Access Token TikTok thành công!',
        expiresAt: expiresAt.toISOString(),
        status: 'CONNECTED',
      });

    // 4. ZALO
    } else if (provider === 'ZALO') {
      if (!account.refreshToken) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Không có Refresh Token cho tài khoản Zalo. Vui lòng kết nối lại.',
          status: 'EXPIRED'
        }, { status: 400 });
      }

      const appId = credentials.ZALO_APP_ID || process.env.ZALO_APP_ID;
      const secretKey = credentials.ZALO_APP_SECRET || process.env.ZALO_APP_SECRET;
      const rawRefresh = decryptToken(account.refreshToken);

      if (!appId || !secretKey) {
        return NextResponse.json({ error: 'Zalo credentials chưa được cấu hình' }, { status: 400 });
      }

      const tokenRes = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'secret_key': secretKey,
        },
        body: new URLSearchParams({
          app_id: appId,
          grant_type: 'refresh_token',
          refresh_token: rawRefresh,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: SocialAccountStatus.EXPIRED },
        });
        return NextResponse.json({
          error: 'Làm mới token Zalo thất bại: ' + (tokenData.error_name || tokenData.message || 'Token hết hạn'),
          status: 'EXPIRED',
          details: tokenData,
        }, { status: 400 });
      }

      const expiresInSeconds = parseInt(tokenData.expires_in) || 86400;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : undefined,
          expiresAt,
          status: SocialAccountStatus.CONNECTED,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã làm mới Access Token Zalo thành công!',
        expiresAt: expiresAt.toISOString(),
        status: 'CONNECTED',
      });

    } else {
      return NextResponse.json({ error: `Nền tảng ${provider} chưa hỗ trợ tự động làm mới token` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi làm mới token' }, { status: 500 });
  }
}
