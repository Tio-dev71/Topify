import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proxies = await prisma.proxy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ proxies });
  } catch (error) {
    console.error('[PROXIES_GET]', error);
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
    const { protocol, host, port, username, password } = body;

    if (!host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const proxy = await prisma.proxy.create({
      data: {
        protocol: protocol || 'http',
        host,
        port: parseInt(port),
        username: username || null,
        password: password || null,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(proxy);
  } catch (error) {
    console.error('[PROXIES_POST]', error);
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
      return NextResponse.json({ error: 'Proxy ID is required' }, { status: 400 });
    }

    await prisma.proxy.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Proxy deleted' });
  } catch (error) {
    console.error('[PROXIES_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
