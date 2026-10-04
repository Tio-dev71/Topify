import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrGenerateFingerprint } from '@/lib/automation/fingerprint';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    const where: any = {};

    if (session.user.role === 'SUPER_ADMIN') {
      const wsParam = req.nextUrl.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      } else if (wsParam !== 'all' && userWorkspaceId) {
        where.workspaceId = userWorkspaceId;
      }
    } else if (userWorkspaceId) {
      where.OR = [
        { workspaceId: userWorkspaceId },
        { workspaceId: null }
      ];
    }

    const queryOptions: any = {
      orderBy: { createdAt: 'desc' },
    };
    if (Object.keys(where).length > 0) {
      queryOptions.where = where;
    }

    const accounts = await prisma.facebookAccount.findMany(queryOptions);

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Failed to fetch facebook accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rawAccounts, autoAssignProxy } = body; // format: UID|Pass|2FA|Cookie or similar

    if (!rawAccounts) {
      return NextResponse.json({ error: 'Missing raw account data' }, { status: 400 });
    }

    let workspaceId = (session.user as any).workspaceId || null;
    if (!workspaceId && session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { workspaceId: true }
      });
      workspaceId = user?.workspaceId || null;
    }

    const lines = rawAccounts.split(/\r?\n/).filter((l: string) => l.trim() !== '');
    const addedAccounts = [];

    // Fetch active proxies only if user explicitly wants auto-assignment
    const activeProxies = autoAssignProxy
      ? await prisma.proxy.findMany({ where: { status: 'ACTIVE' } })
      : [];

    for (const line of lines) {
      try {
        const parts = line.split('|').map((p: string) => p.trim());
        const uid = parts[0];
        const password = parts[1];

        if (uid && password) {
          let twoFactorCode: string | null = null;
          let cookie: string | null = null;
          let proxyStr: string | null = null;

          const remainingParts = parts.slice(2);
          for (const part of remainingParts) {
            if (!part) continue;

            // Check if part is a proxy format
            if (/^(https?|socks[45]):\/\//i.test(part) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/.test(part)) {
              proxyStr = part.startsWith('http') || part.startsWith('socks') ? part : `http://${part}`;
            }
            // Check if part is a cookie (contains c_user, xs, or starts with JSON bracket/brace)
            else if (part.includes('c_user=') || part.includes('xs=') || part.startsWith('[') || part.startsWith('{') || (part.includes(';') && part.includes('='))) {
              cookie = part;
            }
            // Check if part is 2FA code (16-64 alphanumeric chars base32, no @ or . symbols)
            else if (!twoFactorCode && /^[A-Z0-9]{16,64}$/i.test(part.replace(/\s+/g, '')) && !part.includes('@') && !part.includes('.')) {
              twoFactorCode = part.replace(/\s+/g, '');
            }
          }

          // Only assign random proxy if explicitly requested and no proxy was supplied in the line
          if (!proxyStr && autoAssignProxy && activeProxies.length > 0) {
            const proxy = activeProxies[Math.floor(Math.random() * activeProxies.length)];
            if (proxy.username && proxy.password) {
              proxyStr = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
            } else {
              proxyStr = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
            }
          }

          const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '');
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const name = `Clone ${uid.substring(0, 5)}...`;

          // Check if an account with this UID already exists in workspace
          const existing = await prisma.facebookAccount.findFirst({
            where: {
              uid,
              ...(workspaceId ? { workspaceId } : {})
            }
          });

          let account;
          if (existing) {
            account = await prisma.facebookAccount.update({
              where: { id: existing.id },
              data: {
                password,
                twoFactorCode: twoFactorCode || existing.twoFactorCode,
                cookie: cookie || existing.cookie,
                proxy: proxyStr || existing.proxy,
                status: 'LIVE'
              }
            });
          } else {
            const profileId = `profile_${cleanUid || 'acc'}_${Date.now()}_${randomSuffix}`;
            account = await prisma.facebookAccount.create({
              data: {
                name,
                uid,
                password,
                twoFactorCode,
                cookie,
                profileId,
                proxy: proxyStr,
                status: 'LIVE',
                workspaceId,
              },
            });

            // Auto-generate and save the fingerprint for this profile
            getOrGenerateFingerprint(profileId);
          }

          addedAccounts.push(account);
        }
      } catch (lineErr) {
        console.error(`[FB Accounts] Error processing line "${line}":`, lineErr);
      }
    }

    return NextResponse.json({ success: true, count: addedAccounts.length, addedAccounts });
  } catch (error: any) {
    console.error('Failed to create facebook accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      const existing = await prisma.facebookAccount.findFirst({
        where: { id, workspaceId: userWorkspaceId }
      });
      if (!existing) {
        return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
      }
    }

    await prisma.facebookAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete facebook account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ids, name, password, twoFactorCode, proxy, cookie, status } = body;

    const targetIds = Array.isArray(ids) ? ids : (id ? [id] : []);
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID hoặc danh sách IDs là bắt buộc' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (password !== undefined) dataToUpdate.password = password.trim();
    if (twoFactorCode !== undefined) dataToUpdate.twoFactorCode = twoFactorCode.trim() || null;
    if (proxy !== undefined) {
      dataToUpdate.proxy = proxy === '' ? null : proxy.trim();
    }
    if (cookie !== undefined) {
      dataToUpdate.cookie = cookie === '' ? null : cookie.trim();
    }
    if (status !== undefined) {
      dataToUpdate.status = status;
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    const where: any = { id: { in: targetIds } };
    if (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId) {
      where.workspaceId = userWorkspaceId;
    }

    const updated = await prisma.facebookAccount.updateMany({
      where,
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Failed to update facebook accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
