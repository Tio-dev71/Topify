import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    let userId: string | undefined;
    let role: string | undefined;
    
    if (token) {
      try {
        const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
        userId = decoded.sub || decoded.id;
        role = decoded.role;
      } catch (e) {
        console.error('Invalid token in query', e);
      }
    }
    
    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
      role = session?.user?.role;
    }

    if (!userId) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Chưa đăng nhập</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #EF4444;">Phiên đăng nhập đã hết hạn</h2>
            <p>Vui lòng đăng nhập lại trên ứng dụng Topify.</p>
            <script>setTimeout(() => { window.close(); }, 3000);</script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 401 }
      );
    }

    const credentials = await getCredentials(userId);
    const clientKey = credentials.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${req.nextUrl.origin}/api/social/tiktok/callback`;

    if (!clientKey) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Chưa cấu hình TikTok</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
              <h2 style="color: #1F2937; margin-bottom: 8px;">Chưa cấu hình TikTok Client Key</h2>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                Hệ thống chưa tìm thấy TikTok Client Key trong cơ sở dữ liệu.<br/>
                Vui lòng vào <strong>Cài đặt hệ thống &gt; OAuth &amp; Social Apps</strong> để nhập <strong>TikTok Client Key</strong> và <strong>Secret</strong>.
              </p>
              <button onclick="window.close()" style="background: #111827; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Đóng cửa sổ</button>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }

    // TikTok scopes
    const scopes = [
      'user.info.basic',
      'video.list',
      'video.publish',
      'video.upload'
    ].join(',');

    const originalStateParam = token ? `tiktok_${token}` : 'tiktok';
    const csrfState = crypto.randomBytes(16).toString('hex');
    const stateParam = `${csrfState}::${originalStateParam}`;
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state_tiktok', csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || req.nextUrl.protocol === 'https:',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

