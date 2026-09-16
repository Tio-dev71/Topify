import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

const ALLOWED_KEYS = [
  'META_APP_ID', 'META_APP_SECRET', 
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
  'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET',
  'ZALO_APP_ID', 'ZALO_APP_SECRET',
  'GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'AI_MODEL'
];

// GET /api/settings - Fetch settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let settingsMap: Record<string, string> = {};

    if (session.user.role === 'SUPER_ADMIN') {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ALLOWED_KEYS } }
      });
      settingsMap = settings.reduce((acc: Record<string, string>, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
    } else {
      const userCreds = await prisma.userCredential.findMany({
        where: { userId: session.user.id }
      });
      for (const cred of userCreds) {
        if (cred.provider === 'GOOGLE') {
          settingsMap.GOOGLE_CLIENT_ID = cred.clientId;
          settingsMap.GOOGLE_CLIENT_SECRET = cred.clientSecret;
        }
        if (cred.provider === 'META') {
          settingsMap.META_APP_ID = cred.clientId;
          settingsMap.META_APP_SECRET = cred.clientSecret;
        }
        if (cred.provider === 'TIKTOK') {
          settingsMap.TIKTOK_CLIENT_KEY = cred.clientId;
          settingsMap.TIKTOK_CLIENT_SECRET = cred.clientSecret;
        }
        if (cred.provider === 'ZALO') {
          settingsMap.ZALO_APP_ID = cred.clientId;
          settingsMap.ZALO_APP_SECRET = cred.clientSecret;
        }
      }
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/settings - Update settings
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    const settings = body.settings as Record<string, string>;

    if (session.user.role === 'SUPER_ADMIN') {
      const operations = [];
      for (const key of ALLOWED_KEYS) {
        if (settings[key] !== undefined) {
          operations.push(
            prisma.systemSetting.upsert({
              where: { key },
              update: { value: (settings[key] || '').trim() },
              create: { key, value: (settings[key] || '').trim() },
            })
          );
        }
      }
      if (operations.length > 0) {
        await prisma.$transaction(operations);
      }
    } else {
      const operations = [];
      
      if (settings.GOOGLE_CLIENT_ID !== undefined || settings.GOOGLE_CLIENT_SECRET !== undefined) {
        operations.push(
          prisma.userCredential.upsert({
            where: { userId_provider: { userId: session.user.id, provider: 'GOOGLE' } },
            update: { 
              clientId: (settings.GOOGLE_CLIENT_ID || '').trim(), 
              clientSecret: (settings.GOOGLE_CLIENT_SECRET || '').trim() 
            },
            create: { 
              userId: session.user.id, 
              provider: 'GOOGLE', 
              clientId: (settings.GOOGLE_CLIENT_ID || '').trim(), 
              clientSecret: (settings.GOOGLE_CLIENT_SECRET || '').trim() 
            },
          })
        );
      }

      if (settings.META_APP_ID !== undefined || settings.META_APP_SECRET !== undefined) {
        operations.push(
          prisma.userCredential.upsert({
            where: { userId_provider: { userId: session.user.id, provider: 'META' } },
            update: { 
              clientId: (settings.META_APP_ID || '').trim(), 
              clientSecret: (settings.META_APP_SECRET || '').trim() 
            },
            create: { 
              userId: session.user.id, 
              provider: 'META', 
              clientId: (settings.META_APP_ID || '').trim(), 
              clientSecret: (settings.META_APP_SECRET || '').trim() 
            },
          })
        );
      }

      if (settings.TIKTOK_CLIENT_KEY !== undefined || settings.TIKTOK_CLIENT_SECRET !== undefined) {
        operations.push(
          prisma.userCredential.upsert({
            where: { userId_provider: { userId: session.user.id, provider: 'TIKTOK' } },
            update: { 
              clientId: (settings.TIKTOK_CLIENT_KEY || '').trim(), 
              clientSecret: (settings.TIKTOK_CLIENT_SECRET || '').trim() 
            },
            create: { 
              userId: session.user.id, 
              provider: 'TIKTOK', 
              clientId: (settings.TIKTOK_CLIENT_KEY || '').trim(), 
              clientSecret: (settings.TIKTOK_CLIENT_SECRET || '').trim() 
            },
          })
        );
      }

      if (settings.ZALO_APP_ID !== undefined || settings.ZALO_APP_SECRET !== undefined) {
        operations.push(
          prisma.userCredential.upsert({
            where: { userId_provider: { userId: session.user.id, provider: 'ZALO' } },
            update: { 
              clientId: (settings.ZALO_APP_ID || '').trim(), 
              clientSecret: (settings.ZALO_APP_SECRET || '').trim() 
            },
            create: { 
              userId: session.user.id, 
              provider: 'ZALO', 
              clientId: (settings.ZALO_APP_ID || '').trim(), 
              clientSecret: (settings.ZALO_APP_SECRET || '').trim() 
            },
          })
        );
      }

      if (operations.length > 0) {
        await prisma.$transaction(operations);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
