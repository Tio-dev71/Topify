import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    let userId;
    let role;
    
    if (token) {
      try {
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error('Missing AUTH_SECRET');
        const decoded = jwtPackage.verify(token, secret) as any;
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await getCredentials(userId);
    const clientKey = credentials.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.AUTH_URL || 'http://localhost:3000'}/api/social/tiktok/callback`;

    if (!clientKey) {
      return NextResponse.json(
        { error: 'TikTok OAuth credentials not configured.' },
        { status: 400 }
      );
    }

    // TikTok Business scopes
    const scopes = [
      'user.info.basic',
      'video.list',
      'video.publish',
      'video.upload'
    ].join(',');

    const originalStateParam = token ? `tiktok_${token}` : 'tiktok';
    const csrfState = crypto.randomBytes(16).toString('hex');
    const cookieStore = await cookies();
    cookieStore.set('oauth_state_tiktok', csrfState, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 10,
    });

    const stateParam = `${csrfState}::${originalStateParam}`;
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`;

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
