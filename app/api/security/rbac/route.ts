import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthRole(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7).trim();
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.role) return decoded.role;
    } catch {}
  }
  try {
    const session = await auth();
    if (session?.user?.role) return session.user.role;
  } catch {}
  return 'STAFF';
}

export async function GET() {
  try {
    const permissions = securityEngineStore.getRbacMatrix();
    return NextResponse.json({ permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch RBAC matrix' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleUpper = (await getAuthRole(req)).toUpperCase();
    if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN' && roleUpper !== 'OWNER') {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa ma trận phân quyền (Yêu cầu quyền Quản trị viên - Admin).' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { permissionKey, role, value } = body;

    if (!permissionKey || !role || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'permissionKey, role, and value (boolean) are required' }, { status: 400 });
    }

    const success = securityEngineStore.updateRbacPermission(permissionKey, role, value);
    if (!success) {
      return NextResponse.json({ error: 'Không thể sửa quyền của Chủ sở hữu (Owner) hoặc quyền không tồn tại' }, { status: 400 });
    }

    const permissions = securityEngineStore.getRbacMatrix();
    return NextResponse.json({ success: true, permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update permission' }, { status: 500 });
  }
}
