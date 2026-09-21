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
    const appId = credentials.ZALO_APP_ID;
    const redirectUri = process.env.ZALO_REDIRECT_URI || `${process.env.AUTH_URL || 'http://localhost:3000'}/api/social/zalo/callback`;

    if (!appId) {
      return NextResponse.json(
        { error: 'Zalo OAuth credentials not configured.' },
        { status: 400 }
      );
    }
    
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const originalStateParam = token ? `zalo_${token}` : 'zalo';
    const csrfState = crypto.randomBytes(16).toString('hex');
    const stateParam = `${csrfState}::${originalStateParam}`;
    const authUrl = `https://oauth.zaloapp.com/v4/oa/permission?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}&code_challenge=${codeChallenge}`;

    const response = NextResponse.redirect(authUrl);
    
    response.cookies.set('oauth_state_zalo', csrfState, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 10,
    });
    
    response.cookies.set('oauth_pkce_zalo', codeVerifier, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
