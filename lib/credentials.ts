import prisma from './db';

export async function getCredentials(userId?: string) {
  let userSettingsMap: Record<string, string> = {};

  if (userId) {
    const userCreds = await prisma.userCredential.findMany({
      where: { userId }
    });
    
    for (const cred of userCreds) {
      if (cred.provider === 'GOOGLE') {
        userSettingsMap.GOOGLE_CLIENT_ID = cred.clientId;
        userSettingsMap.GOOGLE_CLIENT_SECRET = cred.clientSecret;
      }
      if (cred.provider === 'META') {
        userSettingsMap.META_APP_ID = cred.clientId;
        userSettingsMap.META_APP_SECRET = cred.clientSecret;
      }
      if (cred.provider === 'TIKTOK') {
        userSettingsMap.TIKTOK_CLIENT_KEY = cred.clientId;
        userSettingsMap.TIKTOK_CLIENT_SECRET = cred.clientSecret;
      }
      if (cred.provider === 'ZALO') {
        userSettingsMap.ZALO_APP_ID = cred.clientId;
        userSettingsMap.ZALO_APP_SECRET = cred.clientSecret;
      }
    }
  }

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['META_APP_ID', 'META_APP_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'ZALO_APP_ID', 'ZALO_APP_SECRET']
      }
    }
  });

  const settingsMap = settings.reduce((acc: Record<string, string>, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    META_APP_ID: userSettingsMap.META_APP_ID || settingsMap.META_APP_ID || process.env.META_APP_ID,
    META_APP_SECRET: userSettingsMap.META_APP_SECRET || settingsMap.META_APP_SECRET || process.env.META_APP_SECRET,
    GOOGLE_CLIENT_ID: userSettingsMap.GOOGLE_CLIENT_ID || settingsMap.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: userSettingsMap.GOOGLE_CLIENT_SECRET || settingsMap.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    TIKTOK_CLIENT_KEY: userSettingsMap.TIKTOK_CLIENT_KEY || settingsMap.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_KEY,
    TIKTOK_CLIENT_SECRET: userSettingsMap.TIKTOK_CLIENT_SECRET || settingsMap.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET,
    ZALO_APP_ID: userSettingsMap.ZALO_APP_ID || settingsMap.ZALO_APP_ID || process.env.ZALO_APP_ID,
    ZALO_APP_SECRET: userSettingsMap.ZALO_APP_SECRET || settingsMap.ZALO_APP_SECRET || process.env.ZALO_APP_SECRET,
  };
}
