import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const accounts = await prisma.facebookAccount.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[FB_ACCOUNTS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, uid, password, twoFactorCode, cookie, proxy, workspaceId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const account = await prisma.facebookAccount.create({
      data: {
        name,
        uid: uid || null,
        password: password || null,
        twoFactorCode: twoFactorCode || null,
        cookie: cookie || null,
        proxy: proxy || null,
        profileId: `profile_${uuidv4()}`,
        status: 'LIVE',
        workspaceId: workspaceId || null,
      }
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('[FB_ACCOUNTS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    await prisma.facebookAccount.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('[FB_ACCOUNTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
