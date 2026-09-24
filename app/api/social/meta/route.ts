import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import * as jwtPackage from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// GET /api/social/meta — Initiate Meta OAuth flow
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
    const clientId = credentials.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${req.nextUrl.origin}/api/social/meta/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Meta OAuth credentials not configured.' },
        { status: 400 }
      );
    }

    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'business_management',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const originalStateParam = token ? `meta_${token}` : 'meta';
    
    const csrfState = crypto.randomBytes(16).toString('hex');
    const stateParam = `${csrfState}::${originalStateParam}`;
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${stateParam}`;

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
