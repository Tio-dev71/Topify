import prisma from '@/lib/db';
import { NextRequest } from 'next/server';

export interface AuditLogParams {
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string | null;
  workspaceId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
  req?: NextRequest | Request;
}

/**
 * Extract client IP address from standard request headers.
 */
export function extractClientIp(req?: NextRequest | Request): string {
  if (!req) return '127.0.0.1';
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp) return firstIp;
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp && realIp.trim()) return realIp.trim();
  } catch {
    // fallback if headers are unavailable
  }
  return '127.0.0.1';
}

/**
 * Record an audit log entry in the database.
 * Safe execution: errors are logged to console and will not throw or break the parent flow.
 */
export async function recordAuditLog(params: AuditLogParams) {
  try {
    const ip = params.ipAddress || extractClientIp(params.req);

    let resolvedWorkspaceId = params.workspaceId;
    if (!resolvedWorkspaceId && params.userId) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { workspaceId: true },
      });
      resolvedWorkspaceId = user?.workspaceId || null;
    }

    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        userId: params.userId || null,
        workspaceId: resolvedWorkspaceId || null,
        ipAddress: ip,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
    return null;
  }
}
