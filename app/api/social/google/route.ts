import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// GET /api/social/google — Initiate Google OAuth flow (YouTube or Drive)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawToken = url.searchParams.get('token');
    const tokenParam = (rawToken && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken : null;

    let session = await auth();
    let userId = session?.user?.id;
    let userRole = session?.user?.role;
    let workspaceId = (session?.user as any)?.workspaceId;

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

    if (!userId && tokenParam) {
      try {
        const decoded = jwt.verify(tokenParam, secret) as any;
        userId = decoded.sub || decoded.id;
        userRole = decoded.role || 'ADMIN';
        workspaceId = decoded.workspaceId;
      } catch (err) {
        console.error('Invalid token in google route:', err);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Vui lòng đăng nhập trước khi kết nối tài khoản.' }, { status: 401 });
    }

    const credentials = await getCredentials(userId);
    const clientId = credentials.GOOGLE_CLIENT_ID?.trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `${req.nextUrl.origin}/api/social/google/callback`;
    console.log('GOOGLE OAUTH redirectUri:', redirectUri);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth Client ID chưa được cấu hình. Vui lòng kiểm tra mục OAuth & Social Apps trong Cài đặt.' },
        { status: 400 }
      );
    }

    const scope = url.searchParams.get('scope') || 'youtube';

    // Tạo JWT token đại diện cho người dùng để callback nhận diện được chính xác (Desktop + Web popup)
    const stateToken = tokenParam || jwt.sign(
      { sub: userId, id: userId, role: userRole, workspaceId },
      secret,
      { expiresIn: '30m' }
    );

    let scopes: string;
    let statePrefix: string;

    if (scope === 'drive') {
      scopes = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
      statePrefix = 'google_drive';
    } else {
      // Scopes cho YouTube: upload + readonly + userinfo. Bỏ scope youtube.force-ssl để tránh bị Google chặn lỗi 403 access_denied
      scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
      statePrefix = 'youtube';
    }

    const state = `${statePrefix}_${stateToken}`;
    const csrfState = crypto.randomBytes(16).toString('hex');
    const finalState = `${csrfState}::${state}`;

    // prompt=select_account consent cho phép người dùng luôn được CHỌN TÀI KHOẢN KHÁC thay vì bị dính tài khoản cũ
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=select_account%20consent&state=${encodeURIComponent(finalState)}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state_google', csrfState, {
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
