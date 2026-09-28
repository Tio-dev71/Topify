import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog } from '@/lib/audit-log';

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
        workspaceId: workspaceId || (session.user as any).workspaceId || null,
      }
    });

    await recordAuditLog({
      action: 'PROFILE.CREATE',
      entityType: 'FacebookAccount',
      entityId: account.id,
      userId: session.user.id,
      workspaceId: account.workspaceId,
      req,
      metadata: { 
        message: `Thêm tài khoản Facebook: ${name}`,
        uid: uid || null,
        profileId: account.profileId
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('[FB_ACCOUNTS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, uid, password, twoFactorCode, cookie, proxy, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (uid !== undefined) updateData.uid = uid.trim() || null;
    if (password !== undefined) updateData.password = password || null;
    if (twoFactorCode !== undefined) updateData.twoFactorCode = twoFactorCode || null;
    if (cookie !== undefined) updateData.cookie = cookie || null;
    if (proxy !== undefined) updateData.proxy = proxy || null;
    if (status !== undefined) updateData.status = status;

    const account = await prisma.facebookAccount.update({
      where: { id },
      data: updateData
    });

    await recordAuditLog({
      action: 'PROFILE.UPDATE',
      entityType: 'FacebookAccount',
      entityId: id,
      userId: session.user.id,
      workspaceId: account.workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Cập nhật tài khoản Facebook: ${account.name}`,
        status: account.status
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('[FB_ACCOUNTS_PATCH]', error);
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

    const existing = await prisma.facebookAccount.findUnique({
      where: { id },
      select: { name: true, workspaceId: true },
    });

    await prisma.facebookAccount.delete({
      where: { id }
    });

    await recordAuditLog({
      action: 'PROFILE.DELETE',
      entityType: 'FacebookAccount',
      entityId: id,
      userId: session.user.id,
      workspaceId: existing?.workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Xóa tài khoản Facebook: ${existing?.name || id}` 
      },
    });

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('[FB_ACCOUNTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
