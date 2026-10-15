import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

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
    const body = await req.json();
    const { permissionKey, role, value } = body;

    if (!permissionKey || !role || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'permissionKey, role, and value (boolean) are required' }, { status: 400 });
    }

    const success = securityEngineStore.updateRbacPermission(permissionKey, role, value);
    if (!success) {
      return NextResponse.json({ error: 'Cannot modify Owner permissions or permission not found' }, { status: 400 });
    }

    const permissions = securityEngineStore.getRbacMatrix();
    return NextResponse.json({ success: true, permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update permission' }, { status: 500 });
  }
}
