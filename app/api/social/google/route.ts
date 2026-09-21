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
    const tokenParam = url.searchParams.get('token');

    let session = await auth();
    let userId = session?.user?.id;
    let userRole = session?.user?.role;

    if (!userId && tokenParam) {
      try {
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error('Missing AUTH_SECRET');
        const decoded = jwt.verify(tokenParam, secret) as any;
        userId = decoded.sub || decoded.id;
        userRole = decoded.role || 'ADMIN';
      } catch (err) {
        console.error('Invalid token in google route:', err);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await getCredentials(userId);
    const clientId = credentials.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/social/google/callback`;
    console.log('GOOGLE OAUTH redirectUri:', redirectUri);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured.' },
        { status: 400 }
      );
    }

    const scope = url.searchParams.get('scope') || 'youtube';

    let scopes: string;
    let state: string;

    if (scope === 'drive') {
      scopes = 'https://www.googleapis.com/auth/drive.readonly';
      state = tokenParam ? `google_drive_${tokenParam}` : 'google_drive';
    } else {
      scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl';
      state = tokenParam ? `youtube_${tokenParam}` : 'youtube';
    }

    const csrfState = crypto.randomBytes(16).toString('hex');

    const finalState = `${csrfState}::${state}`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${finalState}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state_google', csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
