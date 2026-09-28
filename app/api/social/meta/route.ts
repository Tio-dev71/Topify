import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

// GET /api/social/meta — Initiate Meta OAuth flow
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
    const clientId = credentials.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${req.nextUrl.origin}/api/social/meta/callback`;

    if (!clientId) {
      return new NextResponse(
        `<html>
          <head><meta charset="utf-8" /><title>Chưa cấu hình Meta</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
              <h2 style="color: #1F2937; margin-bottom: 8px;">Chưa cấu hình Meta App ID</h2>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                Hệ thống chưa tìm thấy Meta App ID trong cơ sở dữ liệu.<br/>
                Vui lòng vào <strong>Cài đặt hệ thống &gt; OAuth &amp; Social Apps</strong> để nhập <strong>Meta App ID</strong> và <strong>Secret</strong>.
              </p>
              <button onclick="window.close()" style="background: #2563EB; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Đóng cửa sổ</button>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }

    // Standard scopes for Fanpage post/reel management and Instagram publishing
    // Removed 'business_management' which requires strict Business Verification & Review
    const scopes = [
      'public_profile',
      'email',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const originalStateParam = token ? `meta_${token}` : 'meta';
    
    const csrfState = crypto.randomBytes(16).toString('hex');
    const stateParam = `${csrfState}::${originalStateParam}`;
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(stateParam)}`;

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('oauth_state_meta', csrfState, {
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

