import prisma from '@/lib/db';
import { decryptToken, encryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import type { SocialAccount } from '@prisma/client';

export async function getValidAccessToken(socialAccount: SocialAccount): Promise<string> {
  const token = decryptToken(socialAccount.accessToken);
  
  // Check if token is expired or expires in less than 5 minutes
  const isExpired = socialAccount.expiresAt && new Date(socialAccount.expiresAt).getTime() < Date.now() + 5 * 60 * 1000;
  
  if (!isExpired && socialAccount.status === 'CONNECTED') {
    return token;
  }

  if (!socialAccount.refreshToken) {
    throw new Error('Token is expired and no refresh token is available. Please reconnect your account.');
  }

  const refreshToken = decryptToken(socialAccount.refreshToken);
  const credentials = await getCredentials(socialAccount.userId);

  if (!credentials.GOOGLE_CLIENT_ID || !credentials.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured in settings.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.GOOGLE_CLIENT_ID,
      client_secret: credentials.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`Failed to refresh token: ${JSON.stringify(data)}`);
  }

  const newExpiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : new Date(Date.now() + 60 * 60 * 1000); // default to 1 hour if not provided

  const encryptedAccessToken = encryptToken(data.access_token);

  await prisma.socialAccount.update({
    where: { id: socialAccount.id },
    data: {
      accessToken: encryptedAccessToken,
      expiresAt: newExpiresAt,
      status: 'CONNECTED',
    },
  });

  return data.access_token;
}
