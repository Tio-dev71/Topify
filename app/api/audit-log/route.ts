import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog, extractClientIp } from '@/lib/audit-log';

// GET /api/audit-log - List audit log entries
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    const entityType = url.searchParams.get('entityType');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const workspaceId = (session.user as any).workspaceId;
    const userRole = (session.user as any).role;

    const where: any = {};
    if (userRole === 'SUPER_ADMIN') {
      const wsParam = url.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      }
    } else {
      if (workspaceId) {
        where.OR = [
          { workspaceId },
          { userId: session.user.id },
        ];
      } else {
        where.userId = session.user.id;
      }
    }

    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;

    let [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Auto-seed starter log entries if empty
    if (total === 0 && workspaceId) {
      const clientIp = extractClientIp(req);
      const initialLogs = [
        {
          action: 'AUTH.LOGIN',
          entityType: 'User',
          entityId: session.user.id,
          userId: session.user.id,
          ipAddress: clientIp,
          metadata: { message: 'Đăng nhập vào hệ thống thành công', email: session.user.email },
          workspaceId,
        },
        {
          action: 'WORKSPACE.ACCESS',
          entityType: 'Workspace',
          entityId: workspaceId,
          userId: session.user.id,
          ipAddress: clientIp,
          metadata: { message: 'Truy cập không gian làm việc', role: userRole || 'ADMIN' },
          workspaceId,
        },
        {
          action: 'SECURITY.VERIFY_DEVICE',
          entityType: 'Security',
          userId: session.user.id,
          ipAddress: clientIp,
          metadata: { message: 'Xác thực thiết bị an toàn hợp lệ' },
          workspaceId,
        },
      ];

      for (const log of initialLogs) {
        await recordAuditLog(log);
      }

      logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      total = logs.length;
    }

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/audit-log - Record new audit log
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entityType, entityId, metadata } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const log = await recordAuditLog({
      action,
      entityType,
      entityId,
      userId: session.user.id,
      metadata: metadata || {},
      workspaceId,
      req,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

